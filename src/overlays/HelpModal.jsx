/* ───────── How it works — help modal ───────── */
import { useKaro } from '../lib/karo.jsx'

function Row({ label, value, neg }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: neg ? 'var(--red)' : 'var(--green-d)', fontVariantNumeric: 'tabular-nums' }}>
        {value > 0 ? '+' : ''}{value}
      </span>
    </div>
  )
}

function Step({ n, title, children }) {
  return (
    <div className="row" style={{ gap: 11, alignItems: 'flex-start', marginBottom: 13 }}>
      <div style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', background: 'var(--yellow)', border: '2.5px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--disp)', fontWeight: 800, fontSize: 14, boxShadow: 'var(--hard-sm)' }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', lineHeight: 1.45 }}>{children}</div>
      </div>
    </div>
  )
}

export default function HelpModal({ onClose }) {
  const { RULES, STAGE_INFO, PLAYERS } = useKaro()
  const S = STAGE_INFO

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, background: 'rgba(36,31,61,.55)', backdropFilter: 'blur(3px)', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} className="pop" style={{ width: '100%', maxWidth: 440, background: 'var(--card)', border: '3px solid var(--ink)', borderRadius: 22, boxShadow: 'var(--hard)', overflow: 'hidden', position: 'relative', margin: 'auto' }}>
        <div className="foil foil--anim" style={{ height: 8 }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', border: '2.5px solid var(--ink)', background: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: 'var(--ink)', boxShadow: 'var(--hard-sm)', lineHeight: 1 }}>✕</button>

        <div style={{ padding: '18px 18px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', color: 'var(--red)', textTransform: 'uppercase' }}>The lowdown</div>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: 28, lineHeight: 1, textTransform: 'uppercase', marginTop: 3 }}>How it works</div>

          <div style={{ marginTop: 18 }}>
            <Step n="1" title="You were drawn 3 teams">
              One from each ranking tier — a <b>favourite</b>, a <b>mid pick</b> and a <b>dark horse</b> — assigned at random. No skill, no picking. Hit “Re-live the Draw” to see yours.
            </Step>
            <Step n="2" title="Your teams earn you points">
              Every match your teams play scores points all tournament long — for wins, goals, clean sheets and going deep in the knockouts. Cards and own goals cost you.
            </Step>
            <Step n="3" title="Most points wins">
              Your total is your three teams added together. The leaderboard (“The Table”) ranks all {PLAYERS.length} of you. It updates automatically every couple of hours as results come in.
            </Step>
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '6px 0 4px' }}>How points are scored</div>
          <Row label="Team wins a match" value={RULES.win} />
          <Row label="Team draws" value={RULES.draw} />
          <Row label="Goal scored" value={RULES.goal} />
          <Row label="Clean sheet" value={RULES.cs} />
          <Row label="Assist" value={RULES.assist} />
          <Row label="Yellow card" value={RULES.yellow} neg />
          <Row label="Red card" value={RULES.red} neg />
          <Row label="Own goal" value={RULES.og} neg />

          <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '16px 0 4px' }}>Progression bonus (how far a team goes)</div>
          <Row label="Reach the Round of 32" value={S.r32.bonus} />
          <Row label="Reach the Round of 16" value={S.r16.bonus} />
          <Row label="Reach the Quarter-finals" value={S.qf.bonus} />
          <Row label="Reach the Semi-finals" value={S.sf.bonus} />
          <Row label="Reach the Final" value={S.final.bonus} />
          <Row label="Win the whole thing" value={S.winner.bonus} />

          <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '16px 0 6px' }}>The emoji language</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', lineHeight: 1.7 }}>
            🐴 <b>Dark horse</b> — your lower-tier team is outscoring your favourite<br />
            🚀 still alive · 🔥 won their last · 🧊 lost their last · 💩 thrashed · 😴 out in the groups
          </div>

          <div style={{ marginTop: 16, padding: '11px 13px', borderRadius: 13, background: 'var(--paper-2)', border: '2px dashed var(--line-2)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', lineHeight: 1.45 }}>
            💡 Tap any flag for team info. Rename your squad (or switch who you are) from the <b>My Squad</b> tab.
          </div>

          <button onClick={onClose} className="btn btn--gold" style={{ width: '100%', marginTop: 16, padding: '12px', fontSize: 15 }}>Got it →</button>
        </div>
      </div>
    </div>
  )
}
