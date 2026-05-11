// src/services/standings.service.ts
import { supabase } from '@/lib/supabase'
import { TeamStandings } from '@/types'

// Tipo para el resultado de la consulta con join
// ✅ Tipo correcto - teams es array
type TournamentTeamWithTeam = {
  group_label: string | null
  is_confirmed: boolean
  teams: {
    id: string
    name: string
    section: string
    subgroup: string | null
  }[]  // ← Array
}

// ✅ FUNCIÓN NUEVA: Calcular promedio de puntos (para grupos desbalanceados)
export function calculateAveragePoints(team: TeamStandings): number {
  if (team.matches_played === 0) return 0
  return team.points / team.matches_played
}

// ✅ FUNCIÓN NUEVA: Obtener los mejores segundos lugares por promedio
export async function getBestSecondPlaces(
  standings: Record<string, TeamStandings[]>,
  count: number = 1
): Promise<TeamStandings[]> {
  // Obtener todos los segundos lugares de cada grupo
  const secondPlaces: TeamStandings[] = []

  Object.values(standings).forEach(groupStandings => {
    // Ordenar primero para asegurar que el índice 1 es realmente el 2° lugar
    const sorted = [...groupStandings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for
      return a.team_name.localeCompare(b.team_name)
    })

    if (sorted.length >= 2) {
      secondPlaces.push(sorted[1]) // Índice 1 = 2° lugar
    }
  })

  // Ordenar por PROMEDIO de puntos (no puntos totales) - Aprobado por el profe
  secondPlaces.sort((a, b) => {
    // 1. Promedio de puntos (descendente)
    const avgA = calculateAveragePoints(a)
    const avgB = calculateAveragePoints(b)
    if (avgB !== avgA) return avgB - avgA

    // 2. Diferencia de goles (descendente)
    if (b.goal_difference !== a.goal_difference) {
      return b.goal_difference - a.goal_difference
    }

    // 3. Goles a favor (descendente)
    if (b.goals_for !== a.goals_for) {
      return b.goals_for - a.goals_for
    }

    // 4. Nombre (alfabético)
    return a.team_name.localeCompare(b.team_name)
  })

  // Retornar los mejores N segundos
  return secondPlaces.slice(0, count)
}

// ✅ FUNCIÓN NUEVA: Obtener los mejores terceros lugares por promedio
export async function getBestThirdPlaces(
  standings: Record<string, TeamStandings[]>,
  count: number = 2
): Promise<TeamStandings[]> {
  const thirdPlaces: TeamStandings[] = []

  Object.values(standings).forEach(groupStandings => {
    const sorted = [...groupStandings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for
      return a.team_name.localeCompare(b.team_name)
    })

    if (sorted.length >= 3) {
      thirdPlaces.push(sorted[2]) // Índice 2 = 3° lugar
    }
  })

  // Mismo ordenamiento por promedio
  thirdPlaces.sort((a, b) => {
    const avgA = calculateAveragePoints(a)
    const avgB = calculateAveragePoints(b)
    if (avgB !== avgA) return avgB - avgA
    if (b.goal_difference !== a.goal_difference) {
      return b.goal_difference - a.goal_difference
    }
    if (b.goals_for !== a.goals_for) {
      return b.goals_for - a.goals_for
    }
    return a.team_name.localeCompare(b.team_name)
  })

  return thirdPlaces.slice(0, count)
}

