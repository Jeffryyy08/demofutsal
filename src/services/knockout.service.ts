// src/services/knockout.service.ts
import { supabase } from '@/lib/supabase'
import { 
  getStandingsByTournament, 
  getBestSecondPlaces, 
  getBestThirdPlaces,
  calculateAveragePoints
} from './standings.service'

interface KnockoutMatchInsert {
  phase_id: string
  team_a_id: string | null
  team_b_id: string | null
  round_number: number
  tournament_id: string
  is_knockout: boolean
  status: string
  score_a: number
  score_b: number
  team_a_fouls: number
  team_b_fouls: number
  team_a_yellow_cards: number
  team_b_yellow_cards: number
  team_a_red_cards: number
  team_b_red_cards: number
  match_date: string
}

// ✅ Configuración dinámica aprobada por el profesor
const TOURNAMENT_CONFIGS: Record<number, {
  groups: number
  distribution: number[]
  qualified: number
  qualifiedType: 'top2' | 'top1_best2' | 'top1_best2_best3' | 'top1'
  finalPhase: 'semifinales' | 'cuartos'
  note?: string
}> = {
  8:  { groups: 2, distribution: [4, 4], qualified: 4, qualifiedType: 'top2', finalPhase: 'semifinales' },
  9:  { groups: 3, distribution: [3, 3, 3], qualified: 4, qualifiedType: 'top1_best2', finalPhase: 'semifinales' },
  10: { groups: 2, distribution: [5, 5], qualified: 4, qualifiedType: 'top2', finalPhase: 'semifinales' },
  11: { groups: 3, distribution: [4, 4, 3], qualified: 4, qualifiedType: 'top1_best2', finalPhase: 'semifinales' },
  12: { groups: 3, distribution: [4, 4, 4], qualified: 4, qualifiedType: 'top1_best2', finalPhase: 'semifinales' },
  13: { groups: 4, distribution: [4, 3, 3, 3], qualified: 4, qualifiedType: 'top1', finalPhase: 'semifinales' },
  14: { groups: 3, distribution: [5, 5, 4], qualified: 8, qualifiedType: 'top1_best2_best3', finalPhase: 'cuartos' },
  15: { groups: 3, distribution: [5, 5, 5], qualified: 8, qualifiedType: 'top1_best2_best3', finalPhase: 'cuartos' },
  16: { groups: 4, distribution: [4, 4, 4, 4], qualified: 8, qualifiedType: 'top2', finalPhase: 'cuartos' }
}

// ✅ Obtener configuración según cantidad de equipos confirmados
function getTournamentConfig(teamCount: number) {
  if (TOURNAMENT_CONFIGS[teamCount]) return TOURNAMENT_CONFIGS[teamCount]
  if (teamCount < 8) return { ...TOURNAMENT_CONFIGS[8], note: `Mínimo 8 equipos. Actualmente: ${teamCount}` }
  if (teamCount > 16) return { ...TOURNAMENT_CONFIGS[16], note: `Máximo 16 equipos. Actualmente: ${teamCount}` }
  
  const closest = Object.keys(TOURNAMENT_CONFIGS)
    .map(Number)
    .sort((a, b) => Math.abs(a - teamCount) - Math.abs(b - teamCount))[0]
  
  return { ...TOURNAMENT_CONFIGS[closest], note: `Configuración aproximada para ${teamCount} equipos` }
}

