// src/actions/tournaments.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { 
  generateGroupsPreview, 
  calculateTournamentPreview,
  startTournament as startTournamentService,
  getTournamentConfig,
} from '@/services/tournaments.service'
import { 
  getStandingsByTournament, 
  getBestSecondPlaces, 
  getBestThirdPlaces 
} from '@/services/standings.service'

// ============================================
// CATEGORÍAS
// ============================================
export async function getCategoriesAction() {
  try {
    const supabase = await createClient()
    const { data: categories } = await supabase
      .from('tournament_categories')
      .select('*')
      .eq('is_active', true)
      .order('min_grade')

    return { success: true, data: categories }
  } catch (err) {
    console.error('❌ getCategoriesAction:', err)
    return { success: false, error: 'Error al cargar categorías' }
  }
}

export async function getCategoryBySlugAction(slug: string) {
  try {
    const supabase = await createClient()
    const { data: category } = await supabase
      .from('tournament_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    return { success: true, data: category }
  } catch (err) {
    console.error('❌ getCategoryBySlugAction:', err)
    return { success: false, error: 'Error al cargar categoría' }
  }
}

// ============================================
// TORNEOS
// ============================================
export async function getTournamentsAction(categorySlug: string) {
  try {
    const supabase = await createClient()
    
    const { data: category } = await supabase
      .from('tournament_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (!category) {
      return { success: false, error: 'Categoría no encontrada' }
    }

    const { data: tournaments } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_teams (id)
      `)
      .eq('category_id', category.id)
      .order('created_at', { ascending: false })

    const tournamentsWithCount = tournaments?.map(t => ({
      ...t,
      _count: { teams: t.tournament_teams?.length || 0 }
    }))

    return { success: true, data: tournamentsWithCount }
  } catch (err) {
    console.error('❌ getTournamentsAction:', err)
    return { success: false, error: 'Error al cargar torneos' }
  }
}

export async function createTournamentAction(
  categoryId: string, 
  name: string, 
  deadline: string
) {
  try {
    const supabase = await createClient()
    
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert({
        category_id: categoryId,
        name,
        registration_deadline: deadline,
        status: 'draft',
        current_phase: 'groups',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/tournaments')
    revalidatePath(`/admin/tournaments/${categoryId}`)
    
    return { success: true, data: tournament }
  } catch (err) {
    console.error('❌ createTournamentAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear torneo',
    }
  }
}

export async function updateTournamentAction(
  tournamentId: string,
  updates: {
    name?: string
    registration_deadline?: string
    start_date?: string
    end_date?: string
    status?: string
  }
) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('tournaments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tournamentId)

    if (error) throw error

    revalidatePath('/admin/tournaments')
    
    return { success: true }
  } catch (err) {
    console.error('❌ updateTournamentAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al actualizar torneo',
    }
  }
}

// ============================================
// EQUIPOS PARA TORNEO
// ============================================
export async function getAvailableTeamsAction(categorySlug: string, tournamentId?: string) {
  try {
    const supabase = await createClient()
    
    const { data: category } = await supabase
      .from('tournament_categories')
      .select('min_grade, max_grade, include_teachers')
      .eq('slug', categorySlug)
      .single()

    if (!category) {
      return { success: false, error: 'Categoría no encontrada' }
    }

    const sections = []
    for (let grade = category.min_grade; grade <= category.max_grade; grade++) {
      sections.push(`${grade}-%`)
    }

    let query = supabase
      .from('teams')
      .select('*')
      .eq('is_active', true)
    
    if (sections.length > 0) {
      query = query.or(sections.map(s => `section.like.${s}`).join(','))
    }

    if (tournamentId) {
      const { data: registered } = await supabase
        .from('tournament_teams')
        .select('team_id')
        .eq('tournament_id', tournamentId)

      const registeredIds = registered?.map(r => r.team_id) || []
      if (registeredIds.length > 0) {
        query = query.not('id', 'in', `(${registeredIds.join(',')})`)
      }
    }

    const { data: teams, error } = await query.order('section').order('name')

    if (error) throw error

    return { success: true, data: teams }
  } catch (err) {
    console.error('❌ getAvailableTeamsAction:', err)
    return { success: false, error: 'Error al cargar equipos disponibles' }
  }
}

export async function registerTeamAction(tournamentId: string, teamId: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('tournament_teams')
      .insert({
        tournament_id: tournamentId,
        team_id: teamId,
        is_confirmed: false,
      })

    if (error) throw error

    revalidatePath(`/admin/tournaments/*`)
    
    return { success: true }
  } catch (err) {
    console.error('❌ registerTeamAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al inscribir equipo',
    }
  }
}

export async function getRegisteredTeamsAction(tournamentId: string) {
  try {
    const supabase = await createClient()
    
    const { data: teams, error } = await supabase
      .from('tournament_teams')
      .select(`
        *,
        team:teams (*)
      `)
      .eq('tournament_id', tournamentId)
      .order('registered_at')

    if (error) throw error

    return { success: true, data: teams }
  } catch (err) {
    console.error('❌ getRegisteredTeamsAction:', err)
    return { success: false, error: 'Error al cargar equipos inscritos' }
  }
}

export async function confirmTeamAction(tournamentTeamId: string, confirmed: boolean) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('tournament_teams')
      .update({ is_confirmed: confirmed })
      .eq('id', tournamentTeamId)

    if (error) throw error

    revalidatePath(`/admin/tournaments/*`)
    
    return { success: true }
  } catch (err) {
    console.error('❌ confirmTeamAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al confirmar equipo',
    }
  }
}

export async function removeTeamAction(tournamentTeamId: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('tournament_teams')
      .delete()
      .eq('id', tournamentTeamId)

    if (error) throw error

    revalidatePath(`/admin/tournaments/*`)
    
    return { success: true }
  } catch (err) {
    console.error('❌ removeTeamAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al remover equipo',
    }
  }
}

// ============================================
// ✅ VISTA PREVIA DE GRUPOS - SIN teamsPerGroup (automático)
// ============================================
export async function generateGroupsPreviewAction(teams: any[]) {
  try {
    // ✅ Ya no necesita teamsPerGroup, se calcula automático según cantidad de equipos
    const preview = calculateTournamentPreview(teams)
    const config = getTournamentConfig(teams.length)
    
    return { 
      success: true, 
      data: { 
        preview,
        config  // ✅ Incluir configuración para mostrar en UI
      } 
    }
  } catch (err) {
    console.error('❌ generateGroupsPreviewAction:', err)
    return { success: false, error: 'Error al generar vista previa' }
  }
}

// ✅ NUEVA: Obtener configuración del torneo según cantidad de equipos
export async function getTournamentConfigAction(teamCount: number) {
  try {
    const config = getTournamentConfig(teamCount)
    return { success: true, data: config }
  } catch (err) {
    console.error('❌ getTournamentConfigAction:', err)
    return { success: false, error: 'Error al obtener configuración' }
  }
}

// ============================================
// ✅ INICIAR TORNEO - Con distribución dinámica
// ============================================
export async function startTournamentAction(tournamentId: string) {
  try {
    const result = await startTournamentService(tournamentId)
    
    if (result.success) {
      revalidatePath('/admin/tournaments')
      revalidatePath('/admin/matches')
    }
    
    return result
  } catch (err) {
    console.error('❌ startTournamentAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al iniciar torneo',
    }
  }
}

// ============================================
// ✅ MEJORES SEGUNDOS/TERCEROS - Para grupos desbalanceados
// ============================================
export async function getBestSecondPlacesAction(tournamentId: string, count: number = 1) {
  try {
    const standings = await getStandingsByTournament(tournamentId)
    const bestSeconds = await getBestSecondPlaces(standings, count)
    
    return { success: true, data: bestSeconds }
  } catch (err) {
    console.error('❌ getBestSecondPlacesAction:', err)
    return { success: false, error: 'Error al obtener mejores segundos' }
  }
}

export async function getBestThirdPlacesAction(tournamentId: string, count: number = 2) {
  try {
    const standings = await getStandingsByTournament(tournamentId)
    const bestThirds = await getBestThirdPlaces(standings, count)
    
    return { success: true, data: bestThirds }
  } catch (err) {
    console.error('❌ getBestThirdPlacesAction:', err)
    return { success: false, error: 'Error al obtener mejores terceros' }
  }
}

// ============================================
// FASES DEL TORNEO
// ============================================
export async function getTournamentPhasesAction(tournamentId: string) {
  try {
    const supabase = await createClient()
    
    const { data: phases, error } = await supabase
      .from('tournament_phases')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('phase_order')

    if (error) throw error

    return { success: true, data: phases }
  } catch (err) {
    console.error('❌ getTournamentPhasesAction:', err)
    return { success: false, error: 'Error al cargar fases' }
  }
}

export async function activatePhaseAction(phaseId: string) {
  try {
    const supabase = await createClient()
    
    // Obtener tournament_id de la fase
    const { data: phaseData } = await supabase
      .from('tournament_phases')
      .select('tournament_id')
      .eq('id', phaseId)
      .single()
    
    if (!phaseData) {
      return { success: false, error: 'Fase no encontrada' }
    }

    // Desactivar todas las fases primero
    await supabase
      .from('tournament_phases')
      .update({ is_active: false })
      .eq('tournament_id', phaseData.tournament_id)
    
    // Activar la fase seleccionada
    const { error } = await supabase
      .from('tournament_phases')
      .update({ is_active: true })
      .eq('id', phaseId)

    if (error) throw error

    revalidatePath('/admin/tournaments/*')
    
    return { success: true }
  } catch (err) {
    console.error('❌ activatePhaseAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al activar fase',
    }
  }
}