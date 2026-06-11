#!/usr/bin/env node
/* Monte-Carlo validation of the KaroCup scoring system.
   Simulates full tournaments (real groups + fixtures, strength from FIFA
   rank), applies the exact scoring rules, and reports where points come
   from and how competitive the actual draw is.
   Run: node scripts/simulate.js [runs]                                   */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')
const rd = f => JSON.parse(readFileSync(join(dataDir, f), 'utf8'))
const teams = rd('teams.json')
const players = rd('players.json')
const matches = rd('matches.json')

const RUNS = Number(process.argv[2] || 20000)

// ---- scoring rules (mirror of the app) ------------------------------------
const RULES = { win: 5, draw: 2, goal: 3, cs: 4 } // free-tier data: no cards/assists/own-goals
// current curve, or a flattened one via FLAT=1 (reduces champion dependency)
const STAGE_BONUS = process.env.FLAT
  ? { r32: 5, r16: 12, qf: 22, sf: 34, final: 48, winner: 64 }
  : { r32: 5, r16: 15, qf: 30, sf: 50, final: 80, winner: 120 }

// ---- strength from FIFA rank ----------------------------------------------
const T = {}
for (const t of teams) T[t.id] = { ...t, r: 1 - (t.rank - 1) / 90 } // r in ~(0,1], higher = stronger

// ---- real groups + fixtures from matches.json -----------------------------
const groups = {} // letter -> { teams:Set, fixtures:[[a,b]] }
for (const m of matches) {
  if (!m.group) continue
  const g = m.group.replace('GROUP_', '')
  groups[g] ??= { teams: new Set(), fixtures: [] }
  groups[g].teams.add(m.homeTeam); groups[g].teams.add(m.awayTeam)
  groups[g].fixtures.push([m.homeTeam, m.awayTeam])
}
const GROUP_LETTERS = Object.keys(groups).sort()

// ---- helpers --------------------------------------------------------------
function poisson(lambda) {
  const L = Math.exp(-lambda); let k = 0, p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}
function playMatch(a, b) {
  const diff = T[a].r - T[b].r
  const xgA = Math.min(5, Math.max(0.2, 1.3 * Math.exp(1.1 * diff)))
  const xgB = Math.min(5, Math.max(0.2, 1.3 * Math.exp(-1.1 * diff)))
  return [poisson(xgA), poisson(xgB)]
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]] } return a }

// accumulate one match into the per-team stat ledger
function applyMatch(stat, a, b, ga, gb) {
  const A = stat[a], B = stat[b]
  A.gf += ga; A.ga += gb; B.gf += gb; B.ga += ga
  if (gb === 0) A.cs++; if (ga === 0) B.cs++
  if (ga > gb) { A.w++; B.l++ } else if (ga < gb) { B.w++; A.l++ } else { A.d++; B.d++ }
}
function teamPoints(s, bonus) {
  return s.w * RULES.win + s.d * RULES.draw + s.gf * RULES.goal + s.cs * RULES.cs + bonus
}

// ---- one tournament -------------------------------------------------------
function simulate() {
  const stat = {}
  for (const t of teams) stat[t.id] = { w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0, ast: 0, yc: 0, rc: 0, og: 0, pts: 0, gd: 0 }

  // group stage
  const thirds = []
  const qualifiers = []
  for (const g of GROUP_LETTERS) {
    const gr = groups[g]
    for (const [a, b] of gr.fixtures) {
      const [ga, gb] = playMatch(a, b)
      applyMatch(stat, a, b, ga, gb)
      if (ga > gb) stat[a].pts += 3; else if (gb > ga) stat[b].pts += 3; else { stat[a].pts++; stat[b].pts++ }
    }
    const table = [...gr.teams].map(id => ({ id, ...stat[id], gd: stat[id].gf - stat[id].ga }))
      .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || Math.random() - 0.5)
    qualifiers.push(table[0].id, table[1].id)
    thirds.push(table[2])
  }
  // 8 best third-placed
  thirds.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || Math.random() - 0.5)
  for (let i = 0; i < 8; i++) qualifiers.push(thirds[i].id)

  // knockouts: single elimination, reseed each round
  const reached = {}            // id -> furthest round index lost (1..5) ; champion handled separately
  for (const id of qualifiers) reached[id] = 1 // everyone in R32 reached R32
  let alive = shuffle([...qualifiers])
  const ROUND_KEYS = ['r32', 'r16', 'qf', 'sf', 'final']
  let champion = null
  for (let round = 0; round < 5; round++) {
    const next = []
    for (let i = 0; i < alive.length; i += 2) {
      const a = alive[i], b = alive[i + 1]
      let [ga, gb] = playMatch(a, b)
      applyMatch(stat, a, b, ga, gb)
      let winner
      if (ga > gb) winner = a
      else if (gb > ga) winner = b
      else winner = Math.random() < (T[a].r / (T[a].r + T[b].r)) ? a : b // shootout
      const loser = winner === a ? b : a
      next.push(winner)
      reached[winner] = round + 2          // advanced to next round
      // loser's furthest = this round (reached[loser] already = round+1)
    }
    alive = shuffle(next)
    if (alive.length === 1) { champion = alive[0]; break }
  }
  // bonuses
  for (const id of qualifiers) {
    const r = reached[id]
    let bonus = [0, STAGE_BONUS.r32, STAGE_BONUS.r16, STAGE_BONUS.qf, STAGE_BONUS.sf, STAGE_BONUS.final][r] || STAGE_BONUS.final
    if (id === champion) bonus = STAGE_BONUS.winner
    stat[id].bonus = bonus
  }
  for (const t of teams) { const s = stat[t.id]; s.bonus ??= 0; s.total = teamPoints(s, s.bonus) }
  return { stat, champion }
}