export async function generateKnockoutPhase(tournamentId: string): Promise<{ 
  success: boolean
  matches_created?: number
  phase_id?: string
  error?: string 
}> {
  try {
    console.log('🎲 generateKnockoutPhase - Iniciando para torneo:', tournamentId)

    // 1. Obtener torneo y verificar que esté activo
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (!tournament) {
      return { success: false, error: 'Torneo no encontrado' }
    }

    if (tournament.status !== 'active') {
      return { success: false, error: 'El torneo debe estar activo para generar fase eliminatoria' }
    }

    // 2. Obtener standings de todos los grupos
    const standings = await getStandingsByTournament(tournamentId)
    const groups = Object.keys(standings)
    
    console.log('📊 Grupos encontrados:', groups)

    if (groups.length < 2) {
      return { success: false, error: 'Se necesitan al menos 2 grupos para generar fase eliminatoria' }
    }

    // ✅ 3. Obtener configuración para saber CUÁNTOS y QUIÉNES clasifican
    const confirmedTeamsCount = Object.values(standings).reduce((sum, g) => sum + g.length, 0)
    const config = getTournamentConfig(confirmedTeamsCount)
    
    console.log('📋 Configuración de clasificación:', config)

    // ✅ 4. Obtener equipos clasificados SEGÚN LA CONFIGURACIÓN
    const qualifiedTeams: { group: string; team_id: string; team_name: string; position: number }[] = []
    
    // Paso 4a: Agregar 1° de cada grupo (SIEMPRE clasifican)
    Object.entries(standings).forEach(([group, groupStandings]) => {
      const sorted = [...groupStandings].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
        if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for
        return a.team_name.localeCompare(b.team_name)
      })
      
      // Agregar 1° lugar de cada grupo
      if (sorted.length >= 1) {
        qualifiedTeams.push({
          group,
          team_id: sorted[0].team_id,
          team_name: sorted[0].team_name,
          position: 1,
        })
      }
    })

    // Paso 4b: Agregar segundos lugares si corresponde (top2 o top1_best2_best3)
    if (config.qualifiedType === 'top2') {
      // Clasifican 1° y 2° de cada grupo (8 equipos total)
      Object.entries(standings).forEach(([group, groupStandings]) => {
        const sorted = [...groupStandings].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
          if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for
          return a.team_name.localeCompare(b.team_name)
        })
        
        if (sorted.length >= 2) {
          qualifiedTeams.push({
            group,
            team_id: sorted[1].team_id,
            team_name: sorted[1].team_name,
            position: 2,
          })
        }
      })
    } else if (config.qualifiedType === 'top1_best2') {
      // Clasifican 1° de cada grupo + mejor(es) 2°
      const bestSecondsNeeded = config.qualified - groups.length  // Para 3 grupos: 4 - 3 = 1
      if (bestSecondsNeeded > 0) {
        const bestSeconds = await getBestSecondPlaces(standings, bestSecondsNeeded)
        bestSeconds.forEach(standing => {
          qualifiedTeams.push({
            group: standing.group_label,
            team_id: standing.team_id,
            team_name: standing.team_name,
            position: 2,
          })
        })
        console.log(`✅ Agregados ${bestSeconds.length} mejores segundos`)
      }
    } else if (config.qualifiedType === 'top1_best2_best3') {
      // Clasifican 1° y 2° de cada grupo + mejores 3°
      Object.entries(standings).forEach(([group, groupStandings]) => {
        const sorted = [...groupStandings].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
          if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for
          return a.team_name.localeCompare(b.team_name)
        })
        
        if (sorted.length >= 2) {
          qualifiedTeams.push({
            group,
            team_id: sorted[1].team_id,
            team_name: sorted[1].team_name,
            position: 2,
          })
        }
      })
      
      // Agregar mejores terceros
      const bestThirdsNeeded = config.qualified - (groups.length * 2)  // Para 3 grupos: 8 - 6 = 2
      if (bestThirdsNeeded > 0) {
        const bestThirds = await getBestThirdPlaces(standings, bestThirdsNeeded)
        bestThirds.forEach(standing => {
          qualifiedTeams.push({
            group: standing.group_label,
            team_id: standing.team_id,
            team_name: standing.team_name,
            position: 3,
          })
        })
        console.log(`✅ Agregados ${bestThirds.length} mejores terceros`)
      }
    }

    console.log('✅ Total equipos clasificados:', qualifiedTeams.length)
    console.log('📋 Clasificados:', qualifiedTeams.map(t => `${t.team_name} (${t.group})`))

    // ✅ Verificar que sean EXACTAMENTE 4 u 8 equipos
    if (qualifiedTeams.length !== 4 && qualifiedTeams.length !== 8) {
      console.error('❌ ERROR: Se esperaban 4 u 8 equipos, pero se clasificaron:', qualifiedTeams.length)
      return { 
        success: false, 
        error: `Error interno: Se clasificaron ${qualifiedTeams.length} equipos. Se esperan 4 u 8.` 
      }
    }

    // 5. Crear fase de eliminación directa
    const { data: phase } = await supabase
      .from('tournament_phases')
      .insert({
        tournament_id: tournamentId,
        name: 'Fase Eliminatoria',
        phase_type: 'knockout',
        phase_order: 2,
        is_active: false,
        config: {
          type: 'knockout',
          has_third_place: false,
          qualifiedCount: config.qualified,
          qualifiedType: config.qualifiedType,
        },
      })
      .select()
      .single()

    if (!phase) {
      return { success: false, error: 'Error al crear fase eliminatoria' }
    }

    console.log('✅ Fase eliminatoria creada:', phase.id)

    // 6. Generar partidos según cantidad de equipos clasificados (SOLO 4 U 8)
    let matchesToInsert: KnockoutMatchInsert[] = []
    const totalQualified = qualifiedTeams.length

    if (totalQualified === 4) {
      // ✅ 4 equipos → Semifinales + Final
      const result = generateSemifinalsAndFinal(qualifiedTeams, phase.id, tournamentId)
      matchesToInsert = result
    } else if (totalQualified === 8) {
      // ✅ 8 equipos → Cuartos + Semifinales + Final
      const result = generateQuarterfinalsSemifinalsFinal(qualifiedTeams, phase.id, tournamentId)
      matchesToInsert = result
    } else {
      // ❌ ESTO NUNCA DEBERÍA PASAR si la lógica de clasificación es correcta
      return { 
        success: false, 
        error: `Cantidad no soportada (${totalQualified}). Solo se permiten 4 u 8 equipos clasificados.` 
      }
    }

    console.log('📝 Partidos a crear:', matchesToInsert.length)

    // 7. Insertar partidos
    if (matchesToInsert.length > 0) {
      const { data: insertedMatches, error: insertError } = await supabase
        .from('matches')
        .insert(matchesToInsert)
        .select()

      if (insertError) {
        console.error('❌ Error al insertar partidos:', insertError)
        return { success: false, error: `Error al crear partidos: ${insertError.message}` }
      }

      console.log('✅ Partidos creados:', insertedMatches?.length)

      // 8. Actualizar next_match_id correctamente
      if (insertedMatches && insertedMatches.length > 0) {
        await updateNextMatchRelations(insertedMatches, totalQualified)
      }

      return { 
        success: true, 
        matches_created: insertedMatches?.length || 0,
        phase_id: phase.id 
      }
    }

    return { success: true, matches_created: 0, phase_id: phase.id }
  } catch (err) {
    console.error('💥 generateKnockoutPhase - Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al generar fase eliminatoria',
    }
  }
}

