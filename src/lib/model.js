/* ───────────────────────────────────────────────────────────────
   KaroCup — production data model.
   Adapts the committed JSON (teams/players/matches/scores) into the
   shape the UI components expect, deriving stats, stage reached,
   trends, scoring breakdowns, dark-horse flags, standings and moves.
   Everything is derived from matches.json so the screens always
   reconcile with the fixtures.
   ─────────────────────────────────────────────────────────────── */

export const RULES = { win: 5, draw: 2, goal: 3, cs: 4, assist: 1, yellow: -1, red: -3, og: -2 };

// Cumulative progression bonus by *furthest stage reached* (matches the
// backend's per-stage sums: 5, 5+10, +15, +20, +30, +winner).
export const STAGE_INFO = {
  group:  { bonus: 0,   label: 'Group stage',   order: 0 },
  r32:    { bonus: 5,   label: 'Round of 32',   order: 1 },
  r16:    { bonus: 15,  label: 'Round of 16',   order: 2 },
  qf:     { bonus: 30,  label: 'Quarter-final', order: 3 },
  sf:     { bonus: 50,  label: 'Semi-final',    order: 4 },
  final:  { bonus: 80,  label: 'Final',         order: 5 },
  winner: { bonus: 120, label: 'Champion',      order: 6 },
};

export const ALIAS_MAX = 22;

export const TREND_KEY = [
  { e: '🚀', label: 'In the hunt — still alive' },
  { e: '🔥', label: 'Hot — won their last match' },
  { e: '🧊', label: 'Gone cold — lost their last match' },
  { e: '💩', label: 'Stinker — heavy defeat' },
  { e: '😴', label: "Out early — didn't escape the group" },
];

// our backend stage strings -> internal short keys
const STAGE_MAP = {
  GROUP_STAGE: 'group',
  LAST_32: 'r32',
  LAST_16: 'r16',
  QUARTER_FINALS: 'qf',
  SEMI_FINALS: 'sf',
  THIRD_PLACE: 'sf', // a 3rd-place team's furthest advancement is the semi-final
  FINAL: 'final',
};
const STAGE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'final'];

const AVATAR_COLORS = [
  '#D6453D', '#2E6E8E', '#C9A84C', '#3C7A4E', '#9B5DE5',
  '#E07A3E', '#1B998B', '#6D6875', '#D4548A', '#4A5859',
];

const ADJ = ['plucky', 'fearless', 'unpredictable', 'streetwise', 'underrated', 'spirited'];

