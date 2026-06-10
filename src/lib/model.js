/* ───────────────────────────────────────────────────────────────
   KaroCup — production data model.
   Adapts the committed JSON (teams/players/matches/scores) into the
   shape the UI components expect, deriving stats, stage reached,
   trends, scoring breakdowns, dark-horse flags, standings and moves.
   Everything is derived from matches.json so the screens always
   reconcile with the fixtures.
   ─────────────────────────────────────────────────────────────── */

export const RULES = { win: 5, draw: 2, goal: 3, cs: 4, assist: 1, yellow: -1, red: -3, og: -2 };

// Cumulative progression bonus by *furthest stage reached* (matches the
// backend's per-stage sums: 5, 5+10, +15, +20, +30, +winner).
export const STAGE_INFO = {
  group:  { bonus: 0,   label: 'Group stage',   order: 0 },
  r32:    { bonus: 5,   label: 'Round of 32',   order: 1 },
  r16:    { bonus: 15,  label: 'Round of 16',   order: 2 },
  qf:     { bonus: 30,  label: 'Quarter-final', order: 3 },
  sf:     { bonus: 50,  label: 'Semi-final',    order: 4 },
  final:  { bonus: 80,  label: 'Final',         order: 5 },
  winner: { bonus: 120, label: 'Champion',      order: 6 },
};

export const ALIAS_MAX = 22;

export const TREND_KEY = [
  { e: '🚀', label: 'In the hunt — still alive' },
  { e: '🔥', label: 'Hot — won their last match' },
  { e: '🧊', label: 'Gone cold — lost their last match' },
  { e: '💩', label: 'Stinker — heavy defeat' },
  { e: '😴', label: "Out early — didn't escape the group" },
];

// our backend stage strings -> internal short keys
const STAGE_MAP = {
  GROUP_STAGE: 'group',
  LAST_32: 'r32',
  LAST_16: 'r16',
  QUARTER_FINALS: 'qf',
  SEMI_FINALS: 'sf',
  THIRD_PLACE: 'sf', // a 3rd-place team's furthest advancement is the semi-final
  FINAL: 'final',
};
const STAGE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'final'];

const AVATAR_COLORS = [
  '#D6453D', '#2E6E8E', '#C9A84C', '#3C7A4E', '#9B5DE5',
  '#E07A3E', '#1B998B', '#6D6875', '#D4548A', '#4A5859',
];