// ✅ FUNCIÓN: Actualizar relaciones next_match_id para 4 u 8 equipos
async function updateNextMatchRelations(
  insertedMatches: any[],
  totalQualified: number
): Promise<void> {
  const matchesByRound = new Map<number, string[]>()
  insertedMatches.forEach(match => {
    const round = match.round_number
    if (!matchesByRound.has(round)) {
      matchesByRound.set(round, [])
    }
    matchesByRound.get(round)!.push(match.id)
  })

  const updatePromises: Promise<any>[] = []

  if (totalQualified === 4) {
    // 4 equipos: Semifinales (round 1) → Final (round 2)
    const semiFinals = matchesByRound.get(1) || []
    const finals = matchesByRound.get(2) || []
    
    if (semiFinals.length === 2 && finals.length === 1) {
      const finalId = finals[0]
      semiFinals.forEach(semiId => {
        updatePromises.push(
          supabase.from('matches').update({ next_match_id: finalId }).eq('id', semiId)
        )
      })
      console.log('✅ Ambas semifinales apuntan a la final:', finalId)
    }
  } 
  else if (totalQualified === 8) {
    // 8 equipos: Cuartos (round 1) → Semis (round 2) → Final (round 3)
    const quarters = matchesByRound.get(1) || []
    const semis = matchesByRound.get(2) || []
    const finals = matchesByRound.get(3) || []

    if (quarters.length === 4 && semis.length === 2 && finals.length === 1) {
      const finalId = finals[0]
      
      // Cuartos 1-2 → Semi 1, Cuartos 3-4 → Semi 2
      if (quarters[0] && quarters[1] && semis[0]) {
        updatePromises.push(
          supabase.from('matches').update({ next_match_id: semis[0] }).eq('id', quarters[0])
        )
        updatePromises.push(
          supabase.from('matches').update({ next_match_id: semis[0] }).eq('id', quarters[1])
        )
      }
      if (quarters[2] && quarters[3] && semis[1]) {
        updatePromises.push(
          supabase.from('matches').update({ next_match_id: semis[1] }).eq('id', quarters[2])
        )
        updatePromises.push(
          supabase.from('matches').update({ next_match_id: semis[1] }).eq('id', quarters[3])
        )
      }
      // Semis → Final
      if (semis[0] && semis[1] && finalId) {
        updatePromises.push(
          supabase.from('matches').update({ next_match_id: finalId }).eq('id', semis[0])
        )
        updatePromises.push(
          supabase.from('matches').update({ next_match_id: finalId }).eq('id', semis[1])
        )
      }
      console.log('✅ Relaciones de cuartos/semis/final actualizadas')
    }
  }

  if (updatePromises.length > 0) {
    await Promise.all(updatePromises)
    console.log('✅ next_match_id actualizado correctamente')
  }
}

