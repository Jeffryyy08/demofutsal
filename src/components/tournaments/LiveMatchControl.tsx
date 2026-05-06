// src/components/tournaments/LiveMatchControl.tsx
'use client'

import { useState, useEffect } from 'react'
import { Match, Team } from '@/types'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  name: string  // ✅ Solo name (sin number)
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

  // ✅ Cargar jugadores al montar - CORREGIDO: full_name → name
  useEffect(() => {
    const loadPlayers = async () => {
      console.log('🔍 Cargando jugadores para:', { teamA: teamA?.id, teamB: teamB?.id })
      
      if (teamA?.id) {
        const { data: playersA, error: errorA } = await supabase
          .from('players')
          .select('id, full_name')  // ✅ Columna correcta en BD
          .eq('team_id', teamA.id)
          .order('full_name')  // ✅ Ordenar por nombre
        
        console.log('✅ Jugadores A encontrados:', playersA?.length || 0)
        
        if (playersA) {
          // ✅ Transformar: full_name → name (interfaz Player)
          const transformedPlayers = playersA.map(p => ({
            id: p.id,
            name: p.full_name
          }))
          setTeamAPlayers(transformedPlayers)
        }
      }
      
      if (teamB?.id) {
        const { data: playersB, error: errorB } = await supabase
          .from('players')
          .select('id, full_name')  // ✅ Columna correcta en BD
          .eq('team_id', teamB.id)
          .order('full_name')  // ✅ Ordenar por nombre
        
        console.log('✅ Jugadores B encontrados:', playersB?.length || 0)
        
        if (playersB) {
          // ✅ Transformar: full_name → name (interfaz Player)
          const transformedPlayers = playersB.map(p => ({
            id: p.id,
            name: p.full_name
          }))
          setTeamBPlayers(transformedPlayers)
        }
      }
    }
    
    loadPlayers()
  }, [teamA?.id, teamB?.id])

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
    
    // Para faltas, confirmar inmediatamente
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
    
    // Alerta de 5ta falta
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
    // ✅ Soporte para jugador seleccionado por ID o nombre manual
    const player = players.find(p => p.id === selectedPlayer)
    const playerName = player?.name || selectedPlayer  // ✅ Usa el nombre manual si no es ID
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ⚽ Control en Vivo
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {teamA?.name} vs {teamB?.name}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-full px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            ✕ Cerrar
          </Button>
        </div>
      </div>

      {/* Alerta de 5ta Falta */}
      {showFoulAlert && (
        <div className="max-w-7xl mx-auto mb-6">
          <Alert className="bg-red-50 border-red-500 border-2">
            <AlertDescription className="text-red-800 font-bold text-lg">
              🚨 ¡ALERTA! 5ta Falta Acumulada
            </AlertDescription>
            <p className="text-red-700 mt-1">
              ⚠️ La próxima falta (6ta) será DOBLE PENALTI
            </p>
          </Alert>
        </div>
      )}

      {/* Marcador Principal */}
      <div className="max-w-7xl mx-auto mb-6">
        <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white border-0 shadow-2xl">
          <CardContent className="p-6 md:p-10">
            <div className="grid grid-cols-3 gap-4 md:gap-8 items-center">
              {/* Equipo A */}
              <div className="text-center space-y-3">
                <h2 className="text-xl md:text-2xl font-bold">{teamA?.name}</h2>
                <div className="text-sm text-blue-300 font-medium">{teamA?.section}</div>
                <div className="text-6xl md:text-8xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  {scoreA}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                  <Badge variant="secondary" className="bg-yellow-500/80 text-white">
                    🟨 {teamAStats.yellow_cards}
                  </Badge>
                  <Badge variant="secondary" className="bg-red-600/80 text-white">
                    🟥 {teamAStats.red_cards}
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-600/80 text-white">
                    ⚽ {teamAStats.fouls}
                  </Badge>
                </div>
              </div>

              {/* Marcador Central */}
              <div className="text-center space-y-4">
                <div className="text-5xl md:text-7xl font-mono font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {formatTime(currentTime)}
                </div>
                <div className="text-lg text-gray-300">
                  {period === 1 ? '1er Tiempo' : '2do Tiempo'}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => setIsRunning(!isRunning)}
                    className={`rounded-full px-6 font-bold shadow-lg transition-all ${
                      isRunning 
                        ? 'bg-amber-500 hover:bg-amber-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {isRunning ? '⏸️ Pausa' : '▶️ Iniciar'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setCurrentTime(0)
                      setIsRunning(false)
                    }}
                    className="rounded-full px-4 border-white/30 text-white hover:bg-white/20"
                  >
                    🔄 Reiniciar
                  </Button>
                </div>
              </div>

              {/* Equipo B */}
              <div className="text-center space-y-3">
                <h2 className="text-xl md:text-2xl font-bold">{teamB?.name}</h2>
                <div className="text-sm text-purple-300 font-medium">{teamB?.section}</div>
                <div className="text-6xl md:text-8xl font-bold bg-gradient-to-br from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  {scoreB}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                  <Badge variant="secondary" className="bg-yellow-500/80 text-white">
                    🟨 {teamBStats.yellow_cards}
                  </Badge>
                  <Badge variant="secondary" className="bg-red-600/80 text-white">
                    🟥 {teamBStats.red_cards}
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-600/80 text-white">
                    ⚽ {teamBStats.fouls}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de Control */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Button
            onClick={handleFinishPeriod}
            variant="outline"
            className="rounded-full px-6 py-3 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold transition-all"
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
            className="rounded-full px-6 py-3 border-2 border-red-500 text-red-600 hover:bg-red-50 font-semibold transition-all"
          >
            🚫 Finalizar Partido
          </Button>
        </div>

        {/* Botones de Acciones */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => setShowActionDialog({ type: 'goal' })}
            className="h-24 text-lg font-bold bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transform hover:scale-105 transition-all rounded-2xl"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">⚽</span>
              <span>Gol</span>
            </div>
          </Button>

          <Button
            onClick={() => setShowActionDialog({ type: 'yellow' })}
            className="h-24 text-lg font-bold bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white shadow-lg transform hover:scale-105 transition-all rounded-2xl"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">🟨</span>
              <span>Amarilla</span>
            </div>
          </Button>

          <Button
            onClick={() => setShowActionDialog({ type: 'red' })}
            className="h-24 text-lg font-bold bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg transform hover:scale-105 transition-all rounded-2xl"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">🟥</span>
              <span>Roja</span>
            </div>
          </Button>

          <Button
            onClick={() => setShowActionDialog({ type: 'foul' })}
            variant="outline"
            className="h-24 text-lg font-bold border-2 border-gray-400 hover:bg-gray-100 text-gray-700 shadow-lg transform hover:scale-105 transition-all rounded-2xl"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">📋</span>
              <span>Falta</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Historial de Eventos */}
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white shadow-xl border-0">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📜</span>
              Historial de Eventos
            </h3>
            
            {events.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-lg">No hay eventos registrados aún</p>
                <p className="text-sm mt-2">Los eventos aparecerán aquí a medida que ocurran</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-l-4 ${
                      event.type === 'goal' 
                        ? 'bg-green-50 border-green-500' 
                        : event.type === 'yellow_card'
                        ? 'bg-yellow-50 border-yellow-500'
                        : event.type === 'red_card'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-gray-50 border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-mono font-bold text-gray-600">
                        {event.minute}'
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {event.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.team_name} ({event.team_section}) {event.player_name && `• ${event.player_name}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl">
                      {event.type === 'goal' && '⚽'}
                      {event.type === 'yellow_card' && '🟨'}
                      {event.type === 'red_card' && '🟥'}
                      {event.type === 'foul' && '📋'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para FALTAS - Solo botones de equipo */}
      <Dialog open={showActionDialog?.type === 'foul'} onOpenChange={() => {
        setShowActionDialog(null)
        setSelectedTeam(null)
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <span className="text-3xl">📋</span>
              Registrar Falta
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {/* Botón Equipo A */}
            <Button
              onClick={() => handleFoulConfirm('A')}
              className="h-32 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg rounded-2xl"
            >
              <span className="text-4xl">👕</span>
              <div className="text-center">
                <div className="text-lg font-bold">{teamA?.name}</div>
                <div className="text-sm opacity-80">{teamA?.section}</div>
              </div>
            </Button>

            {/* Botón Equipo B */}
            <Button
              onClick={() => handleFoulConfirm('B')}
              className="h-32 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg rounded-2xl"
            >
              <span className="text-4xl">👕</span>
              <div className="text-center">
                <div className="text-lg font-bold">{teamB?.name}</div>
                <div className="text-sm opacity-80">{teamB?.section}</div>
              </div>
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowActionDialog(null)
              setSelectedTeam(null)
            }}
            className="mt-4 h-12"
          >
            Cancelar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Diálogo para GOL/TARJETAS - Equipo + Jugador */}
      <Dialog open={showActionDialog !== null && showActionDialog.type !== 'foul'} onOpenChange={() => {
        setShowActionDialog(null)
        setSelectedTeam(null)
        setSelectedPlayer('')
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <span className="text-3xl">{getActionIcon()}</span>
              {getActionTitle()}
            </DialogTitle>
          </DialogHeader>
          
          {!selectedTeam ? (
            /* Paso 1: Seleccionar Equipo */
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button
                onClick={() => setSelectedTeam('A')}
                className="h-32 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg rounded-2xl"
              >
                <span className="text-4xl">👕</span>
                <div className="text-center">
                  <div className="text-lg font-bold">{teamA?.name}</div>
                  <div className="text-sm opacity-80">{teamA?.section}</div>
                </div>
              </Button>

              <Button
                onClick={() => setSelectedTeam('B')}
                className="h-32 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg rounded-2xl"
              >
                <span className="text-4xl">👕</span>
                <div className="text-center">
                  <div className="text-lg font-bold">{teamB?.name}</div>
                  <div className="text-sm opacity-80">{teamB?.section}</div>
                </div>
              </Button>
            </div>
          ) : (
            /* Paso 2: Seleccionar Jugador */
            <div className="space-y-4 pt-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  Equipo seleccionado: <strong>{selectedTeam === 'A' ? teamA?.name : teamB?.name}</strong> ({selectedTeam === 'A' ? teamA?.section : teamB?.section})
                </p>
              </div>
              
              <div>
                <Label className="text-base font-semibold">Jugador</Label>
                
                {/* ✅ Verificar si hay jugadores cargados */}
                {getCurrentPlayers().length === 0 ? (
                  <div className="mt-2 space-y-3">
                    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ No hay jugadores registrados
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Ingresa el nombre manualmente o agrega jugadores al equipo
                      </p>
                    </div>
                    
                    {/* ✅ Input manual como fallback */}
                    <Input
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      placeholder="Nombre del jugador"  // ✅ Sin "o número"
                      className="h-12"
                    />
                  </div>
                ) : (
                  /* ✅ Select normal cuando hay jugadores */
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger className="h-12 mt-2">
                      <SelectValue placeholder="Selecciona un jugador" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {getCurrentPlayers().map(player => (
                        <SelectItem 
                          key={player.id} 
                          value={player.id}
                          className="cursor-pointer"
                        >
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTeam(null)
                    setSelectedPlayer('')
                  }}
                  className="flex-1 h-12"
                >
                  ← Volver
                </Button>
                <Button
                  onClick={handlePlayerConfirm}
                  disabled={!selectedPlayer}
                  className={`flex-1 h-12 font-bold ${
                    showActionDialog?.type === 'goal' ? 'bg-green-600 hover:bg-green-700' :
                    showActionDialog?.type === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' :
                    'bg-red-600 hover:bg-red-700'
                  } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}