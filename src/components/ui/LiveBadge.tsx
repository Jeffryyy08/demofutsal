// src/components/ui/LiveBadge.tsx
'use client'

export function LiveBadge() {
  return (
    <div className="badge-live">
      <span className="badge-live-dot"></span>
      <span className="text-label-caps text-secondary-container font-heading">
        EN VIVO
      </span>
    </div>
  )
}