// src/services/players.service.ts
import { supabase } from '@/lib/supabase'
import {
  Player,
  PlayerPayment,
  PlayerSuspension,
  TournamentConfig,
  PlayerEligibility,
  TeamEligibilityCheck,
  MatchEligibilityResult,
  TournamentFinancialSummary,
  TeamPaymentSummary
} from '@/types'

// ============================================
// CONFIGURACIÓN DEL TORNEO
// ============================================
// ============================================
// ✅ CONFIGURACIÓN DE TASAS (FEE SETTINGS)
// ============================================

export async function getFeeSettings(feeType: 'inscription' | 'yellow_card' | 'red_card' | 'suspension'): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('fee_settings')
      .select('amount')
      .eq('fee_type', feeType)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      // Valores por defecto si no existe
      const defaults = {
        inscription: 1000,
        yellow_card: 1000,
        red_card: 2000,
        suspension: 1000,
      }
      return defaults[feeType] || 1000
    }

    return Number(data.amount)
  } catch (err) {
    console.error('❌ Error al obtener fee_settings:', err)
    return feeType === 'yellow_card' ? 1000 : 2000
  }
}

export async function getTournamentConfig(tournamentId: string): Promise<TournamentConfig | null> {
  const { data, error } = await supabase
    .from('tournament_settings')  // ✅ Usar tabla existente
    .select('*')
    .eq('tournament_id', tournamentId)
    .single()

  if (error && error.code !== 'PGRST116') throw error  // PGRST116 = no rows
  return data
}

export async function createTournamentConfig(
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
): Promise<{ success: boolean; config?: TournamentConfig; error?: string }> {
  try {
    // Verificar si ya existe configuración
    const existing = await getTournamentConfig(tournamentId)

    if (existing) {
      // Actualizar existente
      const { data, error } = await supabase
        .from('tournament_settings')
        .update({
          ...config,
          forfeit_score_a: config.forfeit_score_a ?? 0,
          forfeit_score_b: config.forfeit_score_b ?? 3,
          updated_at: new Date().toISOString(),
        })
        .eq('tournament_id', tournamentId)
        .select()
        .single()

      if (error) throw error
      return { success: true, config: data }
    }

    // Crear nueva
    const { data, error } = await supabase
      .from('tournament_settings')
      .insert({
        tournament_id: tournamentId,
        ...config,
        forfeit_score_a: config.forfeit_score_a ?? 0,
        forfeit_score_b: config.forfeit_score_b ?? 3,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, config: data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear configuración',
    }
  }
}

export async function updateTournamentConfig(
  tournamentId: string,
  config: Partial<TournamentConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('tournament_settings')
      .update({
        ...config,
        updated_at: new Date().toISOString(),
      })
      .eq('tournament_id', tournamentId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar configuración',
    }
  }
}

// ============================================
// JUGADORES - CRUD BÁSICO
// ============================================

export async function getPlayersByTeam(teamId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPlayersByTeamId(teamId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('full_name')

  if (error) throw error
  return data || []
}

export async function createPlayer(playerData: {
  team_id: string
  full_name: string
  section: string
  is_captain?: boolean
}): Promise<{ success: boolean; player?: Player; error?: string }> {
  try {
    // Si es capitán, quitar capitán de otros jugadores del mismo equipo
    if (playerData.is_captain) {
      await supabase
        .from('players')
        .update({ is_captain: false })
        .eq('team_id', playerData.team_id)
    }

    const { data, error } = await supabase
      .from('players')
      .insert({
        team_id: playerData.team_id,
        full_name: playerData.full_name.trim(),
        section: playerData.section.trim(),
        is_captain: playerData.is_captain || false,
        has_paid_inscription: false,
        is_suspended: false,
        suspension_matches_remaining: 0,
        total_yellow_cards: 0,
        total_red_cards: 0,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, player: data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear jugador',
    }
  }
}

export async function createPlayersBulk(playersData: Array<{
  team_id: string
  full_name: string
  section: string
}>): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('players')
      .insert(
        playersData.map(p => ({
          team_id: p.team_id,
          full_name: p.full_name.trim(),
          section: p.section.trim(),
          is_captain: false,
          // ✅ Valores por defecto
          has_paid_inscription: false,
          is_suspended: false,
          suspension_matches_remaining: 0,
          total_yellow_cards: 0,
          total_red_cards: 0,
        }))
      )
      .select()

    if (error) throw error
    return { success: true, count: data?.length || 0 }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear jugadores',
    }
  }
}

