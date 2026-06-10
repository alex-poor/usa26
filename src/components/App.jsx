/* ───────── App shell + nav ───────── */
import { useState, useEffect, useRef } from 'react'
import { useKaro } from '../lib/karo.jsx'
import { Avatar, Icons, ordinal } from './shared.jsx'
import Today from '../screens/Today.jsx'
import Leaderboard from '../screens/Leaderboard.jsx'
import PlayerDetail from '../screens/PlayerDetail.jsx'
import Matches from '../screens/Matches.jsx'
import DrawReveal from '../overlays/DrawReveal.jsx'
import TeamModal from '../overlays/TeamModal.jsx'

const VIEWS = ['today', 'squad', 'table', 'matches']

function TabBar({ view, onNav }) {
  const tabs = [['today', 'Today', Icons.today], ['squad', 'Squad', Icons.draw], ['table', 'Table', Icons.table], ['matches', 'Matches', Icons.matches]]
  return (
    <div className="tab-bar">
      {tabs.map(([k, lbl, ico]) => {
        const active = view === k
        return (
          <button key={k} className={'tab' + (active ? ' active' : '')} onClick={() => onNav(k)}>
            <span className="tab-ico">{ico(active)}</span>
            <span className="lbl">{lbl}</span>
            <span className="dotmark" />
          </button>
        )
      })}
    </div>
  )
}

function Sidebar({ view, onNav, onDraw }) {
  const { you } = useKaro()
  const items = [['today', 'Today', Icons.today], ['squad', 'My Squad', Icons.draw], ['table', 'The Table', Icons.table], ['matches', 'Matches', Icons.matches]]
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="ball foil foil--anim">⚽</div>
        <div className="wm">KaroCup<small>WC 2026 Sweepstake</small></div>
      </div>
      <nav className="side-nav">
        {items.map(([k, lbl, ico]) => {
          const active = view === k
          return (
            <button key={k} className={'side-item' + (active ? ' active' : '')} onClick={() => onNav(k)}>
              <span className="tab-ico">{ico(active)}</span>{lbl}
            </button>
          )
        })}
      </nav>
      <div className="side-foot">
        <button className="side-draw foil foil--anim" onClick={onDraw}>
          <span style={{ fontSize: 17 }}>🎟️</span> Re-live the Draw
        </button>
        {you && (
          <button className="side-me" onClick={() => onNav('squad')} style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <Avatar player={you} size={36} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontWeight: 800, fontSize: 13.5 }}>{you.alias}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>You · {ordinal(you.rank)}</div>
            </div>
          </button>
        )}
      </div>
    </aside>
  )
}

export default function App() {
  const K = useKaro()
  const initialView = (() => {
    const param = new URLSearchParams(window.location.search).get('view')
    if (param && VIEWS.includes(param)) return param
    try { const s = localStorage.getItem('karo.view'); if (s && VIEWS.includes(s)) return s } catch {}
    return 'today'
  })()
  const [view, setView] = useState(initialView)
  const [player, setPlayer] = useState(null)
  const [draw, setDraw] = useState(false)
  const mainRef = useRef(null)

  useEffect(() => { try { localStorage.setItem('karo.view', view) } catch {} }, [view])
  const toTop = () => { if (mainRef.current) mainRef.current.scrollTop = 0 }

  const nav = (v) => { setPlayer(null); setView(v); toTop() }
  const openPlayer = (p) => { if (p.you) { nav('squad'); return } setPlayer(p); toTop() }
  const back = () => { setPlayer(null); toTop() }

  let screen
  if (player) {
    screen = <PlayerDetail key={'d' + player.id} player={player} onBack={back} />
  } else if (view === 'squad') {
    screen = K.you ? <PlayerDetail key="squad" player={K.you} topLevel /> : <Leaderboard onOpen={openPlayer} />
  } else if (view === 'today') {
    screen = <Today onTable={() => nav('table')} onSquad={() => nav('squad')} onOpen={openPlayer} onDraw={() => setDraw(true)} />
  } else if (view === 'table') {
    screen = <Leaderboard onOpen={openPlayer} />
  } else {
    screen = <Matches />
  }
  const activeView = player ? 'table' : view

  return (
    <div className="karo-app tilts">
      <Sidebar view={activeView} onNav={nav} onDraw={() => setDraw(true)} />
      <div className="karo-main" ref={mainRef}>{screen}</div>
      <TabBar view={activeView} onNav={nav} />
      {draw && K.you && <DrawReveal onClose={() => setDraw(false)} />}
      {K.teamCode && <TeamModal code={K.teamCode} onClose={K.closeTeam} />}
    </div>
  )
}
