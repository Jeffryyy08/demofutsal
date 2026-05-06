// src/services/match-live.service.ts
import { supabase } from '@/lib/supabase'
import { MatchEvent, MatchTimer } from '@/types'

// ============================================
// EVENTOS DEL PARTIDO
// ============================================
export async function addMatchEvent(event: Omit<MatchEvent, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('match_events')
      .insert({
        match_id: event.match_id,
        event_type: event.event_type,
        team_id: event.team_id,
        player_name: event.player_name,
        minute: event.minute,
        extra_minute: event.extra_minute,
        description: event.description,
      })

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al registrar evento',
    }
  }
}

export async function getMatchEvents(matchId: string): Promise<MatchEvent[]> {
  const { data, error } = await supabase
    .from('match_events')
    .select('*')
    .eq('match_id', matchId)
    .order('minute', { ascending: true })
    .order('extra_minute', { ascending: true })

  if (error) throw error
  return data || []
}

export async function deleteMatchEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('match_events')
      .delete()
      .eq('id', eventId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar evento',
    }
  }
}

// ============================================
// ACTUALIZAR MARCADOR Y ESTADO
// ============================================
export async function updateMatchLive(
  matchId: string,
  updates: {
    score_a?: number
    score_b?: number
    status?: 'scheduled' | 'live' | 'finished' | 'halftime'
    team_a_fouls?: number
    team_b_fouls?: number
    team_a_yellow_cards?: number
    team_b_yellow_cards?: number
    team_a_red_cards?: number
    team_b_red_cards?: number
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar partido',
    }
  }
}