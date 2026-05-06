// src/actions/players.ts
'use server'

import { revalidatePath } from 'next/cache'
import {
  // CRUD Jugadores
  getPlayersByTeam,
  getPlayersByTeamId,
  createPlayer,
  createPlayersBulk,
  updatePlayer,
  deletePlayer,
  
  // Configuración de Torneo
  getTournamentConfig,
  createTournamentConfig,
  updateTournamentConfig,
  
  // Pagos
  registerPlayerPayment,
  getPlayerPayments,
  getPaymentsByTournament,
  getPaymentsByTeam,
  getPaymentSummaryByTournament,
  
  // Suspensiones
  createPlayerSuspension,
  resolvePlayerSuspension,
  decrementSuspensionMatches,
  getActiveSuspensions,
  getSuspensionsByPlayer,
  
  // Elegibilidad
  getPlayerEligibility,
  getTeamEligibility,
  checkMatchEligibility,
  getTeamPaymentSummary,
  
  // Utilidades
  updatePlayerCards,
  getPlayersEligibilityReport,
} from '@/services/players.service'

// ============================================
// CRUD JUGADORES (EXISTENTE)
// ============================================

export async function getPlayersByTeamAction(teamId: string) {
  try {
    const players = await getPlayersByTeam(teamId)
    return { success: true, data: players }
  } catch (err) {
    console.error('❌ getPlayersByTeamAction:', err)
    return { success: false, error: 'Error al cargar jugadores' }
  }
}

export async function getPlayersByTeamIdAction(teamId: string) {
  try {
    const players = await getPlayersByTeamId(teamId)
    return { success: true, data: players }
  } catch (err) {
    console.error('❌ getPlayersByTeamIdAction:', err)
    return { success: false, error: 'Error al cargar jugadores' }
  }
}

export async function createPlayerAction(playerData: {
  team_id: string
  full_name: string
  section: string
  is_captain?: boolean
}) {
  try {
    const data = {
      team_id: playerData.team_id,
      full_name: playerData.full_name,
      section: playerData.section,
      is_captain: Boolean(playerData.is_captain),
    }

    const result = await createPlayer(data)
    
    if (result.success) {
      revalidatePath('/admin/teams')
      revalidatePath('/admin/teams/[id]')
      revalidatePath('/admin/players')
    }
    
    return result
  } catch (err) {
    console.error('❌ createPlayerAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear jugador',
    }
  }
}

export async function createPlayersBulkAction(playersData: Array<{
  team_id: string
  full_name: string
  section: string
}>) {
  try {
    const result = await createPlayersBulk(playersData)
    
    if (result.success) {
      revalidatePath('/admin/teams')
      revalidatePath('/admin/teams/[id]')
      revalidatePath('/admin/players')
    }
    
    return result
  } catch (err) {
    console.error('❌ createPlayersBulkAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear jugadores',
    }
  }
}

export async function updatePlayerAction(
  id: string,
  updates: {
    full_name?: string
    section?: string
    is_captain?: boolean
    is_suspended?: boolean
    is_blocked?: boolean
    has_paid_inscription?: boolean
    suspension_matches_remaining?: number
    total_yellow_cards?: number
    total_red_cards?: number
  }
) {
  try {
    const result = await updatePlayer(id, updates)
    
    if (result.success) {
      revalidatePath('/admin/teams')
      revalidatePath('/admin/teams/[id]')
      revalidatePath('/admin/players')
    }
    
    return result
  } catch (err) {
    console.error('❌ updatePlayerAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar jugador',
    }
  }
}

export async function deletePlayerAction(id: string) {
  try {
    const result = await deletePlayer(id)
    
    if (result.success) {
      revalidatePath('/admin/teams')
      revalidatePath('/admin/teams/[id]')
      revalidatePath('/admin/players')
    }
    
    return result
  } catch (err) {
    console.error('❌ deletePlayerAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar jugador',
    }
  }
}

// ============================================
// ✅ CONFIGURACIÓN DE TORNEO
// ============================================

export async function getTournamentConfigAction(tournamentId: string) {
  try {
    const config = await getTournamentConfig(tournamentId)
    return { success: true, data: config }
  } catch (err) {
    console.error('❌ getTournamentConfigAction:', err)
    return { success: false, error: 'Error al cargar configuración' }
  }
}

