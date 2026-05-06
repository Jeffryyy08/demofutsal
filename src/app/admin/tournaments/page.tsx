// src/app/admin/tournaments/page.tsx
import { createClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import Link from 'next/link'

export default async function AdminTournamentsPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('tournament_categories')
    .select('*')
    .eq('is_active', true)
    .order('min_grade')

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
                href="/admin"
                className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-4 font-heading text-sm font-semibold"
              >
                <span>←</span>
                Volver al Dashboard
              </Link>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight font-heading">
                🏆 Gestión de Torneos
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-xl font-medium font-body">
                Organiza y administra los torneos por categorías.
                <br />
                <span className="text-sm opacity-90">Crea, edita y lanza competiciones escolares.</span>
              </p>
            </div>
            <Link 
              href="/admin/tournaments/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#fe6b00] hover:bg-[#ff7b1a] text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 no-underline"
            >
              <span>✨</span>
              Crear Nueva Categoría
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-12 px-gutter">
        
        {/* Stats Bar */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-outline-variant/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#fe6b00] animate-pulse" />
              <span className="font-heading text-label-caps text-on-surface-variant">
                {categories?.length || 0} Categorías Activas
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-white font-heading text-label-caps px-3 py-1">
              {categories?.length || 0}
            </Badge>
            <span className="font-body text-body-md text-on-surface-variant">
              Total
            </span>
          </div>
        </div>

        {/* Categories Grid */}
        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <AnimatedCard 
                key={category.id}
                className="group cursor-pointer overflow-hidden"
                animation="slide-up"
                delay={index * 0.1}
              >
                <Link href={`/admin/tournaments/${category.slug}`} className="block h-full">
                  {/* Card Header con Gradiente */}
                  <div 
                    className="relative p-6 pb-4"
                    style={{
                      background: `linear-gradient(135deg, ${index % 2 === 0 ? '#003ec7' : '#0052ff'} 0%, ${index % 2 === 0 ? '#0052ff' : '#0038b6'} 100%)`,
                    }}
                  >
                    {/* Patrón decorativo */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative flex items-start justify-between">
                      <div>
                        <Badge className="bg-white/20 text-white border-white/30 font-heading text-label-caps mb-3">
                          {category.min_grade}° - {category.max_grade}°
                        </Badge>
                        <h3 className="font-heading text-headline-md text-white mb-1 group-hover:text-white transition-colors">
                          {category.name}
                        </h3>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
                        🏆
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Description */}
                    <p className="font-body text-body-md text-on-surface-variant line-clamp-2">
                      {category.description || 'Sin descripción'}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 rounded-lg bg-surface-container-low">
                        <p className="font-heading text-label-caps text-on-surface-variant text-xs uppercase">
                          Equipos
                        </p>
                        <p className="font-heading text-headline-md text-on-surface mt-1">
                          {category.min_teams_recommended}+
                        </p>
                      </div>
                    </div>

                    {/* Features Tags */}
                    <div className="flex flex-wrap gap-2">
                      {category.include_teachers && (
                        <Badge variant="outline" className="font-heading text-label-caps text-xs border-primary/30 text-primary">
                          👨‍🏫 Profesores
                        </Badge>
                      )}
                      <Badge variant="outline" className="font-heading text-label-caps text-xs border-primary/30 text-primary">
                        ⚽ {category.points_win}P por victoria
                      </Badge>
                      {category.teams_per_group > 4 && (
                        <Badge variant="outline" className="font-heading text-label-caps text-xs border-secondary-container/30 text-secondary">
                          🔥 Grupos grandes
                        </Badge>
                      )}
                    </div>

                    {/* Action Hint */}
                    <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                      <span className="font-body text-body-md text-on-surface-variant">
                        Ver detalles →
                      </span>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        →
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimatedCard>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center text-5xl mx-auto mb-6 animate-bounce-subtle">
              🏆
            </div>
            <h3 className="font-heading text-headline-md text-on-surface mb-3">
              No hay categorías disponibles
            </h3>
            <p className="font-body text-body-lg text-on-surface-variant mb-8 max-w-md mx-auto">
              Crea tu primera categoría de torneo para comenzar a organizar competiciones escolares.
            </p>
            <Link 
              href="/admin/tournaments/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-white font-heading font-semibold text-label-caps rounded-full transition-all duration-300 shadow-lg hover:shadow-glow hover:scale-105 no-underline"
            >
              <span>✨</span>
              Crear Primera Categoría
            </Link>
          </div>
        )}

      </main>

      {/* Footer Decorativo */}
      <div className="container-custom px-gutter py-8">
        <div className="flex items-center justify-center gap-2 text-on-surface-variant font-body text-body-md">
          <span>💡</span>
          <span>
            Tip: Las categorías definen las reglas base para todos los torneos que crees dentro de ellas.
          </span>
        </div>
      </div>
    </div>
  )
}