export async function updatePlayer(
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
): Promise<{ success: boolean; error?: string }> {
  try {
    // Si es capitán, quitar capitán de otros jugadores del mismo equipo
    if (updates.is_captain) {
      const { data: player } = await supabase
        .from('players')
        .select('team_id')
        .eq('id', id)
        .single()

      if (player) {
        await supabase
          .from('players')
          .update({ is_captain: false })
          .eq('team_id', player.team_id)
          .neq('id', id)
      }
    }

    const { error } = await supabase
      .from('players')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar jugador',
    }
  }
}

export async function deletePlayer(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar jugador',
    }
  }
}

// ============================================
// ✅ PAGOS DE JUGADORES
// ============================================

export async function registerPlayerPayment(
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
): Promise<{ success: boolean; payment?: PlayerPayment; error?: string }> {
  try {
    // ✅ Obtener monto esperado de fee_settings (no tournament_settings)
    const expectedAmount = await getFeeSettings(payment.payment_type)

    // Registrar el pago
    const { data, error } = await supabase
      .from('player_payments')
      .insert({
        tournament_id: payment.tournament_id,
        player_id: payment.player_id,
        team_id: payment.team_id,
        payment_type: payment.payment_type,
        amount: payment.amount,
        payment_method: payment.payment_method,
        match_id: payment.match_id,
        notes: payment.notes,
      })
      .select()
      .single()

    if (error) throw error

    // Si es inscripción, actualizar estado del jugador
    if (payment.payment_type === 'inscription') {
      await supabase
        .from('players')
        .update({
          has_paid_inscription: true,
          inscription_paid_at: new Date().toISOString(),
        })
        .eq('id', payment.player_id)
    }

    // Si es tarjeta, actualizar contador
    if (payment.payment_type === 'yellow_card') {
      const { data: yellowPlayer } = await supabase
        .from('players')
        .select('total_yellow_cards')
        .eq('id', payment.player_id)
        .single()

      const currentYellowCards = yellowPlayer?.total_yellow_cards || 0

      await supabase
        .from('players')
        .update({
          total_yellow_cards: currentYellowCards + 1
        })
        .eq('id', payment.player_id)
    }

    if (payment.payment_type === 'red_card') {
      const { data: redPlayer } = await supabase
        .from('players')
        .select('total_red_cards')
        .eq('id', payment.player_id)
        .single()

      const currentRedCards = redPlayer?.total_red_cards || 0

      await supabase
        .from('players')
        .update({
          total_red_cards: currentRedCards + 1
        })
        .eq('id', payment.player_id)
    }

    return { success: true, payment: data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al registrar pago',
    }
  }
}