export async function createTournamentConfigAction(
  tournamentId: string,
  config: {
    inscription_fee: number
    yellow_card_fee: number
    red_card_fee: number
    red_card_suspension_matches: number
    min_players_to_play: number
    forfeit_score_a?: number
    forfeit_score_b?: number
  }
) {
  try {
    const result = await createTournamentConfig(tournamentId, config)
    
    if (result.success) {
      revalidatePath(`/admin/tournaments/${tournamentId}`)
      revalidatePath('/admin/tournaments')
    }
    
    return result
  } catch (err) {
    console.error('❌ createTournamentConfigAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear configuración',
    }
  }
}

export async function updateTournamentConfigAction(
  tournamentId: string,
  config: Partial<{
    inscription_fee: number
    yellow_card_fee: number
    red_card_fee: number
    red_card_suspension_matches: number
    min_players_to_play: number
    forfeit_score_a: number
    forfeit_score_b: number
  }>
) {
  try {
    const result = await updateTournamentConfig(tournamentId, config)
    
    if (result.success) {
      revalidatePath(`/admin/tournaments/${tournamentId}`)
      revalidatePath('/admin/tournaments')
    }
    
    return result
  } catch (err) {
    console.error('❌ updateTournamentConfigAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar configuración',
    }
  }
}

// ============================================
// ✅ PAGOS DE JUGADORES
// ============================================

export async function registerPlayerPaymentAction(
  payment: {
    tournament_id: string
    player_id: string
    team_id: string
    payment_type: 'inscription' | 'yellow_card' | 'red_card'
    amount: number
    payment_method: 'cash' | 'transfer' | 'sinpe'
    match_id?: string
    notes?: string
  }
) {
  try {
    const result = await registerPlayerPayment(payment)
    
    if (result.success) {
      revalidatePath('/admin/players')
      revalidatePath(`/admin/tournaments/${payment.tournament_id}`)
      revalidatePath(`/admin/teams/${payment.team_id}`)
    }
    
    return result
  } catch (err) {
    console.error('❌ registerPlayerPaymentAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al registrar pago',
    }
  }
}

export async function getPlayerPaymentsAction(
  playerId: string,
  tournamentId: string
) {
  try {
    const payments = await getPlayerPayments(playerId, tournamentId)
    return { success: true, data: payments }
  } catch (err) {
    console.error('❌ getPlayerPaymentsAction:', err)
    return { success: false, error: 'Error al cargar pagos del jugador' }
  }
}

export async function getPaymentsByTournamentAction(tournamentId: string) {
  try {
    const payments = await getPaymentsByTournament(tournamentId)
    return { success: true, data: payments }
  } catch (err) {
    console.error('❌ getPaymentsByTournamentAction:', err)
    return { success: false, error: 'Error al cargar pagos del torneo' }
  }
}

export async function getPaymentsByTeamAction(
  teamId: string,
  tournamentId: string
) {
  try {
    const payments = await getPaymentsByTeam(teamId, tournamentId)
    return { success: true, data: payments }
  } catch (err) {
    console.error('❌ getPaymentsByTeamAction:', err)
    return { success: false, error: 'Error al cargar pagos del equipo' }
  }
}

export async function getPaymentSummaryByTournamentAction(tournamentId: string) {
  try {
    const summary = await getPaymentSummaryByTournament(tournamentId)
    return { success: true, data: summary }
  } catch (err) {
    console.error('❌ getPaymentSummaryByTournamentAction:', err)
    return { success: false, error: 'Error al cargar resumen financiero' }
  }
}

// ============================================
// ✅ SUSPENSIONES DE JUGADORES
// ============================================

export async function createPlayerSuspensionAction(
  suspension: {
    tournament_id: string
    player_id: string
    team_id: string
    suspension_type: 'red_card' | 'admin'
    reason?: string
    matches_suspended: number
    match_id?: string
  }
) {
  try {
    const result = await createPlayerSuspension(suspension)
    
    if (result.success) {
      revalidatePath('/admin/players')
      revalidatePath('/admin/sanctions')
      revalidatePath(`/admin/tournaments/${suspension.tournament_id}`)
    }
    
    return result
  } catch (err) {
    console.error('❌ createPlayerSuspensionAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear suspensión',
    }
  }
}

export async function resolvePlayerSuspensionAction(
  suspensionId: string,
  playerId: string
) {
  try {
    const result = await resolvePlayerSuspension(suspensionId, playerId)
    
    if (result.success) {
      revalidatePath('/admin/players')
      revalidatePath('/admin/sanctions')
    }
    
    return result
  } catch (err) {
    console.error('❌ resolvePlayerSuspensionAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al resolver suspensión',
    }
  }
}

