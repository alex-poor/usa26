const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard({ scores, players, teamMap, onSelectPlayer }) {
  if (players.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-4xl mb-4">🎲</p>
        <p className="text-lg font-medium text-slate-300">Draw hasn't happened yet</p>
        <p className="text-sm mt-2">
          Edit <code className="bg-wc-card px-1 rounded">scripts/draw.js</code>, add player names, then run{' '}
          <code className="bg-wc-card px-1 rounded">npm run draw</code>
        </p>
      </div>
    )
  }

  // Use scores if available, otherwise fall back to zero-scored player list
  const scoreMap = Object.fromEntries(scores.map(s => [s.id, s]))
  const ranked = [...players]
    .map(p => scoreMap[p.id] ?? { id: p.id, name: p.name, total: 0, teams: {} })
    .sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-200 mb-4">Leaderboard</h2>
      {ranked.map((entry, i) => {
        const player = players.find(p => p.id === entry.id)
        const teamIds = player?.teams ?? []
        return (
          <button
            key={entry.id}
            onClick={() => onSelectPlayer(entry)}
            className="w-full text-left bg-wc-card border border-wc-border rounded-lg px-4 py-3 hover:border-wc-gold transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl w-7 text-center">
                  {i < 3 ? MEDALS[i] : <span className="text-slate-400 text-sm font-bold">{i + 1}</span>}
                </span>
                <div>
                  <p className="font-semibold text-slate-100 group-hover:text-wc-gold transition-colors">
                    {entry.name}
                  </p>
                  <div className="flex gap-1.5 mt-1">
                    {teamIds.map(tid => {
                      const team = teamMap[tid]
                      return team ? (
                        <span key={tid} className="text-sm" title={team.name}>
                          {team.flag}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-wc-gold">{entry.total}</p>
                <p className="text-xs text-slate-400">pts</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