export async function getPlayerPayments(
  playerId: string,
  tournamentId: string
): Promise<PlayerPayment[]> {
  const { data, error } = await supabase
    .from('player_payments')
    .select(`
      *,
      player:player_id (full_name),
      team:team_id (name)
    `)
    .eq('player_id', playerId)
    .eq('tournament_id', tournamentId)
    .order('paid_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPaymentsByTournament(tournamentId: string): Promise<PlayerPayment[]> {
  const { data, error } = await supabase
    .from('player_payments')
    .select(`
      *,
      player:player_id (full_name),
      team:team_id (name, section)
    `)
    .eq('tournament_id', tournamentId)
    .order('paid_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPaymentsByTeam(
  teamId: string,
  tournamentId: string
): Promise<PlayerPayment[]> {
  const { data, error } = await supabase
    .from('player_payments')
    .select(`
      *,
      player:player_id (full_name)
    `)
    .eq('team_id', teamId)
    .eq('tournament_id', tournamentId)
    .order('paid_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPaymentSummaryByTournament(
  tournamentId: string
): Promise<TournamentFinancialSummary | null> {
  // Obtener configuración
  const config = await getTournamentConfig(tournamentId)

  // Obtener todos los pagos del torneo
  const { data: payments } = await supabase
    .from('player_payments')
    .select('payment_type, amount')
    .eq('tournament_id', tournamentId)

  // Obtener jugadores del torneo (vía tournament_teams)
  const { data: tournamentTeams } = await supabase
    .from('tournament_teams')
    .select('team_id')
    .eq('tournament_id', tournamentId)

  const teamIds = tournamentTeams?.map(t => t.team_id) || []

  // Obtener todos los jugadores de esos equipos
  const { data: players } = await supabase
    .from('players')
    .select('id, full_name, has_paid_inscription')
    .in('team_id', teamIds)

  // Calcular resumen
  const totalPlayers = players?.length || 0
  const playersPaid = players?.filter(p => p.has_paid_inscription).length || 0

  const inscriptionTotal = payments?.filter(p => p.payment_type === 'inscription').reduce((sum, p) => sum + p.amount, 0) || 0
  const yellowTotal = payments?.filter(p => p.payment_type === 'yellow_card').reduce((sum, p) => sum + p.amount, 0) || 0
  const redTotal = payments?.filter(p => p.payment_type === 'red_card').reduce((sum, p) => sum + p.amount, 0) || 0

  // Obtener suspensiones activas
  const { count: activeSuspensions } = await supabase
    .from('player_suspensions')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .eq('is_active', true)

  return {
    tournament_id: tournamentId,
    tournament_name: '',  // Se puede llenar con join si se necesita
    total_players: totalPlayers,
    players_paid_inscription: playersPaid,
    players_pending_inscription: totalPlayers - playersPaid,
    total_inscription_collected: inscriptionTotal,
    total_yellow_fees_collected: yellowTotal,
    total_red_fees_collected: redTotal,
    total_collected: inscriptionTotal + yellowTotal + redTotal,
    active_suspensions: activeSuspensions || 0,
    last_updated: new Date().toISOString(),
  }
}

// ============================================
// ✅ SUSPENSIONES DE JUGADORES
// ============================================

// Busca la función createPlayerSuspension y actualiza el tipo:
export async function createPlayerSuspension(
  suspension: {
    tournament_id: string
    player_id: string
    team_id: string
    suspension_type: 'red_card' | 'admin'
    reason?: string
    matches_suspended: number
    matches_remaining?: number  // ✅ AGREGAR (opcional)
    match_id?: string
    is_active?: boolean  // ✅ AGREGAR (opcional)
  }
): Promise<{ success: boolean; suspension?: PlayerSuspension; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('player_suspensions')
      .insert({
        tournament_id: suspension.tournament_id,
        player_id: suspension.player_id,
        team_id: suspension.team_id,
        suspension_type: suspension.suspension_type,
        reason: suspension.reason,
        matches_suspended: suspension.matches_suspended,
        matches_remaining: suspension.matches_remaining ?? suspension.matches_suspended,  // ✅ Usar matches_suspended si no se proporciona
        match_id: suspension.match_id,
        is_active: suspension.is_active ?? true,  // ✅ Default a true
      })
      .select()
      .single()

    if (error) throw error

    // Actualizar estado del jugador
    await supabase
      .from('players')
      .update({
        is_suspended: true,
        suspension_reason: suspension.reason || 'Tarjeta roja',
        suspension_matches_remaining: suspension.matches_remaining ?? suspension.matches_suspended,
      })
      .eq('id', suspension.player_id)

    return { success: true, suspension: data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear suspensión',
    }
  }
}

export async function resolvePlayerSuspension(
  suspensionId: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Marcar suspensión como resuelta
    await supabase
      .from('player_suspensions')
      .update({
        is_active: false,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', suspensionId)

    // Reactivar jugador
    await supabase
      .from('players')
      .update({
        is_suspended: false,
        suspension_reason: null,
        suspension_matches_remaining: 0,
      })
      .eq('id', playerId)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al resolver suspensión',
    }
  }
}

export async function decrementSuspensionMatches(
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: player } = await supabase
      .from('players')
      .select('suspension_matches_remaining')
      .eq('id', playerId)
      .single()

    if (!player) throw new Error('Jugador no encontrado')

    const newRemaining = Math.max(0, player.suspension_matches_remaining - 1)

    await supabase
      .from('players')
      .update({
        suspension_matches_remaining: newRemaining,
        is_suspended: newRemaining > 0,
      })
      .eq('id', playerId)

    // Si ya no tiene partidos, resolver suspensión
    if (newRemaining <= 0) {
      await supabase
        .from('player_suspensions')
        .update({
          is_active: false,
          resolved_at: new Date().toISOString(),
        })
        .eq('player_id', playerId)
        .eq('is_active', true)
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al decrementar suspensión',
    }
  }
}

