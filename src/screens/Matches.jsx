/* ───────── Matches ───────── */
import { useState } from 'react'
import { useKaro, useOpenTeam } from '../lib/karo.jsx'
import { Flag, YouTag } from '../components/shared.jsx'

function involvesYou(m, you) {
  return you && you.teams.some(t => t.code === m.a || t.code === m.b)
}

function MatchRow({ m, you }) {
  const K = useKaro()
  const openTeam = useOpenTeam()
  const mine = involvesYou(m, you)
  const A = m.a ? K.TEAMS[m.a] : null
  const B = m.b ? K.TEAMS[m.b] : null
  const aWin = m.played && m.ga > m.gb
  const bWin = m.played && m.gb > m.ga
  const teamRow = (T, code, win, score, isMine) => (
    <div className="row" style={{ gap: 9, padding: '3px 0' }}>
      <button onClick={() => T && openTeam(code)} disabled={!T}
        style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: T ? 'pointer' : 'default', textAlign: 'left' }}>
        <Flag code={code} size={24} />
        <span style={{ fontSize: 14, fontWeight: win ? 800 : 600, color: T ? 'var(--ink)' : 'var(--ink-3)' }}>{T ? T.name : 'To be decided'}</span>
        {T && T.trend && <span style={{ fontSize: 12 }} title={T.trendLabel}>{T.trend}</span>}
        {isMine && <YouTag small />}
      </button>
      {m.played ? <span className="num" style={{ fontSize: 18, color: win ? 'var(--ink)' : 'var(--ink-3)' }}>{score}</span> : null}
    </div>
  )
  return (
    <div className="sticker sticker--flat" style={{ padding: '11px 13px', position: 'relative', boxShadow: mine ? '0 0 0 1.5px var(--gold), var(--shadow-sm)' : 'var(--shadow-sm)' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{m.venue || m.stageLabel}</span>
        {m.today
          ? <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: 'var(--red)', padding: '2px 8px', borderRadius: 999, letterSpacing: '.04em' }}>● TODAY{m.time ? ' ' + m.time : ''}</span>
          : !m.played
            ? <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--blue)' }}>{m.date}{m.time ? ' · ' + m.time : ''}</span>
            : <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)' }}>{m.date} · FT</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          {teamRow(A, m.a, aWin, m.ga, A && involvesYou({ a: m.a }, you) && you.teams.some(t => t.code === m.a))}
          {teamRow(B, m.b, bWin, m.gb, B && you && you.teams.some(t => t.code === m.b))}
        </div>
        {!m.played && (
          <div style={{ flex: 'none', textAlign: 'center', borderLeft: '1px dashed var(--line-2)', paddingLeft: 12 }}>
            <div style={{ fontFamily: 'var(--disp)', fontSize: 16, lineHeight: 1 }}>{m.time || 'TBC'}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--ink-3)', letterSpacing: '.06em', marginTop: 2 }}>KICK-OFF</div>
          </div>
        )}
      </div>
    </div>
  )
}

function StageBlock({ label, matches, you, accent }) {
  if (!matches.length) return null
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="row" style={{ gap: 9, marginBottom: 11 }}>
        <span style={{ fontFamily: 'var(--disp)', fontSize: 17, textTransform: 'uppercase', color: accent || 'var(--ink)', whiteSpace: 'nowrap', flex: 'none' }}>{label}</span>
        <span className="chip" style={{ height: 19, fontSize: 10, flex: 'none' }}>{matches.length}</span>
        <span style={{ flex: 1, borderTop: '1.5px dashed var(--line-2)' }} />
      </div>
      <div className="match-grid">
        {matches.map(m => <MatchRow key={m.id} m={m} you={you} />)}
      </div>
    </div>
  )
}

