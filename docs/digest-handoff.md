# Handoff: KaroCup World Cup 2026 — Daily Discord Digest

**For:** Claude Code, running **on the ReportBot host** (the GPU box on the Tailnet that serves Qwen via vLLM).
**Goal:** Build a small, standalone script that, once a day, posts a fun AI-written summary of the KaroCup sweepstake to a Discord channel — what happened overnight, where the table stands, and what to watch in today's fixtures (including "X could overtake Y" jeopardy lines).

This is **not** part of the ReportBot codebase. Build it as an isolated tool (its own directory + cron entry). It only *borrows* ReportBot's local Qwen endpoint for text generation.

---

## 1. The big picture / architecture

```
 cron (daily, ~8am NZ)
   └─> wc_digest.py
         1. fetch KaroCup JSON from the public site  (internet)
         2. compute the facts deterministically       (pure Python)
         3. render a punchy digest via local Qwen      (http://localhost:8000/v1)
         4. POST it to a Discord webhook               (internet)
```

**Why it runs here:** the match data and Discord webhook are public internet, but the LLM (Qwen2.5-72B via vLLM) is Tailnet-only — a cloud CI runner can't reach it. This host can reach all three, so the whole job lives here.

**The one rule that matters:** *compute the facts in Python; let the LLM only do the prose.* The model must never invent scores, standings, or fixtures — it receives a clean fact sheet and turns it into something readable. This is what keeps it accurate. (Same principle ReportBot uses — retrieval/structure in code, narrative from the model.)

---

## 2. Data sources (public, no auth)

All served as static JSON from GitHub Pages. Base URL:

```
https://alex-poor.github.io/usa26/data/
```

| File | Shape |
|---|---|
| `teams.json` | `[{ "id":"ARG", "name":"Argentina", "flag":"🇦🇷", "tier":1, "rank":1, "confederation":"CONMEBOL" }, …]` (48 teams) |
| `players.json` | `[{ "id":"alex", "name":"Alex", "alias":"Accrington North End Olympic", "teams":["POR","ALG","COD"] }, …]` — 11 players; `alias` optional (fall back to `"{name}'s XI"`); `teams` are 3 team `id`s |
| `matches.json` | `[{ "id":"537327", "homeTeam":"MEX", "awayTeam":"RSA", "homeScore":null, "awayScore":null, "date":"2026-06-11", "time":"19:00", "utc":"2026-06-11T19:00:00Z", "venue":"", "stage":"GROUP_STAGE", "group":"GROUP_A", "status":"TIMED", "homeYellowCards":0, "awayYellowCards":0, "homeRedCards":0, "awayRedCards":0, "homeAssists":0, "awayAssists":0, "homeOwnGoals":0, "awayOwnGoals":0 }, …]` — 104 matches |
| `scores.json` | `{ "lastUpdated":"…ISO…", "prevTotals":{ "alex":0, … }, "players":[ { "id":"alex", "name":"Alex", "total":0, "teams":{ "POR":{"total":0,"breakdown":{}}, … } }, … ] }` — **authoritative standings**, computed every ~2h by the site's own GitHub Action |
| `blurbs.json` | `{ "ARG":{ "nick":"La Albiceleste", "blurb":"…", "fact":"…" }, … }` — optional flavour/nicknames |

