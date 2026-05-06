// src/components/tournaments/TeamRegistrationList.tsx
'use client'

import { Team, TournamentTeam } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface TeamRegistrationListProps {
  availableTeams: Team[]
  registeredTeams: TournamentTeam[]
  onRegister: (teamId: string) => void
  onRemove: (tournamentTeamId: string) => void
  onConfirm: (tournamentTeamId: string, confirmed: boolean) => void
  loading: string | null
}

export function TeamRegistrationList({
  availableTeams,
  registeredTeams,
  onRegister,
  onRemove,
  onConfirm,
  loading,
}: TeamRegistrationListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAvailableTeams = availableTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.section?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Equipos Registrados */}
      <div>
        <h3 className="text-lg font-semibold mb-4">✅ Equipos Inscritos ({registeredTeams.length})</h3>
        {registeredTeams.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay equipos inscritos aún</p>
        ) : (
          <div className="space-y-2">
            {registeredTeams.map((registeredTeam) => (
              <div
                key={registeredTeam.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">
                      {registeredTeam.team?.name}
                      {registeredTeam.team?.subgroup && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {registeredTeam.team.subgroup}
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {registeredTeam.team?.section}
                    </p>
                  </div>
                  {registeredTeam.is_confirmed ? (
                    <Badge className="bg-green-100 text-green-800">Confirmado</Badge>
                  ) : (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={registeredTeam.is_confirmed ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => onConfirm(registeredTeam.id, !registeredTeam.is_confirmed)}
                    disabled={loading === registeredTeam.id}
                  >
                    {registeredTeam.is_confirmed ? 'Desconfirmar' : 'Confirmar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onRemove(registeredTeam.id)}
                    disabled={loading === registeredTeam.id}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agregar Equipos */}
      <div>
        <h3 className="text-lg font-semibold mb-4">➕ Agregar Equipos</h3>
        <Input
          placeholder="Buscar equipo por nombre o sección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        {filteredAvailableTeams.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {availableTeams.length === 0 
              ? 'No hay equipos disponibles. Crea equipos primero en la sección de Gestión de Equipos.'
              : 'No se encontraron equipos'
            }
          </p>
        ) : (
          <div className="space-y-2">
            {filteredAvailableTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">
                    {team.name}
                    {team.subgroup && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {team.subgroup}
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{team.section}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onRegister(team.id)}
                  disabled={loading === team.id}
                >
                  {loading === team.id ? 'Agregando...' : 'Agregar'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}