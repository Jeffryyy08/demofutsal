// src/components/tables/TeamsTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Team } from '@/types'
import { deleteTeamAction } from '@/actions/teams'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
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

// Tipo extendido para incluir info de torneo
interface TeamWithTournament extends Team {
  tournament?: {
    name: string
    status: string
  } | null
}

interface TeamsTableProps {
  teams: TeamWithTournament[]
}

export function TeamsTable({ teams }: TeamsTableProps) {
  const router = useRouter()
  const [deleteDialog, setDeleteDialog] = useState<{ 
    open: boolean
    teamId?: string 
    teamName?: string 
  }>({ open: false })
  const [loading, setLoading] = useState<string | null>(null)
  const [localTeams, setLocalTeams] = useState<TeamWithTournament[]>(teams)

  const handleDelete = async (id: string) => {
    setLoading(id)
    const result = await deleteTeamAction(id)
    
    if (result.success) {
      setLocalTeams(localTeams.filter(t => t.id !== id))
    }
    
    setLoading(null)
    setDeleteDialog({ open: false })
  }

  const handleEdit = (team: TeamWithTournament) => {
    localStorage.setItem('editingTeam', JSON.stringify(team))
    document.getElementById('team-form')?.scrollIntoView({ behavior: 'smooth' })
    window.dispatchEvent(new CustomEvent('loadTeamData'))
  }

  const handleViewPlayers = (teamId: string) => {
    router.push(`/admin/teams/${teamId}`)
  }

  // Badge de estado del torneo con colores del design system
  const getTournamentBadge = (tournament: { name: string; status: string } | null | undefined) => {
    if (!tournament) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-heading text-label-caps text-xs">
          Sin asignar
        </span>
      )
    }
    
    const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
      draft: { 
        bg: 'bg-surface-container-high', 
        text: 'text-on-surface-variant',
        label: '📝 Borrador'
      },
      registration: { 
        bg: 'bg-primary/10', 
        text: 'text-primary',
        label: '🔓 Inscripciones'
      },
      active: { 
        bg: 'bg-secondary-container/10', 
        text: 'text-secondary',
        label: '🔴 En Curso'
      },
      finished: { 
        bg: 'bg-tertiary-container/20', 
        text: 'text-tertiary',
        label: '✅ Finalizado'
      },
      cancelled: { 
        bg: 'bg-error/10', 
        text: 'text-error',
        label: '❌ Cancelado'
      },
    }
    
    const style = statusStyles[tournament.status] || statusStyles.draft
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${style.bg} ${style.text} font-heading text-label-caps text-xs`}>
        {tournament.name}
      </span>
    )
  }

  // Empty State Animado
  if (localTeams.length === 0) {
    return (
      <AnimatedCard className="p-12 text-center" animation="scale-in">
        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce-subtle">
          👥
        </div>
        <h3 className="font-heading text-headline-md text-on-surface mb-3">
          No hay equipos registrados
        </h3>
        <p className="font-body text-body-md text-on-surface-variant mb-6">
          Crea el primer equipo para comenzar a organizar tu torneo
        </p>
        <Button 
          onClick={() => document.getElementById('team-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-primary"
        >
          ✨ Crear Primer Equipo
        </Button>
      </AnimatedCard>
    )
  }

  return (
    <>
      <AnimatedCard className="overflow-hidden" animation="slide-up">
        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                <th className="font-heading text-label-caps text-primary text-left py-4 px-6">
                  Equipo
                </th>
                <th className="font-heading text-label-caps text-primary text-left py-4 px-6">
                  Sección
                </th>
                <th className="font-heading text-label-caps text-primary text-left py-4 px-6">
                  Torneo
                </th>
                <th className="font-heading text-label-caps text-primary text-center py-4 px-6">
                  Jugadores
                </th>
                <th className="font-heading text-label-caps text-primary text-right py-4 px-6">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {localTeams.map((team, index) => (
                <tr 
                  key={team.id}
                  className="group hover:bg-primary/5 transition-colors duration-200 animate-on-scroll"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  {/* Team Name */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-body-md text-on-surface font-semibold">
                        {team.name}
                      </span>
                    </div>
                  </td>

                  {/* Section + Subgroup */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-body-md text-on-surface">
                        {team.section}
                      </span>
                      {team.subgroup && (
                        <Badge className="bg-surface-container-high text-on-surface font-heading text-label-caps text-xs px-2 py-0.5">
                          {team.subgroup}
                        </Badge>
                      )}
                    </div>
                  </td>

                  {/* Tournament Badge */}
                  <td className="py-4 px-6">
                    {getTournamentBadge(team.tournament)}
                  </td>

                  {/* View Players Button */}
                  <td className="py-4 px-6 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPlayers(team.id)}
                      disabled={loading === team.id}
                      className="rounded-full font-heading text-label-caps text-xs px-4 h-8 border-outline-variant/50 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
                      title="Ver Jugadores"
                    >
                      👥 Ver
                    </Button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(team)}
                        disabled={loading === team.id}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ 
                          open: true, 
                          teamId: team.id, 
                          teamName: team.name 
                        })}
                        disabled={loading === team.id}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-error/10 hover:text-error transition-colors"
                        title="Eliminar"
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
              ¿Eliminar equipo?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-body-md text-on-surface-variant pt-2">
              Esta acción marcará al equipo{' '}
              <span className="font-semibold text-on-surface">
                {deleteDialog.teamName}
              </span>{' '}
              como inactivo. No se eliminarán los datos históricos, pero el equipo no aparecerá en listados activos.
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
              onClick={() => deleteDialog.teamId && handleDelete(deleteDialog.teamId)}
              disabled={loading === deleteDialog.teamId}
              className="w-full sm:w-auto rounded-full font-heading text-label-caps bg-gradient-primary hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60"
            >
              {loading === deleteDialog.teamId ? (
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
    </>
  )
}