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

function parseMatch(raw) {
  const finished = raw.status === 'FINISHED'
  return {
    id: String(raw.id),
    homeTeam: normTeam(raw.homeTeam.tla),
    awayTeam: normTeam(raw.awayTeam.tla),
    homeScore: finished ? (raw.score.fullTime.home ?? 0) : null,
    awayScore: finished ? (raw.score.fullTime.away ?? 0) : null,
    date: raw.utcDate.slice(0, 10),
    stage: raw.stage,
    group: raw.group ?? null,
    status: raw.status,
    // Card/assist data filled in below if available
    homeYellowCards: 0,
    awayYellowCards: 0,
    homeRedCards: 0,
    awayRedCards: 0,
    homeAssists: 0,
    awayAssists: 0,
    homeOwnGoals: 0,
    awayOwnGoals: 0,
  }
}

function calcTeamMatchPoints(match, teamId) {
  if (match.status !== 'FINISHED') return { total: 0, breakdown: {} }
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

  const assists = isHome ? match.homeAssists : match.awayAssists
  if (assists > 0) { breakdown.assists = assists; total += assists }

  const yellows = isHome ? match.homeYellowCards : match.awayYellowCards
  if (yellows > 0) { breakdown.yellowCards = yellows * -1; total += breakdown.yellowCards }

  const reds = isHome ? match.homeRedCards : match.awayRedCards
  if (reds > 0) { breakdown.redCards = reds * -3; total += breakdown.redCards }

  const ownGoals = isHome ? match.homeOwnGoals : match.awayOwnGoals
  if (ownGoals > 0) { breakdown.ownGoals = ownGoals * -2; total += breakdown.ownGoals }

  return { total, breakdown }
}

const STAGE_BONUS = {
  ROUND_OF_32: 5,
  ROUND_OF_16: 10,
  QUARTER_FINALS: 15,
  SEMI_FINALS: 20,
  THIRD_PLACE: 20,
  FINAL: 30,
}

function calcProgressionBonus(matches, teamId) {
  const stagesReached = new Set()
  for (const m of matches) {
    if (m.status !== 'FINISHED') continue
    if (m.homeTeam !== teamId && m.awayTeam !== teamId) continue
    if (STAGE_BONUS[m.stage]) stagesReached.add(m.stage)
  }

  // If a team played in the final and won, add winner bonus
  const finalMatch = matches.find(m => m.stage === 'FINAL' && m.status === 'FINISHED')
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

  const matches = rawMatches.map(parseMatch)

  // Attempt to fetch card data for finished matches (best-effort)
  // The free tier may not include this — we skip gracefully
  for (const match of matches.filter(m => m.status === 'FINISHED')) {
    try {
      const detail = await apiFetch(`/matches/${match.id}`)
      const bookings = detail.bookings ?? []
      for (const b of bookings) {
        const teamKey = b.team?.tla === match.homeTeam ? 'home' : 'away'
        if (b.card === 'YELLOW_CARD') match[`${teamKey}YellowCards`]++
        if (b.card === 'RED_CARD') match[`${teamKey}RedCards`]++
      }
      const goals = detail.goals ?? []
      for (const g of goals) {
        const teamKey = g.team?.tla === match.homeTeam ? 'home' : 'away'
        if (g.type === 'OWN') match[`${teamKey}OwnGoals`]++
        if (g.assist?.name) match[`${teamKey}Assists`]++
      }
    } catch {
      // silently skip if detail fetch fails (rate limit / tier restriction)
    }
  }

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

  writeFileSync(join(dataDir, 'matches.json'), JSON.stringify(matches, null, 2))
  writeFileSync(join(dataDir, 'scores.json'), JSON.stringify({
    lastUpdated: new Date().toISOString(),
    players: playerScores,
  }, null, 2))

  console.log(`Updated: ${matches.filter(m => m.status === 'FINISHED').length} finished matches`)
  playerScores.sort((a, b) => b.total - a.total).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name.padEnd(12)} ${p.total} pts`)
  })
}

main().catch(err => { console.error(err); process.exit(1) })