export async function getStandingsByTournament(tournamentId: string): Promise<Record<string, TeamStandings[]>> {
  console.log('🔍 [SERVICE] Obteniendo standings para torneo:', tournamentId)

  // 1. Obtener equipos del torneo CON su grupo desde tournament_teams
  const { data: tournamentTeamsData, error: teamsError } = await supabase
    .from('tournament_teams')
    .select(`
      group_label,
      is_confirmed,
      teams!inner (
        id,
        name,
        section,
        subgroup
      )
    `)
    .eq('tournament_id', tournamentId)

  if (teamsError) {
    console.error('❌ [SERVICE] Error al obtener equipos:', teamsError)
    return {}
  }

  console.log('📦 [SERVICE] Datos crudos de tournament_teams:', tournamentTeamsData)
  console.log('📦 [SERVICE] Cantidad de registros:', tournamentTeamsData?.length)

  // Type casting doble para manejar correctamente los tipos de Supabase
  const tournamentTeams = (tournamentTeamsData || []) as unknown as TournamentTeamWithTeam[]

  if (tournamentTeams.length === 0) {
    console.warn('⚠️ [SERVICE] No hay equipos registrados en este torneo')
    return {}
  }

  // Contar confirmados vs no confirmados
  const confirmados = tournamentTeams.filter(tt => tt.is_confirmed).length
  const noConfirmados = tournamentTeams.filter(tt => !tt.is_confirmed).length
  console.log(`✅ [SERVICE] Equipos confirmados: ${confirmados}`)
  console.log(`❌ [SERVICE] Equipos NO confirmados: ${noConfirmados}`)

  // 2. Obtener TODOS los partidos del torneo (no solo finalizados)
  const { data: matchesData, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)

  if (matchesError) {
    console.error('Error al obtener partidos:', matchesError)
  }

  const allMatches = matchesData || []

  // 3. ✅ Inicializar standings por equipo (solo confirmados) - ACCESO DIRECTO
  const standingsMap = new Map<string, TeamStandings>()

  tournamentTeams
    .filter(tt => tt.is_confirmed && tt.teams)
    .forEach(tt => {
      const team = tt.teams[0]  // ✅ Extraer primer elemento del array

      if (team && team.id) {
        console.log(`➕ Agregando equipo: ${team.name} (${team.id}) al grupo ${tt.group_label}`)

        standingsMap.set(team.id, {
          position: 0,
          team_id: team.id,
          team_name: team.name,
          section: team.section,
          subgroup: team.subgroup,
          group_label: tt.group_label || 'Sin grupo',
          matches_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0,
          yellow_cards: 0,
          red_cards: 0,
          form: [],
        })
      }
    })

  console.log('📊 [SERVICE] Equipos en standingsMap:', standingsMap.size)

  // 4. Procesar SOLO partidos FINALIZADOS para calcular estadísticas
  allMatches
    .filter(match => match.status === 'finished')
    .forEach(match => {
      if (!match.team_a_id || !match.team_b_id) return

      const teamA = standingsMap.get(match.team_a_id)
      const teamB = standingsMap.get(match.team_b_id)

      if (!teamA || !teamB) {
        console.warn(`⚠️ Partido sin equipos en standings: ${match.team_a_id} vs ${match.team_b_id}`)
        return
      }

      // Actualizar partidos jugados
      teamA.matches_played += 1
      teamB.matches_played += 1

      // Actualizar goles
      teamA.goals_for += match.score_a || 0
      teamA.goals_against += match.score_b || 0
      teamB.goals_for += match.score_b || 0
      teamB.goals_against += match.score_a || 0

      // Actualizar diferencia de goles
      teamA.goal_difference = teamA.goals_for - teamA.goals_against
      teamB.goal_difference = teamB.goals_for - teamB.goals_against

      // Determinar resultado y asignar puntos
      if (match.score_a > match.score_b) {
        teamA.wins += 1
        teamA.points += 3
        teamB.losses += 1
        teamA.form = [...teamA.form, 'W' as const].slice(-5)
        teamB.form = [...teamB.form, 'L' as const].slice(-5)
      } else if (match.score_b > match.score_a) {
        teamB.wins += 1
        teamB.points += 3
        teamA.losses += 1
        teamA.form = [...teamA.form, 'L' as const].slice(-5)
        teamB.form = [...teamB.form, 'W' as const].slice(-5)
      } else {
        teamA.draws += 1
        teamA.points += 1
        teamB.draws += 1
        teamB.points += 1
        teamA.form = [...teamA.form, 'D' as const].slice(-5)
        teamB.form = [...teamB.form, 'D' as const].slice(-5)
      }

      // Actualizar tarjetas desde el partido
      teamA.yellow_cards += match.team_a_yellow_cards || 0
      teamA.red_cards += match.team_a_red_cards || 0
      teamB.yellow_cards += match.team_b_yellow_cards || 0
      teamB.red_cards += match.team_b_red_cards || 0
    })

  // 5. Agrupar standings por group_label
  const standingsByGroup: Record<string, TeamStandings[]> = {}

  standingsMap.forEach((standing) => {
    const group = standing.group_label || 'Sin grupo'
    if (!standingsByGroup[group]) {
      standingsByGroup[group] = []
    }
    standingsByGroup[group].push(standing)
  })

  console.log('📊 [SERVICE] Standings por grupo:', Object.keys(standingsByGroup))

  // 6. ✅ Ordenar cada grupo con PROMEDIO como criterio de desempate
  Object.keys(standingsByGroup).forEach(group => {
    standingsByGroup[group].sort((a, b) => {
      // Criterio 1: Puntos (descendente)
      if (b.points !== a.points) return b.points - a.points
      // Criterio 2: Diferencia de goles (descendente)
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
      // Criterio 3: Goles a favor (descendente)
      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for
      // ✅ Criterio 4: Promedio de puntos (para grupos desbalanceados)
      const avgA = calculateAveragePoints(a)
      const avgB = calculateAveragePoints(b)
      if (avgB !== avgA) return avgB - avgA
      // Criterio 5: Nombre (alfabético)
      return a.team_name.localeCompare(b.team_name)
    })

    // Asignar posición numérica
    standingsByGroup[group].forEach((standing, index) => {
      standing.position = index + 1
    })
  })

  console.log('✅ [SERVICE] Standings finales:', standingsByGroup)
  return standingsByGroup
}

export async function updateMatchResult(
  matchId: string,
  formData: {
    score_a: number
    score_b: number
    status: 'scheduled' | 'live' | 'finished'
    team_a_yellow_cards?: number
    team_b_yellow_cards?: number
    team_a_red_cards?: number
    team_b_red_cards?: number
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔧 updateMatchResult - Actualizando:', { matchId, formData })

    const updateData: Record<string, any> = {
      score_a: Number(formData.score_a) || 0,
      score_b: Number(formData.score_b) || 0,
      status: formData.status,
      team_a_yellow_cards: Number(formData.team_a_yellow_cards ?? 0),
      team_b_yellow_cards: Number(formData.team_b_yellow_cards ?? 0),
      team_a_red_cards: Number(formData.team_a_red_cards ?? 0),
      team_b_red_cards: Number(formData.team_b_red_cards ?? 0),
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    console.log('📦 Datos a enviar a Supabase:', JSON.stringify(updateData, null, 2))

    const { error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId)

    if (error) {
      console.error('❌ Error de Supabase:', error)
      throw error
    }

    console.log('✅ Partido actualizado correctamente:', matchId)
    return { success: true }
  } catch (err) {
    console.error('💥 Error en updateMatchResult:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar resultado',
    }
  }
}