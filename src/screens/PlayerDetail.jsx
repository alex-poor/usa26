/* ───────── Player Detail / My Squad ───────── */
import { useState } from 'react'
import { useKaro, useOpenTeam } from '../lib/karo.jsx'
import { Flag, TierTag, Trend, Avatar, Move, Points, SectionLabel, Medal } from '../components/shared.jsx'

const STAGE_STEPS = [
  { key: 'group', short: 'GRP' }, { key: 'r32', short: 'R32' },
  { key: 'r16', short: 'R16' }, { key: 'qf', short: 'QF' },
  { key: 'sf', short: 'SF' }, { key: 'final', short: 'FIN' },
]
const STAGE_IDX = { group: 0, r32: 1, r16: 2, qf: 3, sf: 4, final: 5, winner: 5 }

function StageTrack({ stage, liveStage }) {
  const reached = STAGE_IDX[stage] ?? 0
  return (
    <div className="row" style={{ gap: 4, marginTop: 2 }}>
      {STAGE_STEPS.map((s, i) => {
        const on = i <= reached
        const live = i === reached && stage === liveStage
        return (
          <div key={s.key} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 5, borderRadius: 3, background: on ? (live ? 'var(--red)' : 'var(--green)') : 'rgba(33,31,43,.12)' }} />
            <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.04em', marginTop: 3, color: on ? 'var(--ink-2)' : 'var(--ink-3)' }}>{s.short}</div>
          </div>
        )
      })}
    </div>
  )
}