// Generar semifinales y final (4 equipos)
function generateSemifinalsAndFinal(
  qualifiedTeams: { group: string; team_id: string; team_name: string; position: number }[],
  phaseId: string,
  tournamentId: string
): KnockoutMatchInsert[] {
  const matches: KnockoutMatchInsert[] = []
  
  // Ordenar equipos: por grupo, luego por posición
  const sortedTeams = [...qualifiedTeams].sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group)
    return a.position - b.position
  })

  const groupA = sortedTeams.filter(t => t.group === 'A')
  const groupB = sortedTeams.filter(t => t.group === 'B')
  const groupC = sortedTeams.filter(t => t.group === 'C')
  
  let semi1: { a: any; b: any } | null = null
  let semi2: { a: any; b: any } | null = null
  
  // Caso: 2 grupos (A y B) → Cruce clásico
  if (groupA.length >= 1 && groupB.length >= 1 && !groupC.length) {
    const a1 = groupA.find(t => t.position === 1)
    const b1 = groupB.find(t => t.position === 1)
    const a2 = groupA.find(t => t.position === 2)
    const b2 = groupB.find(t => t.position === 2)
    
    if (a1 && b2) semi1 = { a: a1, b: b2 }
    if (b1 && a2) semi2 = { a: b1, b: a2 }
  }
  // Caso: 3 grupos (A, B, C) → 1°A, 1°B, 1°C + mejor 2°
  else if (groupC && groupC.length >= 1) {
    const bestSecond = sortedTeams.find(t => t.position === 2)  // El mejor 2° ya está ordenado
    const firstPlaces = sortedTeams.filter(t => t.position === 1).sort((a, b) => a.group.localeCompare(b.group))
    
    if (firstPlaces.length >= 2 && bestSecond) {
      // Semi 1: 1°A vs mejor 2°
      semi1 = { a: firstPlaces[0], b: bestSecond }
      // Semi 2: 1°B vs 1°C
      if (firstPlaces.length >= 3) {
        semi2 = { a: firstPlaces[1], b: firstPlaces[2] }
      }
    }
  }

  // Crear partidos de semifinal
  if (semi1?.a && semi1?.b) {
    matches.push({
      phase_id: phaseId,
      team_a_id: semi1.a.team_id,
      team_b_id: semi1.b.team_id,
      round_number: 1,
      tournament_id: tournamentId,
      is_knockout: true,
      status: 'scheduled',
      score_a: 0,
      score_b: 0,
      team_a_fouls: 0,
      team_b_fouls: 0,
      team_a_yellow_cards: 0,
      team_b_yellow_cards: 0,
      team_a_red_cards: 0,
      team_b_red_cards: 0,
      match_date: new Date().toISOString(),
    })
  }

  if (semi2?.a && semi2?.b) {
    matches.push({
      phase_id: phaseId,
      team_a_id: semi2.a.team_id,
      team_b_id: semi2.b.team_id,
      round_number: 1,
      tournament_id: tournamentId,
      is_knockout: true,
      status: 'scheduled',
      score_a: 0,
      score_b: 0,
      team_a_fouls: 0,
      team_b_fouls: 0,
      team_a_yellow_cards: 0,
      team_b_yellow_cards: 0,
      team_a_red_cards: 0,
      team_b_red_cards: 0,
      match_date: new Date().toISOString(),
    })
  }

  // Final (sin equipos aún)
  matches.push({
    phase_id: phaseId,
    team_a_id: null,
    team_b_id: null,
    round_number: 2,
    tournament_id: tournamentId,
    is_knockout: true,
    status: 'scheduled',
    score_a: 0,
    score_b: 0,
    team_a_fouls: 0,
    team_b_fouls: 0,
    team_a_yellow_cards: 0,
    team_b_yellow_cards: 0,
    team_a_red_cards: 0,
    team_b_red_cards: 0,
    match_date: new Date().toISOString(),
  })

  return matches
}

