// src/components/tournaments/GroupsPreview.tsx
'use client'

import { Team } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GroupsPreviewProps {
  teams: Team[]
}

// ✅ Configuración dinámica aprobada por el profesor
const TOURNAMENT_CONFIGS: Record<number, {
  groups: number
  distribution: number[]
  qualified: number
  qualifiedType: 'top2' | 'top1_best2' | 'top1_best2_best3' | 'top1'
  finalPhase: 'semifinales' | 'cuartos'
  note?: string
}> = {
  8: {
    groups: 2,
    distribution: [4, 4],
    qualified: 4,
    qualifiedType: 'top2',
    finalPhase: 'semifinales'
  },
  9: {
    groups: 3,
    distribution: [3, 3, 3],
    qualified: 4,
    qualifiedType: 'top1_best2',
    finalPhase: 'semifinales'
  },
  10: {
    groups: 2,
    distribution: [5, 5],
    qualified: 4,
    qualifiedType: 'top2',
    finalPhase: 'semifinales'
  },
  11: {
    groups: 3,
    distribution: [4, 4, 3],
    qualified: 4,
    qualifiedType: 'top1_best2',
    finalPhase: 'semifinales',
    note: 'El grupo C juega 1 partido menos'
  },
  12: {
    groups: 3,
    distribution: [4, 4, 4],
    qualified: 4,
    qualifiedType: 'top1_best2',
    finalPhase: 'semifinales'
  },
  13: {
    groups: 4,
    distribution: [4, 3, 3, 3],
    qualified: 4,
    qualifiedType: 'top1',
    finalPhase: 'semifinales',
    note: 'Grupos desbalanceados: se usa promedio de puntos'
  },
  14: {
    groups: 3,
    distribution: [5, 5, 4],
    qualified: 8,
    qualifiedType: 'top1_best2_best3',
    finalPhase: 'cuartos',
    note: 'Clasifican 1°, 2° y dos mejores 3° por promedio'
  },
  15: {
    groups: 3,
    distribution: [5, 5, 5],
    qualified: 8,
    qualifiedType: 'top1_best2_best3',
    finalPhase: 'cuartos'
  },
  16: {
    groups: 4,
    distribution: [4, 4, 4, 4],
    qualified: 8,
    qualifiedType: 'top2',
    finalPhase: 'cuartos'
  }
}

// ✅ Función para obtener la configuración según cantidad de equipos
function getTournamentConfig(teamCount: number) {
  // Si está en la configuración exacta, retornarla
  if (TOURNAMENT_CONFIGS[teamCount]) {
    return TOURNAMENT_CONFIGS[teamCount]
  }
  
  // Si es menos de 8, usar configuración de 8 como mínimo
  if (teamCount < 8) {
    return {
      ...TOURNAMENT_CONFIGS[8],
      note: `Mínimo 8 equipos requeridos. Actualmente: ${teamCount}`
    }
  }
  
  // Si es más de 16, usar configuración de 16 como máximo
  if (teamCount > 16) {
    return {
      ...TOURNAMENT_CONFIGS[16],
      note: `Máximo 16 equipos soportados. Actualmente: ${teamCount}`
    }
  }
  
  // Para números intermedios no configurados, usar la configuración más cercana
  const closest = Object.keys(TOURNAMENT_CONFIGS)
    .map(Number)
    .sort((a, b) => Math.abs(a - teamCount) - Math.abs(b - teamCount))[0]
  
  return {
    ...TOURNAMENT_CONFIGS[closest],
    note: `Configuración aproximada para ${teamCount} equipos`
  }
}

// ✅ Función para distribuir equipos en grupos
function distributeTeamsInGroups(teams: Team[], distribution: number[]): { group_label: string; teams: Team[] }[] {
  const groups: { group_label: string; teams: Team[] }[] = []
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  let teamIndex = 0
  
  // Ordenar equipos por sección para distribución consistente
  const sortedTeams = [...teams].sort((a, b) => {
    if (a.section !== b.section) return a.section.localeCompare(b.section)
    return a.name.localeCompare(b.name)
  })
  
  distribution.forEach((count, index) => {
    const groupTeams = sortedTeams.slice(teamIndex, teamIndex + count)
    groups.push({
      group_label: labels[index],
      teams: groupTeams
    })
    teamIndex += count
  })
  
  return groups
}

