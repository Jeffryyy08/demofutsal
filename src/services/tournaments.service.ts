// src/services/tournaments.service.ts
import { supabase } from '@/lib/supabase'
import { Team, Tournament, TournamentCategory, TournamentTeam, GroupPreview, TournamentPreview } from '@/types'

// ============================================
// CONFIGURACIÓN DINÁMICA APROBADA POR EL PROFESOR
// ============================================
const TOURNAMENT_CONFIGS: Record<number, {
  groups: number
  distribution: number[]
  qualified: number
  qualifiedType: 'top2' | 'top1_best2' | 'top1_best2_best3' | 'top1'
  finalPhase: 'semifinales' | 'cuartos'
  note?: string
}> = {
  8: { groups: 2, distribution: [4, 4], qualified: 4, qualifiedType: 'top2', finalPhase: 'semifinales' },
  9: { groups: 3, distribution: [3, 3, 3], qualified: 4, qualifiedType: 'top1_best2', finalPhase: 'semifinales' },
  10: { groups: 2, distribution: [5, 5], qualified: 4, qualifiedType: 'top2', finalPhase: 'semifinales' },
  11: { groups: 3, distribution: [4, 4, 3], qualified: 4, qualifiedType: 'top1_best2', finalPhase: 'semifinales', note: 'Grupo C juega 1 partido menos' },
  12: { groups: 3, distribution: [4, 4, 4], qualified: 4, qualifiedType: 'top1_best2', finalPhase: 'semifinales' },
  13: { groups: 4, distribution: [4, 3, 3, 3], qualified: 4, qualifiedType: 'top1', finalPhase: 'semifinales', note: 'Grupos desbalanceados: se usa promedio de puntos' },
  14: { groups: 3, distribution: [5, 5, 4], qualified: 8, qualifiedType: 'top1_best2_best3', finalPhase: 'cuartos', note: 'Clasifican 1°, 2° y dos mejores 3° por promedio' },
  15: { groups: 3, distribution: [5, 5, 5], qualified: 8, qualifiedType: 'top1_best2_best3', finalPhase: 'cuartos' },
  16: { groups: 4, distribution: [4, 4, 4, 4], qualified: 8, qualifiedType: 'top2', finalPhase: 'cuartos' }
}

// ✅ Obtener configuración según cantidad de equipos
export function getTournamentConfig(teamCount: number) {
  if (TOURNAMENT_CONFIGS[teamCount]) return TOURNAMENT_CONFIGS[teamCount]
  if (teamCount < 8) return { ...TOURNAMENT_CONFIGS[8], note: `Mínimo 8 equipos. Actualmente: ${teamCount}` }
  if (teamCount > 16) return { ...TOURNAMENT_CONFIGS[16], note: `Máximo 16 equipos. Actualmente: ${teamCount}` }
  
  // Para números intermedios no configurados, usar la configuración más cercana
  const closest = Object.keys(TOURNAMENT_CONFIGS)
    .map(Number)
    .sort((a, b) => Math.abs(a - teamCount) - Math.abs(b - teamCount))[0]
  
  return { ...TOURNAMENT_CONFIGS[closest], note: `Configuración aproximada para ${teamCount} equipos` }
}

// ============================================
// CATEGORÍAS
// ============================================
export async function getTournamentCategories(): Promise<TournamentCategory[]> {
  const { data, error } = await supabase
    .from('tournament_categories')
    .select('*')
    .eq('is_active', true)
    .order('min_grade')

  if (error) throw error
  return data || []
}

export async function getTournamentCategoryBySlug(slug: string): Promise<TournamentCategory | null> {
  const { data, error } = await supabase
    .from('tournament_categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) throw error
  return data
}

// ============================================
// TORNEOS
// ============================================
export async function getTournamentsByCategory(categorySlug: string): Promise<Tournament[]> {
  const { data: category } = await supabase
    .from('tournament_categories')
    .select('id')
    .eq('slug', categorySlug)
    .single()

  if (!category) return []

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('category_id', category.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createTournament(
  categoryId: string,
  name: string,
  registrationDeadline: string
): Promise<{ success: boolean; tournament?: Tournament; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        category_id: categoryId,
        name,
        registration_deadline: registrationDeadline,
        status: 'draft',
        current_phase: 'groups',
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, tournament: data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear torneo',
    }
  }
}

// ============================================
// EQUIPOS DISPONIBLES PARA TORNEO
// ============================================
export async function getAvailableTeamsForCategory(
  categorySlug: string,
  tournamentId?: string
): Promise<Team[]> {
  const { data: category } = await supabase
    .from('tournament_categories')
    .select('min_grade, max_grade, include_teachers')
    .eq('slug', categorySlug)
    .single()

  if (!category) return []

  const sections = []
  for (let grade = category.min_grade; grade <= category.max_grade; grade++) {
    sections.push(`${grade}-%`)
  }

  let query = supabase
    .from('teams')
    .select('*')
    .eq('is_active', true)

  if (sections.length > 0) {
    query = query.or(sections.map(s => `section.like.${s}`).join(','))
  }

  if (tournamentId) {
    const { data: registeredTeamIds } = await supabase
      .from('tournament_teams')
      .select('team_id')
      .eq('tournament_id', tournamentId)

    const registeredIds = registeredTeamIds?.map(t => t.team_id) || []
    if (registeredIds.length > 0) {
      query = query.not('id', 'in', `(${registeredIds.join(',')})`)
    }
  }

  const { data, error } = await query.order('section').order('name')

  if (error) throw error
  return data || []
}

// ============================================
// INSCRIPCIÓN DE EQUIPOS
// ============================================
export async function registerTeamForTournament(
  tournamentId: string,
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('tournament_teams')
      .insert({
        tournament_id: tournamentId,
        team_id: teamId,
        is_confirmed: false,
      })

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al inscribir equipo',
    }
  }
}

