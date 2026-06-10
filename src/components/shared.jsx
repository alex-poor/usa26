/* ───────── KaroCup shared atoms ───────── */
import { useMemo } from 'react'
import { useKaro } from '../lib/karo.jsx'

/* ---- Flag badge (emoji inside a sticker circle) ---- */
export function Flag({ code, size = 34, square = false, style = {} }) {
  const { TEAMS } = useKaro()
  const t = TEAMS[code]
  if (!t) {
    return (
      <div className={'flag flag--emoji' + (square ? ' flag--sq' : '')}
        style={{ width: size, height: size, background: '#d8cba8', color: '#8a7d5a', fontWeight: 800, fontSize: size * 0.42, ...style }}>
        <span>?</span>
      </div>
    )
  }
  return (
    <div className={'flag flag--emoji' + (square ? ' flag--sq' : '')} title={t.name}
      style={{ width: size, height: size, ...style }}>
      <span style={{ fontSize: size * 0.72 }}>{t.flag}</span>
    </div>
  )
}

/* ---- Tier tag ---- */
export const TIER_NAME = { 1: 'Favourite', 2: 'Mid tier', 3: 'Dark horse' }
export function TierTag({ tier, dark, compact }) {
  return (
    <span className={'tier-tag t-' + tier}>
      {dark && <span className="dh">🐴</span>}
      {compact ? ('T' + tier) : (dark ? 'Dark horse' : TIER_NAME[tier])}
    </span>
  )
}

/* ---- Team trend badge ---- */
export function Trend({ team, size = 12, dh = true }) {
  if (!team) return null
  if (dh && team.darkHorse) return <span title="Dark horse — outscoring the favourite" style={{ fontSize: size, lineHeight: 1 }}>🐴</span>
  if (!team.trend) return null
  return <span title={team.trendLabel} style={{ fontSize: size, lineHeight: 1 }}>{team.trend}</span>
}

/* ---- "YOURS" ownership pill (never an emoji) ---- */
export function YouTag({ small }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: small ? 15 : 18, padding: '0 6px',
      borderRadius: 999, background: 'var(--yellow)', color: 'var(--ink)',
      border: '1.5px solid var(--ink)', fontSize: small ? 8.5 : 9.5, fontWeight: 900, letterSpacing: '.06em',
    }}>YOURS</span>
  )
}

/* ---- Player avatar (monogram sticker) ---- */
export function Avatar({ player, size = 40, ring }) {
  const initials = player.name.slice(0, 1).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flex: 'none',
      background: player.color, color: '#fff', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--disp)', fontSize: size * 0.5, lineHeight: 1, fontWeight: 800,
      boxShadow: ring ? '0 0 0 2.5px var(--ink), 2px 3px 0 rgba(36,31,61,.3)' : '0 0 0 2px var(--ink)',
    }}>
      <span style={{ marginTop: 1 }}>{initials}</span>
      {player.you && (
        <span style={{
          position: 'absolute', bottom: -4, right: -4, background: 'var(--ink)',
          color: '#fff', fontFamily: 'var(--ui)', fontWeight: 800, fontSize: 8,
          letterSpacing: '.06em', padding: '2px 5px', borderRadius: 999, border: '2px solid var(--paper)',
        }}>YOU</span>
      )}
    </div>
  )
}

/* ---- Movement arrow ---- */
export function Move({ move }) {
  if (move === 0) return <span className="move flat">–</span>
  const up = move > 0
  return (
    <span className={'move ' + (up ? 'up' : 'down')}>
      <svg width="9" height="9" viewBox="0 0 9 9" style={{ transform: up ? 'none' : 'rotate(180deg)' }}>
        <path d="M4.5 1L8 6H1z" fill="currentColor" />
      </svg>
      {Math.abs(move)}
    </span>
  )
}

/* ---- Big points number ---- */
export function Points({ value, size = 30, unit = true, color }) {
  return (
    <span className="num" style={{ fontSize: size, color: color || 'var(--ink)' }}>
      {value}{unit && <span className="pts-unit" style={{ marginLeft: 3 }}>PTS</span>}
    </span>
  )
}

/* ---- Section label ---- */
export function SectionLabel({ children, style }) {
  return <div className="section-label" style={style}>{children}</div>
}

/* ---- Rank medal ---- */
export function Medal({ rank, size = 34 }) {
  const map = { 1: ['var(--yellow)', 'var(--ink)'], 2: ['#C2D2E0', 'var(--ink)'], 3: ['#F0915A', '#fff'] }
  const c = map[rank]
  if (!c) {
    return <div className="num" style={{ width: size, textAlign: 'center', fontSize: size * 0.62, color: 'var(--ink-3)' }}>{rank}</div>
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flex: 'none',
      background: c[0], border: '2.5px solid var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: c[1], fontFamily: 'var(--disp)', fontWeight: 800, fontSize: size * 0.5,
      boxShadow: '2px 2.5px 0 rgba(36,31,61,.3)', position: 'relative',
    }}>
      <span style={{ marginTop: 1 }}>{rank}</span>
    </div>
  )
}

/* ---- Confetti burst ---- */
export function Confetti({ fire, count = 60 }) {
  const cols = ['#FF5A4D', '#2E8BE6', '#FFC23C', '#34B66A', '#FF6FB5']
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.4 + Math.random() * 1.4,
    col: cols[i % cols.length],
    rot: Math.random() * 360,
  })), [fire, count])
  if (!fire) return null
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 80 }}>
      {bits.map((b, i) => (
        <span key={i} className="confetti-bit" style={{
          left: b.left + '%', background: b.col,
          animation: `confFall ${b.dur}s ${b.delay}s cubic-bezier(.3,.6,.5,1) forwards`,
          transform: `rotate(${b.rot}deg)`,
        }} />
      ))}
    </div>
  )
}

/* ---- tab/nav icons ---- */
export const Icons = {
  today: (a) => (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} />
      <path d="M8 3v3M16 3v3" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" />
      {a && <circle cx="12" cy="15" r="2.4" fill="currentColor" />}
    </svg>
  ),
  table: (a) => (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="13" width="4.2" height="7.5" rx="1.2" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" />
      <rect x="9.9" y="8" width="4.2" height="12.5" rx="1.2" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" />
      <rect x="15.8" y="4" width="4.2" height="16.5" rx="1.2" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  matches: (a) => (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} fill={a ? 'rgba(206,64,54,.14)' : 'none'} />
      <path d="M12 5.4l2.4 1.8-.9 2.9h-3l-.9-2.9z" fill="currentColor" />
      <path d="M12 8.5l2.4 1.8M12 8.5L9.6 10.3M5.7 9.6l2.1.7M18.3 9.6l-2.1.7M8.2 17.3l.9-2.2M15.8 17.3l-.9-2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  draw: (a) => (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l2.1 4.6 5 .5-3.7 3.4 1 4.9L12 14.4 7.6 16.8l1-4.9L4.9 8.6l5-.5z"
        fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 18.5v2.5M8 20h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
}

export function ordinal(n) {
  return n + (['st', 'nd', 'rd'][((n + 90) % 100 - 10) % 10 - 1] || 'th')
}
