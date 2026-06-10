export const POINTS = {
  win: 5,
  draw: 2,
  goalScored: 3,
  assist: 1,
  cleanSheet: 4,
  yellowCard: -1,
  redCard: -3,
  ownGoal: -2,
  penaltyMiss: -2,
  // Progression bonuses
  roundOf32: 5,
  roundOf16: 10,
  quarterFinal: 15,
  semiFinal: 20,
  runnerUp: 30,
  winner: 40,
}

const STAGE_BONUS = {
  LAST_32: POINTS.roundOf32,
  LAST_16: POINTS.roundOf16,
  QUARTER_FINALS: POINTS.quarterFinal,
  SEMI_FINALS: POINTS.semiFinal,
  THIRD_PLACE: POINTS.semiFinal,
  FINAL: POINTS.runnerUp,
}

export function calcTeamMatchPoints(match, teamId) {
  if (match.status !== 'FINISHED') return { total: 0, breakdown: {} }

  const isHome = match.homeTeam === teamId
  const isAway = match.awayTeam === teamId
  if (!isHome && !isAway) return { total: 0, breakdown: {} }

  const scored = isHome ? match.homeScore : match.awayScore
  const conceded = isHome ? match.awayScore : match.homeScore
  const breakdown = {}
  let total = 0

  if (scored > conceded) {
    breakdown.win = POINTS.win
    total += POINTS.win
  } else if (scored === conceded) {
    breakdown.draw = POINTS.draw
    total += POINTS.draw
  }

  if (scored > 0) {
    breakdown.goals = scored * POINTS.goalScored
    total += breakdown.goals
  }

  if (conceded === 0) {
    breakdown.cleanSheet = POINTS.cleanSheet
    total += POINTS.cleanSheet
  }

  const assists = isHome ? (match.homeAssists ?? 0) : (match.awayAssists ?? 0)
  if (assists > 0) {
    breakdown.assists = assists * POINTS.assist
    total += breakdown.assists
  }

  const yellows = isHome ? (match.homeYellowCards ?? 0) : (match.awayYellowCards ?? 0)
  if (yellows > 0) {
    breakdown.yellowCards = yellows * POINTS.yellowCard
    total += breakdown.yellowCards
  }

  const reds = isHome ? (match.homeRedCards ?? 0) : (match.awayRedCards ?? 0)
  if (reds > 0) {
    breakdown.redCards = reds * POINTS.redCard
    total += breakdown.redCards
  }

  const ownGoals = isHome ? (match.homeOwnGoals ?? 0) : (match.awayOwnGoals ?? 0)
  if (ownGoals > 0) {
    breakdown.ownGoals = ownGoals * POINTS.ownGoal
    total += breakdown.ownGoals
  }

  return { total, breakdown }
}

export function calcProgressionBonus(matches, teamId) {
  const stagesReached = new Set()
  for (const m of matches) {
    if (m.status !== 'FINISHED') continue
    if (m.homeTeam !== teamId && m.awayTeam !== teamId) continue
    if (m.stage !== 'GROUP_STAGE' && STAGE_BONUS[m.stage] !== undefined) {
      stagesReached.add(m.stage)
    }
  }
  let total = 0
  const breakdown = {}
  for (const stage of stagesReached) {
    breakdown[stage] = STAGE_BONUS[stage]
    total += STAGE_BONUS[stage]
  }
  return { total, breakdown }
}

export function calcScores(players, matches) {
  return players.map((player) => {
    const teamScores = {}
    let playerTotal = 0

    for (const teamId of player.teams) {
      let teamTotal = 0
      const teamBreakdown = {}

      for (const match of matches) {
        const { total, breakdown } = calcTeamMatchPoints(match, teamId)
        teamTotal += total
        for (const [k, v] of Object.entries(breakdown)) {
          teamBreakdown[k] = (teamBreakdown[k] ?? 0) + v
        }
      }

      const { total: progTotal, breakdown: progBreakdown } = calcProgressionBonus(matches, teamId)
      teamTotal += progTotal
      Object.assign(teamBreakdown, progBreakdown)

      teamScores[teamId] = { total: teamTotal, breakdown: teamBreakdown }
      playerTotal += teamTotal
    }

    return { id: player.id, name: player.name, total: playerTotal, teams: teamScores }
  })
}
