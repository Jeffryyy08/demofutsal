// src/services/teams.service.ts
import { supabase } from '@/lib/supabase'
import { Team, TeamFormData } from '@/types'

export async function getTeams(): Promise<Team[]> {
  console.log('🔍 getTeams - Consultando equipos...')
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('is_active', true)
    .order('section')
    .order('subgroup')

  if (error) {
    console.error('❌ getTeams - Error:', error)
    throw error
  }
  
  console.log('✅ getTeams - Equipos encontrados:', data?.length || 0)
  return data || []
}

export async function getTeamById(id: string): Promise<Team | null> {
  console.log('🔍 getTeamById - Buscando equipo:', id)
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('❌ getTeamById - Error:', error)
    throw error
  }
  
  console.log('✅ getTeamById - Equipo encontrado:', data?.name)
  return data
}

export async function createTeam(formData: TeamFormData): Promise<{ success: boolean; error?: string }> {
  console.log('🔍 createTeam - Iniciando creación...')
  console.log('📋 Datos recibidos:', formData)

  try {
    // Validación de nombre
    if (formData.name.length < 3) {
      console.warn('⚠️ createTeam - Nombre muy corto:', formData.name)
      return { success: false, error: 'El nombre del equipo debe tener al menos 3 caracteres' }
    }

    const section = formData.section
    const subgroup = formData.subgroup || null

    console.log('📊 Section:', section, '| Subgroup:', subgroup)

    // ============================================
    // 1. Obtener equipos existentes de esta sección
    // ============================================
    const {  data: existingTeams, error: fetchError } = await supabase
      .from('teams')
      .select('id, name, section, subgroup')
      .eq('section', section)
      .eq('is_active', true)

    if (fetchError) {
      console.error('❌ createTeam - Error al consultar equipos existentes:', fetchError)
      return { success: false, error: `Error al consultar: ${fetchError.message}` }
    }

    console.log('📋 Equipos existentes en esta sección:', existingTeams)

    // ============================================
    // 2. Validaciones de conflicto
    // ============================================
    if (existingTeams && existingTeams.length > 0) {
      const hasGeneralTeam = existingTeams.some(t => !t.subgroup)
      const hasSameSubgroup = existingTeams.some(t => t.subgroup === subgroup)

      console.log('🔍 Validaciones:')
      console.log('  - hasGeneralTeam:', hasGeneralTeam)
      console.log('  - hasSameSubgroup:', hasSameSubgroup)

      if (subgroup) {
        // Creando equipo CON subgrupo
        if (hasGeneralTeam) {
          console.warn('⚠️ createTeam - Conflicto: existe equipo general')
          return { 
            success: false, 
            error: `Ya existe un equipo general "${section}" registrado. No se pueden crear subgrupos si existe el equipo general.` 
          }
        }
        
        if (hasSameSubgroup) {
          console.warn('⚠️ createTeam - Conflicto: existe mismo subgrupo')
          const fullName = `${section} ${subgroup}`
          return { 
            success: false, 
            error: `Ya existe el equipo "${fullName}" registrado.` 
          }
        }
      } else {
        // Creando equipo GENERAL (sin subgrupo)
        if (hasGeneralTeam) {
          console.warn('⚠️ createTeam - Conflicto: ya existe equipo general')
          return { 
            success: false, 
            error: `Ya existe un equipo general "${section}" registrado.` 
          }
        }
        
        if (existingTeams.length > 0) {
          console.warn('⚠️ createTeam - Conflicto: existen subgrupos')
          const subgroupsList = existingTeams
            .filter(t => t.subgroup)
            .map(t => t.subgroup)
            .join(', ')
          
          return { 
            success: false, 
            error: `Ya existen subgrupos (${subgroupsList}) para "${section}". No se puede crear equipo general si existen subgrupos.` 
          }
        }
      }
    }

    // ============================================
    // 3. Insertar equipo
    // ============================================
    const fullName = subgroup ? `${formData.name} ${subgroup}` : formData.name
    console.log('📝 Insertando equipo:', fullName)

    const { error: insertError } = await supabase
      .from('teams')
      .insert({
        name: formData.name.trim(),
        section: section || null,
        subgroup: subgroup || null,
      })

    if (insertError) {
      console.error('❌ createTeam - Error al insertar:', insertError)
      return { success: false, error: `Error al insertar: ${insertError.message}` }
    }

    console.log('✅ createTeam - Equipo creado exitosamente:', fullName)
    return { success: true }
  } catch (err) {
    console.error('💥 createTeam - Error inesperado:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado al crear el equipo',
    }
  }
}

