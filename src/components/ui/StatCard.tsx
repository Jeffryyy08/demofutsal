// src/components/ui/StatCard.tsx
'use client'

import { AnimatedCard } from './AnimatedCard'
import { cn } from '@/lib/utils'  // ✅ Agregar este import

interface StatCardProps {
  label: string
  value: string | number
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  gradient?: 'primary' | 'secondary' | 'tertiary'
}

export function StatCard({ label, value, icon, trend, gradient = 'primary' }: StatCardProps) {
  const gradients = {
    primary: 'bg-gradient-primary',
    secondary: 'bg-gradient-secondary',
    tertiary: 'bg-gradient-card',
  }

  return (
    <AnimatedCard className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label-caps text-onSurfaceVariant mb-2">{label}</p>
          <p className="font-heading text-headline-lg text-onSurface">{value}</p>
          {trend && (
            <p className={cn(
              'text-body-md mt-2 font-heading',
              trend === 'up' && 'text-secondary',
              trend === 'down' && 'text-error',
              trend === 'neutral' && 'text-onSurfaceVariant'
            )}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {trend === 'neutral' && '• '}
              vs semana anterior
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center text-3xl text-white shadow-glow',
            gradients[gradient]
          )}>
            {icon}
          </div>
        )}
      </div>
    </AnimatedCard>
  )
}