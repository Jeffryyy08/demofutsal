// src/components/tournaments/TournamentManagement.tsx
'use client'

import { useState } from 'react'
import { TournamentCategory, Tournament } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createTournamentAction } from '@/actions/tournaments'
import { useRouter } from 'next/navigation'

interface TournamentManagementProps {
  category: TournamentCategory
  existingTournaments: Tournament[]
}

export function TournamentManagement({ 
  category, 
  existingTournaments 
}: TournamentManagementProps) {
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    registration_deadline: '',
  })

  const handleCreate = async () => {
    setLoading(true)
    const result = await createTournamentAction(
      category.id,
      formData.name,
      formData.registration_deadline
    )
    
    if (result.success && result.tournament) {
      router.push(`/admin/tournaments/${category.slug}/${result.tournament.id}`)
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      registration: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      finished: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: '📝 Borrador',
      registration: '📝 Inscripciones',
      active: '🔴 En Curso',
      finished: '✅ Finalizado',
      cancelled: '❌ Cancelado',
    }
    return texts[status] || status
  }

  return (
    <div className="space-y-6">
      {/* Botón Crear Nuevo */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Torneos Existentes</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancelar' : '+ Crear Nuevo Torneo'}
        </Button>
      </div>

      {/* Formulario de Creación */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>🆕 Crear Nuevo Torneo</CardTitle>
            <CardDescription>
              Configura los detalles básicos del torneo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Torneo *</Label>
              <Input
                id="name"
                placeholder="Ej: Torneo 2026 - Primer Semestre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Fecha Límite de Inscripción *</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleCreate} 
              disabled={loading || !formData.name || !formData.registration_deadline}
            >
              {loading ? 'Creando...' : 'Crear Torneo'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Lista de Torneos */}
      <div className="grid grid-cols-1 gap-4">
        {existingTournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{tournament.name}</CardTitle>
                <Badge className={getStatusColor(tournament.status)}>
                  {getStatusText(tournament.status)}
                </Badge>
              </div>
              <CardDescription>
                Creado el {new Date(tournament.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fecha Límite</p>
                  <p className="font-medium">
                    {tournament.registration_deadline 
                      ? new Date(tournament.registration_deadline).toLocaleDateString()
                      : 'No definida'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Inicio</p>
                  <p className="font-medium">
                    {tournament.start_date 
                      ? new Date(tournament.start_date).toLocaleDateString()
                      : 'Pendiente'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Equipos</p>
                  <p className="font-medium">
                    {tournament._count?.teams || 0} inscritos
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fase Actual</p>
                  <p className="font-medium capitalize">{tournament.current_phase}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => router.push(`/admin/tournaments/${category.slug}/${tournament.id}`)}
              >
                Gestionar →
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {existingTournaments.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No hay torneos creados para esta categoría
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              Crear Primer Torneo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}