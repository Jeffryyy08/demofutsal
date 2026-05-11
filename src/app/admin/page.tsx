// src/app/admin/page.tsx
// ✅ SIN 'use client' - Esto es un Server Component

import { createClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import Link from 'next/link'
import Image from 'next/image'

// Types para type-safety - CORREGIDOS
interface TournamentCategory {
  name: string
  slug: string
}

interface Tournament {
  id: string
  name: string
  status: string
  category?: { name: string; slug: string }[] | null  // ✅ Array
  tournament_teams?: number | null  // ✅ Número, no array
}

interface MatchTeam {
  name: string
  section: string
}

interface Match {
  id: string
  status: 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed'
  score_a: number
  score_b: number
  match_date: string
  team_a?: { name: string; section: string }[] | null  // ✅ Array
  team_b?: { name: string; section: string }[] | null  // ✅ Array
  tournament?: { name: string }[] | null  // ✅ Array
}

interface StatCard {
  label: string
  value: number
  icon: string
  gradient: 'primary' | 'secondary'
  href: string
}

interface QuickAction {
  label: string
  icon: string
  href: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // ✅ Obtener torneos activos
  const { data: activeTournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select(`
      id,
      name,
      status,
      category:tournament_categories(name, slug),
      tournament_teams!count(*)
    `)
    .eq('status', 'active')

  // ✅ Obtener estadísticas
  const [{ count: teamsCount }, { count: playersCount }, { count: matchesCount }] = await Promise.all([
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
  ])

  // ✅ Obtener partidos recientes
  const { data: recentMatches, error: matchesError } = await supabase
    .from('matches')
    .select(`
      id,
      status,
      score_a,
      score_b,
      match_date,
      team_a:team_a_id(name, section),
      team_b:team_b_id(name, section),
      tournament:tournaments(name)
    `)
    .order('match_date', { ascending: false })
    .limit(5)

  // ✅ Fallbacks seguros
  const safeActiveTournaments = activeTournaments || []
  const safeRecentMatches = recentMatches || []

  const statCards: StatCard[] = [
    {
      label: 'Torneos Activos',
      value: safeActiveTournaments.length,
      icon: '🏆',
      gradient: 'primary',
      href: '/admin/tournaments',
    },
    {
      label: 'Equipos',
      value: teamsCount || 0,
      icon: '👥',
      gradient: 'secondary',
      href: '/admin/teams',
    },
    {
      label: 'Jugadores',
      value: playersCount || 0,
      icon: '⭐',
      gradient: 'primary',
      href: '/admin/players',
    },
    {
      label: 'Partidos Pendientes',
      value: matchesCount || 0,
      icon: '⚽',
      gradient: 'secondary',
      href: '/admin/matches',
    },
  ]

  const quickActions: QuickAction[] = [
    { label: 'Registrar Equipo', icon: '👥', href: '/admin/teams' },
    { label: 'Crear Torneo', icon: '🏆', href: '/admin/tournaments' },
    { label: 'Programar Partido', icon: '⚽', href: '/admin/matches' },
    { label: 'Ver Posiciones', icon: '📊', href: '/admin/standings' },
  ]

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
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight font-heading">
                📊 Panel Administrativo
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-xl font-medium font-body">
                Gestiona torneos, equipos, jugadores y partidos en tiempo real.
                <br />
                <span className="text-sm opacity-90">Todo lo que necesitas en un solo lugar.</span>
              </p>
            </div>
            <Link
              href="/admin/tournaments"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#fe6b00] hover:bg-[#ff7b1a] text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 no-underline"
            >
              <span>🏆</span>
              Gestionar Torneos
            </Link>
          </div>
        </div>
      </header>

      <main className="container-custom py-12 px-gutter space-y-12">

        {/* Estadísticas Principales */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-headline-md text-on-surface font-heading">
              📈 Resumen General
            </h2>
            <span className="text-label-caps text-on-surface-variant font-heading">
              Actualizado ahora
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => (
              <Link href={stat.href} key={stat.label} className="block">
                <AnimatedCard className="p-6 hover:shadow-medium transition-all duration-300" animation="scale-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-label-caps text-on-surface-variant mb-2 font-heading">{stat.label}</p>
                      <p className="font-heading text-headline-lg text-on-surface">{stat.value}</p>
                    </div>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl text-white shadow-glow ${stat.gradient === 'primary' ? 'bg-gradient-primary' : 'bg-gradient-secondary'
                      }`}>
                      {stat.icon}
                    </div>
                  </div>
                </AnimatedCard>
              </Link>
            ))}
          </div>
        </section>

        {/* Sección Principal: Torneos y Partidos */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Torneos Activos */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.2}>
            <div className="mb-6">
              <h3 className="text-headline-md text-on-surface font-heading flex items-center gap-2">
                <span>🏆</span>
                Torneos Activos
              </h3>
              <p className="text-body-md text-on-surface-variant font-body">
                Torneos actualmente en curso
              </p>
            </div>

            {safeActiveTournaments.length > 0 ? (
              <div className="space-y-4">
                {safeActiveTournaments.map((tournament: Tournament) => {
                  // ✅ Extraer primera categoría (array → objeto)
                  const firstCategory = Array.isArray(tournament.category)
                    ? tournament.category[0]
                    : tournament.category

                  // ✅ tournament_teams ya es número
                  const teamCount = tournament.tournament_teams || 0

                  return (
                    <Link
                      key={tournament?.id || 'unknown'}
                      href={`/admin/tournaments/${firstCategory?.slug || 'unknown'}/${tournament.id}`}
                      className="group block p-4 rounded-lg bg-surface-container-low border border-outline-variant/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-heading text-headline-md text-on-surface group-hover:text-primary transition-colors">
                            {tournament.name}
                          </p>
                          <p className="text-body-md text-on-surface-variant font-body mt-1">
                            {firstCategory?.name || 'Sin categoría'} • {teamCount} equipos
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary font-heading text-label-caps opacity-0 group-hover:opacity-100 transition-opacity">
                          Gestionar →
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-4xl mx-auto mb-4">
                  🏆
                </div>
                <p className="text-headline-md text-on-surface font-heading mb-2">No hay torneos activos</p>
                <p className="text-body-md text-on-surface-variant font-body mb-6">
                  Crea tu primer torneo para comenzar
                </p>
                <Link
                  href="/admin/tournaments"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 shadow-lg hover:shadow-glow hover:scale-105 no-underline"
                >
                  <span>✨</span>
                  Crear Nuevo Torneo
                </Link>
              </div>
            )}
          </AnimatedCard>

          {/* Partidos Recientes */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.3}>
            <div className="mb-6">
              <h3 className="text-headline-md text-on-surface font-heading flex items-center gap-2">
                <span>⚽</span>
                Partidos Recientes
              </h3>
              <p className="text-body-md text-on-surface-variant font-body">
                Últimos partidos programados
              </p>
            </div>

            {safeRecentMatches.length > 0 ? (
              <div className="space-y-3">
                {safeRecentMatches.map((match: Match) => (
                  <div
                    key={match?.id || 'unknown'}
                    className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-medium ${match.status === 'live'
                      ? 'bg-secondary-container/10 border-secondary-container/30'
                      : 'bg-surface-container-low border-outline-variant/20 hover:border-primary/30'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-heading text-body-lg text-on-surface truncate">
                            {match.team_a?.name || 'TBD'} <span className="text-on-surface-variant">vs</span> {match.team_b?.name || 'TBD'}
                          </span>

                          {match.status === 'live' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/10 border border-secondary-container/20 animate-pulse-slow">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary-container"></span>
                              </span>
                              <span className="text-label-caps text-secondary font-heading">EN VIVO</span>
                            </span>
                          )}

                          {match.status === 'finished' && (
                            <span className="px-3 py-1 bg-primary text-white text-label-caps rounded-full font-heading">
                              ✅ {match.score_a} - {match.score_b}
                            </span>
                          )}

                          {match.status === 'scheduled' && (
                            <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-label-caps rounded-full font-heading">
                              📅 Pendiente
                            </span>
                          )}
                        </div>

                        <p className="text-body-md text-on-surface-variant font-body mt-2 flex items-center gap-2 flex-wrap">
                          <span>🕐</span>
                          {new Date(match.match_date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {match.tournament && (
                            <>
                              <span className="text-outline-variant">•</span>
                              <span className="text-primary font-heading">{match.tournament.name}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-4xl mx-auto mb-4">
                  ⚽
                </div>
                <p className="text-headline-md text-on-surface font-heading mb-2">No hay partidos recientes</p>
                <p className="text-body-md text-on-surface-variant font-body">
                  Los partidos programados aparecerán aquí
                </p>
              </div>
            )}
          </AnimatedCard>
        </section>

        {/* Acciones Rápidas */}
        <AnimatedCard className="p-8" animation="slide-up" delay={0.4}>
          <div className="mb-8 text-center">
            <h3 className="text-headline-md text-on-surface font-heading">
              ⚡ Acciones Rápidas
            </h3>
            <p className="text-body-md text-on-surface-variant font-body">
              Accede rápidamente a las funciones más utilizadas
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-outline-variant/30 hover:border-primary hover:bg-primary/5 hover:shadow-medium transition-all duration-300"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{action.icon}</span>
                <span className="font-heading text-label-caps text-on-surface group-hover:text-primary transition-colors text-center">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </AnimatedCard>

      </main>

      <footer className="bg-surface-container-highest py-8 border-t border-outline-variant/20">
        <div className="container-custom px-gutter">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Logo CTP */}
              <Image
                src="/images/logoicon.png"
                alt="FutsalCTP Logo"
                width={80}
                height={80}
                className="rounded-lg"
              />

              {/* Texto FutsalCTP */}
              <span className="font-heading text-headline-md text-on-surface">
                <span className="text-[#003ec7]">Futsal</span>
                <span className="text-[#fe6b00]">CTP</span>
              </span>
            </div>

            <p className="text-body-md text-on-surface-variant font-body">
              © 2026 FutsalCTP - By Jeffry López. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}