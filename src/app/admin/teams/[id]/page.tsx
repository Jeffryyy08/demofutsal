// src/app/admin/teams/[id]/page.tsx
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { PlayersManagement } from '@/components/teams/PlayersManagement'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
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
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()

  if (!team) {
    redirect('/admin/teams')
  }

  // Obtener jugadores
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', id)
    .order('created_at', { ascending: false })

  const playerCount = players?.length || 0
  const captain = players?.find(p => p.is_captain)

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
                href="/admin/teams"
                className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-4 font-heading text-sm font-semibold"
              >
                <span>←</span>
                Volver a Equipos
              </Link>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight font-heading flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-2xl">
                  👥
                </span>
                {team.name}
                {team.subgroup && (
                  <Badge className="bg-secondary-container text-white font-heading text-label-caps">
                    {team.subgroup}
                  </Badge>
                )}
              </h1>
              <p className="text-lg text-blue-100 font-medium font-body">
                {team.section}
                <span className="text-sm opacity-90 ml-2">• Sección {team.section}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link 
                href={`/admin/teams/${id}/edit`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 border border-white/30 no-underline"
              >
                <span>✏️</span>
                Editar Equipo
              </Link>
              <Link 
                href={`/admin/teams/${id}/players/new`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#fe6b00] hover:bg-[#ff7b1a] text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 no-underline"
              >
                <span>⭐</span>
                Agregar Jugador
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-12 px-gutter space-y-12">
        
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Players */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.1}>
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
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-primary text-3xl text-white shadow-glow">
                ⭐
              </div>
            </div>
            {playerCount > 0 && (
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <Badge className="bg-primary/10 text-primary font-heading text-label-caps px-3 py-1">
                  ✅ Listo para jugar
                </Badge>
              </div>
            )}
          </AnimatedCard>

          {/* Captain Info */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.2}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Capitán del Equipo
                </p>
                <p className="font-heading text-headline-md text-on-surface">
                  {captain?.full_name || '—'}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  {captain ? 'Líder designado' : 'Sin capitán asignado'}
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary-container/10 text-3xl text-secondary">
                🎖️
              </div>
            </div>
            {!captain && (
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <Badge variant="outline" className="font-heading text-label-caps text-xs border-outline-variant/50">
                  ⚠️ Asignar capitán
                </Badge>
              </div>
            )}
          </AnimatedCard>

          {/* Team Status */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.3}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Estado del Equipo
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {team.is_active ? '✅ Activo' : '❌ Inactivo'}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  {team.is_active ? 'Disponible para torneos' : 'No participa actualmente'}
                </p>
              </div>
              <div className={`flex h-16 w-16 items-center justify-center rounded-xl text-3xl text-white ${
                team.is_active ? 'bg-gradient-secondary shadow-glow-orange' : 'bg-surface-container-high text-on-surface'
              }`}>
                {team.is_active ? '🟢' : '🔴'}
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Players Management Component */}
        <AnimatedCard className="overflow-hidden" animation="slide-up" delay={0.4}>
          <div className="p-6 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
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
          
          <div className="p-6 bg-surface-container-low/50">
            <PlayersManagement 
              team={team}
              initialPlayers={players || []}
            />
          </div>
        </AnimatedCard>

      </main>

      {/* Footer Tip */}
      <div className="container-custom px-gutter py-6">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant font-body text-body-md">
          <span>💡</span>
          <span>
            Tip: El capitán del equipo será el punto de contacto principal para comunicaciones del torneo y decisiones tácticas.
          </span>
        </div>
      </div>
    </div>
  )
}