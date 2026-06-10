import { useState, useEffect } from 'react'

const STAGE_LABELS = {
  GROUP_STAGE: 'Group Stage',
  LAST_32: 'Round of 32',
  LAST_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-Finals',
  SEMI_FINALS: 'Semi-Finals',
  THIRD_PLACE: '3rd Place Play-off',
  FINAL: 'Final',
}

function MatchRow({ match, teamMap }) {
  const home = teamMap[match.homeTeam]
  const away = teamMap[match.awayTeam]
  const finished = match.status === 'FINISHED'

  return (
    <div className="bg-wc-card border border-wc-border rounded-lg px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm font-medium text-slate-200 text-right">{home?.name ?? match.homeTeam}</span>
          <span className="text-xl">{home?.flag}</span>
        </div>
        <div className="text-center min-w-[60px]">
          {finished ? (
            <span className="font-bold text-lg text-wc-gold">{match.homeScore}–{match.awayScore}</span>
          ) : (
            <span className="text-xs text-slate-400">{match.date}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{away?.flag}</span>
          <span className="text-sm font-medium text-slate-200">{away?.name ?? match.awayTeam}</span>
        </div>
      </div>
      {match.stage && (
        <p className="text-center text-xs text-slate-500 mt-1">{STAGE_LABELS[match.stage] ?? match.stage}</p>
      )}
    </div>
  )
}

export default function Matches({ base, teamMap }) {
  const [matches, setMatches] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${base}data/matches.json`)
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [base])

  const filtered = matches.filter(m => {
    if (filter === 'finished') return m.status === 'FINISHED'
    if (filter === 'upcoming') return m.status !== 'FINISHED'
    return true
  })

  if (loading) return <div className="text-center py-12 text-slate-400">Loading matches...</div>

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-4xl mb-4">📋</p>
        <p className="text-slate-300">No matches yet</p>
        <p className="text-sm mt-2">Matches are fetched automatically via GitHub Actions</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {[['all', 'All'], ['finished', 'Results'], ['upcoming', 'Upcoming']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filter === val ? 'bg-wc-gold text-wc-dark font-medium' : 'bg-wc-card text-slate-300 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(m => <MatchRow key={m.id} match={m} teamMap={teamMap} />)}
      </div>
    </div>
  )
}
