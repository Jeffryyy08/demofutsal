// src/components/tournaments/MatchReporter.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Match, Team } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface MatchReporterProps {
  match: Match & { teamA?: Team; teamB?: Team }
  onResultUpdated?: () => void
}

export function MatchReporter({ match, onResultUpdated }: MatchReporterProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

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

  // ✅ Función para abrir control en vivo en pantalla completa
  const handleOpenLiveControl = () => {
    setOpen(false)
    // ✅ Redirigir a página dedicada de control en vivo
    router.push(`/admin/matches/${match.id}/live`)
  }

  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return <Badge className="bg-red-500">🔴 EN VIVO</Badge>
      case 'finished':
        return <Badge className="bg-green-500">✅ Finalizado</Badge>
      default:
        return <Badge variant="secondary">📅 Programado</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant={match.status === 'finished' ? 'outline' : 'default'}
          className="gap-2"
        >
          {match.status === 'finished' ? '✏️ Editar' : '⚽ Reportar'}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {getStatusBadge()}
            Control de Partido
          </DialogTitle>
          <DialogDescription className="text-base">
            {match.teamA?.name} vs {match.teamB?.name}
            <br />
            <span className="text-sm text-muted-foreground">
              {formatDate(match.match_date)}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Botón para abrir en PANTALLA COMPLETA */}
        <div className="space-y-6 py-4">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white text-center">
            <div className="text-4xl mb-3">🎮</div>
            <h3 className="text-xl font-bold mb-2">
              Control de Partido en Tiempo Real
            </h3>
            <p className="text-blue-100 mb-4">
              Dirige el partido con cronómetro, registro de goles, tarjetas y faltas
            </p>
            <Button
              className="w-full h-14 text-lg font-bold bg-white text-blue-700 hover:bg-blue-50"
              onClick={handleOpenLiveControl}
            >
              🚀 ABRIR CONTROL EN VIVO
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium mb-1">📊 Estadísticas en Vivo</p>
              <p className="text-muted-foreground">Goles, tarjetas, faltas</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium mb-1">⚽ Goles</p>
              <p className="text-muted-foreground">Anotadores y minuto</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium mb-1">🟨 Tarjetas</p>
              <p className="text-muted-foreground">Registro automático</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium mb-1">⏱️ Cronómetro</p>
              <p className="text-muted-foreground">Tiempo real del partido</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}