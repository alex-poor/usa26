import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { buildModel, ALIAS_MAX } from './model.js'

const BASE = import.meta.env.BASE_URL

async function fetchJSON(path, fallback) {
  try {
    const res = await fetch(`${BASE}data/${path}`)
    if (!res.ok) throw new Error(res.status)
    return await res.json()
  } catch {
    return fallback
  }
}

function readMeId() {
  const url = new URLSearchParams(window.location.search).get('me')
  if (url) {
    try { localStorage.setItem('karo.me', url) } catch {}
    return url
  }
  try { return localStorage.getItem('karo.me') || null } catch { return null }
}

function todayISO() {
  // NZ calendar date, so "today" matches the schedule regardless of where
  // the viewer is. Pacific/Auckland handles NZST/NZDT automatically.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

const KaroContext = createContext(null)
const OpenTeamContext = createContext(() => {})

export function KaroProvider({ children }) {
  const [raw, setRaw] = useState(null)
  const [alias, setAlias] = useState(() => { try { return localStorage.getItem('karo.alias') || null } catch { return null } })
  const [teamCode, setTeamCode] = useState(null)
  const [meId, setMeId] = useState(readMeId)

  useEffect(() => {
    Promise.all([
      fetchJSON('teams.json', []),
      fetchJSON('players.json', []),
      fetchJSON('matches.json', []),
      fetchJSON('scores.json', { lastUpdated: null, players: [], prevTotals: null }),
      fetchJSON('blurbs.json', {}),
    ]).then(([teams, players, matches, scores, blurbs]) => {
      setRaw({ teams, players, matches, scores, blurbs })
    })
  }, [])

  const model = useMemo(() => {
    if (!raw) return null
    const prevTotals = raw.scores?.prevTotals || null
    const m = buildModel(raw, { meId, alias, todayISO: todayISO(), prevTotals })
    m.lastUpdated = raw.scores?.lastUpdated || null
    return m
  }, [raw, meId, alias])

  const openTeam = useCallback((code) => setTeamCode(code), [])
  const closeTeam = useCallback(() => setTeamCode(null), [])

  const rename = useCallback((name) => {
    const v = (name || '').slice(0, ALIAS_MAX).trim()
    const next = v || (model?.you?.name ?? '')
    setAlias(next)
    try { localStorage.setItem('karo.alias', next) } catch {}
  }, [model])

  // identity: who the viewer is. Chosen via ?me=, the picker, or remembered.
  const setMe = useCallback((id) => {
    try { localStorage.setItem('karo.me', id) } catch {}
    setMeId(id)
  }, [])
  const switchMe = useCallback(() => {
    try { localStorage.removeItem('karo.me'); localStorage.removeItem('karo.alias') } catch {}
    setAlias(null)
    setMeId(null)
  }, [])
  const meChosen = !!meId

  if (!model) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontFamily: 'var(--disp)', fontSize: 22 }}>
        Loading…
      </div>
    )
  }

  return (
    <KaroContext.Provider value={{ ...model, rename, teamCode, closeTeam, meChosen, setMe, switchMe }}>
      <OpenTeamContext.Provider value={openTeam}>
        {children}
      </OpenTeamContext.Provider>
    </KaroContext.Provider>
  )
}

export function useKaro() {
  const v = useContext(KaroContext)
  if (!v) throw new Error('useKaro outside provider')
  return v
}
export function useOpenTeam() {
  return useContext(OpenTeamContext)
}
