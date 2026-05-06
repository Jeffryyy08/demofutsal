// src/components/tournaments/StandingsTable.tsx
'use client'

import { TeamStandings } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface StandingsTableProps {
  standings: Record<string, TeamStandings[]>
  qualifiedCount?: number
  qualifiedType?: 'top2' | 'top1_best2' | 'top1_best2_best3' | 'top1'
  hasUnbalancedGroups?: boolean
}

export function StandingsTable({
  standings,
  qualifiedCount = 4,
  qualifiedType = 'top2',
  hasUnbalancedGroups = false
}: StandingsTableProps) {
  const groups = Object.keys(standings).sort()

  // Calcular cuántos equipos clasifican de cada grupo
  const getQualifiedCountPerGroup = () => {
    const totalGroups = groups.length

    if (qualifiedType === 'top2') {
      return { direct: 2, best: 0 }  // 1° y 2° de cada grupo
    } else if (qualifiedType === 'top1_best2') {
      // 1° de cada grupo + mejores 2°
      const directPerGroup = 1
      const bestSeconds = qualifiedCount - (totalGroups * directPerGroup)
      return { direct: directPerGroup, best: bestSeconds }
    } else if (qualifiedType === 'top1_best2_best3') {
      // 1°, 2° y mejores 3°
      const directPerGroup = 2  // 1° y 2°
      const bestThirds = qualifiedCount - (totalGroups * directPerGroup)
      return { direct: directPerGroup, best: bestThirds }
    } else {
      return { direct: 1, best: 0 }  // Solo 1° de cada grupo
    }
  }

  const { direct, best } = getQualifiedCountPerGroup()

  // Si no hay datos, mostrar mensaje
  if (groups.length === 0 || Object.values(standings).every(g => g.length === 0)) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-muted-foreground font-medium">
            No hay equipos confirmados en el torneo aún
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Los equipos deben estar confirmados para aparecer en la tabla de posiciones.
            <br />
            Las estadísticas se actualizarán automáticamente al finalizar partidos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const groupStandings = standings[group]

        return (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Grupo {group}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">Pos</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead className="text-center">PJ</TableHead>
                      <TableHead className="text-center">PG</TableHead>
                      <TableHead className="text-center">PE</TableHead>
                      <TableHead className="text-center">PP</TableHead>
                      <TableHead className="text-center">GF</TableHead>
                      <TableHead className="text-center">GC</TableHead>
                      <TableHead className="text-center">DG</TableHead>
                      <TableHead className="text-center font-bold">PTS</TableHead>
                      <TableHead className="text-center">Forma</TableHead>
                      {/* ✅ Nueva columna: Estado de clasificación */}
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupStandings.map((team, index) => {
                      const position = index + 1
                      const isDirectQualified = position <= direct
                      const isPotentialBest = position === direct + 1 && best > 0

                      // ✅ Determinar color de fondo
                      let rowClass = ''

                      if (isDirectQualified) {
                        rowClass = 'bg-green-50 hover:bg-green-100'
                      } else if (isPotentialBest) {
                        rowClass = 'bg-yellow-50 hover:bg-yellow-100'
                      }

                      return (
                        <TableRow
                          key={team.team_id}
                          className={rowClass}
                        >
                          <TableCell className="text-center font-bold">
                            {getPositionBadge(position)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{team.team_name}</p>
                              <p className="text-xs text-muted-foreground">{team.section}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{team.matches_played}</TableCell>
                          <TableCell className="text-center">{team.wins}</TableCell>
                          <TableCell className="text-center">{team.draws}</TableCell>
                          <TableCell className="text-center">{team.losses}</TableCell>
                          <TableCell className="text-center">{team.goals_for}</TableCell>
                          <TableCell className="text-center">{team.goals_against}</TableCell>
                          <TableCell className="text-center">
                            {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                          </TableCell>
                          <TableCell className="text-center font-bold text-lg">
                            {team.points}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              {team.form.slice(-5).map((result, i) => (
                                <Badge
                                  key={i}
                                  variant={
                                    result === 'W' ? 'default' :
                                      result === 'D' ? 'secondary' : 'destructive'
                                  }
                                  className="w-6 h-6 p-0 flex items-center justify-center text-xs"
                                >
                                  {result}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          {/* ✅ Nueva celda: Estado de clasificación */}
                          <TableCell className="text-center">
                            {isDirectQualified ? (
                              <Badge className="bg-green-500 hover:bg-green-600 text-xs px-2 py-1">
                                ✅ Clasifica
                              </Badge>
                            ) : isPotentialBest ? (
                              <Badge variant="outline" className="text-yellow-700 border-yellow-400 text-xs px-2 py-1">
                                ⚠️ Posible
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Leyenda */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-200 rounded"></div>
                  <span>Clasifica directo ({direct}° de grupo)</span>
                </div>
                {best > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                    <span>Posible mejor {direct + 1}° ({best} clasifican)</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Badge className="w-6 h-6 p-0 text-xs">W</Badge>
                  <span>Ganado</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="w-6 h-6 p-0 text-xs">D</Badge>
                  <span>Empate</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="destructive" className="w-6 h-6 p-0 text-xs">L</Badge>
                  <span>Perdido</span>
                </div>
              </div>

              {/* Info de clasificación */}
              <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-800">
                🎯 Clasifican: <strong>{direct}° de cada grupo</strong>
                {best > 0 && <span> + <strong>{best} mejor(es) {direct + 1}°</strong> por promedio</span>}
                {hasUnbalancedGroups && best > 0 && (  // ✅ BIEN: Solo si hay desbalance Y se comparan mejores
                  <span> ⚠️ (Se usa promedio de puntos por grupos desbalanceados)</span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function getPositionBadge(position: number) {
  if (position === 1) return '🥇'
  if (position === 2) return '🥈'
  if (position === 3) return '🥉'
  return position
}