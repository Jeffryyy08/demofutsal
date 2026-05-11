// src/app/admin/reports/financial/page.tsx
import { getAllFinancialReports } from '@/services/financial-reports.service'
import { FinancialReportsManager } from '@/components/reports/FinancialReportsManager'
import Link from 'next/link'
import { AnimatedCard } from '@/components/ui/AnimatedCard'

export default async function FinancialReportsPage() {
  // Cargar reportes directamente (sin necesidad de torneo)
  const reports = await getAllFinancialReports()

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
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-4 font-heading text-sm font-semibold"
          >
            <span>←</span>
            Volver al Dashboard
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight font-heading flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-2xl">
              📊
            </span>
            Reportes Financieros Semanales
          </h1>
          <p className="text-lg text-blue-100 font-medium font-body">
            Resumen automático de inscripciones, tarjetas y montos recaudados
          </p>
        </div>
      </header>

      <main className="container-custom py-12 px-gutter space-y-8">
        {/* Info */}
        <AnimatedCard className="p-6 bg-blue-50 border-blue-200" animation="slide-up">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="font-heading text-headline-sm text-blue-900 font-bold mb-1">
                Reporte Automático
              </h3>
              <p className="font-body text-body-sm text-blue-800">
                Este reporte muestra <strong>todos los pagos</strong> realizados en el sistema: 
                inscripciones de jugadores, multas por tarjetas amarillas y rojas. 
                Los datos se agrupan automáticamente por semana.
              </p>
            </div>
          </div>
        </AnimatedCard>

        {/* Gestor de Reportes */}
        <FinancialReportsManager initialReports={reports} />
      </main>
    </div>
  )
}