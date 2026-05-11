// src/components/sanctions/SuspensionsStats.tsx
'use client'

import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { Badge } from '@/components/ui/badge'

interface SuspensionsStatsProps {
  totalActive: number
  totalRedCards: number
  totalAdmin: number
}

export function SuspensionsStats({ 
  totalActive, 
  totalRedCards, 
  totalAdmin 
}: SuspensionsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Activas */}
      <AnimatedCard className="p-6" animation="slide-up" delay={0.1}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-heading text-label-caps text-on-surface-variant mb-2">
              Suspensiones Activas
            </p>
            <p className="font-heading text-headline-lg text-on-surface">
              {totalActive}
            </p>
            <p className="font-body text-body-md text-on-surface-variant mt-2">
              Jugadores no elegibles
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-error/10 text-3xl">
            🚫
          </div>
        </div>
      </AnimatedCard>

      {/* Tarjetas Rojas */}
      <AnimatedCard className="p-6" animation="slide-up" delay={0.2}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-heading text-label-caps text-on-surface-variant mb-2">
              Por Tarjeta Roja
            </p>
            <p className="font-heading text-headline-lg text-on-surface">
              {totalRedCards}
            </p>
            <p className="font-body text-body-md text-on-surface-variant mt-2">
              Suspensión automática
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-error/10 text-3xl">
            🟥
          </div>
        </div>
        {totalRedCards > 0 && (
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <Badge className="bg-error/10 text-error font-heading text-label-caps px-3 py-1">
              Automático
            </Badge>
          </div>
        )}
      </AnimatedCard>

      {/* Administrativas */}
      <AnimatedCard className="p-6" animation="slide-up" delay={0.3}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-heading text-label-caps text-on-surface-variant mb-2">
              Administrativas
            </p>
            <p className="font-heading text-headline-lg text-on-surface">
              {totalAdmin}
            </p>
            <p className="font-body text-body-md text-on-surface-variant mt-2">
              Por decisión del comité
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-3xl">
            📋
          </div>
        </div>
        {totalAdmin > 0 && (
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <Badge className="bg-primary/10 text-primary font-heading text-label-caps px-3 py-1">
              Manual
            </Badge>
          </div>
        )}
      </AnimatedCard>
    </div>
  )
}