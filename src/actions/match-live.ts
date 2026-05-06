// src/actions/match-live.ts
'use server'

import { revalidatePath } from 'next/cache'
import { addMatchEvent, updateMatchLive, getMatchEvents } from '@/services/match-live.service'

export async function addMatchEventAction(event: any) {
  const result = await addMatchEvent(event)
  if (result.success) {
    revalidatePath('/admin/tournaments/[slug]/[tournamentId]')
  }
  return result
}

export async function updateMatchLiveAction(matchId: string, updates: any) {
  const result = await updateMatchLive(matchId, updates)
  if (result.success) {
    revalidatePath('/admin/tournaments/[slug]/[tournamentId]')
  }
  return result
}

export async function getMatchEventsAction(matchId: string) {
  try {
    const events = await getMatchEvents(matchId)
    return { success: true,  events }
  } catch (err) {
    return { success: false, error: 'Error al cargar eventos' }
  }
}