function BreakdownRow({ item }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>{item.label}</span>
      <div className="row" style={{ gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {item.n} × {item.per > 0 ? '+' : ''}{item.per}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, width: 38, textAlign: 'right', color: item.pts < 0 ? 'var(--red)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
          {item.pts > 0 ? '+' : ''}{item.pts}
        </span>
      </div>
    </div>
  )
}

function TeamCard({ t, open, onToggle, liveStage }) {
  const openTeam = useOpenTeam()
  const bd = t.bd
  return (
    <div className="sticker pop" style={{ marginBottom: 12, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 14px' }}>
        <div className={'tier-rail tr-' + t.tier} />
        <Flag code={t.code} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 17 }}>{t.name}</span><Trend team={t} size={15} />
          </div>
          <div className="row" style={{ gap: 7, marginTop: 5 }}>
            <TierTag tier={t.tier} dark={t.darkHorse} />
            <span className="chip" style={{ height: 19, fontSize: 10 }}>Group {t.group}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Points value={t.points} size={25} unit={false} />
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', color: 'var(--ink-3)' }}>PTS</div>
        </div>
        <svg width="13" height="13" viewBox="0 0 13 13" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .25s', flex: 'none', color: 'var(--ink-3)' }}>
          <path d="M4 2l5 4.5L4 11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', animation: 'slideUp .3s both' }}>
          {t.darkHorse && (
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '9px 11px', borderRadius: 10, background: 'linear-gradient(90deg, rgba(206,64,54,.12), rgba(206,64,54,.04))', border: '1px solid rgba(206,64,54,.25)', marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>🐴</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--red-d)', lineHeight: 1.3 }}>
                <b style={{ fontWeight: 800 }}>Dark horse run.</b> A Tier&nbsp;{t.tier} side outscoring this manager's favourite.
              </span>
            </div>
          )}

          <div style={{ marginBottom: 13 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>Cup run</div>
            <StageTrack stage={t.stage} liveStage={liveStage} />
          </div>

          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 2 }}>Scoring breakdown</div>
          {bd.items.map(it => <BreakdownRow key={it.key} item={it} />)}
          {bd.penalties.map(it => <BreakdownRow key={it.key} item={it} />)}

          {bd.bonus > 0 && (
            <div className="row" style={{ justifyContent: 'space-between', padding: '10px 11px', marginTop: 11, borderRadius: 10, position: 'relative', overflow: 'hidden' }}>
              <div className="foil" style={{ position: 'absolute', inset: 0, opacity: .95 }} />
              <span style={{ position: 'relative', fontSize: 12.5, fontWeight: 900, color: 'var(--ink)', letterSpacing: '.01em', textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>★ Progression bonus · {bd.bonusLabel}</span>
              <span style={{ position: 'relative', fontSize: 17, fontWeight: 900, color: 'var(--ink)', textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>+{bd.bonus}</span>
            </div>
          )}

          <div className="row" style={{ justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '2px solid var(--ink)' }}>
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>{t.name} total</span>
            <Points value={t.points} size={24} />
          </div>

          <button onClick={() => openTeam(t.code)} style={{ width: '100%', marginTop: 12, padding: '9px', borderRadius: 11, cursor: 'pointer', border: '2px solid var(--ink)', background: 'var(--paper-2)', fontFamily: 'var(--ui)', fontWeight: 800, fontSize: 12.5, color: 'var(--ink)', boxShadow: 'var(--hard-sm)' }}>
            Explore {t.nick || t.name} →
          </button>
        </div>
      )}
    </div>
  )
}

function SquadShare({ player }) {
  const total = player.total || 1
  const tierCol = { 1: 'var(--t1)', 2: 'var(--t2)', 3: 'var(--t3)' }
  return (
    <div style={{ padding: '0 16px', marginBottom: 16 }}>
      <SectionLabel style={{ marginBottom: 10 }}>Where the points come from</SectionLabel>
      <div style={{ display: 'flex', height: 32, borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--hard-sm)', border: '2.5px solid var(--ink)' }}>
        {player.teams.map(t => {
          const pct = Math.max(8, (t.points / total) * 100)
          return (
            <div key={t.code} style={{ width: pct + '%', background: tierCol[t.tier], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', borderRight: '2.5px solid var(--ink)' }}>
              <span style={{ fontSize: 11, fontWeight: 900 }}>{Math.round((t.points / total) * 100)}%</span>
            </div>
          )
        })}
      </div>
      <div className="row" style={{ gap: 14, marginTop: 8, justifyContent: 'center' }}>
        {player.teams.map(t => (
          <div key={t.code} className="row" style={{ gap: 5 }}>
            <Flag code={t.code} size={15} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-2)' }}>{t.code}</span>
            <Trend team={t} size={11} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PlayerDetail({ player, onBack, topLevel }) {
  const K = useKaro()
  const sorted = [...player.teams].sort((a, b) => b.points - a.points)
  const [open, setOpen] = useState(sorted[0]?.code ?? null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(player.alias)
  const MAX = K.ALIAS_MAX
  const saveAlias = () => { setEditing(false); K.rename(draft) }

  return (
    <div className="karo-scroll">
      <div className="col-narrow">
        <div style={{ padding: '28px 16px 6px', position: 'relative' }}>
          {topLevel ? (
            <div className="kicker" style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 12 }}>My Squad</div>
          ) : (
            <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)', fontWeight: 800, fontSize: 13, padding: 0, marginBottom: 14 }}>
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              The Table
            </button>
          )}

          <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
            <Avatar player={player} size={58} ring />
            <div style={{ flex: 1, paddingTop: 2, minWidth: 0 }}>
              <div className="row" style={{ gap: 9 }}>
                <Medal rank={player.rank} size={26} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Rank {player.rank} of {K.PLAYERS.length}</span>
                <Move move={player.move} />
              </div>
              {editing ? (
                <div className="row" style={{ gap: 7, marginTop: 8 }}>
                  <input autoFocus value={draft} maxLength={MAX}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveAlias(); if (e.key === 'Escape') { setDraft(player.alias); setEditing(false) } }}
                    style={{ flex: 1, minWidth: 0, fontFamily: 'var(--disp)', fontWeight: 800, fontSize: 22, padding: '4px 10px', borderRadius: 10, border: '2.5px solid var(--ink)', background: '#fff', color: 'var(--ink)' }} />
                  <button className="btn btn--gold" onClick={saveAlias} style={{ padding: '8px 14px', fontSize: 13 }}>Save</button>
                </div>
              ) : (
                <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: 30, margin: '6px 0 0', lineHeight: 1.04, textTransform: 'uppercase', overflowWrap: 'anywhere' }}>{player.alias}</h1>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginTop: 6 }}>
                <span>Managed by {player.name}{player.you ? ' · that’s you' : ''}</span>
                {player.you && topLevel && !editing && (
                  <button onClick={() => { setDraft(player.alias); setEditing(true) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 8, border: '2px solid var(--ink)', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 11, color: 'var(--ink)', boxShadow: 'var(--hard-sm)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4z" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round" /><path d="M14 6l4 4" stroke="var(--ink)" strokeWidth="2.4" /></svg>
                    Rename
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Total score</div>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
              <Points value={player.total} size={46} />
              <div className="row" style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 200 }}>
                {player.rank > 1 && (
                  <span className="chip" style={{ background: 'rgba(206,64,54,.10)', color: 'var(--red-d)' }}>▲ {K.ranked[player.rank - 2].total - player.total} to {K.ranked[player.rank - 2].name}</span>
                )}
                {player.rank < K.PLAYERS.length && (
                  <span className="chip" style={{ background: 'rgba(60,122,78,.12)', color: 'var(--green)' }}>{player.total - K.ranked[player.rank].total} over {K.ranked[player.rank].name}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />
        <SquadShare player={player} />

        <div style={{ padding: '0 16px' }}>
          <SectionLabel style={{ marginBottom: 11 }}>The squad · tap to break down</SectionLabel>
          {sorted.map(t => (
            <TeamCard key={t.code} t={t} open={open === t.code} liveStage={K.liveStage}
              onToggle={() => setOpen(open === t.code ? null : t.code)} />
          ))}
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
