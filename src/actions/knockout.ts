// src/actions/knockout.ts
'use server'

import { revalidatePath } from 'next/cache'
import { generateKnockoutPhase, advanceKnockoutWinner } from '@/services/knockout.service'

export async function generateKnockoutPhaseAction(tournamentId: string) {
  const result = await generateKnockoutPhase(tournamentId)
  
  if (result.success) {
    revalidatePath('/admin/tournaments/[slug]/[tournamentId]')
    revalidatePath('/admin/matches')
  }
  
  return result
}

export async function advanceKnockoutWinnerAction(matchId: string, winnerTeamId: string) {
  const result = await advanceKnockoutWinner(matchId, winnerTeamId)
  
  if (result.success) {
    revalidatePath('/admin/tournaments/[slug]/[tournamentId]')
    revalidatePath('/admin/matches')
  }
  
  return result
}