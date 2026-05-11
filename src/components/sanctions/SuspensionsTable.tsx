// src/components/sanctions/SuspensionsTable.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { resolvePlayerSuspensionAction, payCardFineAction } from '@/actions/players'
import { ResolveSuspensionDialog } from './ResolveSuspensionDialog'
import { toast } from 'sonner'

interface Suspension {
  id: string
  suspension_type: 'red_card' | 'admin'
  reason: string | null
  matches_suspended: number
  matches_remaining: number
  created_at: string
  tournament_id: string  // ✅ AGREGADO
  player: {
    id: string
    full_name: string
    team: {
      id: string
      name: string
      section: string
    } | null
  } | null
  tournament: {
    id: string
    name: string
  } | null
  // ✅ Información de pago de multa
  fine_payment?: {
    id: string
    amount: number
    paid_at: string | null
    payment_method: string
  } | null
  fine_paid?: boolean  // ✅ Campo helper
  is_yellow_card_fine?: boolean // ✅ Indica si la multa es por tarjeta amarilla (para diferenciar montos)
}

interface SuspensionsTableProps {
  suspensions: Suspension[]
  tournamentId: string  // ✅ AGREGADO
}

export function SuspensionsTable({ suspensions, tournamentId }: SuspensionsTableProps) {
  console.log('🎨 [SUSPENSIONS TABLE] Renderizando con:', {
    suspensions_count: suspensions.length,
    tournamentId,
    first_suspension: suspensions[0] ? {
      id: suspensions[0].id,
      player: suspensions[0].player?.full_name,
      fine_paid: suspensions[0].fine_paid
    } : null
  })
  const [loading, setLoading] = useState<string | null>(null)
  const [payingFineId, setPayingFineId] = useState<string | null>(null)
  const [resolveDialog, setResolveDialog] = useState<{
    open: boolean
    suspensionId?: string
    playerName?: string
  }>({ open: false })

  const handleResolve = async (suspensionId: string) => {
    setLoading(suspensionId)
    await resolvePlayerSuspensionAction(suspensionId, '')
    setLoading(null)
    setResolveDialog({ open: false })
    window.location.reload()
  }

  const handlePayFine = async (suspension: Suspension) => {
    if (!suspension.player?.id || !suspension.player?.team?.id) {
      toast.error('❌ Datos incompletos del jugador')
      return
    }

    setPayingFineId(suspension.id)

    // ✅ CORREGIDO: Usar el nuevo campo para determinar el tipo real
    const cardType = suspension.is_yellow_card_fine
      ? 'yellow_card'
      : (suspension.suspension_type === 'red_card' ? 'red_card' : 'yellow_card')

    const result = await payCardFineAction(
      suspension.player.id,
      suspension.player.team.id,
      tournamentId,
      cardType
    )

    setPayingFineId(null)

    if (result.success) {
      toast.success(result.message || '✅ Multa pagada correctamente')
      window.location.reload()
    } else {
      toast.error(result.error || '❌ Error al pagar multa')
    }
  }

  if (suspensions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-4xl mx-auto mb-4">
          ✅
        </div>
        <p className="font-heading text-headline-md text-on-surface mb-2">
          No hay suspensiones activas
        </p>
        <p className="font-body text-body-md text-on-surface-variant">
          Todos los jugadores están elegibles para jugar
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
              <th className="font-heading text-label-caps text-primary text-left py-4 px-6">
                Jugador
              </th>
              <th className="font-heading text-label-caps text-primary text-left py-4 px-6">
                Equipo
              </th>
              <th className="font-heading text-label-caps text-primary text-left py-4 px-6">
                Tipo
              </th>
              <th className="font-heading text-label-caps text-primary text-center py-4 px-6">
                Partidos
              </th>
              <th className="font-heading text-label-caps text-primary text-center py-4 px-6">
                Estado de Multa
              </th>
              <th className="font-heading text-label-caps text-primary text-left py-4 px-6">
                Razón
              </th>
              <th className="font-heading text-label-caps text-primary text-right py-4 px-6">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {suspensions.map((suspension) => {
              console.log('📋 [SUSPENSIONS TABLE] Renderizando fila:', {
                suspension_id: suspension.id,
                player: suspension.player?.full_name,
                fine_paid: suspension.fine_paid,
                matches_remaining: suspension.matches_remaining
              })
              const finePaid = suspension.fine_paid || false
              const fineAmount = suspension.fine_payment?.amount || (suspension.suspension_type === 'red_card' ? 2000 : 1000)

              return (
                <tr
                  key={suspension.id}
                  className={`group transition-colors duration-200 ${finePaid ? 'hover:bg-primary/5' : 'hover:bg-amber-50/30'
                    }`}
                >
                  {/* Jugador */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-heading font-bold text-sm ${finePaid ? 'bg-gradient-primary' : 'bg-amber-500'
                        } text-white`}>
                        {suspension.player?.full_name.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-heading text-body-md text-on-surface font-semibold">
                          {suspension.player?.full_name || 'Jugador eliminado'}
                        </p>
                        <p className="font-body text-body-sm text-on-surface-variant">
                          {new Date(suspension.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Equipo */}
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-body text-body-md text-on-surface">
                        {suspension.player?.team?.name || 'Sin equipo'}
                      </p>
                      <p className="font-body text-body-sm text-on-surface-variant">
                        {suspension.player?.team?.section || ''}
                      </p>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="py-4 px-6">
                    {suspension.is_yellow_card_fine ? (
                      <Badge className="bg-yellow-500/10 text-yellow-700 font-heading text-label-caps px-3 py-1">
                        🟨 Tarjeta Amarilla
                      </Badge>
                    ) : suspension.suspension_type === 'red_card' ? (
                      <Badge className="bg-error/10 text-error font-heading text-label-caps px-3 py-1">
                        🟥 Tarjeta Roja
                      </Badge>
                    ) : (
                      <Badge className="bg-primary/10 text-primary font-heading text-label-caps px-3 py-1">
                        📋 Administrativa
                      </Badge>
                    )}
                  </td>

                  {/* Partidos */}
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error/10 border border-error/20">
                      <span className="font-heading text-label-caps text-error font-bold">
                        {suspension.matches_remaining}
                      </span>
                      <span className="font-body text-body-sm text-error">
                        / {suspension.matches_suspended}
                      </span>
                    </div>
                  </td>

                  {/* ✅ NUEVA COLUMNA: Estado de Multa */}
                  <td className="py-4 px-6 text-center">
                    {finePaid ? (
                      <Badge className="bg-green-500/10 text-green-700 font-heading text-label-caps px-3 py-1 border border-green-500/20">
                        ✅ Pagada
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-700 font-heading text-label-caps px-3 py-1 border border-amber-500/20">
                        💳 Pendiente
                      </Badge>
                    )}
                  </td>

                  {/* Razón */}
                  <td className="py-4 px-6">
                    <p className="font-body text-body-md text-on-surface-variant">
                      {suspension.reason || 'Sin especificar'}
                    </p>
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* ✅ Botón Pagar Multa (si no está pagada) */}
                      {!finePaid && (
                        <Button
                          onClick={() => handlePayFine(suspension)}
                          disabled={payingFineId === suspension.id || loading === suspension.id}
                          className="rounded-full font-heading text-label-caps text-xs px-4 h-9 bg-amber-500 hover:bg-amber-600 text-white hover:scale-105 transition-all duration-200 disabled:opacity-50"
                        >
                          {payingFineId === suspension.id ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Procesando...
                            </>
                          ) : (
                            <>💳 Pagar ₡{fineAmount.toLocaleString()}</>
                          )}
                        </Button>
                      )}

                      {/* Botón Resolver Suspensión */}
                      <Button
                        onClick={() => setResolveDialog({
                          open: true,
                          suspensionId: suspension.id,
                          playerName: suspension.player?.full_name || 'Jugador'
                        })}
                        disabled={loading === suspension.id}
                        className="rounded-full font-heading text-label-caps text-xs px-4 h-9 bg-primary hover:shadow-glow hover:scale-105 transition-all duration-200 disabled:opacity-50"
                      >
                        {loading === suspension.id ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Procesando...
                          </>
                        ) : (
                          '✅ Resolver'
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Dialog para Resolver Suspensión */}
      <ResolveSuspensionDialog
        open={resolveDialog.open}
        onOpenChange={(open) => setResolveDialog({ open })}
        onResolve={() => resolveDialog.suspensionId && handleResolve(resolveDialog.suspensionId)}
        playerName={resolveDialog.playerName || ''}
        loading={loading === resolveDialog.suspensionId}
      />
    </>
  )
}