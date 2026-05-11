// src/actions/match-live.ts
'use server'

import { revalidatePath } from 'next/cache'
import { addMatchEvent, updateMatchLive, getMatchEvents } from '@/services/match-live.service'
import { createPlayerSuspensionAction } from '@/actions/players'

export async function addMatchEventAction(event: any) {
  // 🚨 LOGS EXTREMADAMENTE DETALLADOS
  console.log('\n🔥🔥🔥 [MATCH-LIVE] addMatchEventAction INICIADO 🔥🔥🔥')
  console.log('📦 EVENTO RECIBIDO:', JSON.stringify(event, null, 2))
  console.log('🔍 event.event_type:', event.event_type)
  console.log('🔍 event.player_id:', event.player_id)
  console.log('🔍 event.team_id:', event.team_id)
  console.log('🔍 event.match_id:', event.match_id)
  console.log('🔍 event.minute:', event.minute)
  
  // 1. Registrar el evento
  console.log('\n📝 [1/4] Llamando a addMatchEvent()...')
  const result = await addMatchEvent(event)
  console.log('✅ Resultado de addMatchEvent:', JSON.stringify(result, null, 2))
  
  // 2. Verificar si es tarjeta roja
  console.log('\n🟥 [2/4] Verificando si es tarjeta roja...')
  console.log('   result.success:', result.success)
  console.log('   event.event_type === "red_card":', event.event_type === 'red_card')
  
  if (result.success && event.event_type === 'red_card') {
    console.log('✅ ¡Es tarjeta roja! Iniciando proceso de suspensión...')
    
    try {
      // 3. Obtener tournament_id
      console.log('\n🏆 [3/4] Obteniendo tournament_id del partido...')
      const supabaseModule = await import('@/lib/supabase-server')
      const supabase = await supabaseModule.createClient()
      
      console.log('   Buscando partido con ID:', event.match_id)
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('tournament_id')
        .eq('id', event.match_id)
        .single()
      
      console.log('   matchError:', matchError)
      console.log('   match encontrado:', match)
      
      if (matchError || !match?.tournament_id) {
        console.error('❌ No se pudo obtener tournament_id')
        return result
      }
      
      console.log('✅ tournament_id obtenido:', match.tournament_id)
      
      // 4. Crear suspensión
      console.log('\n⚠️ [4/4] Llamando a createPlayerSuspensionAction...')
      console.log('   Parámetros:', JSON.stringify({
        tournament_id: match.tournament_id,
        player_id: event.player_id,
        team_id: event.team_id,
        suspension_type: 'red_card',
        reason: `Tarjeta roja - Minuto ${event.minute}'`,
        matches_suspended: 1,
        match_id: event.match_id,
      }, null, 2))
      
      const suspensionResult = await createPlayerSuspensionAction({
        tournament_id: match.tournament_id,
        player_id: event.player_id || null,
        team_id: event.team_id,
        suspension_type: 'red_card',
        reason: `Tarjeta roja en partido - Minuto ${event.minute}'`,
        matches_suspended: 1,
        match_id: event.match_id,
      })
      
      console.log('✅ Resultado de createPlayerSuspensionAction:', JSON.stringify(suspensionResult, null, 2))
      
      if (!suspensionResult.success) {
        console.error('❌ Error en suspensión:', suspensionResult.error)
      }
      
    } catch (err) {
      console.error('❌ [EXCEPCIÓN] Error en procesamiento:', err)
      console.error('Stack:', err instanceof Error ? err.stack : 'No stack')
    }
  } else {
    console.log('⚠️ No es tarjeta roja o result.success es false, saltando suspensión')
  }
  
  // Revalidar
  console.log('\n🔄 Revalidando rutas...')
  if (result.success) {
    revalidatePath('/admin/tournaments/[slug]/[tournamentId]')
    revalidatePath('/admin/sanctions')
    revalidatePath('/admin/players')
    console.log('✅ Rutas revalidadas')
  }
  
  console.log('\n🔥🔥🔥 [MATCH-LIVE] addMatchEventAction FINALIZADO 🔥🔥🔥\n')
  
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