**Notes & gotchas:**
- `date`/`time`/`utc` are **UTC**. `utc` may be absent on older entries until the site's next scheduled fetch — reconstruct it if missing: `utc = f"{date}T{time or '12:00'}:00Z"`.
- `matches.json` `status` values (from football-data.org): `SCHEDULED`, `TIMED`, `IN_PLAY`, `PAUSED`, `FINISHED`, `SUSPENDED`, `POSTPONED`, `CANCELLED`, `AWARDED`. Treat **`FINISHED`** (and `AWARDED`) as played.
- Knockout fixtures beyond the current round have `homeTeam`/`awayTeam` = `null` (teams TBD) — skip those for "today's fixtures."
- `scores.json` `players[].name` is the **manager** name. For the **squad name**, join to `players.json` `alias`.
- Standings = sort `scores.json.players` by `total` desc; tie-break by `name` asc (matches the app).
- Stage strings: `GROUP_STAGE`, `LAST_32`, `LAST_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `THIRD_PLACE`, `FINAL`.

---

## 3. Scoring reference (for per-match "haul" flavour and overtake math)

You generally **read totals from `scores.json`** (don't recompute standings). But to say "Brazil won 2–0 (+15 for Rei)" and to size overtake scenarios, use these rules — they match the app exactly.

**Per-event points** (only what the free data tier supports — no cards/assists/own-goals):
```
win +5 | draw +2 | goal +3 | clean sheet +4
```

**Progression bonus** — cumulative, by *furthest stage reached* (separate from per-match points, already baked into `scores.json` totals):
```
reach R32 +5 | R16 +15 | QF +30 | SF +50 | Final +80 | Winner +120
```

**Single-match base haul** for a team in one finished match (use for the "+N" flavour; *exclude* the progression bonus, or mention advancement separately):
```
base = (5 if won else 2 if draw else 0)
     + 3*goals_for
     + (4 if goals_against == 0 else 0)
```
A strong group-stage win is therefore ~12–18 pts; knockout wins add a big stage bonus on top. Use a constant like `MAX_GROUP_SWING ≈ 18` (and a larger figure for knockout days) to bound "could overtake" claims.

> Note: `matches.json` no longer carries card/assist/own-goal fields — the football-data.org free tier doesn't expose them, so they're not part of scoring. Don't reference them.

---

## 4. The fact engine (the important, reusable part)

Produce a structured `facts` dict (plain Python) with these sections. **All dates/times in NZ time** (`zoneinfo.ZoneInfo("Pacific/Auckland")`). "Today" = current NZ calendar day.

### 4a. New results since last run ("overnight")
Don't fuss with time windows — use a **state file** (`state.json`) listing match IDs already reported. New results = `status == FINISHED` matches whose `id` isn't in the state file. For each, emit:
- teams (names + flags), scoreline, stage label, NZ date
- which players own each side, and each owned team's **base haul** (§3)
- whether a team advanced a round (knockout) — worth calling out

After a successful post, add those IDs to the state file.

### 4b. Standings + movement
- Current table from `scores.json` (sorted). Include rank, squad alias, manager, total.
- Movement vs `scores.json.prevTotals`: recompute the previous ranking from `prevTotals` (same sort + tie-break) and diff ranks. Report notable climbers/fallers. **Guard:** if every `prevTotal` is 0 (pre-tournament), movement is meaningless — report it as flat / omit.
- Leader, gap from 1st→2nd, and the chasing pack.

### 4c. Today's fixtures
- Matches whose **NZ date == today** and `status != FINISHED`, both teams known. For each: teams (flags), NZ kickoff time, stage, and which players own each side (squad alias). Highlight head-to-heads where two players each own a side.

### 4d. Overtake / jeopardy scenarios
For pairs of adjacent (or near-adjacent) players in the table where the **trailing** player owns a team playing today:
- `gap = leader.total − trailer.total`
- if `gap <= MAX_SWING` (use the group/knockout bound from §3), emit a line like:
  *"Cliff (3rd, 142) is 6 behind Brett — and his Germany play tonight. A big win flips them."*
- Keep it to the few most interesting ones (2–4 lines), not every pair.

If there are **no new results and no fixtures today**, produce nothing and **skip posting** (don't spam a rest day). Pre-tournament this means it stays quiet until the first match.

---

## 5. Render via local Qwen (vLLM, OpenAI-compatible)

**Endpoint:** `http://localhost:8000/v1/chat/completions` · **model:** `qwen2.5-72b` (per ReportBot's `VLLM_MODEL` / `VLLM_BASE_URL`). No real API key — vLLM ignores it; if you use the `openai` SDK, set `api_key="EMPTY"`, `base_url="http://localhost:8000/v1"`. Raw `requests` is fine too and keeps deps minimal.

**Request:** `temperature` ~0.7, `max_tokens` ~600. (vLLM `--max-model-len` is 16384, so keep the prompt compact — the fact sheet is small.)

