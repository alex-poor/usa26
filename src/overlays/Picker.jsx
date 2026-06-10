/* ───────── "Who are you?" first-run identity picker ───────── */
import { useKaro } from '../lib/karo.jsx'
import { Flag, Avatar } from '../components/shared.jsx'

export default function Picker() {
  const { PLAYERS, setMe } = useKaro()
  // stable display order (by name) so it isn't shuffled by current standings
  const players = [...PLAYERS].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, overflow: 'auto',
      background: 'radial-gradient(120% 90% at 50% 0%, #2c2a3a, #1a1822 70%)', backgroundColor: 'var(--ink)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1px, transparent 1.4px)', backgroundSize: '7px 7px', pointerEvents: 'none' }} />

      <div style={{ flex: 1, width: '100%', maxWidth: 460, margin: '0 auto', padding: '44px 22px 32px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div className="ball foil foil--anim" style={{ width: 46, height: 46, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, border: '2.5px solid var(--ink)', boxShadow: 'var(--hard-sm)' }}>⚽</div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.24em', color: 'var(--gold)', textTransform: 'uppercase', marginTop: 14 }}>KaroCup · WC 2026</div>
          <div className="foil" style={{ fontFamily: 'var(--disp)', fontSize: 42, lineHeight: .95, textTransform: 'uppercase', marginTop: 4, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Who are you?</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 600, marginTop: 8 }}>Tap your name to see your squad. We'll remember you on this device.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {players.map(p => (
            <button key={p.id} onClick={() => setMe(p.id)} className="sticker" style={{
              border: '2.5px solid var(--ink)', cursor: 'pointer', textAlign: 'left',
              padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 11, background: 'var(--card)',
            }}>
              <Avatar player={p} size={38} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div className="row" style={{ gap: 3, marginTop: 4 }}>
                  {p.teams.map(t => <Flag key={t.code} code={t.code} size={16} />)}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600, marginTop: 20 }}>
          Pick the wrong one? You can switch from the My Squad tab.
        </div>
      </div>
    </div>
  )
}
