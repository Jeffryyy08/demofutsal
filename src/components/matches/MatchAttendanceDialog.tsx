// src/components/matches/MatchAttendanceDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import {
  initializeMatchAttendance,
  updatePlayerAttendance,
  getMatchAttendances,
} from '@/services/match-attendance.service'

interface MatchAttendanceDialogProps {
  matchId: string
  teamAId: string
  teamBId: string
  teamAName: string
  teamBName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

interface PlayerAttendance {
  id: string
  player_id: string
  team_id: string
  is_present: boolean
  is_eligible: boolean
  player: {
    full_name: string
    is_suspended: boolean
    has_paid_inscription: boolean
  }
}

export function MatchAttendanceDialog({
  matchId,
  teamAId,
  teamBId,
  teamAName,
  teamBName,
  open,
  onOpenChange,
  onComplete,
}: MatchAttendanceDialogProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attendances, setAttendances] = useState<PlayerAttendance[]>([])

  useEffect(() => {
    if (open) {
      loadAttendances()
    }
  }, [open])

  const loadAttendances = async () => {
    console.log('🔍 [DIALOG] Cargando asistencias para match:', matchId)
    setLoading(true)
    
    // Inicializar asistencia si no existe
    const initResult = await initializeMatchAttendance(matchId, teamAId, teamBId)
    console.log('✅ [DIALOG] Resultado de inicialización:', initResult)
    
    
    // Cargar asistencias
    const data = await getMatchAttendances(matchId)
    console.log('✅ [DIALOG] Asistencias cargadas:', data.length)
    setAttendances(data as PlayerAttendance[])
    setLoading(false)
  }

  const handleToggleAttendance = async (playerId: string, isPresent: boolean) => {
    setAttendances(prev =>
      prev.map(a =>
        a.player_id === playerId ? { ...a, is_present: isPresent } : a
      )
    )

    await updatePlayerAttendance(matchId, playerId, isPresent)
  }

  const presentCount = attendances.filter(a => a.is_present).length
  const eligibleCount = attendances.filter(a => a.is_eligible).length
  const ineligibleCount = attendances.filter(a => !a.is_eligible).length

  const teamAPlayers = attendances.filter(a => a.team_id === teamAId)
  const teamBPlayers = attendances.filter(a => a.team_id === teamBId)

  const handleComplete = () => {
    onComplete()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            📋 Pase de Lista - Partido
          </DialogTitle>
          <DialogDescription>
            {teamAName} vs {teamBName}
            <br />
            <span className="text-sm">
              ✅ Presentes: {presentCount} | ✅ Elegibles: {eligibleCount} | ❌ No elegibles: {ineligibleCount}
            </span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p>Cargando jugadores...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Equipo A */}
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-4 text-blue-700">
                  🟦 {teamAName}
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {teamAPlayers.map(attendance => (
                    <PlayerAttendanceItem
                      key={attendance.id}
                      attendance={attendance}
                      onToggle={handleToggleAttendance}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Equipo B */}
            <Card className="border-2 border-purple-200">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-4 text-purple-700">
                  🟪 {teamBName}
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {teamBPlayers.map(attendance => (
                    <PlayerAttendanceItem
                      key={attendance.id}
                      attendance={attendance}
                      onToggle={handleToggleAttendance}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleComplete}
            disabled={presentCount < 10} // Mínimo 5 por equipo
            className="rounded-full bg-gradient-primary"
          >
            ✅ Confirmar Asistencia ({presentCount} jugadores)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente individual de jugador
function PlayerAttendanceItem({
  attendance,
  onToggle,
}: {
  attendance: PlayerAttendance
  onToggle: (playerId: string, isPresent: boolean) => void
}) {
  const isSuspended = attendance.player.is_suspended
  const hasNotPaid = !attendance.player.has_paid_inscription
  const isEligible = attendance.is_eligible

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
        !isEligible
          ? 'bg-red-50 border-red-200 opacity-60'
          : attendance.is_present
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          checked={attendance.is_present}
          onCheckedChange={(checked) =>
            isEligible && onToggle(attendance.player_id, checked as boolean)
          }
          disabled={!isEligible}
          className="h-5 w-5"
        />
        <div className="flex-1">
          <p
            className={`font-medium ${
              !isEligible ? 'text-red-700 line-through' : 'text-gray-800'
            }`}
          >
            {attendance.player.full_name}
          </p>
          {!isEligible && (
            <p className="text-xs text-red-600">
              {isSuspended && '🚫 Suspendido'}
              {hasNotPaid && !isSuspended && '💳 Sin pago de inscripción'}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isSuspended && (
          <Badge className="bg-red-500 text-white">🚫 Suspendido</Badge>
        )}
        {hasNotPaid && !isSuspended && (
          <Badge className="bg-amber-500 text-white">💳 Sin Pago</Badge>
        )}
        {isEligible && attendance.is_present && (
          <Badge className="bg-green-500 text-white">✅ Presente</Badge>
        )}
        {isEligible && !attendance.is_present && (
          <Badge variant="outline" className="text-gray-500">
            Ausente
          </Badge>
        )}
      </div>
    </div>
  )
}