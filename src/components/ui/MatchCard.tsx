// src/components/ui/MatchCard.tsx
'use client'

import { AnimatedCard } from './AnimatedCard'
import { LiveBadge } from './LiveBadge'
import { cn } from '@/lib/utils'

interface MatchCardProps {
  teamA: { name: string; section: string; score?: number }
  teamB: { name: string; section: string; score?: number }
  date: string
  status: 'scheduled' | 'live' | 'finished'
  group?: string
  onClick?: () => void
}

export function MatchCard({ teamA, teamB, date, status, group, onClick }: MatchCardProps) {
  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {group && (
          <span className="text-label-caps text-primary font-heading">
            {group}
          </span>
        )}
        {status === 'live' && <LiveBadge />}
        {status === 'finished' && (
          <span className="text-label-caps text-onSurfaceVariant font-heading">
            FINALIZADO
          </span>
        )}
        {status === 'scheduled' && (
          <span className="text-label-caps text-onSurfaceVariant font-heading">
            {date}
          </span>
        )}
      </div>

      {/* Teams & Score */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {/* Team A */}
        <div className="text-right">
          <p className="font-heading text-headline-md text-onSurface">{teamA.name}</p>
          <p className="text-body-md text-onSurfaceVariant">{teamA.section}</p>
        </div>

        {/* Score */}
        <div className={cn(
          'px-6 py-3 rounded-lg font-heading text-headline-lg',
          status === 'live' 
            ? 'bg-gradient-live text-white shadow-glow-orange'
            : 'bg-surface-container-high text-onSurface'
        )}>
          {status === 'scheduled' ? (
            <span className="text-body-lg">VS</span>
          ) : (
            <span>{teamA.score ?? 0} - {teamB.score ?? 0}</span>
          )}
        </div>

        {/* Team B */}
        <div className="text-left">
          <p className="font-heading text-headline-md text-onSurface">{teamB.name}</p>
          <p className="text-body-md text-onSurfaceVariant">{teamB.section}</p>
        </div>
      </div>

      {/* Footer */}
      {status === 'live' && (
        <div className="mt-4 pt-4 border-t border-outline-variant/20">
          <div className="flex items-center justify-center gap-2 text-secondary-container font-heading text-label-caps animate-pulse-fast">
            <span>🔴</span>
            <span>Partido en curso</span>
          </div>
        </div>
      )}
    </>
  )

  // ✅ Si hay onClick, envolver en div clickeable
  if (onClick) {
    return (
      <div 
        onClick={onClick}
        className={cn(
          'cursor-pointer',
          status === 'live' && 'border-2 border-error'
        )}
      >
        <AnimatedCard className="p-6">
          {content}
        </AnimatedCard>
      </div>
    )
  }

  // ✅ Sin onClick, solo AnimatedCard
  return (
    <AnimatedCard 
      className={cn(
        'p-6',
        status === 'live' && 'card-live border-2'
      )}
    >
      {content}
    </AnimatedCard>
  )
}