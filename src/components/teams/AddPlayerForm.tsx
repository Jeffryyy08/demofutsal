// src/components/teams/AddPlayerForm.tsx
'use client'

import { useState } from 'react'
import { createPlayerAction } from '@/actions/players'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { Badge } from '@/components/ui/badge'

interface AddPlayerFormProps {
  teamId: string
  teamSection: string
  onPlayerAdded: (player: any) => void
}

export function AddPlayerForm({ teamId, teamSection, onPlayerAdded }: AddPlayerFormProps) {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [isCaptain, setIsCaptain] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    const result = await createPlayerAction({
      team_id: teamId,
      full_name: fullName,
      section: teamSection,
      is_captain: isCaptain,
    })

    if (result.success && result.player) {
      onPlayerAdded(result.player)
      setFullName('')
      setIsCaptain(false)
      setSuccess(true)
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } else {
      alert(`❌ Error: ${result.error}`)
    }

    setLoading(false)
  }

  return (
    <AnimatedCard className="w-full" animation="slide-up" delay={0.3}>
      {/* Header con Gradiente */}
      <div 
        className="p-6 text-white relative overflow-hidden rounded-t-lg"
        style={{
          background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 100%)',
        }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-xl">
            ➕
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-headline-md text-white mb-1">
              Agregar Nuevo Jugador
            </h3>
            <p className="font-body text-body-md text-blue-100 flex items-center gap-2">
              Sección: <Badge className="bg-white/20 text-white font-heading text-label-caps text-xs px-2 py-0.5">{teamSection}</Badge>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Nombre Completo */}
        <div className="space-y-2">
          <Label 
            htmlFor="full_name" 
            className="font-heading text-label-caps text-on-surface-variant flex items-center gap-2"
          >
            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-sm">⭐</span>
            Nombre Completo *
          </Label>
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: Juan Pérez García"
            required
            disabled={loading}
            className="
              h-12 rounded-xl border-outline-variant/50 
              font-body text-body-md text-on-surface
              placeholder:text-on-surface-variant/50
              focus:border-primary focus:ring-2 focus:ring-primary/20 
              transition-all duration-200
              disabled:bg-surface-container disabled:text-on-surface-variant
            "
          />
          <p className="text-xs text-on-surface-variant font-body">
            Ingresa el nombre completo del jugador tal como aparece en documentos oficiales
          </p>
        </div>

        {/* Designar Capitán */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="is_captain"
              checked={isCaptain}
              onChange={(e) => setIsCaptain(e.target.checked)}
              disabled={loading}
              className="
                mt-1 h-5 w-5 rounded border-outline-variant/50 
                text-secondary-container focus:ring-2 focus:ring-secondary-container/20
                disabled:opacity-50 disabled:cursor-not-allowed
                accent-secondary-container
              "
            />
            <div className="flex-1">
              <Label 
                htmlFor="is_captain" 
                className="font-heading text-body-md text-on-surface font-semibold cursor-pointer"
              >
                👑 Designar como Capitán
              </Label>
              <p className="font-body text-body-sm text-on-surface-variant mt-1">
                El capitán será el representante del equipo para comunicaciones y decisiones tácticas
              </p>
              {isCaptain && (
                <Badge className="mt-2 bg-secondary-container/10 text-secondary font-heading text-label-caps text-xs">
                  ✅ Será el capitán del equipo
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Mensaje de Éxito */}
        {success && (
          <div 
            className="p-4 rounded-xl bg-primary/10 border border-primary/30 animate-slide-up"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <span className="text-primary text-lg">✅</span>
              <p className="font-body text-body-md text-primary font-medium">
                ¡Jugador agregado exitosamente!
              </p>
            </div>
          </div>
        )}

        {/* Botón de Submit */}
        <div className="pt-4 border-t border-outline-variant/20">
          <Button 
            type="submit" 
            disabled={loading || !fullName.trim()}
            className={`
              w-full h-14 rounded-full font-heading text-label-caps text-white
              bg-gradient-primary hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-300 
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
              flex items-center justify-center gap-2
            `}
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando jugador...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Guardar Jugador</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute -top-5 -right-5 w-20 h-20 rounded-full bg-primary/5 blur-xl" />
      <div className="pointer-events-none absolute -bottom-5 -left-5 w-20 h-20 rounded-full bg-secondary-container/5 blur-xl" />
    </AnimatedCard>
  )
}