// ✅ Función para explicar cómo clasifican los equipos
function getQualificationExplanation(config: ReturnType<typeof getTournamentConfig>): string {
  switch (config.qualifiedType) {
    case 'top2':
      return `Clasifican: 1° y 2° de cada grupo → ${config.qualified} equipos a ${config.finalPhase}`
    case 'top1_best2':
      return `Clasifican: 1° de cada grupo + mejor 2° (por promedio de puntos) → ${config.qualified} equipos a ${config.finalPhase}`
    case 'top1_best2_best3':
      return `Clasifican: 1°, 2° y dos mejores 3° (por promedio de puntos) → ${config.qualified} equipos a ${config.finalPhase}`
    case 'top1':
      return `Clasifican: 1° de cada grupo → ${config.qualified} equipos a ${config.finalPhase}`
    default:
      return ''
  }
}

export function GroupsPreview({ teams }: GroupsPreviewProps) {
  const teamCount = teams.length
  const config = getTournamentConfig(teamCount)
  const groups = distributeTeamsInGroups(teams, config.distribution)
  
  // Calcular partidos totales (cada grupo: n*(n-1)/2 partidos)
  const totalMatches = groups.reduce((sum, group) => {
    const n = group.teams.length
    return sum + (n * (n - 1)) / 2
  }, 0)
  
  // Calcular rondas (cada equipo juega contra los demás del grupo)
  const maxRounds = Math.max(...config.distribution.map(n => n - 1))
  
  // Estimación de días (1 partido por día)
  const estimatedDays = totalMatches

  if (teamCount === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">👥</p>
        <p className="text-muted-foreground">
          No hay equipos confirmados para mostrar la vista previa
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Confirma equipos para ver la distribución de grupos
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* ✅ Banner de configuración aprobada */}
      <Alert className="bg-green-50 border-green-300">
        <AlertDescription className="text-green-800">
          ✅ Distribución aprobada por el profesor • {teamCount} equipos confirmados
        </AlertDescription>
      </Alert>

      {/* ✅ Estadísticas dinámicas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{config.groups}</p>
            <p className="text-sm text-muted-foreground">Grupos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalMatches}</p>
            <p className="text-sm text-muted-foreground">Partidos de Grupos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{config.qualified}</p>
            <p className="text-sm text-muted-foreground">Clasifican a {config.finalPhase}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{estimatedDays}</p>
            <p className="text-sm text-muted-foreground">Días Estimados</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Explicación de clasificación */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="font-medium text-blue-900">
            🎯 {getQualificationExplanation(config)}
          </p>
          {config.qualifiedType.includes('best') && (
            <p className="text-sm text-blue-700 mt-1">
              💡 Para grupos desbalanceados, se compara por <strong>promedio de puntos</strong> (puntos ÷ partidos jugados)
            </p>
          )}
        </CardContent>
      </Card>

      {/* ✅ Alerta si hay grupos desbalanceados */}
      {config.note && (
        <Alert className="bg-yellow-50 border-yellow-300">
          <AlertDescription className="text-yellow-800 text-sm">
            ⚠️ {config.note}
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ Grupos con distribución visual */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group, index) => {
          const groupSize = config.distribution[index]
          const isUnbalanced = group.teams.length < Math.max(...config.distribution)
          
          return (
            <Card key={group.group_label} className={isUnbalanced ? 'border-orange-300' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Grupo {group.group_label}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{group.teams.length} equipos</Badge>
                    {isUnbalanced && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        ⚖️
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.teams.map((team, teamIndex) => (
                    <div 
                      key={team.id} 
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-4">
                          {teamIndex + 1}.
                        </span>
                        <span className="text-sm font-medium">{team.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{team.section}</span>
                    </div>
                  ))}
                </div>
                
                {/* Partidos que juega este grupo */}
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {group.teams.length} equipos → {((group.teams.length * (group.teams.length - 1)) / 2)} partidos
                </p>
                
                {/* Si el grupo es más pequeño, mostrar advertencia */}
                {isUnbalanced && (
                  <p className="text-xs text-orange-600 mt-2 text-center">
                    Este grupo juega {(group.teams.length - 1)} partidos (1 menos que los grupos grandes)
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ✅ Leyenda de colores y símbolos */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="w-6 h-6 p-0 text-xs">1°</Badge>
          <span>Clasifica directo</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="w-6 h-6 p-0 text-xs">2°</Badge>
          <span>Puede clasificar como mejor 2°</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-orange-600">⚖️</span>
          <span>Grupo desbalanceado</span>
        </div>
      </div>

    </div>
  )
}