function fmtDate(iso) {
  if (!iso) return 'TBC';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}`;
}
function fmtLongDate(iso) {
  if (!iso) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dt = new Date(iso + 'T12:00:00Z');
  return `${days[dt.getUTCDay()]}, ${months[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}

/**
 * Build the full UI model from the committed JSON.
 * @param {{teams:Array, players:Array, matches:Array, scores:object}} raw
 * @param {{meId?:string, alias?:string, todayISO:string}} opts
 */
export function buildModel(raw, opts) {
  const { teams: teamDefs = [], players: playerDefs = [], matches: matchDefs = [], blurbs = {} } = raw || {};
  const todayISO = opts.todayISO;

  // ---- TEAMS base ----------------------------------------------------
  const TEAMS = {};
  for (const t of teamDefs) {
    TEAMS[t.id] = {
      code: t.id, name: t.name, tier: t.tier, flag: t.flag, rank: t.rank,
      confederation: t.confederation, group: null, stage: 'group',
      stats: { w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0, ast: 0, yc: 0, rc: 0, og: 0 },
      lastMatch: null, trend: '', trendLabel: '',
    };
  }

  // ---- MATCHES (mapped) ---------------------------------------------
  const GROUP_SET = new Set();
  const MATCHES = matchDefs.map(m => {
    const stage = STAGE_MAP[m.stage] || 'group';
    const groupLetter = m.group ? m.group.replace('GROUP_', '') : null;
    if (groupLetter) GROUP_SET.add(groupLetter);
    const played = m.status === 'FINISHED';
    const stageLabel = groupLetter ? `Group ${groupLetter}`
      : (m.stage === 'THIRD_PLACE' ? '3rd Place' : STAGE_INFO[stage].label);
    return {
      id: String(m.id), stage, stageLabel,
      a: m.homeTeam || null, b: m.awayTeam || null,
      ga: played ? (m.homeScore ?? 0) : null,
      gb: played ? (m.awayScore ?? 0) : null,
      played,
      iso: m.date, date: fmtDate(m.date),
      time: m.time || '', venue: m.venue || '',
      today: m.date === todayISO,
      // per-team event tallies carried from the feed (best-effort)
      raw: m,
    };
  });

  // ---- assign group + derive stats / stage reached ------------------
  for (const m of MATCHES) {
    const groupLetter = m.stageLabel.startsWith('Group ') ? m.stageLabel.slice(6) : null;
    if (groupLetter) {
      if (m.a && TEAMS[m.a]) TEAMS[m.a].group = groupLetter;
      if (m.b && TEAMS[m.b]) TEAMS[m.b].group = groupLetter;
    }
    // stage reached = furthest stage a team appears in
    for (const code of [m.a, m.b]) {
      if (code && TEAMS[code]) {
        const cur = STAGE_INFO[TEAMS[code].stage].order;
        if (STAGE_INFO[m.stage].order > cur) TEAMS[code].stage = m.stage;
      }
    }
    if (!m.played || !m.a || !m.b) continue;
    const A = TEAMS[m.a], B = TEAMS[m.b];
    if (!A || !B) continue;
    A.stats.gf += m.ga; A.stats.ga += m.gb;
    B.stats.gf += m.gb; B.stats.ga += m.ga;
    if (m.gb === 0) A.stats.cs++;
    if (m.ga === 0) B.stats.cs++;
    if (m.ga > m.gb) { A.stats.w++; B.stats.l++; }
    else if (m.ga < m.gb) { B.stats.w++; A.stats.l++; }
    else { A.stats.d++; B.stats.d++; }
    const r = m.raw;
    A.stats.ast += r.homeAssists ?? 0; B.stats.ast += r.awayAssists ?? 0;
    A.stats.yc += r.homeYellowCards ?? 0; B.stats.yc += r.awayYellowCards ?? 0;
    A.stats.rc += r.homeRedCards ?? 0; B.stats.rc += r.awayRedCards ?? 0;
    A.stats.og += r.homeOwnGoals ?? 0; B.stats.og += r.awayOwnGoals ?? 0;
  }

  // winner: the team that won the FINAL
  const finalM = MATCHES.find(m => m.stage === 'final' && m.played && m.a && m.b);
  if (finalM) {
    const w = finalM.ga > finalM.gb ? finalM.a : finalM.gb > finalM.ga ? finalM.b : null;
    if (w && TEAMS[w]) TEAMS[w].stage = 'winner';
  }

  // ---- live stage = earliest stage with an unfinished match ---------
  let liveStage = 'group';
  for (const s of STAGE_ORDER) {
    const has = MATCHES.some(m => m.stage === s);
    const allDone = MATCHES.filter(m => m.stage === s).every(m => m.played);
    if (has && !allDone) { liveStage = s; break; }
    if (has) liveStage = s;
  }

  // ---- trends + blurbs ----------------------------------------------
  for (const t of Object.values(TEAMS)) {
    let last = null;
    for (const m of MATCHES) if (m.played && (m.a === t.code || m.b === t.code)) last = m;
    t.lastMatch = last;
    let gf = 0, ga = 0, won = false, lost = false, margin = 0;
    if (last) {
      const home = last.a === t.code;
      gf = home ? last.ga : last.gb; ga = home ? last.gb : last.ga;
      won = gf > ga; lost = gf < ga; margin = ga - gf;
    }
    const knockedOut = t.stage !== 'group' && t.stage !== liveStage && t.stage !== 'winner';
    const alive = t.stage === liveStage || t.stage === 'winner';
    let e = '', label = '';
    if (lost && margin >= 3) { e = '💩'; label = `Hammered ${gf}–${ga} last time out`; }
    else if (alive && last) { e = '🚀'; label = 'Still alive and advancing'; }
    else if (won && last) { e = '🔥'; label = `Won their last match ${gf}–${ga}`; }
    else if (lost && t.stage === 'group') { e = '😴'; label = 'Knocked out in the group stage'; }
    else if (lost) { e = '🧊'; label = `Lost their last match ${gf}–${ga}`; }
    else if (knockedOut) { e = '🧊'; label = 'Out of the tournament'; }
    t.trend = e; t.trendLabel = label;

    const b = blurbs[t.code];
    t.nick = b?.nick || t.name;
    if (b?.blurb) t.blurb = b.blurb;
    else {
      const adj = ADJ[(t.rank || 0) % ADJ.length];
      t.blurb = `[Add a blurb for ${t.name}] — a ${adj} side hoping to cause a stir.`;
    }
    t.fact = b?.fact || `[Fun fact about ${t.name} goes here.]`;
  }

  // ---- scoring breakdown --------------------------------------------
  function breakdown(code) {
    const t = TEAMS[code];
    const s = t.stats, si = STAGE_INFO[t.stage];
    const items = [
      { key: 'win', label: 'Wins', n: s.w, per: RULES.win, pts: s.w * RULES.win },
      { key: 'draw', label: 'Draws', n: s.d, per: RULES.draw, pts: s.d * RULES.draw },
      { key: 'goal', label: 'Goals', n: s.gf, per: RULES.goal, pts: s.gf * RULES.goal },
      { key: 'cs', label: 'Clean sheets', n: s.cs, per: RULES.cs, pts: s.cs * RULES.cs },
      { key: 'assist', label: 'Assists', n: s.ast, per: RULES.assist, pts: s.ast * RULES.assist },
    ];
    const penalties = [];
    if (s.yc) penalties.push({ key: 'yellow', label: 'Yellow cards', n: s.yc, per: RULES.yellow, pts: s.yc * RULES.yellow });
    if (s.rc) penalties.push({ key: 'red', label: 'Red cards', n: s.rc, per: RULES.red, pts: s.rc * RULES.red });
    if (s.og) penalties.push({ key: 'og', label: 'Own goals', n: s.og, per: RULES.og, pts: s.og * RULES.og });
    const base = items.reduce((a, x) => a + x.pts, 0) + penalties.reduce((a, x) => a + x.pts, 0);
    return { items, penalties, bonus: si.bonus, bonusLabel: si.label, total: base + si.bonus };
  }
  const teamPoints = (code) => breakdown(code).total;

  // ---- PLAYERS -------------------------------------------------------
  const PLAYERS = playerDefs.map((p, i) => {
    const teams = p.teams
      .filter(code => TEAMS[code])
      .map(code => ({ ...TEAMS[code], points: teamPoints(code), bd: breakdown(code) }));
    const total = teams.reduce((a, t) => a + t.points, 0);
    return {
      id: p.id, name: p.name,
      alias: p.alias || `${p.name}'s XI`,
      color: p.color || AVATAR_COLORS[i % AVATAR_COLORS.length],
      teams, total, you: false,
    };
  });

  // dark-horse: a lower-tier team outscoring the player's tier-1 team
  for (const p of PLAYERS) {
    const fav = p.teams.find(t => t.tier === 1);
    for (const t of p.teams) {
      t.darkHorse = !!(fav && t.tier > 1 && t.points > fav.points);
    }
    p.topTeam = [...p.teams].sort((a, b) => b.points - a.points)[0];
  }

  // ---- standings + movement -----------------------------------------
  const ranked = [...PLAYERS].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  ranked.forEach((p, i) => { p.rank = i + 1; });

  // previous standings from the snapshot the Action persists (if any)
  const prev = opts.prevTotals || null;
  // Only treat the snapshot as real movement once someone has actually scored
  // — otherwise tie-break ordering produces phantom "moves" at 0–0–0.
  const hasPrevScores = prev && Object.values(prev).some(v => v > 0);
  if (hasPrevScores) {
    const prevRankMap = Object.fromEntries(
      [...PLAYERS]
        .map(p => ({ id: p.id, name: p.name, total: prev[p.id] ?? 0 }))
        // same comparator as `ranked` so equal scores don't shuffle
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
        .map((p, i) => [p.id, i + 1])
    );
    for (const p of PLAYERS) {
      p.prevRank = prevRankMap[p.id] ?? p.rank;
      p.move = p.prevRank - p.rank;
    }
  } else {
    for (const p of PLAYERS) { p.prevRank = p.rank; p.move = 0; }
  }

  // ---- viewer (?me= / saved) ----------------------------------------
  let you = PLAYERS.find(p => p.id === opts.meId) || PLAYERS[0] || null;
  if (you) {
    you.you = true;
    if (opts.alias) you.alias = opts.alias.slice(0, ALIAS_MAX);
  }

  // ---- today summary -------------------------------------------------
  const todayMatches = MATCHES.filter(m => m.today);
  const roundLabel = todayMatches.length
    ? (todayMatches[0].stageLabel.startsWith('Group') ? 'Group stage' : todayMatches[0].stageLabel)
    : STAGE_INFO[liveStage].label;
  const TODAY = { dateLabel: fmtLongDate(todayISO), round: roundLabel };

  const GROUP_LETTERS = [...GROUP_SET].sort();
  const GROUPS = {};
  for (const g of GROUP_LETTERS) {
    GROUPS[g] = Object.values(TEAMS).filter(t => t.group === g).map(t => t.code);
  }

  function ownersOf(code) { return PLAYERS.filter(p => p.teams.some(t => t.code === code)); }

  return {
    TEAMS, MATCHES, PLAYERS, ranked, GROUPS, GROUP_LETTERS,
    STAGE_INFO, RULES, breakdown, teamPoints, TODAY, liveStage,
    ownersOf, TREND_KEY, ALIAS_MAX, you,
  };
}