// Generar cuartos, semifinales y final (8 equipos)
function generateQuarterfinalsSemifinalsFinal(
  qualifiedTeams: { group: string; team_id: string; team_name: string; position: number }[],
  phaseId: string,
  tournamentId: string
): KnockoutMatchInsert[] {
  const matches: KnockoutMatchInsert[] = []
  
  // Ordenar equipos por grupo y posición
  const sortedTeams = [...qualifiedTeams].sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group)
    return a.position - b.position
  })

  // Cuartos de final: cruces balanceados
  // 1°A vs 2°D, 1°B vs 2°C, 1°C vs 2°B, 1°D vs 2°A
  const quarterMatches = [
    { a: sortedTeams[0], b: sortedTeams[7] },  // 1°A vs 2°D
    { a: sortedTeams[2], b: sortedTeams[5] },  // 1°B vs 2°C
    { a: sortedTeams[4], b: sortedTeams[3] },  // 1°C vs 2°B
    { a: sortedTeams[6], b: sortedTeams[1] },  // 1°D vs 2°A
  ]

  quarterMatches.forEach((match) => {
    if (match.a && match.b) {
      matches.push({
        phase_id: phaseId,
        team_a_id: match.a.team_id,
        team_b_id: match.b.team_id,
        round_number: 1,
        tournament_id: tournamentId,
        is_knockout: true,
        status: 'scheduled',
        score_a: 0,
        score_b: 0,
        team_a_fouls: 0,
        team_b_fouls: 0,
        team_a_yellow_cards: 0,
        team_b_yellow_cards: 0,
        team_a_red_cards: 0,
        team_b_red_cards: 0,
        match_date: new Date().toISOString(),
      })
    }
  })

  // Semifinales (sin equipos aún)
  matches.push(
    {
      phase_id: phaseId,
      team_a_id: null,
      team_b_id: null,
      round_number: 2,
      tournament_id: tournamentId,
      is_knockout: true,
      status: 'scheduled',
      score_a: 0,
      score_b: 0,
      team_a_fouls: 0,
      team_b_fouls: 0,
      team_a_yellow_cards: 0,
      team_b_yellow_cards: 0,
      team_a_red_cards: 0,
      team_b_red_cards: 0,
      match_date: new Date().toISOString(),
    },
    {
      phase_id: phaseId,
      team_a_id: null,
      team_b_id: null,
      round_number: 2,
      tournament_id: tournamentId,
      is_knockout: true,
      status: 'scheduled',
      score_a: 0,
      score_b: 0,
      team_a_fouls: 0,
      team_b_fouls: 0,
      team_a_yellow_cards: 0,
      team_b_yellow_cards: 0,
      team_a_red_cards: 0,
      team_b_red_cards: 0,
      match_date: new Date().toISOString(),
    }
  )

  // Final (sin equipos aún)
  matches.push({
    phase_id: phaseId,
    team_a_id: null,
    team_b_id: null,
    round_number: 3,
    tournament_id: tournamentId,
    is_knockout: true,
    status: 'scheduled',
    score_a: 0,
    score_b: 0,
    team_a_fouls: 0,
    team_b_fouls: 0,
    team_a_yellow_cards: 0,
    team_b_yellow_cards: 0,
    team_a_red_cards: 0,
    team_b_red_cards: 0,
    match_date: new Date().toISOString(),
  })

  return matches
}

// Avanzar ganador al siguiente partido
export async function advanceKnockoutWinner(
  matchId: string,
  winnerTeamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🏆 advanceKnockoutWinner - Avanzando:', { matchId, winnerTeamId })

    // 1. Obtener el partido actual
    const { data: match } = await supabase
      .from('matches')
      .select('next_match_id')
      .eq('id', matchId)
      .single()

    if (!match || !match.next_match_id) {
      console.log('✅ Partido final completado, no hay siguiente ronda')
      return { success: true }
    }

    // 2. Obtener el siguiente partido
    const { data: nextMatch } = await supabase
      .from('matches')
      .select('team_a_id, team_b_id')
      .eq('id', match.next_match_id)
      .single()

    if (!nextMatch) {
      return { success: false, error: 'No se encontró el siguiente partido' }
    }

    // 3. Asignar ganador al slot disponible
    let updateData: { team_a_id: string } | { team_b_id: string } | null = null
    
    if (!nextMatch.team_a_id) {
      updateData = { team_a_id: winnerTeamId }
      console.log('📍 Asignando ganador a team_a')
    } else if (!nextMatch.team_b_id) {
      updateData = { team_b_id: winnerTeamId }
      console.log('📍 Asignando ganador a team_b')
    } else {
      console.warn('⚠️ Ambos slots ocupados')
      return { success: false, error: 'El siguiente partido ya tiene ambos equipos' }
    }

    const { error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', match.next_match_id)

    if (error) throw error

    console.log('✅ Ganador avanzado:', winnerTeamId, '→', match.next_match_id)
    return { success: true }
  } catch (err) {
    console.error('❌ advanceKnockoutWinner - Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al avanzar ganador',
    }
  }
}