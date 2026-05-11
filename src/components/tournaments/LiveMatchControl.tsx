// src/components/tournaments/LiveMatchControl.tsx
'use client'

import { useState, useEffect } from 'react'
import { Match, Team } from '@/types'
import { supabase } from '@/lib/supabase'
import { addMatchEventAction } from '@/actions/match-live'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { registerYellowCardAction } from '@/actions/players'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AnimatedCard } from '@/components/ui/AnimatedCard'

interface LiveMatchControlProps {
  match: Match & { teamA?: Team; teamB?: Team }
  onClose: () => void
}

interface MatchEvent {
  id: string
  type: 'goal' | 'yellow_card' | 'red_card' | 'foul'
  team_id: string
  team_name: string
  team_section: string
  minute: number
  player_id?: string
  player_name?: string
  description: string
}

interface Player {
  id: string
  name: string
}

export function LiveMatchControl({ match, onClose }: LiveMatchControlProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [period, setPeriod] = useState(1)
  const [scoreA, setScoreA] = useState(match.score_a || 0)
  const [scoreB, setScoreB] = useState(match.score_b || 0)
  const [events, setEvents] = useState<MatchEvent[]>([])

  // Tarjetas y faltas
  const [teamAStats, setTeamAStats] = useState({
    yellow_cards: match.team_a_yellow_cards || 0,
    red_cards: match.team_a_red_cards || 0,
    fouls: match.team_a_fouls || 0,
  })
  const [teamBStats, setTeamBStats] = useState({
    yellow_cards: match.team_b_yellow_cards || 0,
    red_cards: match.team_b_red_cards || 0,
    fouls: match.team_b_fouls || 0,
  })

  // Jugadores
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([])
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([])

  // Estados del diálogo
  const [showActionDialog, setShowActionDialog] = useState<{
    type: 'goal' | 'yellow' | 'red' | 'foul'
  } | null>(null)

  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState('')

  // Alertas
  const [showFoulAlert, setShowFoulAlert] = useState(false)

  const teamA = match.teamA
  const teamB = match.teamB

  // ✅ Cargar SOLO jugadores presentes al montar
  useEffect(() => {
    const loadPresentPlayers = async () => {
      const { data: presentAttendances } = await supabase
        .from('match_attendances')
        .select('player_id, team_id')
        .eq('match_id', match.id)
        .eq('is_present', true)

      const presentPlayerIds = presentAttendances?.map(a => a.player_id) || []

      if (teamA?.id) {
        const { data: playersA } = await supabase
          .from('players')
          .select('id, full_name')
          .eq('team_id', teamA.id)
          .in('id', presentPlayerIds)
          .order('full_name')

        if (playersA) {
          const transformedPlayers = playersA.map(p => ({
            id: p.id,
            name: p.full_name
          }))
          setTeamAPlayers(transformedPlayers)
        }
      }

      if (teamB?.id) {
        const { data: playersB } = await supabase
          .from('players')
          .select('id, full_name')
          .eq('team_id', teamB.id)
          .in('id', presentPlayerIds)
          .order('full_name')

        if (playersB) {
          const transformedPlayers = playersB.map(p => ({
            id: p.id,
            name: p.full_name
          }))
          setTeamBPlayers(transformedPlayers)
        }
      }
    }

    loadPresentPlayers()
  }, [teamA?.id, teamB?.id, match.id])

  // Cronómetro
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const addEvent = (type: MatchEvent['type'], teamId: string, teamName: string, teamSection: string, description: string, playerId?: string, playerName?: string) => {
    const event: MatchEvent = {
      id: Date.now().toString(),
      type,
      team_id: teamId,
      team_name: teamName,
      team_section: teamSection,
      minute: Math.floor(currentTime / 60) + 1,
      player_id: playerId,
      player_name: playerName,
      description,
    }
    setEvents(prev => [event, ...prev])
  }

  const handleTeamSelect = async (team: 'A' | 'B') => {
    setSelectedTeam(team)

    if (showActionDialog?.type === 'foul') {
      await handleFoulConfirm(team)
      return
    }
  }

  const handleFoulConfirm = async (team: 'A' | 'B') => {
    const teamName = team === 'A' ? teamA?.name : teamB?.name
    const teamSection = team === 'A' ? teamA?.section : teamB?.section
    const teamId = team === 'A' ? match.team_a_id : match.team_b_id
    const currentFouls = team === 'A' ? teamAStats.fouls : teamBStats.fouls
    const newFouls = currentFouls + 1

    if (newFouls === 5) {
      setShowFoulAlert(true)
      setTimeout(() => setShowFoulAlert(false), 5000)
    }

    if (team === 'A') {
      setTeamAStats(prev => ({ ...prev, fouls: prev.fouls + 1 }))
    } else {
      setTeamBStats(prev => ({ ...prev, fouls: prev.fouls + 1 }))
    }

    addEvent('foul', teamId || '', teamName || '', teamSection || '', '📋 Falta')

    await supabase
      .from('matches')
      .update({
        team_a_fouls: team === 'A' ? teamAStats.fouls + 1 : teamAStats.fouls,
        team_b_fouls: team === 'B' ? teamBStats.fouls + 1 : teamBStats.fouls,
      })
      .eq('id', match.id)

    setShowActionDialog(null)
    setSelectedTeam(null)
  }

  const handlePlayerConfirm = async () => {
    if (!selectedTeam || !selectedPlayer || !showActionDialog) return

    const players = selectedTeam === 'A' ? teamAPlayers : teamBPlayers
    const player = players.find(p => p.id === selectedPlayer)
    const playerName = player?.name || selectedPlayer

    const teamName = selectedTeam === 'A' ? teamA?.name : teamB?.name
    const teamSection = selectedTeam === 'A' ? teamA?.section : teamB?.section
    const teamId = selectedTeam === 'A' ? match.team_a_id : match.team_b_id

    switch (showActionDialog.type) {
      case 'goal':
        if (selectedTeam === 'A') {
          setScoreA(prev => prev + 1)
        } else {
          setScoreB(prev => prev + 1)
        }

        addEvent('goal', teamId || '', teamName || '', teamSection || '', '⚽ Gol', player?.id, playerName)

        await supabase
          .from('matches')
          .update({
            score_a: selectedTeam === 'A' ? scoreA + 1 : scoreA,
            score_b: selectedTeam === 'B' ? scoreB + 1 : scoreB,
          })
          .eq('id', match.id)
        break

      case 'yellow':
        if (selectedTeam === 'A') {
          setTeamAStats(prev => ({ ...prev, yellow_cards: prev.yellow_cards + 1 }))
        } else {
          setTeamBStats(prev => ({ ...prev, yellow_cards: prev.yellow_cards + 1 }))
        }

        addEvent('yellow_card', teamId || '', teamName || '', teamSection || '', '🟨 Tarjeta Amarilla', player?.id, playerName)

        await supabase
          .from('matches')
          .update({
            team_a_yellow_cards: selectedTeam === 'A' ? teamAStats.yellow_cards + 1 : teamAStats.yellow_cards,
            team_b_yellow_cards: selectedTeam === 'B' ? teamBStats.yellow_cards + 1 : teamBStats.yellow_cards,
          })
          .eq('id', match.id)

        await registerYellowCardAction(
          match.tournament_id || '',
          player?.id || '',
          teamId || '',
          match.id,
          'cash'
        )

        break

      case 'red':
        if (selectedTeam === 'A') {
          setTeamAStats(prev => ({ ...prev, red_cards: prev.red_cards + 1 }))
        } else {
          setTeamBStats(prev => ({ ...prev, red_cards: prev.red_cards + 1 }))
        }

        addEvent('red_card', teamId || '', teamName || '', teamSection || '', '🟥 Tarjeta Roja', player?.id, playerName)

        await supabase
          .from('matches')
          .update({
            team_a_red_cards: selectedTeam === 'A' ? teamAStats.red_cards + 1 : teamAStats.red_cards,
            team_b_red_cards: selectedTeam === 'B' ? teamBStats.red_cards + 1 : teamBStats.red_cards,
          })
          .eq('id', match.id)

        await addMatchEventAction({
          match_id: match.id,
          event_type: 'red_card',
          team_id: teamId || '',
          player_id: player?.id || null,
          player_name: playerName || null,
          minute: Math.floor(currentTime / 60) + 1,
          extra_minute: 0,
          description: `🟥 Tarjeta Roja - ${playerName || 'Jugador'}`,
        })
        break
    }

    setShowActionDialog(null)
    setSelectedTeam(null)
    setSelectedPlayer('')
  }

  const handleFinishPeriod = async () => {
    if (period === 1) {
      setPeriod(2)
      setCurrentTime(0)
      setIsRunning(false)
    } else {
      await supabase
        .from('matches')
        .update({
          status: 'finished',
          score_a: scoreA,
          score_b: scoreB,
        })
        .eq('id', match.id)
      onClose()
    }
  }

  const getCurrentPlayers = () => selectedTeam === 'A' ? teamAPlayers : teamBPlayers

  const getActionTitle = () => {
    if (!showActionDialog) return ''
    switch (showActionDialog.type) {
      case 'goal': return '⚽ Registrar Gol'
      case 'yellow': return '🟨 Tarjeta Amarilla'
      case 'red': return '🟥 Tarjeta Roja'
      case 'foul': return '📋 Registrar Falta'
    }
  }

  const getActionIcon = () => {
    if (!showActionDialog) return ''
    switch (showActionDialog.type) {
      case 'goal': return '⚽'
      case 'yellow': return '🟨'
      case 'red': return '🟥'
      case 'foul': return '📋'
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header con Gradiente FutsalCTP */}
      <header 
        className="py-6 px-gutter text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 50%, #0038b6 100%)',
          boxShadow: '0 4px 20px rgba(0, 62, 199, 0.3)'
        }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#fe6b00] rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-2">
                <span className="text-3xl">⚽</span>
                Control en Vivo
              </h1>
              <p className="text-blue-100 font-body mt-1">
                {teamA?.name} <span className="mx-2">vs</span> {teamB?.name}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-full px-4 py-2 border-white/30 text-white hover:bg-white/20 transition-colors"
            >
              ✕ Cerrar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* Alerta de 5ta Falta */}
        {showFoulAlert && (
          <AnimatedCard animation="slide-up" className="bg-[#fe6b00]/10 border border-[#fe6b00]/30">
            <Alert className="bg-transparent border-0 p-0">
              <AlertDescription className="text-[#fe6b00] font-bold font-heading flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                ¡ALERTA! 5ta Falta Acumulada
              </AlertDescription>
              <p className="text-[#fe6b00]/80 font-body text-sm mt-1">
                ⚠️ La próxima falta (6ta) será DOBLE PENALTI
              </p>
            </Alert>
          </AnimatedCard>
        )}

        {/* Marcador Principal */}
        <AnimatedCard animation="scale-in" className="overflow-hidden">
          <div 
            className="p-6 md:p-8 text-white relative"
            style={{
              background: 'linear-gradient(135deg, #003ec7 0%, #0038b6 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#fe6b00] rounded-full blur-3xl" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 md:gap-8 items-center relative z-10">
              {/* Equipo A */}
              <div className="text-center space-y-2">
                <h2 className="text-lg md:text-xl font-bold font-heading">{teamA?.name}</h2>
                <div className="text-xs text-blue-200 font-body">{teamA?.section}</div>
                <div className="text-5xl md:text-7xl font-bold font-mono">
                  {scoreA}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs flex-wrap">
                  <Badge className="bg-[#fe6b00]/20 text-[#fe6b00] border border-[#fe6b00]/30 font-body">
                    🟨 {teamAStats.yellow_cards}
                  </Badge>
                  <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 font-body">
                    🟥 {teamAStats.red_cards}
                  </Badge>
                  <Badge className="bg-white/10 text-white/80 border border-white/20 font-body">
                    ⚽ {teamAStats.fouls}
                  </Badge>
                </div>
              </div>

              {/* Marcador Central */}
              <div className="text-center space-y-3">
                <div className="text-4xl md:text-6xl font-mono font-bold text-[#fe6b00]">
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm text-blue-200 font-body">
                  {period === 1 ? '1er Tiempo' : '2do Tiempo'}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsRunning(!isRunning)}
                    className={`rounded-full px-4 font-heading text-label-caps text-xs transition-all ${
                      isRunning 
                        ? 'bg-[#fe6b00] hover:bg-[#fe6b00]/90' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {isRunning ? '⏸️ Pausa' : '▶️ Iniciar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentTime(0)
                      setIsRunning(false)
                    }}
                    className="rounded-full px-3 border-white/30 text-white hover:bg-white/20 text-xs"
                  >
                    🔄
                  </Button>
                </div>
              </div>

              {/* Equipo B */}
              <div className="text-center space-y-2">
                <h2 className="text-lg md:text-xl font-bold font-heading">{teamB?.name}</h2>
                <div className="text-xs text-blue-200 font-body">{teamB?.section}</div>
                <div className="text-5xl md:text-7xl font-bold font-mono">
                  {scoreB}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs flex-wrap">
                  <Badge className="bg-[#fe6b00]/20 text-[#fe6b00] border border-[#fe6b00]/30 font-body">
                    🟨 {teamBStats.yellow_cards}
                  </Badge>
                  <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 font-body">
                    🟥 {teamBStats.red_cards}
                  </Badge>
                  <Badge className="bg-white/10 text-white/80 border border-white/20 font-body">
                    ⚽ {teamBStats.fouls}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Botones de Control */}
        <AnimatedCard animation="slide-up" delay={0.1}>
          <div className="p-4 space-y-4">
            
            {/* Botones de período */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={handleFinishPeriod}
                variant="outline"
                className="rounded-full px-4 py-2 border-[#003ec7] text-[#003ec7] hover:bg-[#003ec7]/5 font-heading text-label-caps text-xs"
              >
                {period === 1 ? '⏭️ Finalizar 1er Tiempo' : '🏁 Finalizar Partido'}
              </Button>
              <Button
                onClick={async () => {
                  await supabase
                    .from('matches')
                    .update({ status: 'finished', score_a: scoreA, score_b: scoreB })
                    .eq('id', match.id)
                  onClose()
                }}
                variant="outline"
                className="rounded-full px-4 py-2 border-red-500 text-red-500 hover:bg-red-500/5 font-heading text-label-caps text-xs"
              >
                🚫 Finalizar
              </Button>
            </div>

            {/* Botones de Acciones - Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                onClick={() => setShowActionDialog({ type: 'goal' })}
                className="h-20 rounded-xl font-heading text-label-caps text-xs bg-gradient-primary hover:shadow-glow transition-all"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">⚽</span>
                  <span>Gol</span>
                </div>
              </Button>

              <Button
                onClick={() => setShowActionDialog({ type: 'yellow' })}
                className="h-20 rounded-xl font-heading text-label-caps text-xs bg-[#fe6b00]/10 text-[#fe6b00] hover:bg-[#fe6b00]/20 border border-[#fe6b00]/30 transition-all"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">🟨</span>
                  <span>Amarilla</span>
                </div>
              </Button>

              <Button
                onClick={() => setShowActionDialog({ type: 'red' })}
                className="h-20 rounded-xl font-heading text-label-caps text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 transition-all"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">🟥</span>
                  <span>Roja</span>
                </div>
              </Button>

              <Button
                onClick={() => setShowActionDialog({ type: 'foul' })}
                variant="outline"
                className="h-20 rounded-xl font-heading text-label-caps text-xs border-outline-variant/30 hover:bg-surface-container-low transition-all"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">📋</span>
                  <span>Falta</span>
                </div>
              </Button>
            </div>

          </div>
        </AnimatedCard>

        {/* Historial de Eventos */}
        <AnimatedCard animation="slide-up" delay={0.2}>
          <div className="p-4">
            <h3 className="font-heading text-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="text-xl">📜</span>
              Historial de Eventos
            </h3>

            {events.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <div className="text-4xl mb-3">📝</div>
                <p className="font-body">No hay eventos registrados aún</p>
                <p className="text-xs mt-1">Los eventos aparecerán aquí a medida que ocurran</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${
                      event.type === 'goal' 
                        ? 'bg-green-500/5 border-green-500' 
                        : event.type === 'yellow_card'
                        ? 'bg-[#fe6b00]/5 border-[#fe6b00]'
                        : event.type === 'red_card'
                        ? 'bg-red-500/5 border-red-500'
                        : 'bg-surface-container-low border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-mono font-bold text-on-surface-variant">
                        {event.minute}'
                      </div>
                      <div>
                        <div className="font-body text-body-sm text-on-surface font-medium">
                          {event.description}
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          {event.team_name} {event.player_name && `• ${event.player_name}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl">
                      {event.type === 'goal' && '⚽'}
                      {event.type === 'yellow_card' && '🟨'}
                      {event.type === 'red_card' && '🟥'}
                      {event.type === 'foul' && '📋'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnimatedCard>

      </main>

      {/* Diálogo para FALTAS */}
      <Dialog open={showActionDialog?.type === 'foul'} onOpenChange={() => {
        setShowActionDialog(null)
        setSelectedTeam(null)
      }}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {/* Header */}
          <div 
            className="p-4 text-white"
            style={{ background: 'linear-gradient(135deg, #003ec7 0%, #0038b6 100%)' }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-heading flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Registrar Falta
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleFoulConfirm('A')}
                className="h-24 rounded-xl font-heading text-label-caps bg-[#003ec7]/10 text-[#003ec7] hover:bg-[#003ec7]/20 border border-[#003ec7]/30 transition-all"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl">👕</span>
                  <span className="text-sm font-medium">{teamA?.name}</span>
                  <span className="text-xs text-on-surface-variant">{teamA?.section}</span>
                </div>
              </Button>

              <Button
                onClick={() => handleFoulConfirm('B')}
                className="h-24 rounded-xl font-heading text-label-caps bg-[#003ec7]/10 text-[#003ec7] hover:bg-[#003ec7]/20 border border-[#003ec7]/30 transition-all"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl">👕</span>
                  <span className="text-sm font-medium">{teamB?.name}</span>
                  <span className="text-xs text-on-surface-variant">{teamB?.section}</span>
                </div>
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowActionDialog(null)
                setSelectedTeam(null)
              }}
              className="w-full rounded-full font-heading text-label-caps text-xs"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para GOL/TARJETAS */}
      <Dialog open={showActionDialog !== null && showActionDialog.type !== 'foul'} onOpenChange={() => {
        setShowActionDialog(null)
        setSelectedTeam(null)
        setSelectedPlayer('')
      }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          {/* Header */}
          <div 
            className="p-4 text-white"
            style={{ background: 'linear-gradient(135deg, #003ec7 0%, #0038b6 100%)' }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-heading flex items-center gap-2">
                <span className="text-2xl">{getActionIcon()}</span>
                {getActionTitle()}
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-4 space-y-4">
            {!selectedTeam ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setSelectedTeam('A')}
                  className="h-24 rounded-xl font-heading text-label-caps bg-[#003ec7]/10 text-[#003ec7] hover:bg-[#003ec7]/20 border border-[#003ec7]/30 transition-all"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl">👕</span>
                    <span className="text-sm font-medium">{teamA?.name}</span>
                    <span className="text-xs text-on-surface-variant">{teamA?.section}</span>
                  </div>
                </Button>

                <Button
                  onClick={() => setSelectedTeam('B')}
                  className="h-24 rounded-xl font-heading text-label-caps bg-[#003ec7]/10 text-[#003ec7] hover:bg-[#003ec7]/20 border border-[#003ec7]/30 transition-all"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl">👕</span>
                    <span className="text-sm font-medium">{teamB?.name}</span>
                    <span className="text-xs text-on-surface-variant">{teamB?.section}</span>
                  </div>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-[#003ec7]/5 rounded-xl border border-[#003ec7]/20">
                  <p className="text-sm font-body text-on-surface">
                    Equipo: <strong className="text-[#003ec7]">{selectedTeam === 'A' ? teamA?.name : teamB?.name}</strong>
                  </p>
                </div>
                
                <div>
                  <Label className="font-heading text-label-caps text-on-surface-variant">Jugador</Label>
                  
                  {getCurrentPlayers().length === 0 ? (
                    <div className="mt-2 p-3 bg-[#fe6b00]/5 border border-[#fe6b00]/20 rounded-xl">
                      <p className="text-sm text-[#fe6b00] font-body">
                        ⚠️ No hay jugadores presentes
                      </p>
                    </div>
                  ) : (
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger className="mt-2 rounded-xl">
                        <SelectValue placeholder="Selecciona un jugador" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {getCurrentPlayers().map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTeam(null)
                      setSelectedPlayer('')
                    }}
                    className="flex-1 rounded-full font-heading text-label-caps text-xs"
                  >
                    ← Volver
                  </Button>
                  <Button
                    onClick={handlePlayerConfirm}
                    disabled={!selectedPlayer}
                    className={`flex-1 rounded-full font-heading text-label-caps text-xs ${
                      showActionDialog?.type === 'goal' ? 'bg-gradient-primary' :
                      showActionDialog?.type === 'yellow' ? 'bg-[#fe6b00] hover:bg-[#fe6b00]/90' :
                      'bg-red-500 hover:bg-red-600'
                    } text-white disabled:opacity-50`}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}