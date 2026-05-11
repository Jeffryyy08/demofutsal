// src/services/match-attendance.service.ts
import { supabase } from '@/lib/supabase'

export interface MatchAttendance {
  id: string
  match_id: string
  player_id: string
  team_id: string
  is_present: boolean
  is_eligible: boolean
  checked_in_at: string | null
  player: {
    full_name: string
    is_suspended: boolean
    has_paid_inscription: boolean
  }
}

// ✅ Función helper para normalizar la relación player
function normalizePlayerRelation(data: any[]): MatchAttendance[] {
  return data.map(item => ({
    ...item,
    // ✅ Si player es array, tomar el primer elemento; si no, usarlo directo
    player: Array.isArray(item.player) ? item.player[0] : item.player
  }))
}

export async function getMatchAttendances(matchId: string): Promise<MatchAttendance[]> {
  try {
    const { data, error } = await supabase
      .from('match_attendances')
      .select(`
        id,
        match_id,
        player_id,
        team_id,
        is_present,
        is_eligible,
        checked_in_at,
        player:player_id (
          full_name,
          is_suspended,
          has_paid_inscription
        )
      `)
      .eq('match_id', matchId)

    if (error) {
      console.error('❌ Error al cargar asistencias:', error)
      return []
    }

    // ✅ Normalizar datos y ordenar en JavaScript
    const normalized = normalizePlayerRelation(data || [])
    
    return normalized.sort((a, b) => 
      a.player?.full_name?.localeCompare(b.player?.full_name) || 0
    )
  } catch (err) {
    console.error('❌ Excepción en getMatchAttendances:', err)
    return []
  }
}

export async function initializeMatchAttendance(
  matchId: string,
  teamAId: string,
  teamBId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 [ATTENDANCE] Inicializando para match:', matchId)
    
    // Obtener jugadores de ambos equipos
    const { data: playersA } = await supabase
      .from('players')
      .select('id, team_id, is_suspended, has_paid_inscription')
      .eq('team_id', teamAId)

    const { data: playersB } = await supabase
      .from('players')
      .select('id, team_id, is_suspended, has_paid_inscription')
      .eq('team_id', teamBId)

    const allPlayers = [...(playersA || []), ...(playersB || [])]
    console.log('✅ [ATTENDANCE] Total jugadores encontrados:', allPlayers.length)

    if (allPlayers.length === 0) {
      return { success: true }
    }

    // Preparar registros de asistencia
    const attendances = allPlayers.map(player => ({
      match_id: matchId,
      player_id: player.id,
      team_id: player.team_id,
      is_present: false,
      is_eligible: !player.is_suspended && player.has_paid_inscription,
    }))

    // Insertar con upsert para evitar duplicados
    const { error } = await supabase
      .from('match_attendances')
      .upsert(attendances, {
        onConflict: 'match_id,player_id',
      })

    if (error) {
      console.error('❌ Error al inicializar asistencias:', error)
      throw error
    }

    console.log('✅ [ATTENDANCE] Asistencias inicializadas:', attendances.length)
    return { success: true }
  } catch (err) {
    console.error('❌ Excepción en initializeMatchAttendance:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al inicializar asistencia',
    }
  }
}

export async function updatePlayerAttendance(
  matchId: string,
  playerId: string,
  isPresent: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('match_attendances')
      .update({
        is_present: isPresent,
        checked_in_at: isPresent ? new Date().toISOString() : null,
      })
      .eq('match_id', matchId)
      .eq('player_id', playerId)

    if (error) {
      console.error('❌ Error al actualizar asistencia:', error)
      throw error
    }

    return { success: true }
  } catch (err) {
    console.error('❌ Excepción en updatePlayerAttendance:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar asistencia',
    }
  }
}

export async function getPresentPlayers(matchId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('match_attendances')
      .select('player_id')
      .eq('match_id', matchId)
      .eq('is_present', true)

    if (error) {
      console.error('❌ Error al cargar jugadores presentes:', error)
      return []
    }

    return data?.map(d => d.player_id) || []
  } catch (err) {
    console.error('❌ Excepción en getPresentPlayers:', err)
    return []
  }
}