export async function decrementSuspensionMatchesAction(playerId: string) {
  try {
    const result = await decrementSuspensionMatches(playerId)
    
    if (result.success) {
      revalidatePath('/admin/players')
      revalidatePath('/admin/sanctions')
    }
    
    return result
  } catch (err) {
    console.error('❌ decrementSuspensionMatchesAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar suspensión',
    }
  }
}

export async function getActiveSuspensionsAction(tournamentId: string) {
  try {
    const suspensions = await getActiveSuspensions(tournamentId)
    return { success: true, data: suspensions }
  } catch (err) {
    console.error('❌ getActiveSuspensionsAction:', err)
    return { success: false, error: 'Error al cargar suspensiones' }
  }
}

export async function getSuspensionsByPlayerAction(
  playerId: string,
  tournamentId: string
) {
  try {
    const suspensions = await getSuspensionsByPlayer(playerId, tournamentId)
    return { success: true, data: suspensions }
  } catch (err) {
    console.error('❌ getSuspensionsByPlayerAction:', err)
    return { success: false, error: 'Error al cargar suspensiones del jugador' }
  }
}

// ============================================
// ✅ ELEGIBILIDAD PARA JUGAR
// ============================================

export async function getPlayerEligibilityAction(
  playerId: string,
  tournamentId: string
) {
  try {
    const eligibility = await getPlayerEligibility(playerId, tournamentId)
    return { success: true, data: eligibility }
  } catch (err) {
    console.error('❌ getPlayerEligibilityAction:', err)
    return { success: false, error: 'Error al verificar elegibilidad del jugador' }
  }
}

export async function getTeamEligibilityAction(
  teamId: string,
  tournamentId: string
) {
  try {
    const eligibility = await getTeamEligibility(teamId, tournamentId)
    return { success: true, data: eligibility }
  } catch (err) {
    console.error('❌ getTeamEligibilityAction:', err)
    return { success: false, error: 'Error al verificar elegibilidad del equipo' }
  }
}

export async function checkMatchEligibilityAction(
  teamAId: string,
  teamBId: string,
  tournamentId: string
) {
  try {
    const result = await checkMatchEligibility(teamAId, teamBId, tournamentId)
    return { success: true, data: result }
  } catch (err) {
    console.error('❌ checkMatchEligibilityAction:', err)
    return { success: false, error: 'Error al verificar elegibilidad del partido' }
  }
}

export async function getTeamPaymentSummaryAction(
  teamId: string,
  tournamentId: string
) {
  try {
    const summary = await getTeamPaymentSummary(teamId, tournamentId)
    return { success: true, data: summary }
  } catch (err) {
    console.error('❌ getTeamPaymentSummaryAction:', err)
    return { success: false, error: 'Error al cargar resumen de pagos del equipo' }
  }
}

// ============================================
// ✅ UTILIDADES
// ============================================

export async function updatePlayerCardsAction(
  playerId: string,
  cardType: 'yellow' | 'red',
  increment: boolean = true
) {
  try {
    const result = await updatePlayerCards(playerId, cardType, increment)
    
    if (result.success) {
      revalidatePath('/admin/players')
      revalidatePath('/admin/matches')
    }
    
    return result
  } catch (err) {
    console.error('❌ updatePlayerCardsAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar tarjetas',
    }
  }
}

export async function getPlayersEligibilityReportAction(tournamentId: string) {
  try {
    const report = await getPlayersEligibilityReport(tournamentId)
    return { success: true, data: report }
  } catch (err) {
    console.error('❌ getPlayersEligibilityReportAction:', err)
    return { success: false, error: 'Error al generar reporte de elegibilidad' }
  }
}

// ============================================
// ✅ ACCIONES COMBINADAS (Para flujos comunes)
// ============================================

/**
 * Registrar tarjeta amarilla + cobrar multa + actualizar contador
 */
export async function registerYellowCardAction(
  tournamentId: string,
  playerId: string,
  teamId: string,
  matchId?: string,
  paymentMethod: 'cash' | 'transfer' | 'sinpe' = 'cash'
) {
  try {
    // 1. Obtener configuración para monto correcto
    const config = await getTournamentConfig(tournamentId)
    const fee = config?.yellow_card_fee ?? 1000
    
    // 2. Registrar pago de multa
    const paymentResult = await registerPlayerPayment({
      tournament_id: tournamentId,
      player_id: playerId,
      team_id: teamId,
      payment_type: 'yellow_card',
      amount: fee,
      payment_method: paymentMethod,
      match_id: matchId,
      notes: 'Multa por tarjeta amarilla',
    })
    
    if (!paymentResult.success) {
      return paymentResult
    }
    
    // 3. Actualizar contador de tarjetas (NO suspende por amarilla)
    await updatePlayerCards(playerId, 'yellow', true)
    
    // 4. Revalidar rutas
    revalidatePath('/admin/players')
    revalidatePath('/admin/matches')
    revalidatePath(`/admin/tournaments/${tournamentId}`)
    
    return { 
      success: true, 
      message: 'Tarjeta amarilla registrada y multa cobrada',
      data: paymentResult.payment 
    }
  } catch (err) {
    console.error('❌ registerYellowCardAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al registrar tarjeta amarilla',
    }
  }
}