export async function getRegisteredTeams(tournamentId: string): Promise<TournamentTeam[]> {
  const { data, error } = await supabase
    .from('tournament_teams')
    .select(`
      *,
      team:teams(*)
    `)
    .eq('tournament_id', tournamentId)
    .order('registered_at')

  if (error) throw error
  return data || []
}

// ============================================
// ✅ GENERACIÓN DINÁMICA DE GRUPOS (8-16 equipos)
// ============================================
export function generateGroupsPreview(
  teams: Team[],
  _teamsPerGroup?: number  // ✅ Ya no se usa, la distribución es automática
): GroupPreview[] {
  const teamCount = teams.length
  const config = getTournamentConfig(teamCount)
  
  // Mezclar equipos aleatoriamente para distribución justa
  const shuffled = [...teams].sort(() => Math.random() - 0.5)
  
  // Ordenar por sección para consistencia visual (opcional)
  // const shuffled = [...teams].sort((a, b) => {
  //   if (a.section !== b.section) return a.section.localeCompare(b.section)
  //   return a.name.localeCompare(b.name)
  // })

  const groups: GroupPreview[] = []
  const groupLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  let teamIndex = 0

  // Distribuir equipos según la configuración aprobada
  config.distribution.forEach((count, index) => {
    const groupTeams = shuffled.slice(teamIndex, teamIndex + count)
    const matchesCount = (count * (count - 1)) / 2  // Fórmula round-robin

    groups.push({
      group_label: groupLabels[index] || `Grupo ${index + 1}`,
      teams: groupTeams,
      matches_count: matchesCount,
    })
    teamIndex += count
  })

  return groups
}

export function calculateTournamentPreview(
  teams: Team[],
  _teamsPerGroup?: number  // ✅ Ya no se usa
): TournamentPreview {
  const groups = generateGroupsPreview(teams)
  const config = getTournamentConfig(teams.length)

  // Partidos de fase de grupos
  const groupMatches = groups.reduce((sum, g) => sum + g.matches_count, 0)

  // Partidos de fase eliminatoria según configuración
  let knockoutMatches = 0
  if (config.finalPhase === 'semifinales') {
    knockoutMatches = 3  // 2 semis + 1 final
  } else if (config.finalPhase === 'cuartos') {
    knockoutMatches = 7  // 4 cuartos + 2 semis + 1 final
  }

  const totalMatches = groupMatches + knockoutMatches
  
  // Rondas de grupos = equipos por grupo - 1
  const maxGroupSize = Math.max(...config.distribution)
  const groupRounds = maxGroupSize - 1
  const knockoutRounds = config.finalPhase === 'semifinales' ? 2 : 3
  const totalRounds = groupRounds + knockoutRounds

  // Estimación: 1 partido por día (fútbol sala, 1 partido/día)
  const estimatedDurationDays = totalMatches

  return {
    groups,
    total_matches: totalMatches,
    total_rounds: totalRounds,
    estimated_duration_days: estimatedDurationDays,
  }
}

// ============================================
// ✅ FUNCIÓN HELPER: Obtener próxima fecha disponible (Lunes-Viernes 11:20 AM)
// ============================================
function getNextAvailableMatchDate(startDate: Date): Date {
  const date = new Date(startDate)
  const now = new Date()
  
  // Configurar hora a 11:20 AM
  date.setHours(11, 20, 0, 0)
  date.setMilliseconds(0)
  
  // Si ya pasó la hora de hoy, empezar desde mañana
  if (date <= now) {
    date.setDate(date.getDate() + 1)
    date.setHours(11, 20, 0, 0)
  }
  
  // Saltar fines de semana (0 = domingo, 6 = sábado)
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1)
  }
  
  return date
}

