// src/app/admin/sanctions/page.tsx
import { createClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { SuspensionsTable } from '@/components/sanctions/SuspensionsTable'
import { SuspensionsStats } from '@/components/sanctions/SuspensionsStats'
import Link from 'next/link'

// ✅ Definir tipos explícitos
interface PlayerSuspensionWithRelations {
  id: string
  suspension_type: 'red_card' | 'admin'
  reason: string | null
  matches_suspended: number
  matches_remaining: number
  created_at: string
  tournament_id: string
  player_id: string
  player: {
    id: string
    full_name: string
    team: {
      id: string
      name: string
      section: string
    } | null
  } | null
  tournament: {
    id: string
    name: string
  } | null
  fine_payment?: {
    id: string
    amount: number
    paid_at: string | null
    payment_method: string
  } | null
  fine_paid?: boolean
}

// ✅ NUEVO TIPO: Para multas de tarjetas amarillas
interface YellowCardFine {
  id: string
  payment_id: string
  player_id: string
  tournament_id: string
  amount: number
  paid_at: string | null
  created_at: string
  player: {
    id: string
    full_name: string
    team: {
      id: string
      name: string
      section: string
    } | null
  } | null
  tournament: {
    id: string
    name: string
  } | null
}

export default async function SanctionsPage() {
  const supabase = await createClient()

  // ✅ PASO 1: Obtener suspensiones activas (tarjetas rojas)
  const { data: activeSuspensions, error: suspensionsError } = await supabase
    .from('player_suspensions')
    .select(`
      id,
      suspension_type,
      reason,
      matches_suspended,
      matches_remaining,
      created_at,
      tournament_id,
      player_id,
      player:player_id (
        id,
        full_name,
        team:team_id (
          id,
          name,
          section
        )
      ),
      tournament:tournament_id (
        id,
        name
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // ✅ PASO 2: Obtener multas de tarjetas amarillas pendientes
  const { data: yellowCardFines, error: yellowFinesError } = await supabase
    .from('player_payments')
    .select(`
      id,
      player_id,
      tournament_id,
      amount,
      paid_at,
      created_at,
      player:player_id (
        id,
        full_name,
        team:team_id (
          id,
          name,
          section
        )
      ),
      tournament:tournament_id (
        id,
        name
      )
    `)
    .eq('payment_type', 'yellow_card')
    .is('paid_at', null)  // Solo multas NO pagadas
    .order('created_at', { ascending: false })

  // ✅ PASO 3: Obtener pagos de multa para suspensiones (tarjetas rojas)
  const suspensionPlayerIds = activeSuspensions
    ?.filter(s => s.suspension_type === 'red_card')
    .map(s => s.player_id) || []

  let cardPayments: any[] = []
  if (suspensionPlayerIds.length > 0) {
    const { data: payments } = await supabase
      .from('player_payments')
      .select('id, player_id, amount, paid_at, payment_method, tournament_id')
      .in('player_id', suspensionPlayerIds)
      .in('payment_type', ['red_card'])

    cardPayments = payments || []
  }

  // ✅ PASO 4: Combinar suspensiones con sus pagos
  const processedSuspensions = (activeSuspensions || []).map(suspension => {
    const playerPayments = cardPayments.filter(
      p => p.player_id === suspension.player_id && p.tournament_id === suspension.tournament_id
    )
    const finePaid = playerPayments.some((p: any) => p.paid_at !== null)

    return {
      ...suspension,
      fine_payment: playerPayments.find((p: any) => p.paid_at !== null) || null,
      fine_paid: finePaid,
    }
  })

  // ✅ PASO 5: Convertir multas de amarillas al formato compatible
  const yellowFinesAsSuspensions: PlayerSuspensionWithRelations[] = (yellowCardFines || []).map((fine: any) => ({
    id: `yellow_${fine.id}`,  // ID único para evitar conflictos
    suspension_type: 'admin' as const, // Tratar como suspensión administrativa para diferenciar
    reason: 'Multa por tarjeta amarilla', 
    matches_suspended: 0,  // No hay suspensión de partidos
    matches_remaining: 0, 
    created_at: fine.created_at,
    tournament_id: fine.tournament_id,
    player_id: fine.player_id,
    player: fine.player,
    tournament: fine.tournament,
    fine_payment: {
      id: fine.id,
      amount: fine.amount,
      paid_at: fine.paid_at,
      payment_method: 'cash',
    },
    fine_paid: fine.paid_at !== null,
    is_yellow_card_fine: true,
  }))
  // ✅ PASO 6: Combinar suspensiones rojas + multas amarillas
  const allSuspensions = [
    ...processedSuspensions,
    ...yellowFinesAsSuspensions,
  ].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const safeSuspensions = allSuspensions

  // ✅ Obtener estadísticas
  const { count: totalActive } = await supabase
    .from('player_suspensions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: totalRedCards } = await supabase
    .from('player_suspensions')
    .select('*', { count: 'exact', head: true })
    .eq('suspension_type', 'red_card')
    .eq('is_active', true)

  const { count: totalAdmin } = await supabase
    .from('player_suspensions')
    .select('*', { count: 'exact', head: true })
    .eq('suspension_type', 'admin')
    .eq('is_active', true)

  // ✅ Contar multas de amarillas pendientes
  const { count: totalYellowFines } = await supabase
    .from('player_payments')
    .select('*', { count: 'exact', head: true })
    .eq('payment_type', 'yellow_card')
    .is('paid_at', null)

  const safeTotalActive = (totalActive || 0) + (totalYellowFines || 0)
  const safeTotalRedCards = totalRedCards || 0
  const safeTotalAdmin = totalAdmin || 0

  // Debug logs
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [SANCTIONS] Debug:', {
      suspensionsError,
      yellowFinesError,
      activeSuspensionsCount: processedSuspensions.length,
      yellowCardFinesCount: yellowCardFines?.length || 0,
      totalCombined: safeSuspensions.length,
      totalActive: safeTotalActive,
    })
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header con Gradiente */}
      <header
        className="py-12 px-gutter text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 50%, #0038b6 100%)',
          boxShadow: '0 4px 20px rgba(0, 62, 199, 0.3)'
        }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#fe6b00] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container-custom relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-4 font-heading text-sm font-semibold"
              >
                <span>←</span>
                Volver al Dashboard
              </Link>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight font-heading flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-2xl">
                  🟨
                </span>
                Gestión de Sanciones
              </h1>
              <p className="text-lg text-blue-100 font-medium font-body">
                Administra suspensiones, tarjetas y multas de jugadores
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-custom py-12 px-gutter space-y-12">

        {/* Estadísticas */}
        <SuspensionsStats
          totalActive={safeTotalActive}
          totalRedCards={safeTotalRedCards}
          totalAdmin={safeTotalAdmin}
        />

        {/* Tabla de Suspensiones y Multas */}
        <AnimatedCard className="overflow-hidden" animation="slide-up" delay={0.3}>
          <div className="p-6 border-b border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10 text-xl">
                  🚫
                </div>
                <div>
                  <h2 className="font-heading text-headline-md text-on-surface">
                    Suspensiones y Multas Pendientes
                  </h2>
                  <p className="font-body text-body-md text-on-surface-variant">
                    {safeSuspensions.length} registros pendientes
                  </p>
                </div>
              </div>
              <Badge className="bg-error/10 text-error font-heading text-label-caps px-4 py-2">
                {safeSuspensions.length} Activas
              </Badge>
            </div>
          </div>

          <div className="p-6 bg-surface-container-low/50">
            {/* ✅ Pasar tournamentId para habilitar pagos de multas */}
            <SuspensionsTable
              suspensions={safeSuspensions}
              tournamentId={safeSuspensions[0]?.tournament_id || ''}
            />
          </div>
        </AnimatedCard>

      </main>
    </div>
  )
}