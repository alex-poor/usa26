/* ───────── Today / Home ───────── */
import { useKaro, useOpenTeam } from '../lib/karo.jsx'
import { Flag, Trend, YouTag, Avatar, Move, Medal, SectionLabel, ordinal } from '../components/shared.jsx'

function rivalOwner(K, code, exclude) {
  return K.ownersOf(code).find(p => p.id !== (exclude && exclude.id)) || null
}

function YourStanding({ K, you, onTable, onSquad }) {
  const above = you.rank > 1 ? K.ranked[you.rank - 2] : null
  const below = you.rank < K.PLAYERS.length ? K.ranked[you.rank] : null
  return (
    <div className="sticker pop" style={{ margin: '0 16px 16px', overflow: 'hidden', position: 'relative' }}>
      <div className="foil foil--anim" style={{ height: 6, width: '100%' }} />
      <div style={{ padding: '15px 16px 16px' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Your position</div>
          <Move move={you.move} />
        </div>
        <div className="row" style={{ gap: 14, marginTop: 8, alignItems: 'center' }}>
          <Medal rank={you.rank} size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>
              {you.move > 0 ? `Up ${you.move} since the last update` : you.move < 0 ? `Down ${-you.move} since the last update` : 'Holding steady'}
            </div>
            <div style={{ fontFamily: 'var(--disp)', fontSize: 30, lineHeight: 1, marginTop: 2 }}>
              {you.total}<span className="pts-unit" style={{ marginLeft: 4 }}>PTS</span>
            </div>
          </div>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 14 }}>
          {above && (
            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 9, background: 'rgba(33,31,43,.05)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--red)', letterSpacing: '.06em' }}>{above.total - you.total} TO CATCH</div>
              <div className="row" style={{ gap: 6, marginTop: 4 }}><Avatar player={above} size={18} /><span style={{ fontSize: 12, fontWeight: 700 }}>{above.name} · {ordinal(above.rank)}</span></div>
            </div>
          )}
          {below && (
            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 9, background: 'rgba(60,122,78,.10)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)', letterSpacing: '.06em' }}>{you.total - below.total} CUSHION</div>
              <div className="row" style={{ gap: 6, marginTop: 4 }}><Avatar player={below} size={18} /><span style={{ fontSize: 12, fontWeight: 700 }}>{below.name} chasing</span></div>
            </div>
          )}
        </div>
        <div className="row" style={{ gap: 9, marginTop: 14 }}>
          <button className="btn btn--gold" onClick={onSquad} style={{ flex: 1, padding: '11px', fontSize: 13 }}>⚙️ My squad</button>
          <button className="btn" onClick={onTable} style={{ flex: 1, padding: '11px', fontSize: 13 }}>Full table →</button>
        </div>
      </div>
    </div>
  )
}

function TodayMatchCard({ K, m, you }) {
  const openTeam = useOpenTeam()
  const myCode = [m.a, m.b].find(c => you.teams.some(t => t.code === c))
  const oppCode = m.a === myCode ? m.b : m.a
  const myTeam = K.TEAMS[myCode]
  const oppTeam = K.TEAMS[oppCode]
  const rival = rivalOwner(K, oppCode, you)
  return (
    <div className="sticker" style={{ padding: '13px 14px' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 11 }}>
        <span className="chip" style={{ background: 'var(--red)', color: '#fff', height: 21, fontSize: 10 }}>● {m.time || 'TBC'} · {m.stageLabel}</span>
        {m.venue && <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{m.venue}</span>}
      </div>
      <div className="row" style={{ gap: 11 }}>
        <button onClick={() => openTeam(myCode)} style={{ textAlign: 'center', flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Flag code={myCode} size={46} style={{ margin: '0 auto' }} />
          <div className="row" style={{ gap: 4, justifyContent: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800 }}>{myTeam.name}</span><Trend team={myTeam} size={12} />
          </div>
          <div style={{ marginTop: 4 }}><YouTag small /></div>
        </button>
        <div style={{ fontFamily: 'var(--disp)', fontSize: 18, color: 'var(--ink-3)' }}>V</div>
        <button onClick={() => oppCode && openTeam(oppCode)} style={{ textAlign: 'center', flex: 1, background: 'none', border: 'none', cursor: oppCode ? 'pointer' : 'default', padding: 0 }}>
          <Flag code={oppCode} size={46} style={{ margin: '0 auto' }} />
          <div className="row" style={{ gap: 4, justifyContent: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800 }}>{oppTeam ? oppTeam.name : 'TBD'}</span>{oppTeam && <Trend team={oppTeam} size={12} />}
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: rival ? 'var(--red)' : 'var(--ink-3)', letterSpacing: '.04em', marginTop: 4 }}>
            {rival ? `${rival.name.toUpperCase()}'S` : 'UNOWNED'}
          </div>
        </button>
      </div>
      {rival && (
        <div style={{ marginTop: 11, padding: '7px 10px', borderRadius: 8, background: 'rgba(206,64,54,.09)', fontSize: 11, fontWeight: 600, color: 'var(--red-d)', textAlign: 'center' }}>
          ⚔️ Head-to-head with <b>{rival.name}</b> · {rival.rank < you.rank ? 'just above you' : 'right behind you'}
        </div>
      )}
    </div>
  )
}

