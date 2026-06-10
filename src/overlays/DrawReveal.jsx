/* ───────── The Draw — animated reveal ───────── */
import { useState, useEffect, useRef } from 'react'
import { useKaro } from '../lib/karo.jsx'
import { Flag, Confetti } from '../components/shared.jsx'

const TIER_LABEL = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' }
const TIER_SUB = { 1: 'The favourite', 2: 'The mid pick', 3: 'The dark horse' }

function DrawCard({ team, revealed }) {
  const tcol = { 1: 'var(--t1)', 2: 'var(--t2)', 3: 'var(--t3)' }[team.tier]
  return (
    <div style={{ flex: 1, perspective: 900 }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '0.7' }}>
        {!revealed ? (
          <div className="sticker" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--ink)', overflow: 'hidden' }}>
            <div className="foil foil--anim" style={{ position: 'absolute', inset: 0, opacity: .22 }} />
            <div style={{ position: 'relative', fontFamily: 'var(--disp)', fontSize: 30, color: tcol }}>?</div>
            <div style={{ position: 'relative', fontSize: 9, fontWeight: 800, letterSpacing: '.14em', color: 'rgba(255,255,255,.65)' }}>{TIER_LABEL[team.tier].toUpperCase()}</div>
          </div>
        ) : (
          <div className="sticker flip-in" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 6px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: tcol }} />
            <Flag code={team.code} size={52} style={{ marginBottom: 9 }} />
            <div style={{ fontSize: 13, fontWeight: 800, textAlign: 'center', lineHeight: 1.05 }}>{team.name}</div>
            <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.08em', color: tcol, marginTop: 5, textTransform: 'uppercase' }}>{TIER_SUB[team.tier]}</div>
            {team.darkHorse && <div style={{ fontSize: 13, marginTop: 4 }}>🔥</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DrawReveal({ onClose }) {
  const K = useKaro()
  const you = K.you
  const squad = [...you.teams].sort((a, b) => a.tier - b.tier)
  const [step, setStep] = useState(0)
  const timers = useRef([])

  useEffect(() => {
    const seq = [[700, 1], [1600, 2], [2600, 3], [3500, 4]]
    seq.forEach(([t, s]) => timers.current.push(setTimeout(() => setStep(s), t)))
    return () => timers.current.forEach(clearTimeout)
  }, [])
  const skip = () => { timers.current.forEach(clearTimeout); setStep(4) }

  return (
    <div className="draw-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'auto', background: 'radial-gradient(120% 90% at 50% 0%, #2c2a3a, #1a1822 70%)', backgroundColor: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1px, transparent 1.4px)', backgroundSize: '7px 7px', pointerEvents: 'none' }} />
      <Confetti fire={step >= 3} count={70} />

      <button onClick={onClose} style={{ position: 'absolute', top: 22, right: 22, zIndex: 10, width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 16, fontWeight: 700 }}>✕</button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 26px', position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.24em', color: 'var(--gold)', textTransform: 'uppercase' }}>WC 2026 Sweepstake</div>
          <div className="foil" style={{ fontFamily: 'var(--disp)', fontSize: 52, lineHeight: .9, textTransform: 'uppercase', marginTop: 4, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>The Draw</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 600, marginTop: 8 }}>
            {step < 4 ? 'Three teams. One from each tier.' : `${you.name}, meet your squad.`}
          </div>
        </div>

        <div className="row" style={{ gap: 12, alignItems: 'stretch' }}>
          {squad.map((t, i) => <DrawCard key={t.code} team={t} revealed={step > i} />)}
        </div>

        <div style={{ marginTop: 30, textAlign: 'center', minHeight: 64 }}>
          {step < 4 ? (
            <button onClick={skip} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: '.04em' }}>Skip ▸</button>
          ) : (
            <div className="pop">
              <div style={{ color: 'rgba(255,255,255,.78)', fontSize: 13, fontWeight: 600, lineHeight: 1.5, marginBottom: 16 }}>
                {squad.some(t => t.darkHorse)
                  ? <>Your dark horse is already <span style={{ color: 'var(--red)', fontWeight: 800 }}>outscoring your favourite.</span> 🔥</>
                  : <>A favourite, a mid pick and a wildcard. Good luck.</>}
              </div>
              <button className="btn btn--gold" onClick={onClose} style={{ padding: '13px 40px', fontSize: 15 }}>Let's go →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
