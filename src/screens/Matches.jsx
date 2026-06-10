/* ───────── Matches — chronological, day-grouped ───────── */
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
  const teamRow = (Tm, code, win, score, isMine) => (
    <div className="row" style={{ gap: 9, padding: '3px 0' }}>
      <button onClick={() => Tm && openTeam(code)} disabled={!Tm}
        style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: Tm ? 'pointer' : 'default', textAlign: 'left' }}>
        <Flag code={code} size={24} />
        <span style={{ fontSize: 14, fontWeight: win ? 800 : 600, color: Tm ? 'var(--ink)' : 'var(--ink-3)' }}>{Tm ? Tm.name : 'To be decided'}</span>
        {Tm && Tm.trend && <span style={{ fontSize: 12 }} title={Tm.trendLabel}>{Tm.trend}</span>}
        {isMine && <YouTag small />}
      </button>
      {m.played ? <span className="num" style={{ fontSize: 18, color: win ? 'var(--ink)' : 'var(--ink-3)' }}>{score}</span> : null}
    </div>
  )
  return (
    <div className="sticker sticker--flat" style={{ padding: '11px 13px', position: 'relative', boxShadow: mine ? '0 0 0 1.5px var(--gold), var(--shadow-sm)' : 'var(--shadow-sm)' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
          {m.stageLabel}{m.venue ? ` · ${m.venue}` : ''}
        </span>
        {m.today && !m.played
          ? <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: 'var(--red)', padding: '2px 8px', borderRadius: 999, letterSpacing: '.04em' }}>● TODAY{m.time ? ' ' + m.time : ''}</span>
          : m.played
            ? <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)' }}>FT</span>
            : <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--blue)' }}>{m.time || 'TBC'}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          {teamRow(A, m.a, aWin, m.ga, A && you && you.teams.some(t => t.code === m.a))}
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

export default function Matches() {
  const K = useKaro()
  const you = K.you
  const [filter, setFilter] = useState('all')

  let list = K.MATCHES
  if (filter === 'results') list = list.filter(m => m.played)
  else if (filter === 'upcoming') list = list.filter(m => !m.played)
  list = [...list].sort((a, b) => a.ts - b.ts)

  // group into days, ascending
  const days = []
  for (const m of list) {
    let day = days[days.length - 1]
    if (!day || day.iso !== m.iso) { day = { iso: m.iso, label: m.dayLabel, isToday: false, matches: [] }; days.push(day) }
    day.matches.push(m)
    if (m.today) day.isToday = true
  }

  const EMPTY = {
    results: ['🗓️', 'No results yet', 'Finished games will show here once the tournament kicks off.'],
    upcoming: ['🎉', 'Nothing left to play', 'Every match has been played.'],
    all: ['📋', 'No matches', 'The schedule will appear here.'],
  }[filter]

  return (
    <div className="karo-scroll">
      <div className="app-header">
        <div className="kicker">Fixtures &amp; Results</div>
        <h1>Matches</h1>
        <div className="sub">{K.MATCHES.length} games · all times NZ</div>
      </div>

      <div className="col-narrow">
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
          {days.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--ink-3)' }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>{EMPTY[0]}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink-2)' }}>{EMPTY[1]}</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{EMPTY[2]}</div>
            </div>
          ) : days.map(day => (
            <div key={day.iso || day.label} style={{ marginBottom: 18 }}>
              <div className="row" style={{ gap: 9, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--disp)', fontSize: 16, textTransform: 'uppercase', whiteSpace: 'nowrap', flex: 'none', color: day.isToday ? 'var(--red)' : 'var(--ink)' }}>{day.label}</span>
                {day.isToday && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.08em', color: '#fff', background: 'var(--red)', padding: '2px 7px', borderRadius: 999 }}>TODAY</span>}
                <span className="chip" style={{ height: 19, fontSize: 10, flex: 'none' }}>{day.matches.length}</span>
                <span style={{ flex: 1, borderTop: '1.5px dashed var(--line-2)' }} />
              </div>
              <div className="match-grid">
                {day.matches.map(m => <MatchRow key={m.id} m={m} you={you} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 22 }} />
    </div>
  )
}
