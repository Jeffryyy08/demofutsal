// src/app/admin/matches/[matchId]/live/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Match, Team } from '@/types'
import { LiveMatchControl } from '@/components/tournaments/LiveMatchControl'
import { Button } from '@/components/ui/button'

export default function MatchLivePage() {
  const params = useParams()
  const router = useRouter()
  const [match, setMatch] = useState<(Match & { teamA?: Team; teamB?: Team }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMatch = async () => {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          teamA:team_a_id (id, name, section),
          teamB:team_b_id (id, name, section)
        `)
        .eq('id', params.matchId)
        .single()

      if (data) {
        setMatch({
          ...data,
          teamA: data.teamA?.[0] || data.teamA,
          teamB: data.teamB?.[0] || data.teamB,
        })
      }
      setLoading(false)
    }

    loadMatch()
  }, [params.matchId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-lg">Cargando partido...</p>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-lg">Partido no encontrado</p>
          <Button onClick={() => router.back()} className="mt-4">
            ← Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <LiveMatchControl
      match={match}
      onClose={() => router.back()}
    />
  )
}