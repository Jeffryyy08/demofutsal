// src/app/admin/tournaments/[slug]/page.tsx
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { TournamentManagement } from '@/components/tournaments/TournamentManagement'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import Link from 'next/link'

interface TournamentDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Obtener categoría
  const { data: category } = await supabase
    .from('tournament_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) {
    redirect('/admin/tournaments')
  }

  // Obtener torneos existentes de esta categoría
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .eq('category_id', category.id)
    .order('created_at', { ascending: false })

  const tournamentCount = tournaments?.length || 0

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
                href="/admin/tournaments"
                className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-4 font-heading text-sm font-semibold"
              >
                <span>←</span>
                Volver a Categorías
              </Link>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight font-heading">
                🏆 {category.name}
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-xl font-medium font-body">
                {category.description}
                <br />
              </p>
            </div>
            <div className="flex gap-3">
              <Link 
                href={`/admin/tournaments/${slug}/new`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#fe6b00] hover:bg-[#ff7b1a] text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 no-underline"
              >
                <span>✨</span>
                Crear Torneo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-12 px-gutter space-y-12">
        
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Torneos Creados */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.1}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Torneos Creados
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {tournamentCount}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  En esta categoría
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-primary text-3xl text-white shadow-glow">
                🏆
              </div>
            </div>
            {tournamentCount > 0 && (
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <Badge className="bg-primary/10 text-primary font-heading text-label-caps px-3 py-1">
                  ✅ Activos
                </Badge>
              </div>
            )}
          </AnimatedCard>

          {/* Mínimo de Equipos */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.2}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Mínimo de Equipos
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {category.min_teams_recommended}+
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  Por torneo requerido
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-secondary text-3xl text-white shadow-glow-orange">
                👥
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <p className="font-body text-body-sm text-on-surface-variant">
                Para iniciar competición
              </p>
            </div>
          </AnimatedCard>

          {/* Puntos por Victoria */}
          <AnimatedCard className="p-6" animation="slide-up" delay={0.4}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                  Sistema de Puntos
                </p>
                <p className="font-heading text-headline-lg text-on-surface">
                  {category.points_win} / {category.points_draw} / {category.points_loss}
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-2">
                  Victoria / Empate / Derrota
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-tertiary-container/20 text-3xl text-tertiary">
                ⭐
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <Badge variant="outline" className="font-heading text-label-caps text-xs border-outline-variant/50">
                Reglas estándar
              </Badge>
            </div>
          </AnimatedCard>
        </div>

        {/* Category Info Card */}
        <AnimatedCard className="p-6" animation="slide-up" delay={0.5}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl flex-shrink-0">
              ℹ️
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-headline-md text-on-surface mb-2">
                Configuración de Categoría
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-body text-body-md">
                <div>
                  <span className="text-on-surface-variant">Grados:</span>
                  <span className="font-semibold text-on-surface ml-1">
                    {category.min_grade}° - {category.max_grade}°
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Profesores:</span>
                  <span className={`font-semibold ml-1 ${category.include_teachers ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {category.include_teachers ? '✅ Incluidos' : '❌ No incluidos'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Clasifican:</span>
                  <span className="font-semibold text-on-surface ml-1">
                    {category.teams_per_group >= 4 ? 'Top 2' : 'Top 1 + mejores'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Tournament Management Component */}
        <AnimatedCard className="overflow-hidden" animation="slide-up" delay={0.6}>
          <div className="p-6 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                ⚙️
              </div>
              <div>
                <h2 className="font-heading text-headline-md text-on-surface">
                  Gestión de Torneos
                </h2>
                <p className="font-body text-body-md text-on-surface-variant">
                  Crea, edita y administra torneos dentro de esta categoría
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-surface-container-low/50">
            <TournamentManagement
              category={category}
              existingTournaments={tournaments || []}
            />
          </div>
        </AnimatedCard>

      </main>

      {/* Footer Tip */}
      <div className="container-custom px-gutter py-6">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant font-body text-body-md">
          <span>💡</span>
          <span>
            Tip: Los torneos heredan la configuración de puntos y grupos de su categoría. Puedes ajustar detalles específicos al crear cada torneo.
          </span>
        </div>
      </div>
    </div>
  )
}