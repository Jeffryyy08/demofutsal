// src/app/admin/tournaments/[slug]/[tournamentId]/inscriptions/page.tsx
import { createClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { PlayerInscriptionsManager } from '@/components/tournaments/PlayerInscriptionsManager'
import Link from 'next/link'

export default async function TournamentInscriptionsPage({
  params,
}: {
  params: { slug: string; tournamentId: string }
}) {
  const supabase = await createClient()

  // Obtener información del torneo
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, section')
    .eq('id', params.tournamentId)
    .single()

  // Obtener configuración del torneo
  const { data: config } = await supabase
    .from('tournament_settings')
    .select('inscription_fee, yellow_card_fee, red_card_fee')
    .eq('tournament_id', params.tournamentId)
    .single()

  // Obtener equipos del torneo
  const { data: teamsData } = await supabase
    .from('tournament_teams')
    .select(`
    team_id,
    team:teams (
      id,
      name,
      section
    )
  `)
    .eq('tournament_id', params.tournamentId)
    .order('team:section')

  // ✅ Transformar teams: extraer team[0] y aplanar la estructura
  const teams = (teamsData || []).map(tt => {
    const teamObj = Array.isArray(tt.team) ? tt.team[0] : tt.team
    return {
      id: teamObj?.id || tt.team_id,
      name: teamObj?.name || '',
      section: teamObj?.section || '',
    }
  }).filter(t => t.id) // Filtrar teams nulos

  // Obtener jugadores de todos los equipos
  const { data: playersData } = await supabase
    .from('players')
    .select(`
    id,
    full_name,
    team_id,
    has_paid_inscription,
    inscription_paid_at,
    team:teams (
      id,
      name,
      section
    )
  `)
    .in('team_id', teams.map(t => t.id))
    .order('team:section')
    .order('full_name')

  // ✅ Transformar players: extraer team[0]
  const players = (playersData || []).map(player => ({
    ...player,
    team: Array.isArray(player.team) ? player.team[0] : player.team,
  }))

  const inscriptionFee = config?.inscription_fee || 1000

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header
        className="py-12 px-gutter text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 50%, #0038b6 100%)',
          boxShadow: '0 4px 20px rgba(0, 62, 199, 0.3)'
        }}
      >
        <div className="container-custom relative z-10">
          <Link
            href={`/admin/tournaments/${params.slug}/${params.tournamentId}`}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-4 font-heading text-sm font-semibold"
          >
            <span>←</span>
            Volver al Torneo
          </Link>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight font-heading flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-2xl">
              💳
            </span>
            Inscripciones - {tournament?.name}
          </h1>
          <p className="text-lg text-blue-100 font-medium font-body">
            Gestiona el pago de inscripción de los jugadores
          </p>
        </div>
      </header>

      <main className="container-custom py-12 px-gutter space-y-8">

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AnimatedCard className="p-6" animation="slide-up" delay={0.1}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Total Jugadores
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {players?.length || 0}
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                👥
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" animation="slide-up" delay={0.2}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Inscritos (Pagaron)
                </p>
                <p className="font-heading text-headline-lg text-on-surface text-green-600">
                  {players?.filter(p => p.has_paid_inscription).length || 0}
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-500/10 text-3xl">
                ✅
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" animation="slide-up" delay={0.3}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Pendientes de Pago
                </p>
                <p className="font-heading text-headline-lg text-on-surface text-amber-600">
                  {players?.filter(p => !p.has_paid_inscription).length || 0}
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-500/10 text-3xl">
                ⏳
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" animation="slide-up" delay={0.4}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Costo Inscripción
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  ₡{inscriptionFee.toLocaleString()}
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                💵
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Gestor de Inscripciones */}
        <PlayerInscriptionsManager
          tournamentId={params.tournamentId}
          players={players}  // ✅ team ahora es objeto
          teams={teams || []}
          inscriptionFee={inscriptionFee}
        />

      </main>
    </div>
  )
}