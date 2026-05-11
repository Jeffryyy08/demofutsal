// src/actions/players.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
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
  getFeeSettings,

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
// CRUD JUGADORES
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
// CONFIGURACIÓN DE TORNEO
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
// PAGOS DE JUGADORES
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
// SUSPENSIONES DE JUGADORES - CORREGIDAS
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
  console.log('🔥 [ACTION] createPlayerSuspensionAction INICIADO:', {
    player_id: suspension.player_id,
    tournament_id: suspension.tournament_id,
    suspension_type: suspension.suspension_type
  })
  const supabase = await createClient()

  try {
    // 1. Crear suspensión en player_suspensions
    const result = await createPlayerSuspension({
      ...suspension,
      is_active: true,
    })
    console.log('✅ [ACTION] Resultado de createPlayerSuspension:', {
      success: result.success,
      error: result.error,
      suspension_id: result.suspension?.id
    })

    if (!result.success) {
      return result
    }


    // 2. ACTUALIZAR JUGADOR: marcar como suspendido y actualizar contadores
    if (suspension.player_id) {
      const config = await getTournamentConfig(suspension.tournament_id)
      const matchesToSuspend = config?.red_card_suspension_matches || 1

      // ✅ Leer el valor actual primero
      const { data: player } = await supabase
        .from('players')
        .select('total_red_cards')
        .eq('id', suspension.player_id)
        .single()

      const currentRedCards = player?.total_red_cards || 0

      // ✅ Actualizar con el nuevo valor
      const { error: playerError } = await supabase
        .from('players')
        .update({
          is_suspended: true,
          suspension_matches_remaining: matchesToSuspend,
          suspension_reason: suspension.reason || 'Suspensión automática',
          total_red_cards: currentRedCards + 1,  // ✅ Incremento manual
        })
        .eq('id', suspension.player_id)

      if (playerError) {
        console.error('❌ Error al actualizar jugador:', playerError)
      }
    }

    // 3. Revalidar rutas
    revalidatePath('/admin/players')
    revalidatePath('/admin/sanctions')
    revalidatePath(`/admin/tournaments/${suspension.tournament_id}`)

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
  const supabase = await createClient()

  try {
    // 1. Marcar suspensión como resuelta
    const result = await resolvePlayerSuspension(suspensionId, playerId)

    if (!result.success) {
      return result
    }

    // 2. ACTUALIZAR JUGADOR: quitar suspensión
    if (playerId) {
      await supabase
        .from('players')
        .update({
          is_suspended: false,
          suspension_matches_remaining: 0,
          suspension_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', playerId)
    }

    // 3. Revalidar rutas
    revalidatePath('/admin/players')
    revalidatePath('/admin/sanctions')

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
  const supabase = await createClient()

  try {
    // 1. Obtener suspensión activa del jugador
    const { data: suspension } = await supabase
      .from('player_suspensions')
      .select('id, matches_remaining, player_id')
      .eq('player_id', playerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!suspension) {
      return { success: false, error: 'No hay suspensión activa' }
    }

    const newRemaining = (suspension.matches_remaining || 1) - 1

    // 2. Actualizar suspensión
    if (newRemaining <= 0) {
      // Suspensión completada → resolver automáticamente
      await supabase
        .from('player_suspensions')
        .update({
          is_active: false,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', suspension.id)

      // Quitar suspensión del jugador
      await supabase
        .from('players')
        .update({
          is_suspended: false,
          suspension_matches_remaining: 0,
          suspension_reason: null,
        })
        .eq('id', playerId)
    } else {
      // Solo decrementar contador
      await supabase
        .from('player_suspensions')
        .update({ matches_remaining: newRemaining })
        .eq('id', suspension.id)

      await supabase
        .from('players')
        .update({ suspension_matches_remaining: newRemaining })
        .eq('id', playerId)
    }

    // 3. Revalidar rutas
    revalidatePath('/admin/players')
    revalidatePath('/admin/sanctions')

    return { success: true }
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
// ELEGIBILIDAD PARA JUGAR
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
// UTILIDADES
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
// ACCIONES COMBINADAS (Para flujos comunes)
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
    const fee = await getFeeSettings('yellow_card')

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
 * Registrar tarjeta roja + cobrar multa + crear suspensión + actualizar jugador
 * ✅ CORREGIDO: Usa getFeeSettings en lugar de getTournamentConfig
 */
export async function registerRedCardAction(
  tournamentId: string,
  playerId: string,
  teamId: string,
  matchId?: string,
  paymentMethod: 'cash' | 'transfer' | 'sinpe' = 'cash'
) {
  const supabase = await createClient()

  try {
    // ✅ 1. Obtener monto de fee_settings (NO tournament_settings)
    const fee = await getFeeSettings('red_card')
    const suspensionMatches = 1  // Default, o puedes hacerlo configurable

    // 2. Registrar pago de multa (paid_at: null = pendiente)
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

    // 3. Crear suspensión AUTOMÁTICA con is_active: true
    const suspensionResult = await createPlayerSuspension({
      tournament_id: tournamentId,
      player_id: playerId,
      team_id: teamId,
      suspension_type: 'red_card',
      reason: 'Tarjeta roja directa',
      matches_suspended: suspensionMatches,
      matches_remaining: suspensionMatches,
      match_id: matchId,
      is_active: true,
    })

    if (!suspensionResult.success) {
      return suspensionResult
    }

    // 4. ACTUALIZAR JUGADOR: incrementar contador y marcar como suspendido
    const { data: player } = await supabase
      .from('players')
      .select('total_red_cards')
      .eq('id', playerId)
      .single()

    const currentRedCards = player?.total_red_cards || 0
    await supabase
      .from('players')
      .update({
        total_red_cards: currentRedCards + 1,
        is_suspended: true,
        suspension_matches_remaining: suspensionMatches,
        suspension_reason: 'Tarjeta roja directa',
      })
      .eq('id', playerId)

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
  const supabase = await createClient()

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
        message: `Partido finalizado por forfeit: ${eligibility.forfeit.score}`,
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

/**
 * Pagar inscripción de jugador (pago único, no por torneo)
 */
export async function payPlayerInscriptionAction(
  playerId: string,
  teamId: string,
  amount: number = 1000,  // ₡1,000 CRC por defecto
  paymentMethod: 'cash' | 'transfer' | 'sinpe' = 'cash'
) {
  const supabase = await createClient()

  try {
    console.log('💳 [INSCRIPCIÓN] Procesando pago para jugador:', playerId)

    // 1. Registrar pago en player_payments (sin tournament_id)
    const { data: payment, error: paymentError } = await supabase
      .from('player_payments')
      .insert({
        player_id: playerId,
        team_id: teamId,
        payment_type: 'inscription',
        amount: amount,
        payment_method: paymentMethod,
        notes: 'Inscripción al torneo - Pago único por categoría',
        paid_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (paymentError) {
      console.error('❌ Error al registrar pago:', paymentError)
      throw paymentError
    }

    // 2. Marcar jugador como que pagó inscripción
    const { error: playerError } = await supabase
      .from('players')
      .update({
        has_paid_inscription: true,
        inscription_paid_at: new Date().toISOString(),
        // ✅ Removido: updated_at (no existe en la tabla)
      })
      .eq('id', playerId)

    if (playerError) {
      console.error('❌ Error al actualizar jugador:', playerError)
      throw playerError
    }

    console.log('✅ [INSCRIPCIÓN] Pago registrado y jugador actualizado')

    // 3. Revalidar rutas
    revalidatePath('/admin/teams')
    revalidatePath('/admin/teams/[id]')

    return {
      success: true,
      message: 'Inscripción registrada correctamente',
      payment
    }
  } catch (err) {
    console.error('❌ Excepción en payPlayerInscriptionAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al registrar pago de inscripción',
    }
  }
}

// ============================================
// ✅ PAGO DE MULTAS DE TARJETAS (Desde sanciones) - CORREGIDO
// ============================================

/**
 * Pagar multa pendiente de tarjeta amarilla o roja desde la página de sanciones
 * ✅ CORREGIDO: Actualiza el registro existente en lugar de crear uno nuevo
 */
export async function payCardFineAction(
  playerId: string,
  teamId: string,
  tournamentId: string,
  cardType: 'yellow_card' | 'red_card'
) {
  const supabase = await createClient()

  try {
    console.log('💳 [MULTA] Procesando pago de multa para jugador:', playerId, cardType)

    // 1. Obtener monto de fee_settings (para validación)
    const expectedAmount = await getFeeSettings(cardType)

    // 2. ✅ BUSCAR el registro de pago PENDIENTE existente
    const { data: pendingPayment, error: findError } = await supabase
      .from('player_payments')
      .select('id, amount')
      .eq('player_id', playerId)
      .eq('tournament_id', tournamentId)
      .eq('payment_type', cardType)
      .is('paid_at', null)  // Solo pagos NO realizados
      .single()

    if (findError || !pendingPayment) {
      console.error('❌ No se encontró multa pendiente para pagar')
      return {
        success: false,
        error: 'No se encontró multa pendiente para este jugador'
      }
    }

    // ✅ Validar monto (opcional, para seguridad)
    if (pendingPayment.amount !== expectedAmount) {
      console.warn('⚠️ Monto diferente al esperado:', {
        esperado: expectedAmount,
        registrado: pendingPayment.amount
      })
    }

    // 3. ✅ ACTUALIZAR el registro existente para marcar como pagado
    const { error: updateError } = await supabase
      .from('player_payments')
      .update({
        paid_at: new Date().toISOString(),
        payment_method: 'cash',  // o el método que prefieras
        notes: `Multa pagada: ${cardType === 'yellow_card' ? 'tarjeta amarilla' : 'tarjeta roja'}`,
      })
      .eq('id', pendingPayment.id)

    if (updateError) {
      console.error('❌ Error al actualizar pago:', updateError)
      throw updateError
    }

    console.log('✅ [MULTA] Multa marcada como pagada:', pendingPayment.id)

    // 4. Revalidar rutas para actualizar UI
    revalidatePath('/admin/sanctions')
    revalidatePath('/admin/players')
    revalidatePath(`/admin/tournaments/${tournamentId}`)

    return {
      success: true,
      message: `Multa de ${cardType === 'yellow_card' ? 'tarjeta amarilla' : 'tarjeta roja'} pagada correctamente`,
    }
  } catch (err) {
    console.error('❌ Excepción en payCardFineAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al pagar multa',
    }
  }
}