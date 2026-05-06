// src/actions/standings.ts
'use server'

import { revalidatePath } from 'next/cache'
import { getStandingsByTournament, updateMatchResult } from '@/services/standings.service'

export async function getStandingsAction(tournamentId: string) {
  try {
    const standings = await getStandingsByTournament(tournamentId)
    // ✅ CAMBIO: Retornar "standings" en lugar de "data"
    return { success: true, standings }
  } catch (err) {
    console.error('❌ Error en getStandingsAction:', err)
    return { success: false, error: 'Error al cargar tabla de posiciones' }
  }
}

export async function updateMatchResultAction(
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
) {
  try {
    // ✅ Asegurar que todos los valores sean números válidos
    const data = {
      score_a: Number(formData.score_a) || 0,
      score_b: Number(formData.score_b) || 0,
      status: formData.status,
      team_a_yellow_cards: Number(formData.team_a_yellow_cards) || 0,
      team_b_yellow_cards: Number(formData.team_b_yellow_cards) || 0,
      team_a_red_cards: Number(formData.team_a_red_cards) || 0,
      team_b_red_cards: Number(formData.team_b_red_cards) || 0,
    }

    console.log('📝 Actualizando partido:', matchId, data)

    const result = await updateMatchResult(matchId, data)
    
    if (result.success) {
      revalidatePath('/admin/tournaments/[slug]/[tournamentId]')
      revalidatePath('/admin/matches')
      return { success: true }
    }
    
    return { success: false, error: result.error }
  } catch (err) {
    console.error('❌ Error en updateMatchResultAction:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Error al actualizar resultado' 
    }
  }
}