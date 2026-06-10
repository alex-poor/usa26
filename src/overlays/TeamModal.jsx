/* ───────── Team info modal ───────── */
import { useKaro } from '../lib/karo.jsx'
import { Flag, TierTag, Avatar, Points } from '../components/shared.jsx'

function StatTile({ label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '2px solid var(--ink)', borderRadius: 12, padding: '8px 6px', textAlign: 'center', boxShadow: 'var(--hard-sm)' }}>
      <div className="num" style={{ fontSize: 22, color: accent || 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function TeamModal({ code, onClose }) {
  const K = useKaro()
  const t = K.TEAMS[code]
  if (!t) return null
  const s = t.stats
  const si = K.STAGE_INFO[t.stage]
  const pts = K.teamPoints(code)
  const owners = K.ownersOf(code)
  const tcol = { 1: 'var(--t1)', 2: 'var(--t2)', 3: 'var(--t3)' }[t.tier]
  const live = t.stage === K.liveStage

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, background: 'rgba(36,31,61,.55)', backdropFilter: 'blur(3px)', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} className="pop" style={{ width: '100%', maxWidth: 420, background: 'var(--card)', border: '3px solid var(--ink)', borderRadius: 22, boxShadow: 'var(--hard)', overflow: 'hidden', position: 'relative', margin: 'auto' }}>
        <div style={{ height: 8, background: tcol }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', border: '2.5px solid var(--ink)', background: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: 'var(--ink)', boxShadow: 'var(--hard-sm)', lineHeight: 1 }}>✕</button>

        <div style={{ padding: '18px 18px 20px' }}>
          <div className="row" style={{ gap: 13 }}>
            <Flag code={code} size={58} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: 26, lineHeight: .95, textTransform: 'uppercase' }}>{t.name}</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: tcol, marginTop: 2 }}>“{t.nick}”</div>
            </div>
          </div>

          <div className="row" style={{ gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
            <TierTag tier={t.tier} dark={false} />
            {t.group && <span className="chip" style={{ height: 22 }}>Group {t.group}</span>}
          </div>
          {t.trend && (
            <div className="row" style={{ gap: 7, marginTop: 8 }}>
              <span style={{ fontSize: 16 }}>{t.trend}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>{t.trendLabel}</span>
            </div>
          )}

          <p style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink)', margin: '15px 0 0' }}>{t.blurb}</p>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 13, padding: '11px 13px', borderRadius: 13, background: 'var(--paper-2)', border: '2px dashed var(--line-2)' }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Fun fact</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.4 }}>{t.fact}</div>
            </div>
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '18px 0 8px' }}>Tournament record</div>
          <div className="row" style={{ gap: 8 }}>
            <StatTile label="W·D·L" value={`${s.w}-${s.d}-${s.l}`} />
            <StatTile label="Goals" value={s.gf} accent={tcol} />
            <StatTile label="Conceded" value={s.ga} />
            <StatTile label="Clean sheets" value={s.cs} accent="var(--green-d)" />
          </div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 12, padding: '11px 13px', borderRadius: 13, border: '2.5px solid var(--ink)', background: '#fff', boxShadow: 'var(--hard-sm)' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.08em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Got to</div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{si.label}{live ? ' (live)' : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.08em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Sweepstake pts</div>
              <Points value={pts} size={24} />
            </div>
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '18px 0 8px' }}>
            {owners.length ? `Drafted by ${owners.length === 1 ? '1 manager' : owners.length + ' managers'}` : 'Undrafted'}
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {owners.length ? owners.map(o => (
              <div key={o.id} className="row" style={{ gap: 7, padding: '5px 11px 5px 5px', borderRadius: 999, background: o.you ? 'var(--yellow)' : '#fff', border: '2px solid var(--ink)', boxShadow: 'var(--hard-sm)' }}>
                <Avatar player={o} size={22} />
                <span style={{ fontWeight: 800, fontSize: 12.5 }}>{o.you ? 'You' : o.alias}</span>
              </div>
            )) : <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>No one drew this team.</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
