// src/components/reports/FinancialReportsManager.tsx
'use client'

import { useState } from 'react'
import { WeeklyFinancialReport, getAllFinancialReports } from '@/services/financial-reports.service'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'

interface FinancialReportsManagerProps {
  initialReports: WeeklyFinancialReport[]
}

export function FinancialReportsManager({ initialReports }: FinancialReportsManagerProps) {
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<WeeklyFinancialReport[]>(initialReports)

  const loadReports = async () => {
    setLoading(true)
    const data = await getAllFinancialReports()
    setReports(data)
    setLoading(false)
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('Reporte Financiero Semanal', 14, 20)
    
    // Subtítulo
    doc.setFontSize(11)
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, 14, 30)
    doc.text('Sistema de Gestión Deportiva', 14, 37)
    
    // Línea divisoria
    doc.setDrawColor(0, 62, 199)
    doc.setLineWidth(0.5)
    doc.line(14, 42, 196, 42)
    
    // Tabla de datos
    const tableData = reports.map(report => [
      `${new Date(report.week_start).toLocaleDateString('es-CR')} - ${new Date(report.week_end).toLocaleDateString('es-CR')}`,
      report.total_inscriptions.toString(),
      report.total_yellow_cards.toString(),
      report.total_red_cards.toString(),
      `₡${report.total_amount.toLocaleString()}`,
    ])

    autoTable(doc, {
      startY: 50,
      head: [['Semana', 'Inscripciones', '🟨 Amarillas', '🟥 Rojas', 'Total Recaudado']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [0, 62, 199], 
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 40, halign: 'right' },
      }
    })

    // Totales generales
    const totalInscriptions = reports.reduce((sum, r) => sum + r.total_inscriptions, 0)
    const totalYellow = reports.reduce((sum, r) => sum + r.total_yellow_cards, 0)
    const totalRed = reports.reduce((sum, r) => sum + r.total_red_cards, 0)
    const totalAmount = reports.reduce((sum, r) => sum + r.total_amount, 0)

    const finalY = (doc as any).lastAutoTable.finalY + 15
    
    // Recuadro de totales
    doc.setFillColor(240, 240, 240)
    doc.rect(14, finalY, 182, 40, 'F')
    
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(0, 62, 199)
    doc.text('RESUMEN TOTAL DEL PERÍODO:', 20, finalY + 10)
    
    doc.setFont(undefined, 'normal')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.text(`Total Inscripciones: ${totalInscriptions}`, 20, finalY + 20)
    doc.text(`Total Tarjetas Amarillas: ${totalYellow}`, 70, finalY + 20)
    doc.text(`Total Tarjetas Rojas: ${totalRed}`, 120, finalY + 20)
    
    doc.setFont(undefined, 'bold')
    doc.setTextColor(0, 128, 0)
    doc.setFontSize(14)
    doc.text(`Monto Total Recaudado: ₡${totalAmount.toLocaleString()}`, 20, finalY + 32)

    // Pie de página
    doc.setFontSize(9)
    doc.setTextColor(128, 128, 128)
    doc.text('Documento generado automáticamente por el sistema', 14, 285)

    // Guardar PDF
    const fileName = `reporte-financiero-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    toast.success('✅ PDF generado y descargado correctamente')
  }

  // Calcular totales
  const totalInscriptions = reports.reduce((sum, r) => sum + r.total_inscriptions, 0)
  const totalYellow = reports.reduce((sum, r) => sum + r.total_yellow_cards, 0)
  const totalRed = reports.reduce((sum, r) => sum + r.total_red_cards, 0)
  const totalAmount = reports.reduce((sum, r) => sum + r.total_amount, 0)

  return (
    <div className="space-y-6">
      {/* Botones de acción */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={loadReports}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 font-heading text-label-caps"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Actualizando...
            </>
          ) : (
            <>🔄 Actualizar Datos</>
          )}
        </Button>
        
        <Button
          onClick={generatePDF}
          disabled={reports.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 font-heading text-label-caps disabled:opacity-50"
        >
          📄 Generar PDF
        </Button>
      </div>

      {/* Estadísticas generales */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AnimatedCard className="p-6" animation="slide-up" delay={0.1}>
            <div className="text-center">
              <div className="text-3xl mb-2">📝</div>
              <p className="font-heading text-label-caps text-on-surface-variant mb-1">
                Total Inscripciones
              </p>
              <p className="font-heading text-headline-lg text-primary font-bold">
                {totalInscriptions}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                ₡{reports.reduce((sum, r) => sum + r.inscriptions_amount, 0).toLocaleString()}
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" animation="slide-up" delay={0.2}>
            <div className="text-center">
              <div className="text-3xl mb-2">🟨</div>
              <p className="font-heading text-label-caps text-on-surface-variant mb-1">
                Tarjetas Amarillas
              </p>
              <p className="font-heading text-headline-lg text-yellow-600 font-bold">
                {totalYellow}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                ₡{reports.reduce((sum, r) => sum + r.yellow_cards_amount, 0).toLocaleString()}
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" animation="slide-up" delay={0.3}>
            <div className="text-center">
              <div className="text-3xl mb-2">🟥</div>
              <p className="font-heading text-label-caps text-on-surface-variant mb-1">
                Tarjetas Rojas
              </p>
              <p className="font-heading text-headline-lg text-error font-bold">
                {totalRed}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                ₡{reports.reduce((sum, r) => sum + r.red_cards_amount, 0).toLocaleString()}
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6" animation="slide-up" delay={0.4}>
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <p className="font-heading text-label-caps text-on-surface-variant mb-1">
                Total Recaudado
              </p>
              <p className="font-heading text-headline-lg text-green-600 font-bold">
                ₡{totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {reports.length} pagos registrados
              </p>
            </div>
          </AnimatedCard>
        </div>
      )}

      {/* Tabla de reportes semanales */}
      {reports.length > 0 && (
        <AnimatedCard className="overflow-hidden" animation="slide-up" delay={0.5}>
          <div className="p-6 border-b border-outline-variant/20">
            <h2 className="font-heading text-headline-md text-on-surface font-bold flex items-center gap-2">
              📊 Desglose por Semana
            </h2>
            <p className="font-body text-body-sm text-on-surface-variant mt-1">
              Todos los pagos registrados en el sistema
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container-low/50">
                  <TableHead className="font-heading text-label-caps text-primary">Semana</TableHead>
                  <TableHead className="font-heading text-label-caps text-primary text-center">Inscripciones</TableHead>
                  <TableHead className="font-heading text-label-caps text-primary text-center">🟨 Amarillas</TableHead>
                  <TableHead className="font-heading text-label-caps text-primary text-center">🟥 Rojas</TableHead>
                  <TableHead className="font-heading text-label-caps text-primary text-right">Monto Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-outline-variant/10">
                {reports.map((report, index) => (
                  <TableRow key={index} className="hover:bg-primary/5">
                    <TableCell className="font-medium">
                      {new Date(report.week_start).toLocaleDateString('es-CR')} - {new Date(report.week_end).toLocaleDateString('es-CR')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-primary/10 text-primary">
                        {report.total_inscriptions}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-yellow-500/10 text-yellow-700">
                        {report.total_yellow_cards}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-error/10 text-error">
                        {report.total_red_cards}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ₡{report.total_amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AnimatedCard>
      )}

      {reports.length === 0 && !loading && (
        <div className="text-center py-12 text-on-surface-variant">
          <div className="text-6xl mb-4">📊</div>
          <p className="font-heading text-body-lg">No hay pagos registrados aún</p>
          <p className="font-body text-body-sm mt-1">
            Los pagos de inscripción y multas aparecerán aquí automáticamente
          </p>
        </div>
      )}
    </div>
  )
}