// playful placeholder copy — swap for the group's own voice over time
const TEAM_BLURBS = {
  ESP: { nick: 'La Roja', blurb: 'Tiki-taka merchants who pass you into a coma, then score.', fact: 'World champions in 2010 — their only title, somehow.' },
  ARG: { nick: 'La Albiceleste', blurb: 'Drama, flair, and at least one player you’ll argue about.', fact: 'Reigning champions — and they will remind you.' },
  FRA: { nick: 'Les Bleus', blurb: 'Ludicrous talent, occasional implosion. Box office either way.', fact: 'Two World Cups since 1998.' },
  ENG: { nick: 'Three Lions', blurb: 'It’s coming home. (It is not coming home.)', fact: 'One trophy, 1966, mentioned approximately hourly.' },
  BRA: { nick: 'Seleção', blurb: 'Joga bonito until it isn’t. Five stars, endless pressure.', fact: 'Record five World Cup titles.' },
  POR: { nick: 'Seleção', blurb: 'Golden generation, golden boots, golden-hour selfies.', fact: 'European champions in 2016 against the odds.' },
  NED: { nick: 'Oranje', blurb: 'Total football, total chaos, totally orange.', fact: 'Three lost finals — the nearly-men of greatness.' },
  BEL: { nick: 'Red Devils', blurb: 'The golden generation that keeps not-quite winning.', fact: 'Ranked world No.1 for ages without a trophy.' },
  GER: { nick: 'Die Mannschaft', blurb: 'Used to be a tournament machine. Now? Group-stage gremlins.', fact: 'Four-time winners — currently allergic to the knockouts.' },
  CRO: { nick: 'Vatreni', blurb: 'A midfield from the heavens, legs from a museum.', fact: 'Reached the 2018 final with a tiny population.' },
  MAR: { nick: 'Atlas Lions', blurb: 'Organised, fearless, and the story of the last World Cup.', fact: 'First African side to reach a World Cup semi-final (2022).' },
  COL: { nick: 'Los Cafeteros', blurb: 'Rhythm, ruthlessness, and a corner-flag dance or two.', fact: 'Once scored maybe the best team goal in World Cup history.' },
  MEX: { nick: 'El Tri', blurb: 'The great escape artists of the group stage.', fact: 'Have reached the knockouts an exhausting number of times.' },
  SEN: { nick: 'Lions of Teranga', blurb: 'Pace, power, and the loudest fans in the building.', fact: 'Africa’s reigning continental kings on their day.' },
  URY: { nick: 'La Celeste', blurb: 'Tiny nation, enormous bite. Never, ever a soft draw.', fact: 'Won the very first World Cup in 1930.' },
  USA: { nick: 'The Stars and Stripes', blurb: 'Young, athletic, and playing the tournament at home.', fact: 'Co-hosts — expectation has never been higher.' },
  JPN: { nick: 'Samurai Blue', blurb: 'Crisp, disciplined, and giant-killers when it matters.', fact: 'Have knocked out Germany and Spain on the same run.' },
  SUI: { nick: 'Nati', blurb: 'Punctual, organised, quietly ruins big teams’ tournaments.', fact: 'Masters of the goalless knockout heartbreak.' },
  AUT: { nick: 'Das Team', blurb: 'Press, press, press, concede, go home.', fact: 'Gegenpressing poster boys who flatter to deceive.' },
  ECU: { nick: 'La Tri', blurb: 'Altitude specialists who travel surprisingly well.', fact: 'Almost unbeatable in thin Quito air.' },
  KOR: { nick: 'Taegeuk Warriors', blurb: 'Run until they literally cannot run anymore.', fact: 'Co-hosts and semi-finalists back in 2002.' },
  IRN: { nick: 'Team Melli', blurb: 'Streetwise, stubborn and a regular qualifier.', fact: 'Asia’s perennial heavyweight.' },
  NOR: { nick: 'Vikings', blurb: 'Big, blond, and surprisingly fun to watch this time.', fact: 'Fjords, oil money, and unfairly tall strikers.' },
  SWE: { nick: 'Blågult', blurb: 'Tall, tidy and a total nuisance at set-pieces.', fact: 'Knocked the Netherlands out to even get here, once.' },
  GHA: { nick: 'Black Stars', blurb: 'Your dark horse with actual giddy-up. The neutral’s favourite.', fact: 'Named after the Black Star of Pan-Africanism.' },
  CIV: { nick: 'Les Éléphants', blurb: 'Power, flair and African champions on home soil recently.', fact: 'Won the 2023 Cup of Nations from nowhere.' },
  EGY: { nick: 'The Pharaohs', blurb: 'Record continental kings with one very famous No.10.', fact: 'Seven-time African champions.' },
  ALG: { nick: 'Desert Foxes', blurb: 'Technical, fiery, and dangerous on their day.', fact: 'African champions in 2019.' },
  TUN: { nick: 'Eagles of Carthage', blurb: 'Defensively stubborn, occasionally heartbreaking.', fact: 'Regular qualifiers who love a famous scalp.' },
  AUS: { nick: 'Socceroos', blurb: 'Run forever, tackle harder, refuse to lie down.', fact: 'Travel further than anyone just to qualify.' },
  CAN: { nick: 'Les Rouges', blurb: 'Quick, fearless co-hosts on the rise.', fact: 'Co-hosting their first home World Cup.' },
  PAN: { nick: 'Los Canaleros', blurb: 'Tiny nation, enormous heart, dangerous on the break.', fact: 'Their first-ever World Cup goal sparked national delirium.' },
  PAR: { nick: 'La Albirroja', blurb: 'Gritty, physical and never a pleasant afternoon.', fact: 'Famous for grinding out the ugliest of results.' },
  SCO: { nick: 'The Tartan Army', blurb: 'The fans alone are worth the entry fee.', fact: 'Bring the best away support in world football.' },
  QAT: { nick: 'The Maroon', blurb: 'Asian champions hoping to repay a host’s faith.', fact: 'Won the 2019 Asian Cup before hosting in 2022.' },
  KSA: { nick: 'The Green Falcons', blurb: 'Capable of a result that stops the planet.', fact: 'Beat the eventual champions in the 2022 group stage.' },
  UZB: { nick: 'White Wolves', blurb: 'The fairytale debutants nobody can spell-check.', fact: 'On a first-ever World Cup run — pure house money.' },
  RSA: { nick: 'Bafana Bafana', blurb: 'Quick, joyful, and overdue a deep run.', fact: 'Hosted the whole thing back in 2010.' },
  NZL: { nick: 'All Whites', blurb: 'Honest, organised and never beaten easily.', fact: 'Went unbeaten at a World Cup and still went home (2010).' },
};

