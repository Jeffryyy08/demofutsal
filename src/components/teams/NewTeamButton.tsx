// src/components/teams/NewTeamButton.tsx
'use client'

import { Button } from '@/components/ui/button'

export function NewTeamButton() {
  return (
    <Button onClick={() => document.getElementById('team-form')?.scrollIntoView({ behavior: 'smooth' })}>
      + Nuevo Equipo
    </Button>
  )
}