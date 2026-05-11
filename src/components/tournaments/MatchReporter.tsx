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
import { MatchAttendanceDialog } from '@/components/matches/MatchAttendanceDialog'
import { AnimatedCard } from '@/components/ui/AnimatedCard'

interface MatchReporterProps {
  match: Match & { teamA?: Team; teamB?: Team }
  onResultUpdated?: () => void
}

export function MatchReporter({ match, onResultUpdated }: MatchReporterProps) {
  const [open, setOpen] = useState(false)
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false)
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

  // ✅ Nuevo flujo: Primero pase de lista, luego control en vivo
  const handleOpenLiveControl = () => {
    setShowAttendanceDialog(true)
  }

  // ✅ Callback cuando se completa el pase de lista
  const handleAttendanceComplete = () => {
    router.push(`/admin/matches/${match.id}/live`)
  }

  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return (
          <Badge className="bg-[#fe6b00]/10 text-[#fe6b00] border border-[#fe6b00]/20 font-heading text-label-caps">
            🔴 EN VIVO
          </Badge>
        )
      case 'finished':
        return (
          <Badge className="bg-green-500/10 text-green-700 border border-green-500/20 font-heading text-label-caps">
            ✅ Finalizado
          </Badge>
        )
      default:
        return (
          <Badge className="bg-[#003ec7]/10 text-[#003ec7] border border-[#003ec7]/20 font-heading text-label-caps">
            📅 Programado
          </Badge>
        )
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            size="sm" 
            variant={match.status === 'finished' ? 'outline' : 'default'}
            className={`
              gap-2 rounded-full font-heading text-label-caps
              ${match.status === 'finished' 
                ? 'border-[#003ec7] text-[#003ec7] hover:bg-[#003ec7]/5' 
                : 'bg-gradient-primary hover:shadow-glow'
              }
            `}
          >
            {match.status === 'finished' ? '✏️ Editar' : '⚽ Reportar'}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {/* Header con Gradiente FutsalCTP */}
          <div 
            className="p-6 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 50%, #0038b6 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#fe6b00] rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
            </div>
            
            <DialogHeader className="relative z-10">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                {getStatusBadge()}
                <span>Control de Partido</span>
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-lg mt-2">
                <span className="font-semibold text-white">{match.teamA?.name}</span>
                <span className="mx-2">vs</span>
                <span className="font-semibold text-white">{match.teamB?.name}</span>
                <br />
                <span className="text-sm text-blue-200">
                  {formatDate(match.match_date)}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-6">
            
            {/* Botón Principal - Control en Vivo */}
            <AnimatedCard animation="slide-up" delay={0.1}>
              <div 
                className="p-6 rounded-xl text-white text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 100%)',
                }}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#fe6b00] rounded-full blur-xl" />
                </div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-4">🎮</div>
                  <h3 className="text-xl font-bold mb-2 font-heading">
                    Control en Tiempo Real
                  </h3>
                  <p className="text-blue-100 mb-5 font-body">
                    Dirige el partido con cronómetro, goles, tarjetas y faltas
                  </p>
                  <Button
                    className="w-full h-14 text-lg font-bold font-heading text-label-caps rounded-full bg-white text-[#003ec7] hover:bg-[#fe6b00] hover:text-white transition-all duration-300 shadow-lg hover:shadow-glow"
                    onClick={handleOpenLiveControl}
                    disabled={match.status === 'finished'}
                  >
                    🚀 INICIAR CONTROL EN VIVO
                  </Button>
                </div>
              </div>
            </AnimatedCard>

            {/* Info de Pase de Lista */}
            <AnimatedCard animation="slide-up" delay={0.2}>
              <div className="p-4 bg-[#fe6b00]/5 border border-[#fe6b00]/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="font-heading text-[#fe6b00] font-semibold mb-1">
                      Antes de comenzar:
                    </p>
                    <p className="font-body text-on-surface-variant text-sm">
                      Se abrirá el pase de lista para registrar jugadores presentes. 
                      Los jugadores suspendidos o sin pago aparecerán en rojo y no podrán ser marcados.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedCard>

            {/* Features Grid */}
            <AnimatedCard animation="slide-up" delay={0.3}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '📊', title: 'Estadísticas', desc: 'Goles, tarjetas, faltas' },
                  { icon: '⚽', title: 'Goles', desc: 'Anotadores y minuto' },
                  { icon: '🟨', title: 'Tarjetas', desc: 'Registro automático' },
                  { icon: '⏱️', title: 'Cronómetro', desc: 'Tiempo real del partido' },
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 hover:border-[#003ec7]/30 transition-colors"
                  >
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <p className="font-heading text-body-md text-on-surface font-semibold">
                      {feature.title}
                    </p>
                    <p className="font-body text-body-sm text-on-surface-variant">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </AnimatedCard>

          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Dialog de Pase de Lista */}
      <MatchAttendanceDialog
        matchId={match.id}
        teamAId={match.team_a_id}
        teamBId={match.team_b_id}
        teamAName={match.teamA?.name || ''}
        teamBName={match.teamB?.name || ''}
        open={showAttendanceDialog}
        onOpenChange={setShowAttendanceDialog}
        onComplete={handleAttendanceComplete}
      />
    </>
  )
}