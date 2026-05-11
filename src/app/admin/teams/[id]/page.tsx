// src/app/admin/teams/[id]/page.tsx
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { PlayersManagement } from '@/components/teams/PlayersManagement'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { payPlayerInscriptionAction } from '@/actions/players'
import Link from 'next/link'

interface TeamPlayersPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TeamPlayersPage({ params }: TeamPlayersPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Obtener equipo
  const {  data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()

  if (!team) {
    redirect('/admin/teams')
  }

  // Obtener jugadores con información de pago
  const {  data: players } = await supabase
    .from('players')
    .select(`
      *,
      payments:player_payments (
        id,
        amount,
        payment_type,
        paid_at,
        payment_method
      )
    `)
    .eq('team_id', id)
    .order('created_at', { ascending: false })

  const playerCount = players?.length || 0
  const captain = players?.find(p => p.is_captain)
  const paidCount = players?.filter(p => p.has_paid_inscription).length || 0
  const pendingCount = playerCount - paidCount

  return (
    <div className="min-h-screen bg-surface">
      
      {/* Header con Gradiente Hero - RESPONSIVE */}
      <header 
        className="py-8 md:py-12 px-4 md:px-gutter text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 50%, #0038b6 100%)',
          boxShadow: '0 4px 20px rgba(0, 62, 199, 0.3)'
        }}
      >
        {/* Efectos decorativos - más pequeños en móvil */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-48 md:w-96 h-48 md:h-96 bg-white rounded-full blur-2xl md:blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-[#fe6b00] rounded-full blur-2xl md:blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container-custom relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
            <div>
              <Link 
                href="/admin/teams"
                className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-3 md:mb-4 font-heading text-sm font-semibold"
              >
                <span>←</span>
                Volver a Equipos
              </Link>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 md:mb-3 tracking-tight font-heading flex items-center gap-3 flex-wrap">
                <span className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-xl md:text-2xl flex-shrink-0">
                  👥
                </span>
                <span className="break-words">{team.name}</span>
                {team.subgroup && (
                  <Badge className="bg-secondary-container text-white font-heading text-label-caps flex-shrink-0">
                    {team.subgroup}
                  </Badge>
                )}
              </h1>
              <p className="text-base md:text-lg text-blue-100 font-medium font-body flex flex-wrap items-center gap-1">
                <span>{team.section}</span>
                <span className="text-sm opacity-90">• Sección {team.section}</span>
              </p>
            </div>
            
            {/* Botones - wrap en móvil */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Link 
                href={`/admin/teams/${id}/edit`}
                className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white/10 hover:bg-white/20 text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 border border-white/30 no-underline text-sm"
              >
                <span>✏️</span>
                Editar Equipo
              </Link>
              <Link 
                href={`/admin/teams/${id}/players/new`}
                className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-[#fe6b00] hover:bg-[#ff7b1a] text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 no-underline text-sm"
              >
                <span>⭐</span>
                Agregar Jugador
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - RESPONSIVE */}
      <main className="container-custom py-6 md:py-12 px-4 md:px-gutter space-y-8 md:space-y-12">
        
        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total Players */}
          <AnimatedCard className="p-4 md:p-6" animation="slide-up" delay={0.1}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Jugadores Registrados
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {playerCount}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  En este equipo
                </p>
              </div>
              <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl bg-gradient-primary text-2xl md:text-3xl text-white shadow-glow flex-shrink-0">
                ⭐
              </div>
            </div>
          </AnimatedCard>

          {/* ✅ Pagaron Inscripción */}
          <AnimatedCard className="p-4 md:p-6" animation="slide-up" delay={0.2}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Inscritos (Pagaron)
                </p>
                <p className="font-heading text-headline-lg text-on-surface text-green-600">
                  {paidCount}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  Listos para jugar
                </p>
              </div>
              <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl bg-green-500/10 text-2xl md:text-3xl text-green-600 flex-shrink-0">
                ✅
              </div>
            </div>
          </AnimatedCard>

          {/* ⏳ Pendientes de Pago */}
          <AnimatedCard className="p-4 md:p-6" animation="slide-up" delay={0.3}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Pendientes de Pago
                </p>
                <p className="font-heading text-headline-lg text-on-surface text-amber-600">
                  {pendingCount}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  ₡1,000 por jugador
                </p>
              </div>
              <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl bg-amber-500/10 text-2xl md:text-3xl text-amber-600 flex-shrink-0">
                ⏳
              </div>
            </div>
          </AnimatedCard>

          {/* Captain Info */}
          <AnimatedCard className="p-4 md:p-6" animation="slide-up" delay={0.4}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Capitán
                </p>
                <p className="font-heading text-headline-md text-on-surface break-words">
                  {captain?.full_name || '—'}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  {captain ? (captain.has_paid_inscription ? '✅ Inscrito' : '⏳ Pendiente') : 'Sin capitán'}
                </p>
              </div>
              <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl bg-secondary-container/10 text-2xl md:text-3xl text-secondary flex-shrink-0">
                🎖️
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Players Management Component */}
        <AnimatedCard className="overflow-hidden" animation="slide-up" delay={0.6}>
          <div className="p-4 md:p-6 border-b border-outline-variant/20">
            <div className="flex items-start md:items-center gap-3 md:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl flex-shrink-0">
                ⭐
              </div>
              <div>
                <h2 className="font-heading text-headline-md text-on-surface">
                  Gestión de Jugadores
                </h2>
                <p className="font-body text-body-md text-on-surface-variant">
                  Agrega, edita o elimina jugadores de este equipo
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-6 bg-surface-container-low/50 overflow-x-auto">
            <PlayersManagement 
              team={team}
              initialPlayers={players?.map(({ payments, ...p }) => p) || []}
            />
          </div>
        </AnimatedCard>

      </main>

      {/* Footer Tip - RESPONSIVE */}
      <div className="container-custom px-4 md:px-gutter py-4 md:py-6">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant font-body text-body-md text-center">
          <span>💡</span>
          <span>
            Los jugadores pagan inscripción UNA VEZ por categoría. Una vez pagado, pueden participar en cualquier torneo de su sección.
          </span>
        </div>
      </div>
    </div>
  )
}