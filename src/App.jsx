import { useState, useEffect } from 'react'
import Leaderboard from './components/Leaderboard.jsx'
import Matches from './components/Matches.jsx'
import PlayerDetail from './components/PlayerDetail.jsx'

const BASE = import.meta.env.BASE_URL

async function fetchJSON(path) {
  const res = await fetch(`${BASE}data/${path}`)
  if (!res.ok) throw new Error(`Failed to fetch ${path}`)
  return res.json()
}

export default function App() {
  const [tab, setTab] = useState('leaderboard')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [data, setData] = useState({ teams: [], players: [], scores: { lastUpdated: null, players: [] } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchJSON('teams.json'),
      fetchJSON('players.json'),
      fetchJSON('scores.json'),
    ]).then(([teams, players, scores]) => {
      setData({ teams, players, scores })
      setLoading(false)
    }).catch(console.error)
  }, [])

  const teamMap = Object.fromEntries(data.teams.map(t => [t.id, t]))

  function handleSelectPlayer(scoreEntry) {
    const playerData = data.players.find(p => p.id === scoreEntry.id)
    setSelectedPlayer({
      id: scoreEntry.id,
      name: scoreEntry.name,
      total: scoreEntry.total ?? 0,
      teamIds: playerData?.teams ?? [],
      teamScores: scoreEntry.teams ?? {},
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-wc-gold text-2xl animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-wc-card border-b border-wc-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-wc-gold">⚽ WC 2026 Sweepstake</h1>
            {data.scores.lastUpdated && (
              <p className="text-xs text-slate-400 mt-0.5">
                Updated {new Date(data.scores.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          <nav className="flex gap-1">
            {[['leaderboard', '🏆'], ['matches', '📋']].map(([id, icon]) => (
              <button
                key={id}
                onClick={() => { setTab(id); setSelectedPlayer(null) }}
                className={`px-3 py-1.5 rounded text-sm font-medium capitalize transition-colors ${
                  tab === id
                    ? 'bg-wc-gold text-wc-dark'
                    : 'text-slate-300 hover:text-white hover:bg-wc-border'
                }`}
              >
                {icon} {id}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {selectedPlayer ? (
          <PlayerDetail
            player={selectedPlayer}
            teamMap={teamMap}
            onBack={() => setSelectedPlayer(null)}
          />
        ) : tab === 'leaderboard' ? (
          <Leaderboard
            scores={data.scores.players}
            players={data.players}
            teamMap={teamMap}
            onSelectPlayer={handleSelectPlayer}
          />
        ) : (
          <Matches base={BASE} teamMap={teamMap} />
        )}
      </main>
    </div>
  )
}