export async function updateTeam(id: string, formData: TeamFormData): Promise<{ success: boolean; error?: string }> {
  console.log('🔍 updateTeam - Iniciando actualización...')
  console.log('📋 Team ID:', id)
  console.log('📋 Datos recibidos:', formData)

  try {
    if (formData.name.length < 3) {
      console.warn('⚠️ updateTeam - Nombre muy corto:', formData.name)
      return { success: false, error: 'El nombre del equipo debe tener al menos 3 caracteres' }
    }

    const section = formData.section
    const subgroup = formData.subgroup || null

    console.log('📊 Section:', section, '| Subgroup:', subgroup)

    // ============================================
    // 1. Obtener otros equipos de esta sección (excluyendo el actual)
    // ============================================
    const {  data: existingTeams, error: fetchError } = await supabase
      .from('teams')
      .select('id, name, section, subgroup')
      .eq('section', section)
      .eq('is_active', true)
      .neq('id', id)  // Excluir el equipo que estamos editando

    if (fetchError) {
      console.error('❌ updateTeam - Error al consultar equipos existentes:', fetchError)
      return { success: false, error: `Error al consultar: ${fetchError.message}` }
    }

    console.log('📋 Otros equipos en esta sección:', existingTeams)

    // ============================================
    // 2. Validaciones de conflicto
    // ============================================
    if (existingTeams && existingTeams.length > 0) {
      const hasGeneralTeam = existingTeams.some(t => !t.subgroup)
      const hasSameSubgroup = existingTeams.some(t => t.subgroup === subgroup)

      console.log('🔍 Validaciones:')
      console.log('  - hasGeneralTeam:', hasGeneralTeam)
      console.log('  - hasSameSubgroup:', hasSameSubgroup)

      if (subgroup) {
        // Actualizando equipo CON subgrupo
        if (hasGeneralTeam) {
          console.warn('⚠️ updateTeam - Conflicto: existe equipo general')
          return { 
            success: false, 
            error: `Ya existe un equipo general "${section}" registrado. No se pueden crear subgrupos si existe el equipo general.` 
          }
        }
        
        if (hasSameSubgroup) {
          console.warn('⚠️ updateTeam - Conflicto: existe mismo subgrupo')
          const fullName = `${section} ${subgroup}`
          return { 
            success: false, 
            error: `Ya existe el equipo "${fullName}" registrado.` 
          }
        }
      } else {
        // Actualizando equipo GENERAL
        if (hasGeneralTeam) {
          console.warn('⚠️ updateTeam - Conflicto: ya existe equipo general')
          return { 
            success: false, 
            error: `Ya existe un equipo general "${section}" registrado.` 
          }
        }
        
        if (existingTeams.length > 0) {
          console.warn('⚠️ updateTeam - Conflicto: existen subgrupos')
          const subgroupsList = existingTeams
            .filter(t => t.subgroup)
            .map(t => t.subgroup)
            .join(', ')
          
          return { 
            success: false, 
            error: `Ya existen subgrupos (${subgroupsList}) para "${section}". No se puede crear equipo general si existen subgrupos.` 
          }
        }
      }
    }

    // ============================================
    // 3. Actualizar equipo
    // ============================================
    const fullName = subgroup ? `${formData.name} ${subgroup}` : formData.name
    console.log('📝 Actualizando equipo:', fullName)

    const { error: updateError } = await supabase
      .from('teams')
      .update({
        name: formData.name.trim(),
        section: section || null,
        subgroup: subgroup || null,
      })
      .eq('id', id)

    if (updateError) {
      console.error('❌ updateTeam - Error al actualizar:', updateError)
      return { success: false, error: `Error al actualizar: ${updateError.message}` }
    }

    console.log('✅ updateTeam - Equipo actualizado exitosamente:', fullName)
    return { success: true }
  } catch (err) {
    console.error('💥 updateTeam - Error inesperado:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado al actualizar el equipo',
    }
  }
}

export async function deleteTeam(id: string): Promise<{ success: boolean; error?: string }> {
  console.log('🔍 deleteTeam - Iniciando eliminación...')
  console.log('📋 Team ID:', id)

  try {
    // Soft delete: marcar como inactivo
    const { error } = await supabase
      .from('teams')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('❌ deleteTeam - Error al eliminar:', error)
      return { success: false, error: `Error al eliminar: ${error.message}` }
    }

    console.log('✅ deleteTeam - Equipo eliminado (marcado como inactivo)')
    return { success: true }
  } catch (err) {
    console.error('💥 deleteTeam - Error inesperado:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado al eliminar el equipo',
    }
  }
}

export async function getTeamsByTournamentAndGroup(
  tournamentId: string, 
  groupLabel: string
): Promise<Team[]> {
  console.log('🔍 getTeamsByTournamentAndGroup - Consultando:', { tournamentId, groupLabel })
  
  const { data, error } = await supabase
    .from('tournament_teams')
    .select(`
      team:teams (*)
    `)
    .eq('tournament_id', tournamentId)
    .eq('group_label', groupLabel)
    .eq('is_confirmed', true)

  if (error) {
    console.error('❌ Error:', error)
    throw error
  }
  
  const teams = data
  ?.map(dt => Array.isArray(dt.team) ? dt.team[0] : dt.team)
  .filter((team): team is Team => team !== null && team !== undefined)

console.log('✅ Equipos encontrados:', teams?.length || 0)
return teams || []

}