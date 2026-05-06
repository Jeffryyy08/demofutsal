// src/app/admin/tournaments/[slug]/[tournamentId]/page.tsx
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { TournamentConfig } from '@/components/tournaments/TournamentConfig'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import Link from 'next/link'

interface TournamentConfigPageProps {
  params: Promise<{
    slug: string
    tournamentId: string
  }>
}

export default async function TournamentConfigPage({ params }: TournamentConfigPageProps) {
  const { slug, tournamentId } = await params
  const supabase = await createClient()

  // Obtener torneo
  const { data: tournament } = await supabase
    .from('tournaments')
    .select(`
      *,
      category:tournament_categories(*)
    `)
    .eq('id', tournamentId)
    .single()

  if (!tournament) {
    redirect('/admin/tournaments')
  }

  // Obtener equipos inscritos
  const { data: registeredTeams } = await supabase
    .from('tournament_teams')
    .select(`
      *,
      team:teams(*)
    `)
    .eq('tournament_id', tournamentId)
    .order('registered_at')

  // Obtener equipos disponibles
  const { data: availableTeams } = await supabase
    .from('teams')
    .select('*')
    .eq('is_active', true)
    .not('id', 'in', `(${registeredTeams?.map(t => t.team_id).join(',') || '""'})`)
    .order('section')
    .order('name')

  const registeredCount = registeredTeams?.length || 0
  const availableCount = availableTeams?.length || 0
  const status = tournament.status as 'draft' | 'registration' | 'active' | 'finished' | 'cancelled'

  // Badge de estado con colores
  const getStatusBadge = () => {
    const styles: Record<string, string> = {
      draft: 'bg-surface-container-high text-on-surface-variant',
      registration: 'bg-primary/10 text-primary',
      active: 'bg-secondary-container/10 text-secondary',
      finished: 'bg-tertiary-container/20 text-tertiary',
      cancelled: 'bg-error/10 text-error',
    }
    const labels: Record<string, string> = {
      draft: '📝 Borrador',
      registration: '🔓 Inscripciones Abiertas',
      active: '🔴 En Curso',
      finished: '✅ Finalizado',
      cancelled: '❌ Cancelado',
    }
    return (
      <Badge className={`${styles[status]} font-heading text-label-caps px-3 py-1`}>
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      
      {/* Header con Gradiente Hero */}
      <header 
        className="py-12 px-gutter text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 50%, #0038b6 100%)',
          boxShadow: '0 4px 20px rgba(0, 62, 199, 0.3)'
        }}
      >
        {/* Efectos decorativos */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#fe6b00] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container-custom relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Link 
                href={`/admin/tournaments/${slug}`}
                className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-4 font-heading text-sm font-semibold"
              >
                <span>←</span>
                Volver a {tournament.category?.name}
              </Link>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight font-heading">
                ⚙️ {tournament.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-lg text-blue-100 font-medium font-body">
                  {tournament.category?.name}
                </p>
                {getStatusBadge()}
              </div>
            </div>
            <div className="flex gap-3">
              {status === 'draft' && (
                <Link 
                  href={`/admin/tournaments/${slug}/${tournamentId}/edit`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#fe6b00] hover:bg-[#ff7b1a] text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 no-underline"
                >
                  <span>✏️</span>
                  Editar Configuración
                </Link>
              )}
              {status === 'registration' && (
                <Link 
                  href={`/admin/tournaments/${slug}/${tournamentId}/teams`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#fe6b00] hover:bg-[#ff7b1a] text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 no-underline"
                >
                  <span>👥</span>
                  Gestionar Equipos
                </Link>
              )}
              {status === 'active' && (
                <Link 
                  href={`/admin/tournaments/${slug}/${tournamentId}/matches`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#fe6b00] hover:bg-[#ff7b1a] text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 no-underline"
                >
                  <span>⚽</span>
                  Ver Partidos
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-12 px-gutter space-y-12">
        
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Equipos Inscritos */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.1}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Equipos Inscritos
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {registeredCount}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  Confirmados en el torneo
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-primary text-3xl text-white shadow-glow">
                ✅
              </div>
            </div>
            {registeredCount > 0 && (
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-body text-on-surface-variant">Meta: 8-16 equipos</span>
                  <span className={`font-heading font-semibold ${
                    registeredCount >= 8 ? 'text-primary' : 'text-on-surface-variant'
                  }`}>
                    {registeredCount >= 8 ? '✅ Listo' : '⏳ Pendiente'}
                  </span>
                </div>
              </div>
            )}
          </AnimatedCard>

          {/* Equipos Disponibles */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.2}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Equipos Disponibles
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {availableCount}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  Pueden registrarse
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-3xl text-primary">
                👥
              </div>
            </div>
            {availableCount > 0 && status === 'registration' && (
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <Badge className="bg-secondary-container/10 text-secondary font-heading text-label-caps px-3 py-1">
                  📩 Inscripciones abiertas
                </Badge>
              </div>
            )}
          </AnimatedCard>

          {/* Fecha de Inicio */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.3}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Fecha de Inicio
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {tournament.start_date 
                    ? new Date(tournament.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                    : '—'
                  }
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  {tournament.start_date 
                    ? new Date(tournament.start_date).toLocaleDateString('es-ES', { year: 'numeric' })
                    : 'Por definir'
                  }
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-tertiary-container/20 text-3xl text-tertiary">
                📅
              </div>
            </div>
          </AnimatedCard>

          {/* Estado del Torneo */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.4}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Estado Actual
                </p>
                <p className="font-heading text-headline-lg text-on-surface capitalize">
                  {status === 'draft' && '📝 Borrador'}
                  {status === 'registration' && '🔓 Registrando'}
                  {status === 'active' && '🔴 En Juego'}
                  {status === 'finished' && '✅ Finalizado'}
                  {status === 'cancelled' && '❌ Cancelado'}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  {status === 'draft' && 'Configuración pendiente'}
                  {status === 'registration' && 'Aceptando equipos'}
                  {status === 'active' && 'Partidos en curso'}
                  {status === 'finished' && 'Torneo completado'}
                  {status === 'cancelled' && 'No se realizará'}
                </p>
              </div>
              <div className={`flex h-16 w-16 items-center justify-center rounded-xl text-3xl text-white ${
                status === 'active' ? 'bg-gradient-secondary shadow-glow-orange' :
                status === 'finished' ? 'bg-primary shadow-glow' :
                'bg-surface-container-high text-on-surface'
              }`}>
                {status === 'draft' && '📋'}
                {status === 'registration' && '🔓'}
                {status === 'active' && '⚽'}
                {status === 'finished' && '🏆'}
                {status === 'cancelled' && '❌'}
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Tournament Configuration Component */}
        <AnimatedCard className="overflow-hidden" animation="slide-up" delay={0.5}>
          <div className="p-6 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                ⚙️
              </div>
              <div>
                <h2 className="font-heading text-headline-md text-on-surface">
                  Configuración del Torneo
                </h2>
                <p className="font-body text-body-md text-on-surface-variant">
                  Gestiona equipos, grupos, partidos y configuración avanzada
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-surface-container-low/50">
            <TournamentConfig 
              tournament={tournament}
              registeredTeams={registeredTeams || []}
              availableTeams={availableTeams || []}
            />
          </div>
        </AnimatedCard>

      </main>

      {/* Footer Tip */}
      <div className="container-custom px-gutter py-6">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant font-body text-body-md">
          <span>💡</span>
          <span>
            Tip: Una vez que el torneo esté en estado "En Curso", la configuración de grupos y equipos se bloqueará para mantener la integridad de la competición.
          </span>
        </div>
      </div>
    </div>
  )
}