/**
 * Registrar tarjeta roja + cobrar multa + crear suspensión + actualizar contador
 */
export async function registerRedCardAction(
  tournamentId: string,
  playerId: string,
  teamId: string,
  matchId?: string,
  paymentMethod: 'cash' | 'transfer' | 'sinpe' = 'cash'
) {
  try {
    // 1. Obtener configuración
    const config = await getTournamentConfig(tournamentId)
    const fee = config?.red_card_fee ?? 2000
    const suspensionMatches = config?.red_card_suspension_matches ?? 1
    
    // 2. Registrar pago de multa
    const paymentResult = await registerPlayerPayment({
      tournament_id: tournamentId,
      player_id: playerId,
      team_id: teamId,
      payment_type: 'red_card',
      amount: fee,
      payment_method: paymentMethod,
      match_id: matchId,
      notes: 'Multa por tarjeta roja',
    })
    
    if (!paymentResult.success) {
      return paymentResult
    }
    
    // 3. Crear suspensión automática (1 partido por defecto)
    const suspensionResult = await createPlayerSuspension({
      tournament_id: tournamentId,
      player_id: playerId,
      team_id: teamId,
      suspension_type: 'red_card',
      reason: 'Tarjeta roja directa',
      matches_suspended: suspensionMatches,
      match_id: matchId,
    })
    
    if (!suspensionResult.success) {
      return suspensionResult
    }
    
    // 4. Actualizar contador de tarjetas rojas
    await updatePlayerCards(playerId, 'red', true)
    
    // 5. Revalidar rutas
    revalidatePath('/admin/players')
    revalidatePath('/admin/matches')
    revalidatePath('/admin/sanctions')
    revalidatePath(`/admin/tournaments/${tournamentId}`)
    
    return { 
      success: true, 
      message: `Tarjeta roja registrada, multa cobrada y suspensión de ${suspensionMatches} partido(s) aplicada`,
      data: { 
        payment: paymentResult.payment,
        suspension: suspensionResult.suspension 
      }
    }
  } catch (err) {
    console.error('❌ registerRedCardAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al registrar tarjeta roja',
    }
  }
}

/**
 * Verificar elegibilidad y aplicar forfeit si es necesario
 */
export async function processMatchStartAction(
  matchId: string,
  teamAId: string,
  teamBId: string,
  tournamentId: string
) {
  try {
    // 1. Verificar elegibilidad de ambos equipos
    const eligibility = await checkMatchEligibility(teamAId, teamBId, tournamentId)
    
    if (!eligibility) {
      return { success: false, error: 'Error al verificar elegibilidad' }
    }
    
    // 2. Si hay forfeit, actualizar marcador del partido
    if (eligibility.forfeit && eligibility.forfeit.winner !== 'none') {
      const [scoreA, scoreB] = eligibility.forfeit.score.split('-').map(Number)
      
      const { error } = await supabase
        .from('matches')
        .update({
          score_a: scoreA,
          score_b: scoreB,
          status: 'finished',
          notes: `Forfeit: ${eligibility.forfeit.reason}`,
        })
        .eq('id', matchId)
      
      if (error) {
        return { success: false, error: 'Error al aplicar forfeit' }
      }
      
      revalidatePath('/admin/matches')
      revalidatePath(`/admin/tournaments/${tournamentId}`)
      
      return {
        success: true,
        forfeit: true,
        message: `Partido finalizado por forfeit: ${eligibility.forfet.score}`,
        data: eligibility,
      }
    }
    
    // 3. Si ambos equipos pueden jugar, permitir inicio normal
    if (eligibility.can_play) {
      return {
        success: true,
        forfeit: false,
        message: 'Partido autorizado para inicio',
        data: eligibility,
      }
    }
    
    // 4. Caso edge: ambos equipos sin jugadores elegibles
    return {
      success: false,
      error: 'Ambos equipos no tienen jugadores elegibles para jugar',
      data: eligibility,
    }
    
  } catch (err) {
    console.error('❌ processMatchStartAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al procesar inicio de partido',
    }
  }
}