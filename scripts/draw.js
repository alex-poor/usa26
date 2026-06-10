#!/usr/bin/env node
// Run once to assign teams to players: npm run draw
// Edit PLAYERS below, then run.

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dir, '..', 'public', 'data')

// ── CONFIGURE PLAYERS HERE ──────────────────────────────────────────────────
// Each entry is the person's name, optionally with a shared squad name (alias).
// Plain strings also work: 'Robert' is the same as { name: 'Robert' }.
// Without an alias, the app shows "{Name}'s XI".
const PLAYERS = [
  { name: 'Alice',   alias: '' },
  { name: 'Bob',     alias: '' },
  { name: 'Charlie', alias: '' },
  { name: 'Diana',   alias: '' },
  { name: 'Ed',      alias: '' },
  { name: 'Fiona',   alias: '' },
  { name: 'George',  alias: '' },
  { name: 'Hannah',  alias: '' },
  { name: 'Ivan',    alias: '' },
  { name: 'Julia',   alias: '' },
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

const roster = PLAYERS.map(p => (typeof p === 'string' ? { name: p } : p))

const tier1 = shuffle(teams.filter(t => t.tier === 1))
const tier2 = shuffle(teams.filter(t => t.tier === 2))
const tier3 = shuffle(teams.filter(t => t.tier === 3))

if (roster.length > tier1.length) {
  console.error(`Too many players (${roster.length}) for tier size (${tier1.length})`)
  process.exit(1)
}

const players = roster.map((p, i) => {
  const entry = {
    id: p.name.toLowerCase().replace(/\s+/g, '-'),
    name: p.name,
    teams: [tier1[i].id, tier2[i].id, tier3[i].id],
  }
  if (p.alias && p.alias.trim()) entry.alias = p.alias.trim()
  return entry
})

writeFileSync(join(dataDir, 'players.json'), JSON.stringify(players, null, 2))

console.log('\n🎲 Draw complete!\n')
players.forEach(p => {
  const t1 = teams.find(t => t.id === p.teams[0])
  const t2 = teams.find(t => t.id === p.teams[1])
  const t3 = teams.find(t => t.id === p.teams[2])
  const label = p.alias ? `${p.name} (${p.alias})` : p.name
  console.log(`  ${label.padEnd(24)} ${t1.flag} ${t1.name.padEnd(16)} ${t2.flag} ${t2.name.padEnd(16)} ${t3.flag} ${t3.name}`)
})
console.log('\nCommit public/data/players.json to save the draw.\n')
