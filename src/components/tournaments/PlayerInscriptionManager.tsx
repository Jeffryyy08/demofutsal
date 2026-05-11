// src/components/tournaments/PlayerInscriptionsManager.tsx
'use client'

import { useState } from 'react'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { registerPlayerPaymentAction } from '@/actions/players'
import { toast } from 'sonner'

interface PlayerInscriptionsManagerProps {
  tournamentId: string
  players: any[]
  teams: any[]
  inscriptionFee: number
}

export function PlayerInscriptionsManager({
  tournamentId,
  players,
  teams,
  inscriptionFee,
}: PlayerInscriptionsManagerProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean
    playerId?: string
    playerName?: string
  }>({ open: false })

  const handlePayment = async (playerId: string) => {
    setLoading(playerId)
    
    const result = await registerPlayerPaymentAction({
      tournament_id: tournamentId,
      player_id: playerId,
      team_id: players.find(p => p.id === playerId)?.team_id || '',
      payment_type: 'inscription',
      amount: inscriptionFee,
      payment_method: 'cash',
      notes: 'Inscripción al torneo',
    })
    
    setLoading(null)
    setPaymentDialog({ open: false })
    
    if (result.success) {
      toast.success('✅ Inscripción registrada correctamente')
      // Recargar página para ver cambios
      window.location.reload()
    } else {
      toast.error('❌ Error al registrar pago')
    }
  }

  // Agrupar jugadores por equipo
  const playersByTeam = players.reduce((acc, player) => {
    const teamId = player.team_id
    if (!acc[teamId]) {
      acc[teamId] = {
        team: player.team,
        players: [],
      }
    }
    acc[teamId].players.push(player)
    return acc
  }, {} as Record<string, { team: any; players: any[] }>)

  return (
    <>
      <div className="space-y-6">
        {Object.entries(playersByTeam).map(([teamId, { team, players: teamPlayers }]) => (
          <AnimatedCard key={teamId} className="overflow-hidden" animation="slide-up">
            <div className="p-6 border-b border-outline-variant/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                    👕
                  </div>
                  <div>
                    <h3 className="font-heading text-headline-md text-on-surface font-bold">
                      {team?.name}
                    </h3>
                    <p className="font-body text-body-sm text-on-surface-variant">
                      {team?.section} • {teamPlayers.filter(p => p.has_paid_inscription).length}/{teamPlayers.length} inscritos
                    </p>
                  </div>
                </div>
                <Badge className={teamPlayers.every(p => p.has_paid_inscription) ? 'bg-green-500' : 'bg-amber-500'}>
                  {teamPlayers.every(p => p.has_paid_inscription) ? '✅ Completo' : '⏳ Pendiente'}
                </Badge>
              </div>
            </div>

            <div className="divide-y divide-outline-variant/10">
              {teamPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    player.has_paid_inscription 
                      ? 'bg-green-50/50' 
                      : 'bg-amber-50/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full font-heading font-bold text-lg ${
                      player.has_paid_inscription
                        ? 'bg-green-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}>
                      {player.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-heading text-body-md text-on-surface font-semibold">
                        {player.full_name}
                      </p>
                      <p className="font-body text-body-sm text-on-surface-variant">
                        {player.has_paid_inscription 
                          ? `Pagado: ${new Date(player.inscription_paid_at).toLocaleDateString('es-CR')}`
                          : 'Pendiente de pago'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {player.has_paid_inscription ? (
                      <Badge className="bg-green-500 text-white px-4 py-2">
                        ✅ Inscrito
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => setPaymentDialog({ 
                          open: true, 
                          playerId: player.id,
                          playerName: player.full_name 
                        })}
                        disabled={loading === player.id}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-heading text-label-caps rounded-full px-6"
                      >
                        {loading === player.id ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Procesando...
                          </>
                        ) : (
                          <>💳 Pagar ₡{inscriptionFee.toLocaleString()}</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Dialog de Confirmación de Pago */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog({ open })}>
        <DialogContent className="rounded-2xl border-0 shadow-large bg-surface-container-lowest max-w-md">
          <DialogHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-4xl mx-auto mb-4">
              💳
            </div>
            <DialogTitle className="font-heading text-headline-md text-on-surface">
              Registrar Pago de Inscripción
            </DialogTitle>
            <DialogDescription className="font-body text-body-md text-on-surface-variant pt-2">
              Jugador: <span className="font-semibold text-on-surface">{paymentDialog.playerName}</span>
              <br /><br />
              <span className="font-heading text-label-caps text-primary">
                Monto: ₡{inscriptionFee.toLocaleString()} CRC
              </span>
              <br />
              <span className="text-sm">
                El jugador quedará habilitado para jugar inmediatamente después del pago.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-outline-variant/20">
            <Button
              onClick={() => setPaymentDialog({ open: false })}
              disabled={loading === paymentDialog.playerId}
              variant="outline"
              className="w-full sm:w-auto rounded-full font-heading text-label-caps border-2 border-outline-variant/50 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => paymentDialog.playerId && handlePayment(paymentDialog.playerId)}
              disabled={loading === paymentDialog.playerId}
              className="w-full sm:w-auto rounded-full font-heading text-label-caps bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 disabled:opacity-60"
            >
              {loading === paymentDialog.playerId ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                '✅ Confirmar Pago'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}