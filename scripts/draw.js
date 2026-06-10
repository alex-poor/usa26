#!/usr/bin/env node
// Run once to assign teams to players: npm run draw
// Edit PLAYER_NAMES below, then run.

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dir, '..', 'public', 'data')

// ── CONFIGURE PLAYERS HERE ──────────────────────────────────────────────────
const PLAYER_NAMES = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Ed',
  'Fiona',
  'George',
  'Hannah',
  'Ivan',
  'Julia',
]
// ────────────────────────────────────────────────────────────────────────────

const teams = JSON.parse(readFileSync(join(dataDir, 'teams.json'), 'utf8'))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const tier1 = shuffle(teams.filter(t => t.tier === 1))
const tier2 = shuffle(teams.filter(t => t.tier === 2))
const tier3 = shuffle(teams.filter(t => t.tier === 3))

if (PLAYER_NAMES.length > tier1.length) {
  console.error(`Too many players (${PLAYER_NAMES.length}) for tier size (${tier1.length})`)
  process.exit(1)
}

const players = PLAYER_NAMES.map((name, i) => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  teams: [tier1[i].id, tier2[i].id, tier3[i].id],
}))

writeFileSync(join(dataDir, 'players.json'), JSON.stringify(players, null, 2))

console.log('\n🎲 Draw complete!\n')
players.forEach(p => {
  const t1 = teams.find(t => t.id === p.teams[0])
  const t2 = teams.find(t => t.id === p.teams[1])
  const t3 = teams.find(t => t.id === p.teams[2])
  console.log(`  ${p.name.padEnd(12)} ${t1.flag} ${t1.name.padEnd(16)} ${t2.flag} ${t2.name.padEnd(16)} ${t3.flag} ${t3.name}`)
})
console.log('\nCommit public/data/players.json to save the draw.\n')
