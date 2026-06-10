/* ───────── Leaderboard / The Table ───────── */
import { useKaro } from '../lib/karo.jsx'
import { Flag, YouTag, Avatar, Move, Points, SectionLabel, Medal } from '../components/shared.jsx'

function TeamMiniRow({ teams, size = 21 }) {
  return (
    <div className="row" style={{ gap: 4 }}>
      {teams.map(t => (
        <div key={t.code} style={{ position: 'relative' }}>
          <Flag code={t.code} size={size} />
          {(t.darkHorse || t.trend) && (
            <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 11 }}>
              {t.darkHorse ? '🐴' : t.trend}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function TableRow({ p, onOpen }) {
  const top3 = p.rank <= 3
  return (
    <button onClick={() => onOpen(p)} className="sticker pop" style={{
      display: 'flex', alignItems: 'center', gap: 11, width: '100%',
      textAlign: 'left', border: 'none', cursor: 'pointer', padding: '11px 13px', marginBottom: 9,
      background: p.you ? 'linear-gradient(90deg,#FFF6E0,#FFFDF7 40%)' : 'var(--card)',
      boxShadow: p.you ? '0 0 0 2px var(--gold), var(--shadow)' : 'var(--shadow-sm)',
    }}>
      <Medal rank={p.rank} size={top3 ? 34 : 30} />
      <Avatar player={p} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row" style={{ gap: 7 }}>
          <span style={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: 15.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.alias}</span>
          {p.you && <YouTag small />}
          <Move move={p.move} />
        </div>
        <div className="row" style={{ gap: 8, marginTop: 5 }}>
          <TeamMiniRow teams={p.teams} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)' }}>{p.name}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Points value={p.total} size={26} unit={false} />
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', color: 'var(--ink-3)' }}>PTS</div>
      </div>
    </button>
  )
}

export default function Leaderboard({ onOpen }) {
  const K = useKaro()
  const ranked = K.ranked
  if (!ranked.length) {
    return (
      <div className="karo-scroll">
        <div className="app-header">
          <div className="kicker">Standings</div>
          <h1>The Table</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--ink-3)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎲</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink-2)' }}>The draw hasn’t happened yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Once teams are assigned, the table fills in here.</div>
        </div>
      </div>
    )
  }
  const leader = ranked[0]
  const topMover = [...K.PLAYERS].sort((a, b) => b.move - a.move)[0]
  const hasMoves = K.PLAYERS.some(p => p.move !== 0)
  return (
    <div className="karo-scroll">
      <div className="app-header">
        <div className="kicker">Standings</div>
        <h1>The Table</h1>
        <div className="sub">{K.PLAYERS.length} managers · {K.TODAY.round} in play</div>
      </div>

      <div className="col-narrow">
        <div className="row" style={{ gap: 9, padding: '2px 16px 14px' }}>
          <div className="sticker sticker--flat" style={{ flex: 1, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Leader</div>
            <div className="row" style={{ gap: 7, marginTop: 5 }}>
              <Avatar player={leader} size={26} />
              <span style={{ fontWeight: 800, fontSize: 14 }}>{leader.name}</span>
              <span className="num" style={{ fontSize: 16, marginLeft: 'auto' }}>{leader.total}</span>
            </div>
          </div>
          {hasMoves && topMover.move > 0 && (
            <div className="sticker sticker--flat" style={{ flex: 1, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: 'var(--green)', textTransform: 'uppercase' }}>▲ Top mover</div>
              <div className="row" style={{ gap: 7, marginTop: 5 }}>
                <Avatar player={topMover} size={26} />
                <span style={{ fontWeight: 800, fontSize: 14 }}>{topMover.name}</span>
                <span className="move up" style={{ marginLeft: 'auto', fontSize: 14 }}>+{topMover.move}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '0 16px' }}>
          <SectionLabel style={{ marginBottom: 11 }}>Full standings</SectionLabel>
          {ranked.map(p => <TableRow key={p.id} p={p} onOpen={onOpen} />)}
          {hasMoves && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-3)', padding: '4px 0 8px', fontWeight: 600 }}>
              Movement shown vs. the previous update
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 18 }} />
    </div>
  )
}
