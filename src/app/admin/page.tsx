// src/app/admin/page.tsx
// ✅ SIN 'use client' - Esto es un Server Component

import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Obtener torneos activos
  const { data: activeTournaments } = await supabase
    .from('tournaments')
    .select(`
      *,
      category:tournament_categories(name, slug),
      _count:count(tournament_teams)
    `)
    .eq('status', 'active')

  // Obtener estadísticas
  const [{ count: teamsCount }, { count: playersCount }, { count: matchesCount }] = await Promise.all([
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
  ])

  // Obtener partidos recientes
  const { data: recentMatches } = await supabase
    .from('matches')
    .select(`
      *,
      team_a:team_a_id (name, section),
      team_b:team_b_id (name, section),
      tournament:tournaments(name)
    `)
    .order('match_date', { ascending: false })
    .limit(5)

  // Datos para stat cards
  const statCards = [
    {
      label: 'Torneos Activos',
      value: activeTournaments?.length || 0,
      icon: '🏆',
      gradient: 'primary' as const,
      href: '/admin/tournaments',
    },
    {
      label: 'Equipos',
      value: teamsCount || 0,
      icon: '👥',
      gradient: 'secondary' as const,
      href: '/admin/teams',
    },
    {
      label: 'Jugadores',
      value: playersCount || 0,
      icon: '⭐',
      gradient: 'primary' as const,
      href: '/admin/players',
    },
    {
      label: 'Partidos Pendientes',
      value: matchesCount || 0,
      icon: '⚽',
      gradient: 'secondary' as const,
      href: '/admin/matches',
    },
  ]

  const quickActions = [
    { label: 'Registrar Equipo', icon: '👥', href: '/admin/teams' },
    { label: 'Crear Torneo', icon: '🏆', href: '/admin/tournaments' },
    { label: 'Programar Partido', icon: '⚽', href: '/admin/matches' },
    { label: 'Ver Posiciones', icon: '📊', href: '/admin/standings' },
  ]

  return (
    <div className="min-h-screen bg-surface">
      {/* Header con Gradiente - VERSIÓN FINAL CORREGIDA */}
      <header
        className="py-12 px-gutter text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 50%, #0038b6 100%)',
          boxShadow: '0 4px 20px rgba(0, 62, 199, 0.3)'
        }}
      >
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#fe6b00] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container-custom relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
                📊 Dashboard Administrativo
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-xl font-medium">
                Gestiona torneos, equipos, jugadores y partidos en tiempo real.
                <br />
                <span className="text-sm opacity-90">Todo lo que necesitas en un solo lugar.</span>
              </p>
            </div>

            {/* ✅ BOTÓN CORREGIDO: Usar Link en lugar de onClick */}
            <Link
              href="/admin/tournaments"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#fe6b00] hover:bg-[#ff7b1a] text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 no-underline"
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
            <h2 className="text-headline-md text-on-surface">
              📈 Resumen General
            </h2>
            <span className="text-label-caps text-on-surface-variant">
              Actualizado ahora
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => (
              <Link href={stat.href} key={stat.label} className="block">
                <div className="card p-6 hover:shadow-medium transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-label-caps text-on-surface-variant mb-2">{stat.label}</p>
                      <p className="font-heading text-headline-lg text-on-surface">{stat.value}</p>
                    </div>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl text-white shadow-glow ${stat.gradient === 'primary' ? 'bg-gradient-primary' : 'bg-gradient-secondary'
                      }`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Sección Principal: Torneos y Partidos */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Torneos Activos */}
          <div className="card p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-headline-md text-on-surface flex items-center gap-2">
                <span>🏆</span>
                Torneos Activos
              </CardTitle>
              <CardDescription className="text-body-md text-on-surface-variant">
                Torneos actualmente en curso
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {activeTournaments && activeTournaments.length > 0 ? (
                <div className="space-y-4">
                  {activeTournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className="group p-4 rounded-lg bg-surface-container-low border border-outline-variant/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-heading text-headline-md text-on-surface group-hover:text-primary transition-colors">
                            {tournament.name}
                          </p>
                          <p className="text-body-md text-on-surface-variant mt-1">
                            {tournament.category?.name} • {tournament._count} equipos
                          </p>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          className="btn-outline opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Link href={`/admin/tournaments/${tournament.category?.slug}/${tournament.id}`}>
                            Gestionar →
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-4xl mx-auto mb-4">
                    🏆
                  </div>
                  <p className="text-headline-md text-on-surface mb-2">No hay torneos activos</p>
                  <p className="text-body-md text-on-surface-variant mb-6">
                    Crea tu primer torneo para comenzar
                  </p>
                  <Button asChild className="btn-primary">
                    <Link href="/admin/tournaments">
                      Crear Nuevo Torneo
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </div>

          {/* Partidos Recientes */}
          <div className="card p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-headline-md text-on-surface flex items-center gap-2">
                <span>⚽</span>
                Partidos Recientes
              </CardTitle>
              <CardDescription className="text-body-md text-on-surface-variant">
                Últimos partidos programados
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {recentMatches && recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {recentMatches.map((match) => (
                    <div
                      key={match.id}
                      className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-medium ${match.status === 'live'
                        ? 'bg-secondary-container/10 border-secondary-container/30'
                        : 'bg-surface-container-low border-outline-variant/20 hover:border-primary/30'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-heading text-body-lg text-on-surface truncate">
                              {match.team_a?.name} <span className="text-on-surface-variant">vs</span> {match.team_b?.name}
                            </span>

                            {match.status === 'live' && (
                              <span className="badge-live">
                                <span className="badge-live-dot"></span>
                                <span className="badge-live-text">EN VIVO</span>
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

                          <p className="text-body-md text-on-surface-variant mt-2 flex items-center gap-2 flex-wrap">
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
                  <p className="text-headline-md text-on-surface mb-2">No hay partidos recientes</p>
                  <p className="text-body-md text-on-surface-variant">
                    Los partidos programados aparecerán aquí
                  </p>
                </div>
              )}
            </CardContent>
          </div>
        </section>

        {/* Acciones Rápidas */}
        <div className="card p-8">
          <CardHeader className="p-0 mb-8 text-center">
            <CardTitle className="text-headline-md text-on-surface">
              ⚡ Acciones Rápidas
            </CardTitle>
            <CardDescription className="text-body-md text-on-surface-variant">
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  asChild
                  variant="outline"
                  className="h-24 flex flex-col gap-3 rounded-xl border-2 border-outline-variant/30 hover:border-primary hover:bg-primary/5 hover:shadow-medium transition-all duration-300 group"
                >
                  <Link href={action.href} className="flex flex-col items-center gap-2">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{action.icon}</span>
                    <span className="font-heading text-label-caps text-on-surface group-hover:text-primary transition-colors">
                      {action.label}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest py-8 border-t border-outline-variant/20">
        <div className="container-custom px-gutter">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xl">
                ⚽
              </div>
              <span className="font-heading text-headline-md text-on-surface">
                Futsal<span className="text-primary">Pro</span>
              </span>
            </div>
            <p className="text-body-md text-on-surface-variant">
              © 2026 - Sistema de Gestión de Torneos Escolares
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}