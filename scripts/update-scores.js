#!/usr/bin/env node
// Called by GitHub Actions on a schedule.
// Fetches match results from football-data.org and recalculates scores.

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dir, '..', 'public', 'data')

const API_KEY = process.env.FOOTBALL_API_KEY
if (!API_KEY) {
  console.error('FOOTBALL_API_KEY env var is required')
  process.exit(1)
}

const COMPETITION = 'WC'
const BASE_URL = 'https://api.football-data.org/v4'

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

// Map football-data.org TLA codes to our team IDs where they differ
const TLA_MAP = {
  'SAU': 'KSA',
  'USA': 'USA',
  'ENG': 'ENG',
  'NZL': 'NZL',
  'CIV': 'CIV',
}
function normTeam(tla) {
  return TLA_MAP[tla] ?? tla
}

// A match only counts once it has a confirmed final score. The free tier can
// flip status to FINISHED *before* populating the score (and briefly drop it
// back to null), so never trust status alone.
const isPlayed = (m) => m.status === 'FINISHED' && m.homeScore != null && m.awayScore != null

function parseMatch(raw, prevById = {}) {
  const id = String(raw.id)
  const h = raw.score?.fullTime?.home
  const a = raw.score?.fullTime?.away
  const hasFinal = raw.status === 'FINISHED' && h != null && a != null
  // Sticky: a real (non-null) score we've already captured is never overwritten
  // by null. A new non-null score from the API *does* override (corrects).
  const prev = prevById[id]
  const keepPrev = !hasFinal && prev && prev.homeScore != null && prev.awayScore != null
  return {
    id,
    homeTeam: normTeam(raw.homeTeam.tla),
    awayTeam: normTeam(raw.awayTeam.tla),
    homeScore: hasFinal ? h : keepPrev ? prev.homeScore : null,
    awayScore: hasFinal ? a : keepPrev ? prev.awayScore : null,
    date: raw.utcDate.slice(0, 10),
    time: raw.utcDate.slice(11, 16),
    utc: raw.utcDate, // full UTC instant; the app localises this to NZ time
    venue: raw.venue ?? '',
    stage: raw.stage,
    group: raw.group ?? null,
    // Once a score is known, stay FINISHED even if a stale snapshot says TIMED.
    status: (hasFinal || keepPrev) ? 'FINISHED' : raw.status,
  }
}

function calcTeamMatchPoints(match, teamId) {
  if (!isPlayed(match)) return { total: 0, breakdown: {} }
  const isHome = match.homeTeam === teamId
  const isAway = match.awayTeam === teamId
  if (!isHome && !isAway) return { total: 0, breakdown: {} }

  const scored = isHome ? match.homeScore : match.awayScore
  const conceded = isHome ? match.awayScore : match.homeScore
  const breakdown = {}
  let total = 0

  if (scored > conceded) { breakdown.win = 5; total += 5 }
  else if (scored === conceded) { breakdown.draw = 2; total += 2 }
  if (scored > 0) { breakdown.goals = scored * 3; total += breakdown.goals }
  if (conceded === 0) { breakdown.cleanSheet = 4; total += 4 }

  // Note: assists/cards/own-goals are intentionally not scored — the
  // football-data.org free tier doesn't expose per-match event detail.

  return { total, breakdown }
}

const STAGE_BONUS = {
  LAST_32: 5,
  LAST_16: 10,
  QUARTER_FINALS: 15,
  SEMI_FINALS: 20,
  THIRD_PLACE: 20,
  FINAL: 30,
}

function calcProgressionBonus(matches, teamId) {
  const stagesReached = new Set()
  for (const m of matches) {
    if (!isPlayed(m)) continue
    if (m.homeTeam !== teamId && m.awayTeam !== teamId) continue
    if (STAGE_BONUS[m.stage]) stagesReached.add(m.stage)
  }

  // If a team played in the final and won, add winner bonus
  const finalMatch = matches.find(m => m.stage === 'FINAL' && isPlayed(m))
  if (finalMatch) {
    const isHome = finalMatch.homeTeam === teamId
    const isAway = finalMatch.awayTeam === teamId
    if (isHome || isAway) {
      const scored = isHome ? finalMatch.homeScore : finalMatch.awayScore
      const conceded = isHome ? finalMatch.awayScore : finalMatch.homeScore
      if (scored > conceded) stagesReached.add('WINNER')
    }
  }

  let total = 0
  const breakdown = {}
  for (const stage of stagesReached) {
    const pts = stage === 'WINNER' ? 40 : STAGE_BONUS[stage]
    breakdown[stage] = pts
    total += pts
  }
  return { total, breakdown }
}

async function main() {
  console.log('Fetching matches from football-data.org...')
  const { matches: rawMatches } = await apiFetch(`/competitions/${COMPETITION}/matches`)

  // Previous snapshot — used to keep confirmed final scores sticky against the
  // free tier flapping a finished match's score back to null.
  let prevById = {}
  try {
    const prev = JSON.parse(readFileSync(join(dataDir, 'matches.json'), 'utf8'))
    prevById = Object.fromEntries(prev.map(m => [String(m.id), m]))
  } catch {}

  const matches = rawMatches.map(r => parseMatch(r, prevById))

  // Scoring uses only data the free tier provides: scores (wins/goals/clean
  // sheets) and stage (progression). No per-match event detail is fetched.

  const players = JSON.parse(readFileSync(join(dataDir, 'players.json'), 'utf8'))
  if (players.length === 0) {
    console.log('No players yet — skipping score calculation')
    writeFileSync(join(dataDir, 'matches.json'), JSON.stringify(matches, null, 2))
    return
  }

  const playerScores = players.map(player => {
    const teamScores = {}
    let playerTotal = 0

    for (const teamId of player.teams) {
      let teamTotal = 0
      const teamBreakdown = {}

      for (const match of matches) {
        const { total, breakdown } = calcTeamMatchPoints(match, teamId)
        teamTotal += total
        for (const [k, v] of Object.entries(breakdown)) {
          teamBreakdown[k] = (teamBreakdown[k] ?? 0) + v
        }
      }

      const { total: progTotal, breakdown: progBreakdown } = calcProgressionBonus(matches, teamId)
      teamTotal += progTotal
      Object.assign(teamBreakdown, progBreakdown)

      teamScores[teamId] = { total: teamTotal, breakdown: teamBreakdown }
      playerTotal += teamTotal
    }

    return { id: player.id, name: player.name, total: playerTotal, teams: teamScores }
  })

  // snapshot the prior run's totals so the UI can show movement
  let prevTotals = {}
  try {
    const old = JSON.parse(readFileSync(join(dataDir, 'scores.json'), 'utf8'))
    if (old.players?.length) {
      prevTotals = Object.fromEntries(old.players.map(p => [p.id, p.total]))
    } else if (old.prevTotals) {
      prevTotals = old.prevTotals
    }
  } catch {}

  writeFileSync(join(dataDir, 'matches.json'), JSON.stringify(matches, null, 2))
  writeFileSync(join(dataDir, 'scores.json'), JSON.stringify({
    lastUpdated: new Date().toISOString(),
    prevTotals,
    players: playerScores,
  }, null, 2))

  console.log(`Updated: ${matches.filter(m => m.status === 'FINISHED').length} finished matches`)
  playerScores.sort((a, b) => b.total - a.total).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name.padEnd(12)} ${p.total} pts`)
  })
}

main().catch(err => { console.error(err); process.exit(1) })