// ============================================
// ✅ INICIAR TORNEO - Con distribución dinámica y fechas inteligentes
// ============================================
export async function startTournament(
  tournamentId: string
): Promise<{ success: boolean; matches_created?: number; error?: string }> {
  try {
    console.log('🔍 startTournament - Iniciando torneo:', tournamentId)

    // 1. Obtener torneo
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .limit(1)

    if (tournamentError || !tournaments || tournaments.length === 0) {
      throw new Error('Torneo no encontrado')
    }

    const tournament = tournaments[0]

    if (tournament.status === 'active') {
      return {
        success: false,
        error: 'El torneo ya está activo. No se puede iniciar nuevamente.',
      }
    }

    console.log('✅ Torneo encontrado:', tournament.name)

    // 2. Obtener categoría
    const { data: categories } = await supabase
      .from('tournament_categories')
      .select('*')
      .eq('id', tournament.category_id)
      .limit(1)

    if (!categories || categories.length === 0) {
      throw new Error('Categoría no encontrada')
    }

    const category = categories[0]

    // 3. Obtener equipos confirmados
    const { data: tournamentTeams } = await supabase
      .from('tournament_teams')
      .select(`
        *,
        team:teams(*)
      `)
      .eq('tournament_id', tournamentId)
      .eq('is_confirmed', true)

    if (!tournamentTeams || tournamentTeams.length === 0) {
      return { success: false, error: 'No hay equipos confirmados' }
    }

    console.log('✅ Equipos confirmados:', tournamentTeams.length)

    // 4. ✅ Generar grupos CON DISTRIBUCIÓN DINÁMICA
    const teams = tournamentTeams.map(tt => tt.team).filter(Boolean) as Team[]
    const groups = generateGroupsPreview(teams)  // ✅ Usa configuración automática
    const config = getTournamentConfig(teams.length)

    console.log('✅ Grupos generados:', groups.length)
    console.log('📊 Configuración:', config)
    groups.forEach(g => {
      console.log(`  📁 Grupo ${g.group_label}: ${g.teams.length} equipos, ${g.matches_count} partidos`)
    })

    // 5. ✅ Asignar group_label en tournament_teams
    for (const group of groups) {
      for (const team of group.teams) {
        const { error: updateError } = await supabase
          .from('tournament_teams')
          .update({ group_label: group.group_label })
          .eq('tournament_id', tournamentId)
          .eq('team_id', team.id)

        if (updateError) {
          console.error(`❌ Error al asignar equipo ${team.id} a grupo ${group.group_label}:`, updateError)
        } else {
          console.log(`  ✅ Equipo ${team.name} asignado a Grupo ${group.group_label}`)
        }
      }
    }

    // 6. Crear fase de grupos
    const { data: phases } = await supabase
      .from('tournament_phases')
      .insert({
        tournament_id: tournamentId,
        name: 'Fase de Grupos',
        phase_type: 'groups',
        phase_order: 1,
        is_active: true,
        config: { 
          groups: groups.map(g => g.group_label),
          qualified: config.qualified,
          qualifiedType: config.qualifiedType,
          finalPhase: config.finalPhase
        },
      })
      .select()
      .limit(1)

    if (!phases || phases.length === 0) {
      throw new Error('Error al crear fase')
    }

    const phase = phases[0]
    console.log('✅ Fase creada:', phase.id)

    // 7. ✅ Crear partidos CON FECHA INTELIGENTE (Lun-Vie 11:20 AM)
    let matchesCreated = 0
    const baseDate = tournament.start_date ? new Date(tournament.start_date) : new Date()
    let currentDate = new Date(baseDate)

    // Configurar fecha inicial a 11:20 AM
    currentDate.setHours(11, 20, 0, 0)

    console.log('📅 Fecha base:', baseDate)
    console.log('⏰ Primera fecha programada:', currentDate)

    for (const group of groups) {
      const groupTeams = group.teams
      const matches: any[] = []

      console.log(`📝 Creando partidos para Grupo ${group.group_label}...`)

      // Round-robin DENTRO del grupo
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          // ✅ Obtener próxima fecha disponible (salta fines de semana y horas pasadas)
          currentDate = getNextAvailableMatchDate(currentDate)
          
          const matchDate = new Date(currentDate)

          matches.push({
            tournament_id: tournamentId,
            phase_id: phase.id,
            team_a_id: groupTeams[i].id,
            team_b_id: groupTeams[j].id,
            match_date: matchDate.toISOString(),
            status: 'scheduled',
            round_number: 1,
            is_knockout: false,
            group_label: group.group_label,  // ✅ CRÍTICO para standings
          })
          
          // ✅ Avanzar al próximo día hábil
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }

      if (matches.length > 0) {
        const { error: insertError } = await supabase
          .from('matches')
          .insert(matches)

        if (insertError) {
          console.error('❌ Error al insertar partidos:', insertError)
          throw new Error('Error al crear partidos')
        }

        matchesCreated += matches.length
        console.log(`  ✅ ${matches.length} partidos creados para Grupo ${group.group_label}`)
        
        // Mostrar fechas de ejemplo
        console.log(`     Primer partido: ${matches[0].match_date}`)
        console.log(`     Último partido: ${matches[matches.length - 1].match_date}`)
      }
    }

    console.log('✅ Total partidos de grupos creados:', matchesCreated)

    // 8. Actualizar estado del torneo
    await supabase
      .from('tournaments')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId)

    return { success: true, matches_created: matchesCreated }
  } catch (err) {
    console.error('❌ startTournament error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al iniciar torneo',
    }
  }
}