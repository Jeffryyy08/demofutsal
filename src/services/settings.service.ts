// src/services/settings.service.ts
import { supabase } from '@/lib/supabase'

export interface TournamentSetting {
  id: number
  key: string
  value: string
  description: string
}

export async function getSettings() {
  const { data, error } = await supabase
    .from('tournament_settings')
    .select('*')
    .order('id')

  if (error) throw error
  return data
}

export async function updateSetting(id: number, value: string) {
  const { error } = await supabase
    .from('tournament_settings')
    .update({ value })
    .eq('id', id)

  if (error) throw error
}