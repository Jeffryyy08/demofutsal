// src/components/tournaments/KnockoutBracket.tsx
'use client'

import { Match, Team } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MatchReporter } from './MatchReporter'

interface KnockoutBracketProps {
    matches: Match[]
    teams: Team[]
    tournamentName: string
    onMatchUpdated?: () => void
}

export function KnockoutBracket({ matches, teams, tournamentName, onMatchUpdated }: KnockoutBracketProps) {
    // ✅ Agrupar partidos por round_number dinámicamente
    const matchesByRound = matches.reduce((acc, match) => {
        const round = match.round_number
        if (!acc[round]) acc[round] = []
        acc[round].push(match)
        return acc
    }, {} as Record<number, Match[]>)

    // ✅ Obtener rondas ordenadas
    const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b)

    // ✅ Determinar etiqueta según cantidad de partidos en la ronda
    const getRoundLabel = (roundNumber: number, matchCount: number) => {
        if (matchCount === 4) return '🔷 CUARTOS DE FINAL'
        if (matchCount === 2) return '⚔️ SEMIFINALES'
        if (matchCount === 1) return '🏆 GRAN FINAL'
        return `📋 Ronda ${roundNumber}`
    }

    const getTeamName = (teamId: string | null) => {
        if (!teamId) return '—'
        const team = teams.find(t => t.id === teamId)
        return team ? team.name : '—'
    }

    const getTeamSection = (teamId: string | null) => {
        if (!teamId) return ''
        const team = teams.find(t => t.id === teamId)
        return team ? team.section : ''
    }

    const isMatchFinished = (match: Match) => match.status === 'finished'

    // ✅ Función para renderizar una ronda de partidos
    const renderRound = (roundNumber: number, roundMatches: Match[]) => {
        const matchCount = roundMatches.length
        const roundLabel = getRoundLabel(roundNumber, matchCount)
        const isFinal = matchCount === 1

        return (
            <div key={roundNumber} className="w-full">
                <h3 className={`text-center font-bold text-lg mb-4 ${isFinal ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    {roundLabel}
                </h3>

                {/* Grid dinámico: 4 partidos = 2x2, 2 partidos = 1x2, 1 partido = centrado */}
                <div className={`grid gap-4 ${matchCount === 4 ? 'grid-cols-1 md:grid-cols-2' :
                        matchCount === 2 ? 'grid-cols-1 md:grid-cols-2' :
                            'grid-cols-1 place-items-center'
                    }`}>
                    {roundMatches.map((match, index) => (
                        <Card
                            key={match.id}
                            className={`border-2 ${isFinal
                                    ? 'border-orange-400 bg-orange-50/30'
                                    : isMatchFinished(match)
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200'
                                } ${isFinal ? 'max-w-md mx-auto' : ''}`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant={isFinal ? 'default' : 'outline'} className={isFinal ? 'bg-orange-500' : ''}>
                                        {isFinal ? 'FINAL' : `${roundLabel.includes('CUARTOS') ? 'Cuarto' : roundLabel.includes('SEMIFINALES') ? 'Semifinal' : 'Partido'} ${index + 1}`}
                                    </Badge>
                                    <MatchReporter match={match} onResultUpdated={onMatchUpdated} />
                                </div>

                                {/* Equipo A */}
                                <div className={`flex items-center justify-between p-3 rounded ${match.score_a > match.score_b && isMatchFinished(match)
                                        ? (isFinal ? 'bg-orange-100' : 'bg-green-100') + ' font-bold'
                                        : 'bg-gray-50'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{isFinal ? '👑' : ''}</span>
                                        <div>
                                            <p className="font-medium">{getTeamName(match.team_a_id)}</p>
                                            <p className="text-xs text-muted-foreground">{getTeamSection(match.team_a_id)}</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold">{match.score_a}</span>
                                </div>

                                {/* VS */}
                                <div className="text-center text-sm text-muted-foreground py-1">
                                    {isMatchFinished(match) ? 'Resultado' : 'VS'}
                                </div>

                                {/* Equipo B */}
                                <div className={`flex items-center justify-between p-3 rounded ${match.score_b > match.score_a && isMatchFinished(match)
                                        ? (isFinal ? 'bg-orange-100' : 'bg-green-100') + ' font-bold'
                                        : 'bg-gray-50'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{isFinal ? '👑' : ''}</span>
                                        <div>
                                            <p className="font-medium">{getTeamName(match.team_b_id)}</p>
                                            <p className="text-xs text-muted-foreground">{getTeamSection(match.team_b_id)}</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold">{match.score_b}</span>
                                </div>

                                {/* Estado */}
                                {isMatchFinished(match) && (
                                    <div className="mt-2 text-center">
                                        <Badge className={isFinal ? 'bg-orange-500' : 'bg-green-500'}>
                                            ✅ Finalizado
                                        </Badge>
                                        {!isFinal && roundNumber < Math.max(...rounds) && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Ganador avanza a {getRoundLabel(roundNumber + 1, matchesByRound[roundNumber + 1]?.length || 1)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-center text-2xl">
                        🏆 {tournamentName} - Fase Eliminatoria
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center gap-6">

                        {/* ✅ Renderizar todas las rondas dinámicamente */}
                        {rounds.map((roundNumber, index) => (
                            <div key={roundNumber} className="w-full flex flex-col items-center">
                                {renderRound(roundNumber, matchesByRound[roundNumber])}

                                {/* ✅ Conector visual entre rondas (excepto después de la final) */}
                                {index < rounds.length - 1 && (
                                    <div className="flex flex-col items-center my-2">
                                        <div className="w-px h-6 bg-gray-300"></div>
                                        <div className="w-24 h-px bg-gray-300"></div>
                                        <div className="w-px h-6 bg-gray-300"></div>
                                    </div>
                                )}
                            </div>
                        ))}

                    </div>
                </CardContent>
            </Card>

            {/* Leyenda */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div>
                    <span>Ganador / Finalizado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-50 border border-orange-500 rounded"></div>
                    <span>Final</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                    <span>Pendiente</span>
                </div>
            </div>
        </div>
    )
}