// ---- aggregate ------------------------------------------------------------
const tierTot = { 1: 0, 2: 0, 3: 0 }, tierCnt = { 1: 0, 2: 0, 3: 0 }
let bonusSum = 0, matchSum = 0
const pAgg = players.map(p => ({ id: p.id, name: p.name, teams: p.teams, total: 0, wins: 0, top3: 0, byTier: { 1: 0, 2: 0, 3: 0 }, champOwnerWins: 0 }))
let championOwnedWins = 0, championOwnedTotal = 0

for (let run = 0; run < RUNS; run++) {
  const { stat, champion } = simulate()
  for (const t of teams) { tierTot[t.tier] += stat[t.id].total; tierCnt[t.tier]++; bonusSum += stat[t.id].bonus; matchSum += (stat[t.id].total - stat[t.id].bonus) }
  // players
  const totals = pAgg.map(p => {
    let tot = 0
    for (const code of p.teams) { const s = stat[code]; tot += s.total; p.byTier[T[code].tier] += s.total }
    p.total += tot
    return { id: p.id, tot }
  }).sort((a, b) => b.tot - a.tot)
  totals.forEach((x, i) => { const p = pAgg.find(q => q.id === x.id); if (i === 0) p.wins++; if (i < 3) p.top3++ })
  // champion-owner effect
  const owner = players.find(p => p.teams.includes(champion))
  if (owner) { championOwnedTotal++; if (totals[0].id === owner.id) championOwnedWins++ }
}

// ---- report ---------------------------------------------------------------
const pct = (x, d = totals => 1) => (100 * x).toFixed(1) + '%'
const f1 = x => x.toFixed(1)
console.log(`\n=== KaroCup scoring validation · ${RUNS.toLocaleString()} simulated tournaments ===\n`)

console.log('TIER BALANCE — avg sweepstake points a team earns per tournament:')
for (const t of [1, 2, 3]) console.log(`  Tier ${t}:  ${f1(tierTot[t] / tierCnt[t]).padStart(6)} pts/team`)
const tierAvg = { 1: tierTot[1] / tierCnt[1], 2: tierTot[2] / tierCnt[2], 3: tierTot[3] / tierCnt[3] }
console.log(`  → a Tier-1 team scores ${f1(tierAvg[1] / tierAvg[3])}× a Tier-3 team on average`)

console.log('\nWHERE POINTS COME FROM (all teams, all runs):')
const allPts = bonusSum + matchSum
console.log(`  Live match play (wins/goals/CS/cards): ${pct(matchSum / allPts)}`)
console.log(`  Progression bonuses (how far you go):  ${pct(bonusSum / allPts)}`)

console.log('\nAVG PLAYER TOTAL, split by which tier earned it:')
for (const p of pAgg) {
  const tot = p.total / RUNS
  const b = p.byTier
  console.log(`  ${p.name.padEnd(9)} ${f1(tot).padStart(6)} pts   ` +
    `T1 ${pct(b[1] / p.total).padStart(6)} · T2 ${pct(b[2] / p.total).padStart(6)} · T3 ${pct(b[3] / p.total).padStart(6)}`)
}

console.log('\nCHAMPION-OWNER EFFECT:')
console.log(`  When you own the tournament winner, you win the sweepstake ${pct(championOwnedWins / championOwnedTotal)} of the time`)

console.log('\nTHIS DRAW — competitiveness (win% and avg points over all runs):')
const ranked = [...pAgg].sort((a, b) => b.wins - a.wins)
for (const p of ranked) {
  console.log(`  ${p.name.padEnd(9)} win ${pct(p.wins / RUNS).padStart(6)} · top3 ${pct(p.top3 / RUNS).padStart(6)} · avg ${f1(p.total / RUNS).padStart(6)} pts`)
}
const winRates = ranked.map(p => p.wins / RUNS)
console.log(`\n  Favourite wins ${pct(winRates[0])} vs longshot ${pct(winRates[winRates.length - 1])} — ` +
  `${f1(winRates[0] / winRates[winRates.length - 1])}× spread (fair coin = ${f1(1 / players.length * 100)}% each)`)
console.log()