function GroupStageBlock({ matches, you }) {
  const K = useKaro()
  const [openG, setOpenG] = useState(null)
  if (!matches.length) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="row" style={{ gap: 9, marginBottom: 11 }}>
        <span style={{ fontFamily: 'var(--disp)', fontSize: 17, textTransform: 'uppercase', whiteSpace: 'nowrap', flex: 'none' }}>Group stage</span>
        <span className="chip" style={{ height: 19, fontSize: 10, flex: 'none' }}>{matches.length}</span>
        <span style={{ flex: 1, borderTop: '1.5px dashed var(--line-2)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
        {K.GROUP_LETTERS.map(g => {
          const gm = matches.filter(m => m.stageLabel === 'Group ' + g)
          const yourGroup = gm.some(m => involvesYou(m, you))
          const open = openG === g
          return (
            <button key={g} onClick={() => setOpenG(open ? null : g)} className="sticker sticker--flat" style={{
              border: 'none', cursor: 'pointer', padding: '9px 4px', textAlign: 'center',
              background: open ? 'var(--ink)' : 'var(--card)', color: open ? '#fff' : 'var(--ink)',
              boxShadow: yourGroup ? '0 0 0 1.5px var(--gold), var(--shadow-sm)' : 'var(--shadow-sm)',
            }}>
              <div style={{ fontFamily: 'var(--disp)', fontSize: 18, lineHeight: 1 }}>{g}</div>
              {yourGroup && <div style={{ fontSize: 8.5, fontWeight: 800, color: open ? 'var(--gold)' : 'var(--gold-d)', marginTop: 2 }}>YOURS</div>}
            </button>
          )
        })}
      </div>
      {openG && (
        <div style={{ marginTop: 10, animation: 'slideUp .25s both' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase' }}>
            Group {openG} · {(K.GROUPS[openG] || []).join(' · ')}
          </div>
          <div className="match-grid">
            {matches.filter(m => m.stageLabel === 'Group ' + openG).map(m => <MatchRow key={m.id} m={m} you={you} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Matches() {
  const K = useKaro()
  const you = K.you
  const [filter, setFilter] = useState('all')
  const byStage = s => K.MATCHES.filter(m => m.stage === s)
  const showUpcoming = filter !== 'results'
  const showResults = filter !== 'upcoming'

  return (
    <div className="karo-scroll">
      <div className="app-header">
        <div className="kicker">Fixtures &amp; Results</div>
        <h1>Matches</h1>
        <div className="sub">{K.MATCHES.length} games · groups through the final</div>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', background: 'rgba(33,31,43,.07)', borderRadius: 11, padding: 3 }}>
          {[['all', 'All'], ['results', 'Results'], ['upcoming', 'Upcoming']].map(([k, lbl]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              flex: 1, border: 'none', cursor: 'pointer', padding: '8px', borderRadius: 8.5, fontWeight: 800, fontSize: 13, fontFamily: 'var(--ui)',
              background: filter === k ? 'var(--card)' : 'transparent', color: filter === k ? 'var(--ink)' : 'var(--ink-3)',
              boxShadow: filter === k ? 'var(--shadow-sm)' : 'none',
            }}>{lbl}</button>
          ))}
        </div>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginTop: 11 }}>
          {K.TREND_KEY.map(k => (
            <span key={k.e} className="row" style={{ gap: 4, fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)' }}>
              <span style={{ fontSize: 13 }}>{k.e}</span>{k.label.split('—')[0].trim()}
            </span>
          ))}
          <span className="row" style={{ gap: 4, fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)' }}>
            <span style={{ fontSize: 13 }}>🐴</span>Dark horse
          </span>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {showUpcoming && <StageBlock label="Final" accent="var(--gold-d)" matches={byStage('final')} you={you} />}
        {showUpcoming && <StageBlock label="Semi-finals" matches={byStage('sf')} you={you} />}
        {showUpcoming && <StageBlock label="Quarter-finals" accent={K.liveStage === 'qf' ? 'var(--red)' : null} matches={byStage('qf')} you={you} />}
        {showResults && <StageBlock label="Round of 16" matches={byStage('r16')} you={you} />}
        {showResults && <StageBlock label="Round of 32" matches={byStage('r32')} you={you} />}
        {(showResults || showUpcoming) && <GroupStageBlock matches={byStage('group')} you={you} />}
      </div>
      <div style={{ height: 22 }} />
    </div>
  )
}
