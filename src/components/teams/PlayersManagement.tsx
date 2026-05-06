// src/components/teams/PlayersManagement.tsx
'use client'

import { useState } from 'react'
import { Team, Player } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlayersList } from './PlayersList'
import { AddPlayerForm } from './AddPlayerForm'
import { BulkImportPlayers } from './BulkImportPlayers'

interface PlayersManagementProps {
  team: Team
  initialPlayers: Player[]
}

export function PlayersManagement({ team, initialPlayers }: PlayersManagementProps) {
  const [activeTab, setActiveTab] = useState('list')
  const [players, setPlayers] = useState<Player[]>(initialPlayers)

  const handlePlayerAdded = (newPlayer: Player) => {
    setPlayers([...players, newPlayer])
    setActiveTab('list')
  }

  const handlePlayersBulkAdded = (count: number) => {
    window.location.reload()
  }

  const handlePlayerUpdated = (updatedPlayer: Player) => {
    setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p))
  }

  const handlePlayerDeleted = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId))
  }

  const captainCount = players.filter(p => p.is_captain).length

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{players.length}</p>
            <p className="text-sm text-muted-foreground">Jugadores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{captainCount > 0 ? '✅' : '⚠️'}</p>
            <p className="text-sm text-muted-foreground">Capitán</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {players.filter(p => p.is_suspended).length}
            </p>
            <p className="text-sm text-muted-foreground">Suspendidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {players.filter(p => p.is_blocked).length}
            </p>
            <p className="text-sm text-muted-foreground">Bloqueados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">📋 Lista de Jugadores</TabsTrigger>
          <TabsTrigger value="add">➕ Agregar Jugador</TabsTrigger>
          <TabsTrigger value="bulk">📄 Importar Lista</TabsTrigger>
        </TabsList>

        {/* Tab: Lista */}
        <TabsContent value="list">
          <PlayersList 
            players={players}
            onUpdate={handlePlayerUpdated}
            onDelete={handlePlayerDeleted}
          />
        </TabsContent>

        {/* Tab: Agregar */}
        <TabsContent value="add">
          <AddPlayerForm 
            teamId={team.id}
            teamSection={team.section || ''}
            onPlayerAdded={handlePlayerAdded}
          />
        </TabsContent>

        {/* Tab: Importar */}
        <TabsContent value="bulk">
          <BulkImportPlayers 
            teamId={team.id}
            teamSection={team.section || ''}
            onPlayersAdded={handlePlayersBulkAdded}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}