export async function getActiveSuspensions(tournamentId: string): Promise<PlayerSuspension[]> {
  const { data, error } = await supabase
    .from('player_suspensions')
    .select(`
      *,
      player:player_id (full_name),
      team:team_id (name, section)
    `)
    .eq('tournament_id', tournamentId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getSuspensionsByPlayer(
  playerId: string,
  tournamentId: string
): Promise<PlayerSuspension[]> {
  const { data, error } = await supabase
    .from('player_suspensions')
    .select('*')
    .eq('player_id', playerId)
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================
// ✅ ELEGIBILIDAD PARA JUGAR
// ============================================

export async function getPlayerEligibility(
  playerId: string,
  tournamentId: string
): Promise<PlayerEligibility | null> {
  // Obtener jugador con datos completos
  const { data: player } = await supabase
    .from('players')
    .select(`*, team:team_id (id, name, section)`)
    .eq('id', playerId)
    .single()

  if (!player) return null

  // ✅ VERIFICAR si tiene multas de tarjetas pendientes de pago
  const { data: unpaidCardFees } = await supabase
    .from('player_payments')
    .select('id, payment_type, amount')
    .eq('player_id', playerId)
    .eq('tournament_id', tournamentId)
    .in('payment_type', ['yellow_card', 'red_card'])
    .is('paid_at', null)  // Solo pagos NO realizados

  // ✅ Asegurar que siempre sea boolean (no null)
  const hasUnpaidFees = (unpaidCardFees?.length || 0) > 0

  // Determinar elegibilidad
  const hasPaid = player.has_paid_inscription ?? false
  const isSuspended = player.is_suspended ?? false

  let isEligible = true
  let ineligibilityReason: string | undefined

  // ✅ PRIORIDAD DE VALIDACIÓN:
  if (!hasPaid && isSuspended) {
    isEligible = false
    ineligibilityReason = 'both'
  } else if (!hasPaid) {
    isEligible = false
    ineligibilityReason = 'no_payment'
  } else if (isSuspended) {
    isEligible = false
    ineligibilityReason = 'suspended'
  } else if (hasUnpaidFees) {
    // ✅ NUEVO: Verificar multas pendientes
    isEligible = false
    ineligibilityReason = 'unpaid_fees'
  }

  return {
    player_id: player.id,
    player_name: player.full_name,
    team_id: player.team_id,
    team_name: player.team?.name || '',
    has_paid_inscription: hasPaid,
    is_suspended: isSuspended,
    suspension_reason: player.suspension_reason,
    suspension_matches_remaining: player.suspension_matches_remaining,
    total_yellow_cards: player.total_yellow_cards,
    total_red_cards: player.total_red_cards,
    is_eligible: isEligible,
    ineligibility_reason: ineligibilityReason,
    // ✅ AGREGAR: Información de multas pendientes
    has_unpaid_card_fees: hasUnpaidFees,
    unpaid_fees_count: unpaidCardFees?.length || 0,
  }
}

export async function getTeamEligibility(
  teamId: string,
  tournamentId: string
): Promise<TeamEligibilityCheck | null> {
  // Obtener configuración
  const config = await getTournamentConfig(tournamentId)
  const minPlayers = config?.min_players_to_play || 5

  // Obtener jugadores del equipo
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)

  if (!players) return null

  // Obtener nombre del equipo
  const { data: team } = await supabase
    .from('teams')
    .select('name, section')
    .eq('id', teamId)
    .single()

  // Clasificar jugadores
  const eligible: PlayerEligibility[] = []
  const ineligible: PlayerEligibility[] = []
  const suspended: PlayerEligibility[] = []

  for (const player of players) {
    const eligibility = await getPlayerEligibility(player.id, tournamentId)
    if (!eligibility) continue

    if (eligibility.is_eligible) {
      eligible.push(eligibility)
    } else {
      ineligible.push(eligibility)
      if (eligibility.ineligibility_reason === 'suspended' || eligibility.ineligibility_reason === 'both') {
        suspended.push(eligibility)
      }
    }
  }

  const canPlay = eligible.length >= minPlayers

  let forfeitInfo: TeamEligibilityCheck['forfeit_info']
  if (!canPlay) {
    forfeitInfo = {
      should_forfeit: true,
      reason: `Solo ${eligible.length} jugadores elegibles (mínimo requerido: ${minPlayers})`,
      score: '0-3',
    }
  }

  // ✅ CORREGIDO: Removido 'section' que no existe en TeamEligibilityCheck
  return {
    team_id: teamId,
    team_name: team?.name || '',
    total_players: players.length,
    eligible_players: eligible.length,
    ineligible_players: ineligible.length,
    can_play: canPlay,
    ineligible_list: ineligible,
    forfeit_info: forfeitInfo,
  }
}

export async function checkMatchEligibility(
  teamAId: string,
  teamBId: string,
  tournamentId: string
): Promise<MatchEligibilityResult | null> {
  const [teamA, teamB] = await Promise.all([
    getTeamEligibility(teamAId, tournamentId),
    getTeamEligibility(teamBId, tournamentId),
  ])

  if (!teamA || !teamB) return null

  const config = await getTournamentConfig(tournamentId)
  const forfeitA = config?.forfeit_score_a ?? 0
  const forfeitB = config?.forfeit_score_b ?? 3

  let forfeit: MatchEligibilityResult['forfeit']

  if (!teamA.can_play && teamB.can_play) {
    forfeit = { winner: 'B', score: `${forfeitA}-${forfeitB}`, reason: teamA.forfeit_info?.reason || 'Incomparecencia' }
  } else if (teamA.can_play && !teamB.can_play) {
    forfeit = { winner: 'A', score: `${forfeitB}-${forfeitA}`, reason: teamB.forfeit_info?.reason || 'Incomparecencia' }
  } else if (!teamA.can_play && !teamB.can_play) {
    forfeit = { winner: 'none', score: '0-0', reason: 'Ambos equipos sin jugadores elegibles' }
  }

  return {
    match_id: '',  // Se puede pasar como parámetro si se necesita
    team_a: teamA,
    team_b: teamB,
    can_play: teamA.can_play && teamB.can_play,
    forfeit,
  }
}

export async function getTeamPaymentSummary(
  teamId: string,
  tournamentId: string
): Promise<TeamPaymentSummary | null> {
  // Obtener jugadores del equipo
  const { data: players } = await supabase
    .from('players')
    .select('id, full_name, has_paid_inscription, is_suspended, suspension_reason, suspension_matches_remaining')
    .eq('team_id', teamId)

  if (!players) return null

  // Obtener nombre del equipo
  const { data: team } = await supabase
    .from('teams')
    .select('name, section')
    .eq('id', teamId)
    .single()

  // Clasificar jugadores
  const paid = players.filter(p => p.has_paid_inscription && !p.is_suspended)
  const pending = players.filter(p => !p.has_paid_inscription)
  const suspended = players.filter(p => p.is_suspended)

  const canPlay = paid.length >= 5  // Default minimum

  return {
    team_id: teamId,
    team_name: team?.name || '',
    section: team?.section || '',
    total_players: players.length,
    players_paid: {
      count: paid.length,
      players: paid.map(p => ({
        id: p.id,
        name: p.full_name,
        paid_at: ''  // Se puede obtener de player_payments si se necesita
      })),
    },
    players_pending: {
      count: pending.length,
      players: pending.map(p => ({ id: p.id, name: p.full_name })),
    },
    suspended_players: {
      count: suspended.length,
      players: suspended.map(p => ({
        id: p.id,
        name: p.full_name,
        reason: p.suspension_reason || '',
        matches_remaining: p.suspension_matches_remaining
      })),
    },
    can_play_next_match: canPlay,
    ineligible_reason: !canPlay ? `Solo ${paid.length} jugadores elegibles` : undefined,
  }
}

// ============================================
// ✅ UTILIDADES
// ============================================

export async function updatePlayerCards(
  playerId: string,
  cardType: 'yellow' | 'red',
  increment: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const field = cardType === 'yellow' ? 'total_yellow_cards' : 'total_red_cards'

    // ✅ Obtener valor actual - CORREGIDO
    const result = await supabase
      .from('players')
      .select(field)
      .eq('id', playerId)
      .single()

    if (!result.data) throw new Error('Jugador no encontrado')

    // ✅ Cast a any para evitar error de TypeScript
    const playerData = result.data as any
    const currentValue = playerData[field] || 0
    const newValue = increment ? currentValue + 1 : Math.max(0, currentValue - 1)

    const { error } = await supabase
      .from('players')
      .update({ [field]: newValue })
      .eq('id', playerId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar tarjetas',
    }
  }
}
export async function getPlayersEligibilityReport(
  tournamentId: string
): Promise<{ teams: TeamEligibilityCheck[]; summary: any }> {
  // Obtener equipos del torneo
  const { data: tournamentTeams } = await supabase
    .from('tournament_teams')
    .select('team_id')
    .eq('tournament_id', tournamentId)

  const teamIds = tournamentTeams?.map(t => t.team_id) || []

  // Obtener elegibilidad de cada equipo
  const teams: TeamEligibilityCheck[] = []
  for (const teamId of teamIds) {
    const eligibility = await getTeamEligibility(teamId, tournamentId)
    if (eligibility) teams.push(eligibility)
  }

  // Resumen
  const summary = {
    total_teams: teams.length,
    teams_ready: teams.filter(t => t.can_play).length,
    teams_not_ready: teams.filter(t => !t.can_play).length,
    total_eligible_players: teams.reduce((sum, t) => sum + t.eligible_players, 0),
    total_ineligible_players: teams.reduce((sum, t) => sum + t.ineligible_players, 0),
  }

  return { teams, summary }
}