function MoverPill({ p, onOpen }) {
  const up = p.move > 0
  return (
    <button onClick={() => onOpen(p)} className="sticker" style={{
      padding: '11px 12px', border: 'none', cursor: 'pointer', textAlign: 'left', background: 'var(--card)', boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Avatar player={p} size={26} />
        <span className={'move ' + (up ? 'up' : 'down')} style={{ fontSize: 14 }}>
          <svg width="10" height="10" viewBox="0 0 9 9" style={{ transform: up ? 'none' : 'rotate(180deg)' }}><path d="M4.5 1L8 6H1z" fill="currentColor" /></svg>
          {Math.abs(p.move)}
        </span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 13.5, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.alias}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{p.name} · {p.total}pts</div>
    </button>
  )
}

export default function Today({ onTable, onSquad, onOpen, onDraw }) {
  const K = useKaro()
  const you = K.you
  const todayMatches = K.MATCHES.filter(m => m.today)
  const myToday = todayMatches.filter(m => you.teams.some(t => t.code === m.a || t.code === m.b))
  const movers = [...K.PLAYERS].filter(p => p.move !== 0).sort((a, b) => b.move - a.move)

  return (
    <div className="karo-scroll">
      <div className="app-header">
        <div className="kicker">Match Day · {K.TODAY.round}</div>
        <h1>Today</h1>
        <div className="sub">{K.TODAY.dateLabel} · data refreshes every couple of hours</div>
      </div>

      <YourStanding K={K} you={you} onTable={onTable} onSquad={onSquad} />

      <div style={{ padding: '0 16px' }}>
        <SectionLabel style={{ marginBottom: 11 }}>
          {myToday.length ? `${myToday.length} of your teams play today` : 'Your teams today'}
        </SectionLabel>
      </div>
      <div className="card-grid" style={{ padding: '0 16px 4px' }}>
        {myToday.length ? myToday.map(m => <TodayMatchCard key={m.id} K={K} m={m} you={you} />)
          : <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '8px 0' }}>None of your teams are in action today.</div>}
      </div>

      {movers.length > 0 && (
        <>
          <div style={{ padding: '20px 16px 0' }}>
            <SectionLabel style={{ marginBottom: 11 }}>Match day movers</SectionLabel>
          </div>
          <div className="mover-grid" style={{ padding: '0 16px 4px' }}>
            {movers.map(p => <MoverPill key={p.id} p={p} onOpen={onOpen} />)}
          </div>
        </>
      )}

      <div style={{ padding: '20px 16px 0' }}>
        <button onClick={onDraw} className="sticker" style={{
          width: '100%', border: 'none', cursor: 'pointer', padding: 0, overflow: 'hidden',
          position: 'relative', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div className="foil foil--anim" style={{ width: 64, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎟️</div>
          <div style={{ padding: '13px 0', flex: 1 }}>
            <div style={{ fontFamily: 'var(--disp)', fontSize: 19, lineHeight: 1, textTransform: 'uppercase' }}>Re-live the draw</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 600, marginTop: 3 }}>How you landed {you.teams.map(t => t.code).join(' · ')}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 16 16" style={{ marginRight: 14, color: 'var(--ink-3)' }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div style={{ height: 22 }} />
    </div>
  )
}
