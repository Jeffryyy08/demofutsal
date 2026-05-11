// src/services/financial-reports.service.ts
import { supabase } from '@/lib/supabase'

export interface WeeklyFinancialReport {
  week_start: string
  week_end: string
  total_inscriptions: number
  total_yellow_cards: number
  total_red_cards: number
  total_amount: number
  inscriptions_amount: number
  yellow_cards_amount: number
  red_cards_amount: number
  payment_count: number
  payments?: any[]  // Para guardar detalles de pagos
}

export async function getAllFinancialReports(): Promise<WeeklyFinancialReport[]> {
  try {
    // Obtener TODOS los pagos del sistema (sin filtrar por torneo)
    const { data: payments, error } = await supabase
      .from('player_payments')
      .select(`
        amount,
        payment_type,
        paid_at,
        notes,
        player:player_id (full_name),
        team:team_id (name, section)
      `)
      .order('paid_at', { ascending: true })

    if (error) throw error

    // Agrupar por semana
    const weeksMap = new Map<string, WeeklyFinancialReport>()

    payments.forEach(payment => {
      const paidDate = new Date(payment.paid_at)
      const weekStart = getWeekStart(paidDate)
      const weekEnd = getWeekEnd(paidDate)
      const weekKey = `${weekStart.toISOString()}-${weekEnd.toISOString()}`

      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, {
          week_start: weekStart.toISOString(),
          week_end: weekEnd.toISOString(),
          total_inscriptions: 0,
          total_yellow_cards: 0,
          total_red_cards: 0,
          total_amount: 0,
          inscriptions_amount: 0,
          yellow_cards_amount: 0,
          red_cards_amount: 0,
          payment_count: 0,
          payments: [],
        })
      }

      const week = weeksMap.get(weekKey)!
      week.payment_count++
      week.total_amount += payment.amount
      week.payments?.push(payment)

      if (payment.payment_type === 'inscription') {
        week.total_inscriptions++
        week.inscriptions_amount += payment.amount
      } else if (payment.payment_type === 'yellow_card') {
        week.total_yellow_cards++
        week.yellow_cards_amount += payment.amount
      } else if (payment.payment_type === 'red_card') {
        week.total_red_cards++
        week.red_cards_amount += payment.amount
      }
    })

    // Convertir a array y ordenar
    return Array.from(weeksMap.values()).sort((a, b) => 
      new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
    )
  } catch (err) {
    console.error('❌ Error al obtener reportes financieros:', err)
    return []
  }
}

export async function getCurrentWeekSummary(): Promise<WeeklyFinancialReport | null> {
  try {
    const now = new Date()
    const weekStart = getWeekStart(now)
    const weekEnd = getWeekEnd(now)

    const { data: payments, error } = await supabase
      .from('player_payments')
      .select(`
        amount,
        payment_type,
        paid_at,
        player:player_id (full_name),
        team:team_id (name, section)
      `)
      .gte('paid_at', weekStart.toISOString())
      .lte('paid_at', weekEnd.toISOString())

    if (error) throw error

    const report: WeeklyFinancialReport = {
      week_start: weekStart.toISOString(),
      week_end: weekEnd.toISOString(),
      total_inscriptions: 0,
      total_yellow_cards: 0,
      total_red_cards: 0,
      total_amount: 0,
      inscriptions_amount: 0,
      yellow_cards_amount: 0,
      red_cards_amount: 0,
      payment_count: payments.length,
      payments: payments,
    }

    payments.forEach(payment => {
      report.total_amount += payment.amount

      if (payment.payment_type === 'inscription') {
        report.total_inscriptions++
        report.inscriptions_amount += payment.amount
      } else if (payment.payment_type === 'yellow_card') {
        report.total_yellow_cards++
        report.yellow_cards_amount += payment.amount
      } else if (payment.payment_type === 'red_card') {
        report.total_red_cards++
        report.red_cards_amount += payment.amount
      }
    })

    return report
  } catch (err) {
    console.error('❌ Error al obtener resumen de semana actual:', err)
    return null
  }
}

// Helpers
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end
}