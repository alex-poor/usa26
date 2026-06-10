const BREAKDOWN_LABELS = {
  win: 'Wins',
  draw: 'Draws',
  goals: 'Goals scored',
  assists: 'Assists',
  cleanSheet: 'Clean sheets',
  yellowCards: 'Yellow cards',
  redCards: 'Red cards',
  ownGoals: 'Own goals',
  LAST_32: 'Reached Round of 32',
  LAST_16: 'Reached Round of 16',
  QUARTER_FINALS: 'Reached Quarter-Final',
  SEMI_FINALS: 'Reached Semi-Final',
  THIRD_PLACE: 'Reached 3rd Place play-off',
  FINAL: 'Reached Final',
  WINNER: 'World Champions',
}

const TIER_LABELS = ['', 'Tier 1', 'Tier 2', 'Tier 3']

function BreakdownRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-slate-400">{label}</span>
      <span className={value >= 0 ? 'text-emerald-400' : 'text-red-400'}>
        {value > 0 ? '+' : ''}{value}
      </span>
    </div>
  )
}

export default function PlayerDetail({ player, teamMap, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-5 transition-colors"
      >
        ← Back to leaderboard
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">{player.name}</h2>
        <p className="text-3xl font-bold text-wc-gold mt-1">{player.total} pts</p>
      </div>

      <div className="space-y-4">
        {player.teamIds.map((teamId) => {
          const team = teamMap[teamId]
          const score = player.teamScores[teamId] ?? { total: 0, breakdown: {} }
          if (!team) return null
          return (
            <div key={teamId} className="bg-wc-card border border-wc-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{team.flag}</span>
                  <div>
                    <p className="font-semibold text-slate-100">{team.name}</p>
                    <p className="text-xs text-slate-500">{TIER_LABELS[team.tier]}</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-wc-gold">{score.total} pts</p>
              </div>
              {Object.keys(score.breakdown ?? {}).length > 0 && (
                <div className="border-t border-wc-border pt-3 mt-3">
                  {Object.entries(score.breakdown).map(([key, val]) => (
                    <BreakdownRow key={key} label={BREAKDOWN_LABELS[key] ?? key} value={val} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
