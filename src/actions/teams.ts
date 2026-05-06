// src/actions/teams.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createTeam, updateTeam, deleteTeam } from '@/services/teams.service'
import { TeamFormData } from '@/types'

export async function createTeamAction(formData: FormData): Promise<{ success: boolean; error?: string; message?: string }> {
  const teamData: TeamFormData = {
    name: formData.get('name') as string,
    section: formData.get('section') as string,
    subgroup: formData.get('subgroup') as string || '',

  }

  const result = await createTeam(teamData)
  
  if (result.success) {
    revalidatePath('/admin/teams')
    return { success: true, message: 'Equipo registrado correctamente' }
  }
  
  return { success: false, error: result.error }
}

export async function updateTeamAction(id: string, formData: FormData): Promise<{ success: boolean; error?: string; message?: string }> {
  const teamData: TeamFormData = {
    name: formData.get('name') as string,
    section: formData.get('section') as string,
    subgroup: formData.get('subgroup') as string || '',
  }

  const result = await updateTeam(id, teamData)
  
  if (result.success) {
    revalidatePath('/admin/teams')
    return { success: true, message: 'Equipo actualizado correctamente' }
  }
  
  return { success: false, error: result.error }
}

export async function deleteTeamAction(id: string): Promise<{ success: boolean; error?: string; message?: string }> {
  const result = await deleteTeam(id)
  
  if (result.success) {
    revalidatePath('/admin/teams')
    return { success: true, message: 'Equipo eliminado correctamente' }
  }
  
  return { success: false, error: result.error }
}