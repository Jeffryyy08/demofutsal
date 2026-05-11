// src/components/tournaments/TournamentConfig.tsx
'use client'

import { useState, useEffect } from 'react'
import { Tournament, TournamentTeam, Team, Match, TeamStandings } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TeamRegistrationList } from './TeamRegistrationList'
import { GroupsPreview } from './GroupsPreview'
import { MatchesList } from './MatchesList'
import { StandingsTable } from './StandingsTable'
import { KnockoutBracket } from './KnockoutBracket'
import { supabase } from '@/lib/supabase'
import { registerTeamAction, removeTeamAction, confirmTeamAction, startTournamentAction } from '@/actions/tournaments'
import { getStandingsAction } from '@/actions/standings'
import { generateKnockoutPhaseAction } from '@/actions/knockout'

interface TournamentConfigProps {
  tournament: Tournament
  registeredTeams: TournamentTeam[]
  availableTeams: Team[]
}

export function TournamentConfig({
  tournament,
  registeredTeams,
  availableTeams
}: TournamentConfigProps) {
  const [activeTab, setActiveTab] = useState('teams')
  const [loading, setLoading] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [standings, setStandings] = useState<Record<string, TeamStandings[]>>({})
  const [loadingStandings, setLoadingStandings] = useState(false)
  const [knockoutGenerated, setKnockoutGenerated] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Cargar partidos y standings al montar si el torneo está activo
  useEffect(() => {
    if (tournament.status === 'active') {
      loadMatches()
      loadStandings()
      checkKnockoutGenerated()
    }
  }, [tournament.id, tournament.status])

  const checkKnockoutGenerated = async () => {
    const { data: phases } = await supabase
      .from('tournament_phases')
      .select('id')
      .eq('tournament_id', tournament.id)
      .eq('phase_type', 'knockout')
      .single()

    if (phases) {
      setKnockoutGenerated(true)
    }
  }

  const loadMatches = async () => {
    setLoadingMatches(true)
    try {
      const { data: fetchedMatches } = await supabase
        .from('matches')
        .select(`
          *,
          team_a:team_a_id (*),
          team_b:team_b_id (*)
        `)
        .eq('tournament_id', tournament.id)
        .order('match_date')

      setMatches(fetchedMatches || [])
    } catch (err) {
      console.error('Error loading matches:', err)
    } finally {
      setLoadingMatches(false)
    }
  }

  const loadStandings = async () => {
    setLoadingStandings(true)
    const result = await getStandingsAction(tournament.id)

    if (result.success && result.standings) {
      setStandings(result.standings)
    }
    setLoadingStandings(false)
  }

  const refreshMatches = async () => {
    try {
      const { data: fetchedMatches } = await supabase
        .from('matches')
        .select(`
          *,
          team_a:team_a_id (*),
          team_b:team_b_id (*)
        `)
        .eq('tournament_id', tournament.id)
        .order('match_date')
      
      setMatches(fetchedMatches || [])
    } catch (err) {
      console.error('Error refreshing matches:', err)
    }
  }

  const refreshStandings = async () => {
    const result = await getStandingsAction(tournament.id)
    if (result.success && result.standings) {
      setStandings(result.standings)
    }
  }

  const handleMatchUpdated = async () => {
    setUpdating(true)
    await Promise.all([refreshMatches(), refreshStandings()])
    setUpdating(false)
  }

  const handleRegisterTeam = async (teamId: string) => {
    setLoading(teamId)
    await registerTeamAction(tournament.id, teamId)
    await handleMatchUpdated()
    setLoading(null)
  }

  const handleRemoveTeam = async (tournamentTeamId: string) => {
    setLoading(tournamentTeamId)
    await removeTeamAction(tournamentTeamId)
    await handleMatchUpdated()
    setLoading(null)
  }

  const handleConfirmTeam = async (tournamentTeamId: string, confirmed: boolean) => {
    setLoading(tournamentTeamId)
    await confirmTeamAction(tournamentTeamId, confirmed)
    await handleMatchUpdated()
    setLoading(null)
  }

  const handleStartTournament = async () => {
    if (!confirm('¿Estás seguro de iniciar el torneo? Esta acción generará todos los partidos automáticamente.')) {
      return
    }

    setLoading('start')
    const result = await startTournamentAction(tournament.id)

    if (result.success) {
      alert(`✅ Torneo iniciado exitosamente. Se crearon ${result.matches_created} partidos.`)
      window.location.reload()
    } else {
      alert(`❌ Error: ${result.error}`)
      setLoading(null)
    }
  }

  const handleGenerateKnockout = async () => {
    if (!confirm('¿Generar Fase Eliminatoria? Esto creará los partidos de semi/final automáticamente.')) {
      return
    }

    setLoading('knockout')
    const result = await generateKnockoutPhaseAction(tournament.id)

    if (result.success) {
      alert(`✅ Fase eliminatoria generada. ${result.matches_created} partidos creados.`)
      setKnockoutGenerated(true)
      await refreshMatches()
      setActiveTab('knockout')
    } else {
      alert(`❌ Error: ${result.error}`)
    }

    setLoading(null)
  }

  const confirmedTeams = registeredTeams.filter(t => t.is_confirmed)
  const canStartTournament = confirmedTeams.length >= (tournament.category?.min_teams_recommended || 8)
  const confirmedCount = confirmedTeams.length

  // ✅ FUNCIÓN: Obtener configuración de clasificación según cantidad de equipos confirmados
  const getTournamentConfig = () => {
    const configs: Record<number, { 
      qualified: number
      type: 'top2' | 'top1_best2' | 'top1_best2_best3' | 'top1'
      unbalanced: boolean
    }> = {
      8:  { qualified: 4, type: 'top2',              unbalanced: false },
      9:  { qualified: 4, type: 'top1_best2',        unbalanced: false },
      10: { qualified: 4, type: 'top2',              unbalanced: false },
      11: { qualified: 4, type: 'top1_best2',        unbalanced: true  },
      12: { qualified: 4, type: 'top1_best2',        unbalanced: false },
      13: { qualified: 4, type: 'top1',              unbalanced: true  },
      14: { qualified: 8, type: 'top1_best2_best3',  unbalanced: true  },
      15: { qualified: 8, type: 'top1_best2_best3',  unbalanced: false },
      16: { qualified: 8, type: 'top2',              unbalanced: false },
    }
    return configs[confirmedCount] || configs[8]
  }

  const getQualifiedCount = () => getTournamentConfig().qualified
  const getQualifiedType = () => getTournamentConfig().type
  const checkUnbalancedGroups = () => getTournamentConfig().unbalanced

  // Filtrar equipos con tipado correcto
  const teamsList = registeredTeams
    .map(t => t.team)
    .filter((team): team is Team => team !== null && team !== undefined)

  // Filtrar partidos de fase eliminatoria
  const knockoutMatches = matches.filter(m => m.is_knockout)

  return (
    <div className="space-y-6">
      
      {updating && (
        <div className="fixed top-4 right-4 z-50">
          <Badge className="bg-blue-500 animate-pulse gap-2">
            <span className="animate-spin">🔄</span> Actualizando...
          </Badge>
        </div>
      )}

      {/* ✅ Tabs con scroll horizontal en móvil */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* TabsList: scroll horizontal en móvil, grid en desktop */}
        <div className="overflow-x-auto pb-2 lg:pb-0">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-6 min-w-full lg:min-w-0">
            <TabsTrigger value="teams" className="text-xs lg:text-sm px-2 lg:px-3 py-1.5">
              <span className="hidden sm:inline">👥 Equipos</span>
              <span className="sm:hidden">👥</span>
              <span className="hidden md:inline"> ({registeredTeams.length})</span>
            </TabsTrigger>
            <TabsTrigger value="standings" disabled={tournament.status !== 'active'} className="text-xs lg:text-sm px-2 lg:px-3 py-1.5">
              <span className="hidden sm:inline">📊 Posiciones</span>
              <span className="sm:hidden">📊</span>
            </TabsTrigger>
            <TabsTrigger value="matches" disabled={tournament.status !== 'active'} className="text-xs lg:text-sm px-2 lg:px-3 py-1.5">
              <span className="hidden sm:inline">⚽ Partidos</span>
              <span className="sm:hidden">⚽</span>
              {matches.length > 0 && <span className="hidden lg:inline"> ({matches.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="groups" disabled={!canStartTournament} className="text-xs lg:text-sm px-2 lg:px-3 py-1.5">
              <span className="hidden sm:inline">👁️ Vista Previa</span>
              <span className="sm:hidden">👁️</span>
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={tournament.status !== 'draft'} className="text-xs lg:text-sm px-2 lg:px-3 py-1.5">
              <span className="hidden sm:inline">⚙️ Configuración</span>
              <span className="sm:hidden">⚙️</span>
            </TabsTrigger>
            {knockoutGenerated && (
              <TabsTrigger value="knockout" className="bg-orange-100 text-orange-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs lg:text-sm px-2 lg:px-3 py-1.5">
                <span className="hidden md:inline">🏆 Fase Eliminatoria</span>
                <span className="md:hidden">🏆</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Tab: Equipos */}
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📝 Inscripción de Equipos</CardTitle>
              <CardDescription>
                Agrega los equipos que participarán en el torneo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamRegistrationList
                availableTeams={availableTeams}
                registeredTeams={registeredTeams}
                onRegister={handleRegisterTeam}
                onRemove={handleRemoveTeam}
                onConfirm={handleConfirmTeam}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Posiciones */}
        <TabsContent value="standings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📊 Tabla de Posiciones</CardTitle>
              <CardDescription>
                Clasificación actual por grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStandings ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando tabla...</p>
                </div>
              ) : (
                <StandingsTable 
                  standings={standings}
                  qualifiedCount={getQualifiedCount()}
                  qualifiedType={getQualifiedType()}
                  hasUnbalancedGroups={checkUnbalancedGroups()}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Partidos */}
        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>⚽ Partidos del Torneo</CardTitle>
                  <CardDescription>
                    Todos los partidos programados para {tournament.name}
                  </CardDescription>
                </div>

                {tournament.status === 'active' && !knockoutGenerated && (
                  <Button
                    onClick={handleGenerateKnockout}
                    disabled={loading === 'knockout'}
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                  >
                    {loading === 'knockout' ? 'Generando...' : '🎲 Generar Fase Eliminatoria'}
                  </Button>
                )}

                {knockoutGenerated && (
                  <Badge className="bg-purple-500 gap-2 py-2 flex-wrap">
                    ✅ Fase Generada
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-xs bg-white hover:bg-gray-100 text-purple-700 border-purple-300"
                      onClick={() => setActiveTab('knockout')}
                    >
                      Ver Cuadro →
                    </Button>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingMatches ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando partidos...</p>
                </div>
              ) : (
                <MatchesList
                  matches={matches}
                  teams={teamsList}
                  tournamentName={tournament.name}
                  onMatchUpdated={handleMatchUpdated}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Vista Previa de Grupos */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>👁️ Vista Previa de Grupos</CardTitle>
              <CardDescription>
                Así quedarían organizados los grupos al iniciar el torneo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GroupsPreview
                teams={teamsList}
              />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setActiveTab('teams')} className="w-full sm:w-auto">
                ← Volver a Equipos
              </Button>
              <Button
                onClick={handleStartTournament}
                disabled={
                  !canStartTournament ||
                  loading === 'start' ||
                  tournament.status === 'active'
                }
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {loading === 'start'
                  ? 'Iniciando...'
                  : tournament.status === 'active'
                    ? '✅ Torneo Iniciado'
                    : '🚀 INICIAR TORNEO'
                }
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Configuración del Torneo</CardTitle>
              <CardDescription>
                Ajusta las reglas y parámetros del torneo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Puntos por Victoria</p>
                  <p className="text-2xl font-bold">{tournament.category?.points_win || 3}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Puntos por Empate</p>
                  <p className="text-2xl font-bold">{tournament.category?.points_draw || 1}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Equipos por Grupo</p>
                  <p className="text-2xl font-bold">{tournament.category?.teams_per_group || 4}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Mínimo de Equipos</p>
                  <p className="text-2xl font-bold">{tournament.category?.min_teams_recommended || 8}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                💡 Estas configuraciones se aplicarán automáticamente al iniciar el torneo
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab: Fase Eliminatoria */}
        <TabsContent value="knockout" className="space-y-4">
          <KnockoutBracket 
            matches={knockoutMatches}
            teams={teamsList}
            tournamentName={tournament.name}
            onMatchUpdated={handleMatchUpdated}  
          />
        </TabsContent>

      </Tabs>

      {/* Alertas */}
      {!canStartTournament && registeredTeams.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-4">
            <p className="text-yellow-800">
              ⚠️ Se necesitan al menos <strong>{tournament.category?.min_teams_recommended || 8}</strong> equipos confirmados para iniciar el torneo.
              Actualmente hay <strong>{confirmedTeams.length}</strong> confirmados.
            </p>
          </CardContent>
        </Card>
      )}

      {tournament.status === 'active' && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="py-4">
            <p className="text-green-800">
              ✅ <strong>Torneo Activo</strong> - Los partidos ya han sido generados.
              Puedes verlos en la pestaña "⚽ Partidos" y reportar resultados.
            </p>
          </CardContent>
        </Card>
      )}

      {knockoutGenerated && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="py-4">
            <p className="text-orange-800">
              🏆 <strong>Fase Eliminatoria Activa</strong> - Ve a la pestaña "🏆 Fase Eliminatoria" para ver el cuadro y reportar los partidos de eliminación directa.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}