**System prompt (suggested):**
> You are the resident pundit for "KaroCup", a friends' World Cup 2026 fantasy sweepstake. Write a short, punchy daily Discord post. Use ONLY the facts provided — never invent scores, standings, or fixtures. NZ English. Warm, funny, a bit cheeky; light emoji ok. Keep it under ~200 words. Structure: a quick overnight recap, the state of the table (who's moving), then today's must-watch and any "could overtake" jeopardy. Refer to people by their squad name with the manager in parentheses the first time. No markdown headers.

**User message:** the `facts` dict rendered as a compact, labelled plain-text fact sheet (or JSON). Be explicit and unambiguous — every number the model might use should be present and labelled.

**Output:** take `choices[0].message.content`, strip whitespace. Keep the final text **under ~1500 chars** to sit comfortably inside Discord limits (trim or ask for shorter if needed).

**Fallback (important for resilience):** if Qwen is unreachable or errors, build a **templated digest** from the same `facts` (plain, no flair) and post that instead, so the digest still goes out. Log that the LLM was skipped.

---

## 6. Post to Discord

A Discord **webhook** takes a simple JSON POST. Either:
- `{"content": "…"}` — max **2000 chars**, or
- `{"embeds":[{"title":"⚽ KaroCup Daily — Sat 13 Jun", "description":"…digest…", "color": 15844367}]}` — description max **4096 chars** (nicer; recommended). Optionally add a small footer with the top-3 table.

Webhook URL is a secret — see §7. On non-2xx, log the status + body and exit non-zero. Once-daily volume is far under any rate limit.

---

## 7. Config & secrets

Keep it simple — a `.env` next to the script (and `python-dotenv`, or just read env):

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/…   # required
VLLM_BASE_URL=http://localhost:8000/v1                   # default
VLLM_MODEL=qwen2.5-72b                                   # default
DATA_BASE_URL=https://alex-poor.github.io/usa26/data     # default
```

`.gitignore` the `.env` and `state.json`. To create the Discord webhook: Discord → Server Settings → Integrations → Webhooks → New Webhook → pick the channel → Copy URL.

---

## 8. Scheduling (cron on this host)

Run once each morning NZ time so it covers "yesterday evening → this morning" (the US-scheduled matches land in NZ small hours). If the host clock is NZ local:

```cron
# ~8am NZ daily
0 8 * * *  /home/<user>/wc-digest/.venv/bin/python /home/<user>/wc-digest/wc_digest.py >> /home/<user>/wc-digest/digest.log 2>&1
```

If the host runs UTC, use `0 20 * * *` (8am NZST = 20:00 UTC previous day). Log to a file; the script should be safe to run repeatedly (state file dedups results).

---

## 9. CLI flags / behaviour
- `--dry-run` — compute + render but print to stdout instead of posting to Discord (and don't update the state file). Use this to test.
- `--force` — ignore the state file (re-report recent results); for testing.
- Default run: compute → if nothing to say, exit 0 quietly → else render → post → update state.

---

## 10. Suggested layout & stack
- Python 3 (this host already has it), a small venv. Deps: `requests` (and optionally `python-dotenv`, `openai`). Keep it minimal.
```
wc-digest/
├── wc_digest.py        # everything: fetch → facts → render → post
├── .env                # secrets (gitignored)
├── state.json          # reported match IDs (gitignored)
├── digest.log
└── README.md
```
You can split `facts.py` / `render.py` / `post.py` if you prefer — the fact engine is the bit worth keeping clean and testable.

---

## 11. Acceptance criteria
1. `python wc_digest.py --dry-run` prints a sensible digest (or "nothing to report") without posting.
2. With real results present, the digest's scores/standings **exactly match** `scores.json` and `matches.json` — no invented numbers.
3. Times shown are **NZ local**.
4. Re-running the same day doesn't double-report the same overnight results (state file works).
5. Qwen down → templated fallback still posts.
6. Cron installed; first live post lands in the Discord channel.

---

## 12. Quick reference — connectivity smoke tests
```bash
# Qwen reachable?
curl -s http://localhost:8000/v1/models | head
# Data reachable?
curl -s https://alex-poor.github.io/usa26/data/scores.json | head
```

That's everything. Build it as an isolated tool, keep the fact engine deterministic, and let Qwen handle only the voice.
