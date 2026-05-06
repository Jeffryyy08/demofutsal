// src/components/teams/PlayersList.tsx
'use client'

import { useState } from 'react'
import { Player } from '@/types'
import { updatePlayerAction, deletePlayerAction } from '@/actions/players'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PlayersListProps {
  players: Player[]
  onUpdate: (player: Player) => void
  onDelete: (playerId: string) => void
}

export function PlayersList({ players, onUpdate, onDelete }: PlayersListProps) {
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; playerId?: string }>({ open: false })
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleCaptain = async (player: Player) => {
    if (player.is_captain) {
      alert('No puedes quitar el capitán. Asigna otro primero si quieres cambiar.')
      return
    }

    setLoading(player.id)
    await updatePlayerAction(player.id, { is_captain: true })
    setLoading(null)
  }

  const handleToggleSuspended = async (player: Player) => {
    setLoading(player.id)
    await updatePlayerAction(player.id, { is_suspended: !player.is_suspended })
    setLoading(null)
  }

  const handleToggleBlocked = async (player: Player) => {
    setLoading(player.id)
    await updatePlayerAction(player.id, { is_blocked: !player.is_blocked })
    setLoading(null)
  }

  const handleDelete = async () => {
    if (!deleteDialog.playerId) return
    
    setLoading(deleteDialog.playerId)
    await deletePlayerAction(deleteDialog.playerId)
    setLoading(null)
    setDeleteDialog({ open: false })
    onDelete(deleteDialog.playerId)
  }

  // Empty State Animado
  if (players.length === 0) {
    return (
      <AnimatedCard className="p-12 text-center" animation="scale-in">
        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce-subtle">
          👥
        </div>
        <h3 className="font-heading text-headline-md text-on-surface mb-3">
          No hay jugadores registrados
        </h3>
        <p className="font-body text-body-md text-on-surface-variant mb-6">
          Agrega jugadores individualmente o importa una lista completa
        </p>
        <Button className="btn-primary">
          ✨ Agregar Primer Jugador
        </Button>
      </AnimatedCard>
    )
  }

  return (
    <>
      <AnimatedCard className="overflow-hidden" animation="slide-up">
        {/* Table Header */}
        <div className="p-6 border-b border-outline-variant/20">
          <h2 className="font-heading text-headline-md text-on-surface flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
              📋
            </span>
            Lista de Jugadores
            <Badge className="bg-primary/10 text-primary font-heading text-label-caps ml-2">
              {players.length}
            </Badge>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                <th className="font-heading text-label-caps text-primary text-left py-4 px-6">
                  Jugador
                </th>
                <th className="font-heading text-label-caps text-primary text-center py-4 px-6">
                  Capitán
                </th>
                <th className="font-heading text-label-caps text-primary text-center py-4 px-6">
                  Estado
                </th>
                <th className="font-heading text-label-caps text-primary text-center py-4 px-6">
                  Tarjetas
                </th>
                <th className="font-heading text-label-caps text-primary text-right py-4 px-6">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {players.map((player, index) => (
                <tr 
                  key={player.id}
                  className={`
                    group transition-colors duration-200 animate-on-scroll
                    ${player.is_suspended || player.is_blocked 
                      ? 'bg-error/5' 
                      : 'hover:bg-primary/5'
                    }
                  `}
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  {/* Player Name + Avatar */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-white font-heading font-bold text-sm shadow-soft">
                        {player.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-heading text-body-md text-on-surface font-semibold block">
                          {player.full_name}
                        </span>
                        {player.is_captain && (
                          <Badge className="mt-1 bg-secondary-container/10 text-secondary font-heading text-label-caps text-xs px-2 py-0.5">
                            👑 Capitán
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Captain Toggle */}
                  <td className="py-4 px-6 text-center">
                    <Button
                      variant={player.is_captain ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleCaptain(player)}
                      disabled={loading === player.id || player.is_captain}
                      className={`
                        rounded-full font-heading text-label-caps text-xs px-4 h-8 transition-all duration-200
                        ${player.is_captain 
                          ? 'bg-gradient-secondary text-white hover:shadow-glow-orange' 
                          : 'border-outline-variant/50 hover:border-secondary-container hover:bg-secondary-container/5 hover:text-secondary'
                        }
                      `}
                    >
                      {player.is_captain ? '👑' : '👑 Designar'}
                    </Button>
                  </td>

                  {/* Status Badges */}
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center gap-2">
                      {/* Suspended Toggle */}
                      <button
                        onClick={() => handleToggleSuspended(player)}
                        disabled={loading === player.id}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold transition-all duration-200
                          ${player.is_suspended 
                            ? 'bg-error/10 text-error hover:bg-error/20' 
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }
                        `}
                      >
                        {player.is_suspended ? '🚫' : '✅'}
                        {player.is_suspended ? 'Suspendido' : 'Activo'}
                      </button>

                      {/* Blocked Toggle */}
                      <button
                        onClick={() => handleToggleBlocked(player)}
                        disabled={loading === player.id}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold transition-all duration-200
                          ${player.is_blocked 
                            ? 'bg-tertiary-container/20 text-tertiary hover:bg-tertiary-container/30' 
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
                          }
                        `}
                      >
                        {player.is_blocked ? '🔒' : '✓'}
                        {player.is_blocked ? 'Bloqueado' : 'Libre'}
                      </button>
                    </div>
                  </td>

                  {/* Cards Count */}
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center gap-2">
                      <Badge className="bg-yellow-500/10 text-yellow-700 font-heading text-label-caps text-xs px-2 py-0.5 border border-yellow-500/20">
                        🟨 {player.total_yellow_cards}
                      </Badge>
                      <Badge className="bg-error/10 text-error font-heading text-label-caps text-xs px-2 py-0.5 border border-error/20">
                        🟥 {player.total_red_cards}
                      </Badge>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Edit Dialog */}
                      <Dialog open={editingPlayer?.id === player.id} onOpenChange={(open) => !open && setEditingPlayer(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPlayer(player)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            ✏️
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl border-0 shadow-large bg-surface-container-lowest">
                          <DialogHeader className="pb-4 border-b border-outline-variant/20">
                            <DialogTitle className="font-heading text-headline-md text-on-surface">
                              Editar Jugador
                            </DialogTitle>
                          </DialogHeader>
                          <EditPlayerForm 
                            player={player}
                            onSave={(updated) => {
                              onUpdate(updated)
                              setEditingPlayer(null)
                            }}
                            onCancel={() => setEditingPlayer(null)}
                          />
                        </DialogContent>
                      </Dialog>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, playerId: player.id })}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-error/10 hover:text-error transition-colors"
                      >
                        🗑️
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedCard>

      {/* Delete Confirmation Dialog - Estilizado */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-large bg-surface-container-lowest">
          <AlertDialogHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-3xl mx-auto mb-4">
              ⚠️
            </div>
            <AlertDialogTitle className="font-heading text-headline-md text-on-surface">
              ¿Eliminar jugador?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-body-md text-on-surface-variant pt-2">
              Esta acción no se puede deshacer. El jugador será eliminado permanentemente del sistema.
              <br /><br />
              <span className="font-heading text-label-caps text-error">
                ¿Estás seguro de continuar?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-outline-variant/20">
            <AlertDialogCancel className="w-full sm:w-auto rounded-full font-heading text-label-caps border-2 border-outline-variant/50 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading === deleteDialog.playerId}
              className="w-full sm:w-auto rounded-full font-heading text-label-caps bg-gradient-primary hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60"
            >
              {loading === deleteDialog.playerId ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
                  Eliminando...
                </>
              ) : (
                'Sí, eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Script para animaciones on-scroll - Usar CSS en globals.css en su lugar */}
    </>
  )
}

// Formulario de Edición - Estilizado
function EditPlayerForm({ 
  player, 
  onSave, 
  onCancel 
}: { 
  player: Player
  onSave: (player: Player) => void
  onCancel: () => void
}) {
  const [fullName, setFullName] = useState(player.full_name)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await updatePlayerAction(player.id, {
      full_name: fullName,
    })

    onSave({
      ...player,
      full_name: fullName,
    })

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
      <div className="space-y-2">
        <Label htmlFor="full_name" className="font-heading text-label-caps text-on-surface-variant">
          Nombre Completo *
        </Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={loading}
          className="h-12 rounded-xl border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 font-body text-body-md disabled:bg-surface-container disabled:text-on-surface-variant"
          placeholder="Ej: Juan Pérez García"
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-12 rounded-full font-heading text-label-caps border-2 border-outline-variant/50 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="flex-1 h-12 rounded-full font-heading text-label-caps text-white bg-gradient-primary hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
              Guardando...
            </>
          ) : (
            '💾 Guardar Cambios'
          )}
        </Button>
      </div>
    </form>
  )
}