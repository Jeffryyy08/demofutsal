// src/app/admin/teams/page.tsx
import { createClient } from '@/lib/supabase-server'
import { TeamForm } from '@/components/forms/TeamForm'
import { TeamsTable } from '@/components/tables/TeamsTable'
import { NewTeamButton } from '@/components/teams/NewTeamButton'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function TeamsPage() {
  const supabase = await createClient()
  
  // Obtener equipos activos
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('is_active', true)
    .order('section')
    .order('name')

  // Obtener asignaciones de equipos a torneos
  const { data: tournamentAssignments } = await supabase
    .from('tournament_teams')
    .select(`
      team_id,
      tournament:tournaments (
        id,
        name,
        status
      )
    `)
    .eq('is_confirmed', true)

  // Crear mapa de equipo → torneo
  const teamTournamentMap = new Map<string, { name: string; status: string }>()
  tournamentAssignments?.forEach((assignment: any) => {
    if (assignment.tournament) {
      teamTournamentMap.set(assignment.team_id, {
        name: assignment.tournament.name,
        status: assignment.tournament.status,
      })
    }
  })

  // Enriquecer equipos con info de torneo
  const teamsWithTournament = (teams || []).map(team => ({
    ...team,
    tournament: teamTournamentMap.get(team.id) || null,
  }))

  const totalTeams = teams?.length || 0
  const teamsInTournaments = teams?.filter(t => teamTournamentMap.has(t.id)).length || 0

  return (
    <div className="min-h-screen bg-surface">
      
      {/* Header con Gradiente Hero - RESPONSIVE */}
      <header 
        className="py-8 md:py-12 px-4 md:px-gutter text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 50%, #0038b6 100%)',
          boxShadow: '0 4px 20px rgba(0, 62, 199, 0.3)'
        }}
      >
        {/* Efectos decorativos - más pequeños en móvil */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-48 md:w-96 h-48 md:h-96 bg-white rounded-full blur-2xl md:blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-[#fe6b00] rounded-full blur-2xl md:blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container-custom relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
            <div>
              <Link 
                href="/admin"
                className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-3 md:mb-4 font-heading text-sm font-semibold"
              >
                <span>←</span>
                Volver al Dashboard
              </Link>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 md:mb-3 tracking-tight font-heading">
                👥 Gestión de Equipos
              </h1>
              <p className="text-base md:text-lg text-blue-100 max-w-xl font-medium font-body">
                Registra y administra los equipos participantes.
                <br className="hidden sm:inline" />
                <span className="text-sm opacity-90">Asigna secciones, capitanes y gestiona jugadores.</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Link 
                href="/admin/teams#import"
                className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-white/10 hover:bg-white/20 text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 border border-white/30 no-underline text-sm"
              >
                <span>📥</span>
                Importar
              </Link>
              <NewTeamButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - RESPONSIVE */}
      <main className="container-custom py-6 md:py-12 px-4 md:px-gutter space-y-8 md:space-y-12">
        
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Total Teams Card */}
          <AnimatedCard className="p-4 md:p-6" animation="slide-up" delay={0.1}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Equipos Registrados
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {totalTeams}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  Activos en el sistema
                </p>
              </div>
              <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl bg-gradient-primary text-2xl md:text-3xl text-white shadow-glow flex-shrink-0">
                👥
              </div>
            </div>
            {/* Progress indicator */}
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <div className="flex items-center justify-between text-sm">
                <span className="font-body text-on-surface-variant">Meta: 32 equipos</span>
                <span className="font-heading text-primary font-semibold">
                  {Math.round((totalTeams / 32) * 100)}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalTeams / 32) * 100, 100)}%` }}
                />
              </div>
            </div>
          </AnimatedCard>

          {/* Teams in Tournaments Card */}
          <AnimatedCard className="p-4 md:p-6" animation="slide-up" delay={0.2}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  En Torneos Activos
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {teamsInTournaments}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  Equipos confirmados
                </p>
              </div>
              <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl bg-gradient-secondary text-2xl md:text-3xl text-white shadow-glow-orange flex-shrink-0">
                🏆
              </div>
            </div>
            {/* Status badges */}
            <div className="mt-4 pt-4 border-t border-outline-variant/20 flex flex-wrap gap-2">
              <Badge className="bg-primary/10 text-primary font-heading text-label-caps px-3 py-1">
                ✅ Confirmados
              </Badge>
              <Badge variant="outline" className="font-heading text-label-caps text-xs border-outline-variant/50">
                {totalTeams - teamsInTournaments} pendientes
              </Badge>
            </div>
          </AnimatedCard>
        </div>

        {/* Team Form Section */}
        <AnimatedCard className="p-4 md:p-8" animation="slide-up" delay={0.3}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 mb-5 md:mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl flex-shrink-0">
              ✏️
            </div>
            <div>
              <h2 className="font-heading text-headline-md text-on-surface">
                Registrar Nuevo Equipo
              </h2>
              <p className="font-body text-body-md text-on-surface-variant">
                Completa la información para agregar un equipo al sistema
              </p>
            </div>
          </div>
          <div className="pl-4 md:pl-15">
            <TeamForm />
          </div>
        </AnimatedCard>

        {/* Teams Table Section */}
        <AnimatedCard className="overflow-hidden" animation="slide-up" delay={0.4}>
          <div className="p-4 md:p-6 border-b border-outline-variant/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl flex-shrink-0">
                  📋
                </div>
                <div>
                  <h2 className="font-heading text-headline-md text-on-surface">
                    Equipos Registrados
                  </h2>
                  <p className="font-body text-body-md text-on-surface-variant">
                    {totalTeams} equipos en total
                  </p>
                </div>
              </div>
              
              {/* Quick Filters - wrap en móvil */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-heading text-label-caps text-xs cursor-pointer hover:bg-primary/5 transition-colors">
                  Todos
                </Badge>
                <Badge variant="outline" className="font-heading text-label-caps text-xs cursor-pointer hover:bg-primary/5 transition-colors">
                  🏆 En Torneo
                </Badge>
                <Badge variant="outline" className="font-heading text-label-caps text-xs cursor-pointer hover:bg-primary/5 transition-colors">
                  ⏳ Pendientes
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-6 overflow-x-auto">
            <TeamsTable teams={teamsWithTournament} />
          </div>
        </AnimatedCard>

      </main>

      {/* Footer Tip - RESPONSIVE */}
      <div className="container-custom px-4 md:px-gutter py-4 md:py-6">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant font-body text-body-md text-center">
          <span>💡</span>
          <span>
            Tip: Los equipos deben tener al menos 5 jugadores registrados para poder participar en un torneo.
          </span>
        </div>
      </div>
    </div>
  )
}