const ADJ = ['plucky', 'fearless', 'unpredictable', 'streetwise', 'underrated', 'spirited'];
const TIER_SUB = { 1: 'The favourite', 2: 'The mid pick', 3: 'The dark horse' };

function fmtDate(iso) {
  if (!iso) return 'TBC';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}`;
}
function fmtLongDate(iso) {
  if (!iso) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dt = new Date(iso + 'T12:00:00Z');
  return `${days[dt.getUTCDay()]}, ${months[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}

/**
 * Build the full UI model from the committed JSON.
 * @param {{teams:Array, players:Array, matches:Array, scores:object}} raw
 * @param {{meId?:string, alias?:string, todayISO:string}} opts
 */
export function buildModel(raw, opts) {
  const { teams: teamDefs = [], players: playerDefs = [], matches: matchDefs = [] } = raw || {};
  const todayISO = opts.todayISO;

  // ---- TEAMS base ----------------------------------------------------
  const TEAMS = {};
  for (const t of teamDefs) {
    TEAMS[t.id] = {
      code: t.id, name: t.name, tier: t.tier, flag: t.flag, rank: t.rank,
      confederation: t.confederation, group: null, stage: 'group',
      stats: { w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0, ast: 0, yc: 0, rc: 0, og: 0 },
      lastMatch: null, trend: '', trendLabel: '',
    };
  }

  // ---- MATCHES (mapped) ---------------------------------------------
  const GROUP_SET = new Set();
  const MATCHES = matchDefs.map(m => {
    const stage = STAGE_MAP[m.stage] || 'group';
    const groupLetter = m.group ? m.group.replace('GROUP_', '') : null;
    if (groupLetter) GROUP_SET.add(groupLetter);
    const played = m.status === 'FINISHED';
    const stageLabel = groupLetter ? `Group ${groupLetter}`
      : (m.stage === 'THIRD_PLACE' ? '3rd Place' : STAGE_INFO[stage].label);
    return {
      id: String(m.id), stage, stageLabel,
      a: m.homeTeam || null, b: m.awayTeam || null,
      ga: played ? (m.homeScore ?? 0) : null,
      gb: played ? (m.awayScore ?? 0) : null,
      played,
      iso: m.date, date: fmtDate(m.date),
      time: m.time || '', venue: m.venue || '',
      today: m.date === todayISO,
      // per-team event tallies carried from the feed (best-effort)
      raw: m,
    };
  });

  // ---- assign group + derive stats / stage reached ------------------
  for (const m of MATCHES) {
    const groupLetter = m.stageLabel.startsWith('Group ') ? m.stageLabel.slice(6) : null;
    if (groupLetter) {
      if (m.a && TEAMS[m.a]) TEAMS[m.a].group = groupLetter;
      if (m.b && TEAMS[m.b]) TEAMS[m.b].group = groupLetter;
    }
    // stage reached = furthest stage a team appears in
    for (const code of [m.a, m.b]) {
      if (code && TEAMS[code]) {
        const cur = STAGE_INFO[TEAMS[code].stage].order;
        if (STAGE_INFO[m.stage].order > cur) TEAMS[code].stage = m.stage;
      }
    }
    if (!m.played || !m.a || !m.b) continue;
    const A = TEAMS[m.a], B = TEAMS[m.b];
    if (!A || !B) continue;
    A.stats.gf += m.ga; A.stats.ga += m.gb;
    B.stats.gf += m.gb; B.stats.ga += m.ga;
    if (m.gb === 0) A.stats.cs++;
    if (m.ga === 0) B.stats.cs++;
    if (m.ga > m.gb) { A.stats.w++; B.stats.l++; }
    else if (m.ga < m.gb) { B.stats.w++; A.stats.l++; }
    else { A.stats.d++; B.stats.d++; }
    const r = m.raw;
    A.stats.ast += r.homeAssists ?? 0; B.stats.ast += r.awayAssists ?? 0;
    A.stats.yc += r.homeYellowCards ?? 0; B.stats.yc += r.awayYellowCards ?? 0;
    A.stats.rc += r.homeRedCards ?? 0; B.stats.rc += r.awayRedCards ?? 0;
    A.stats.og += r.homeOwnGoals ?? 0; B.stats.og += r.awayOwnGoals ?? 0;
  }

  // winner: the team that won the FINAL
  const finalM = MATCHES.find(m => m.stage === 'final' && m.played && m.a && m.b);
  if (finalM) {
    const w = finalM.ga > finalM.gb ? finalM.a : finalM.gb > finalM.ga ? finalM.b : null;
    if (w && TEAMS[w]) TEAMS[w].stage = 'winner';
  }

  // ---- live stage = earliest stage with an unfinished match ---------
  let liveStage = 'group';
  for (const s of STAGE_ORDER) {
    const has = MATCHES.some(m => m.stage === s);
    const allDone = MATCHES.filter(m => m.stage === s).every(m => m.played);
    if (has && !allDone) { liveStage = s; break; }
    if (has) liveStage = s;
  }

  // ---- trends + blurbs ----------------------------------------------
  for (const t of Object.values(TEAMS)) {
    let last = null;
    for (const m of MATCHES) if (m.played && (m.a === t.code || m.b === t.code)) last = m;
    t.lastMatch = last;
    let gf = 0, ga = 0, won = false, lost = false, margin = 0;
    if (last) {
      const home = last.a === t.code;
      gf = home ? last.ga : last.gb; ga = home ? last.gb : last.ga;
      won = gf > ga; lost = gf < ga; margin = ga - gf;
    }
    const knockedOut = t.stage !== 'group' && t.stage !== liveStage && t.stage !== 'winner';
    const alive = t.stage === liveStage || t.stage === 'winner';
    let e = '', label = '';
    if (lost && margin >= 3) { e = '💩'; label = `Hammered ${gf}–${ga} last time out`; }
    else if (alive && last) { e = '🚀'; label = 'Still alive and advancing'; }
    else if (won && last) { e = '🔥'; label = `Won their last match ${gf}–${ga}`; }
    else if (lost && t.stage === 'group') { e = '😴'; label = 'Knocked out in the group stage'; }
    else if (lost) { e = '🧊'; label = `Lost their last match ${gf}–${ga}`; }
    else if (knockedOut) { e = '🧊'; label = 'Out of the tournament'; }
    t.trend = e; t.trendLabel = label;

    const b = TEAM_BLURBS[t.code];
    if (b) { t.nick = b.nick; t.blurb = b.blurb; t.fact = b.fact; }
    else {
      const adj = ADJ[(t.rank || 0) % ADJ.length];
      t.nick = t.name;
      t.blurb = `[Add a blurb for ${t.name}] — a ${adj} side hoping to cause a stir.`;
      t.fact = `[Fun fact about ${t.name} goes here.]`;
    }
  }

  // ---- scoring breakdown --------------------------------------------
  function breakdown(code) {
    const t = TEAMS[code];
    const s = t.stats, si = STAGE_INFO[t.stage];
    const items = [
      { key: 'win', label: 'Wins', n: s.w, per: RULES.win, pts: s.w * RULES.win },
      { key: 'draw', label: 'Draws', n: s.d, per: RULES.draw, pts: s.d * RULES.draw },
      { key: 'goal', label: 'Goals', n: s.gf, per: RULES.goal, pts: s.gf * RULES.goal },
      { key: 'cs', label: 'Clean sheets', n: s.cs, per: RULES.cs, pts: s.cs * RULES.cs },
      { key: 'assist', label: 'Assists', n: s.ast, per: RULES.assist, pts: s.ast * RULES.assist },
    ];
    const penalties = [];
    if (s.yc) penalties.push({ key: 'yellow', label: 'Yellow cards', n: s.yc, per: RULES.yellow, pts: s.yc * RULES.yellow });
    if (s.rc) penalties.push({ key: 'red', label: 'Red cards', n: s.rc, per: RULES.red, pts: s.rc * RULES.red });
    if (s.og) penalties.push({ key: 'og', label: 'Own goals', n: s.og, per: RULES.og, pts: s.og * RULES.og });
    const base = items.reduce((a, x) => a + x.pts, 0) + penalties.reduce((a, x) => a + x.pts, 0);
    return { items, penalties, bonus: si.bonus, bonusLabel: si.label, total: base + si.bonus };
  }
  const teamPoints = (code) => breakdown(code).total;

  // ---- PLAYERS -------------------------------------------------------
  const PLAYERS = playerDefs.map((p, i) => {
    const teams = p.teams
      .filter(code => TEAMS[code])
      .map(code => ({ ...TEAMS[code], points: teamPoints(code), bd: breakdown(code) }));
    const total = teams.reduce((a, t) => a + t.points, 0);
    return {
      id: p.id, name: p.name,
      alias: p.alias || `${p.name}'s XI`,
      color: p.color || AVATAR_COLORS[i % AVATAR_COLORS.length],
      teams, total, you: false,
    };
  });

  // dark-horse: a lower-tier team outscoring the player's tier-1 team
  for (const p of PLAYERS) {
    const fav = p.teams.find(t => t.tier === 1);
    for (const t of p.teams) {
      t.darkHorse = !!(fav && t.tier > 1 && t.points > fav.points);
    }
    p.topTeam = [...p.teams].sort((a, b) => b.points - a.points)[0];
  }

  // ---- standings + movement -----------------------------------------
  const ranked = [...PLAYERS].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  ranked.forEach((p, i) => { p.rank = i + 1; });

  // previous standings from the snapshot the Action persists (if any)
  const prev = opts.prevTotals || null;
  if (prev) {
    const prevRanked = [...PLAYERS]
      .map(p => ({ id: p.id, total: prev[p.id] ?? p.total }))
      .sort((a, b) => b.total - a.total)
      .map((p, i) => [p.id, i + 1]);
    const prevRankMap = Object.fromEntries(prevRanked);
    for (const p of PLAYERS) {
      p.prevRank = prevRankMap[p.id] ?? p.rank;
      p.move = p.prevRank - p.rank;
    }
  } else {
    for (const p of PLAYERS) { p.prevRank = p.rank; p.move = 0; }
  }

  // ---- viewer (?me= / saved) ----------------------------------------
  let you = PLAYERS.find(p => p.id === opts.meId) || PLAYERS[0] || null;
  if (you) {
    you.you = true;
    if (opts.alias) you.alias = opts.alias.slice(0, ALIAS_MAX);
  }

  // ---- today summary -------------------------------------------------
  const todayMatches = MATCHES.filter(m => m.today);
  const roundLabel = todayMatches.length
    ? (todayMatches[0].stageLabel.startsWith('Group') ? 'Group stage' : todayMatches[0].stageLabel)
    : STAGE_INFO[liveStage].label;
  const TODAY = { dateLabel: fmtLongDate(todayISO), round: roundLabel };

  const GROUP_LETTERS = [...GROUP_SET].sort();
  const GROUPS = {};
  for (const g of GROUP_LETTERS) {
    GROUPS[g] = Object.values(TEAMS).filter(t => t.group === g).map(t => t.code);
  }

  function ownersOf(code) { return PLAYERS.filter(p => p.teams.some(t => t.code === code)); }

  return {
    TEAMS, MATCHES, PLAYERS, ranked, GROUPS, GROUP_LETTERS,
    STAGE_INFO, RULES, breakdown, teamPoints, TODAY, liveStage,
    ownersOf, TREND_KEY, ALIAS_MAX, you,
  };
}
