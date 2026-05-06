// src/components/tournaments/MatchesList.tsx
'use client'

import { Match, Team } from '@/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MatchReporter } from './MatchReporter'

interface MatchesListProps {
  matches: Match[]
  teams: Team[]
  tournamentName: string
  onMatchUpdated?: () => void
}

export function MatchesList({ matches, teams, tournamentName, onMatchUpdated }: MatchesListProps) {
  // ✅ Separar partidos de fase de grupos vs fase eliminatoria
  const groupMatches = matches.filter(m => !m.is_knockout)
  const knockoutMatches = matches.filter(m => m.is_knockout)

  // Agrupar partidos de grupos por group_label
  const matchesByGroup = groupMatches.reduce((acc, match) => {
    const teamA = teams.find(t => t.id === match.team_a_id)
    const teamB = teams.find(t => t.id === match.team_b_id)

    const groupLabel = match.group_label || teamA?.group_label || teamB?.group_label || 'Sin grupo'

    if (!acc[groupLabel]) {
      acc[groupLabel] = []
    }
    acc[groupLabel].push({ ...match, teamA, teamB })

    return acc
  }, {} as Record<string, Array<Match & { teamA?: Team; teamB?: Team }>>)

  // Ordenar grupos
  const sortedGroups = Object.keys(matchesByGroup).sort((a, b) => {
    if (a.length === 1 && b.length === 1) {
      return a.localeCompare(b)
    }
    return a.localeCompare(b)
  })

  // Contar grupos reales
  const realGroupsCount = sortedGroups.filter(g => g !== 'Sin grupo' && g !== 'null').length

  // Si NO hay partidos de grupos (solo eliminatoria)
  if (groupMatches.length === 0 && knockoutMatches.length > 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-4xl">🏆</p>
          <p className="text-lg font-medium text-muted-foreground">
            Fase de Grupos Finalizada
          </p>
          <p className="text-sm text-muted-foreground">
            Los partidos de fase eliminatoria se muestran en la pestaña dedicada.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => {
            const knockoutTab = document.querySelector('[value="knockout"]') as HTMLElement
            if (knockoutTab) {
              knockoutTab.click()
            }
          }}>
            🏆 Ver Cuadro Eliminatoria →
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Si no hay partidos de ningún tipo
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-muted-foreground">No hay partidos programados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Los partidos se generarán automáticamente al iniciar el torneo
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">

      {/* ✅ Banner informativo si hay partidos de eliminatoria */}
      {knockoutMatches.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <p className="text-sm text-orange-800">
                <strong>{knockoutMatches.length}</strong> partidos de fase eliminatoria disponibles.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-white text-orange-700 border-orange-300 hover:bg-orange-100"
              onClick={() => {
                const knockoutTab = document.querySelector('[value="knockout"]') as HTMLElement
                if (knockoutTab) {
                  knockoutTab.click()
                }
              }}
            >
              Ver Cuadro →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas de fase de grupos */}
      {groupMatches.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{groupMatches.length}</p>
              <p className="text-sm text-muted-foreground">Partidos de Grupos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{realGroupsCount}</p>
              <p className="text-sm text-muted-foreground">Grupos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {groupMatches.filter(m => m.status === 'scheduled').length}
              </p>
              <p className="text-sm text-muted-foreground">Por Jugar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {groupMatches.filter(m => m.status === 'finished').length}
              </p>
              <p className="text-sm text-muted-foreground">Finalizados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs por grupo - SOLO si hay partidos de grupos */}
      {groupMatches.length > 0 && (
        <Tabs defaultValue={sortedGroups[0]} className="space-y-4">
          <TabsList className="flex flex-wrap">
            {sortedGroups.map((group) => (
              <TabsTrigger key={group} value={group}>
                Grupo {group}
              </TabsTrigger>
            ))}
          </TabsList>

          {sortedGroups.map((group) => (
            <TabsContent key={group} value={group} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchesByGroup[group].map((match) => (
                  // ✅ PASAR onMatchUpdated a MatchCard
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    onMatchUpdated={onMatchUpdated}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

// ✅ MatchCard ahora recibe onMatchUpdated como prop
interface MatchCardProps {
  match: Match & { teamA?: Team; teamB?: Team }
  onMatchUpdated?: () => void
}

function MatchCard({ match, onMatchUpdated }: MatchCardProps) {
  const getStatusBadge = () => {
    switch (match.status) {
      case 'scheduled':
        return <Badge variant="secondary">📅 Programado</Badge>
      case 'live':
        return <Badge className="bg-red-500 hover:bg-red-600">🔴 EN VIVO</Badge>
      case 'finished':
        return <Badge className="bg-green-500 hover:bg-green-600">✅ Finalizado</Badge>
      case 'postponed':
        return <Badge variant="outline">⏸️ Pospuesto</Badge>
      case 'cancelled':
        return <Badge variant="destructive">❌ Cancelado</Badge>
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {formatDate(match.match_date)}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Equipo A */}
          <div className="flex items-center justify-between">
            <span className="font-medium">{match.teamA?.name || 'TBD'}</span>
            {match.status === 'finished' && (
              <span className="text-xl font-bold">{match.score_a ?? '-'}</span>
            )}
          </div>

          {/* VS */}
          <div className="text-center text-muted-foreground text-sm py-2 border-y">
            {match.status === 'finished' ? 'Resultado Final' : 'VS'}
          </div>

          {/* Equipo B */}
          <div className="flex items-center justify-between">
            <span className="font-medium">{match.teamB?.name || 'TBD'}</span>
            {match.status === 'finished' && (
              <span className="text-xl font-bold">{match.score_b ?? '-'}</span>
            )}
          </div>

          {/* Info adicional */}
          {match.location && (
            <p className="text-xs text-muted-foreground">
              📍 {match.location}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {/* ✅ PASAR onMatchUpdated a MatchReporter */}
        <MatchReporter
          match={match}
          onResultUpdated={onMatchUpdated}
        />
      </CardFooter>
    </Card>
  )
}