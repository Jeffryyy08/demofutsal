// src/types/index.ts

// ============================================
// USUARIOS Y AUTENTICACIÓN
// ============================================
export interface User {
  id: string
  email: string
  full_name?: string
  role?: 'admin' | 'professor' | 'student'
  created_at: string
}

// ============================================
// EQUIPOS
// ============================================
export interface Team {
  id: string
  name: string
  section: string | null
  subgroup: string | null
  captain_id: string | null
  is_active: boolean
  total_yellow_cards: number
  total_red_cards: number
  goal_difference: number
  total_goals_for: number
  total_goals_against: number
  points: number
  matches_played: number
  created_at: string
}

export interface TeamFormData {
  name: string
  section: string
  subgroup: string
}

// ============================================
// JUGADORES
// ============================================
export interface Player {
  id: string
  team_id: string
  full_name: string
  section: string | null
  is_captain: boolean
  is_suspended: boolean
  is_blocked: boolean
  total_yellow_cards: number
  total_red_cards: number
  suspension_matches_remaining: number
  created_at: string
  team?: Team
  
  // ✅ NUEVOS CAMPOS - Sistema de Pagos y Sanciones
  has_paid_inscription?: boolean
  inscription_paid_at?: string
  is_eligible_to_play?: boolean
}

export interface PlayerFormData {
  full_name: string
  section: string
  is_captain: boolean
}

// ============================================
// PROFESORES
// ============================================
export interface Teacher {
  id: string
  user_id: string | null
  full_name: string
  section: string | null
  total_yellow_cards: number
  total_red_cards: number
  is_blocked: boolean
  suspension_matches_remaining: number
  created_at: string
  updated_at: string
}

// ============================================
// PARTIDOS
// ============================================
export interface Match {
  id: string
  team_a_id: string | null
  team_b_id: string | null
  score_a: number
  score_b: number
  status: 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed'
  match_date: string
  location: string | null
  notes: string | null
  team_a_fouls: number
  team_b_fouls: number
  team_a_yellow_cards: number
  team_b_yellow_cards: number
  team_a_red_cards: number
  team_b_red_cards: number
  is_rescheduled: boolean
  original_date: string | null
  reported_by: string | null
  reported_at: string | null
  created_at: string
  tournament_id: string | null
  phase_id: string | null
  round_number: number
  is_knockout: boolean
  next_match_id: string | null
  group_label: string | null
  team_a?: Team
  team_b?: Team
  tournament?: Tournament
}

export interface MatchFormData {
  team_a_id: string
  team_b_id: string
  match_date: string
  location?: string
  tournament_id?: string
}

export interface MatchEvent {
  id?: string
  match_id: string
  event_type: 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'penalty' | 'substitution'
  team_id: 'a' | 'b'
  player_id?: string | null
  player_name: string
  minute: number
  extra_minute?: number | null
  description?: string | null
  created_at?: string
}

// ============================================
// TORNEOS - CATEGORÍAS
// ============================================
export interface TournamentCategory {
  id: string
  name: string
  slug: string
  description: string | null
  min_grade: number
  max_grade: number
  include_teachers: boolean
  min_teams_recommended: number
  max_teams_allowed: number
  teams_per_group: number
  groups_count: number
  points_win: number
  points_draw: number
  points_loss: number
  is_active: boolean
  created_at: string
}

// ============================================
// TORNEOS
// ============================================
export interface Tournament {
  id: string
  category_id: string
  name: string
  year: number
  status: 'draft' | 'registration' | 'active' | 'finished' | 'cancelled'
  registration_deadline: string | null
  start_date: string | null
  end_date: string | null
  current_phase: string
  created_by: string | null
  created_at: string
  updated_at: string
  category?: TournamentCategory
  _count?: {
    teams: number
    matches: number
  }
  // ✅ NUEVO: Configuración del torneo (si viene con join)
  settings?: TournamentConfig
}

export interface TournamentFormData {
  name: string
  category_id: string
  registration_deadline: string
  start_date: string
}

// ============================================
// EQUIPOS EN TORNEOS
// ============================================
export interface TournamentTeam {
  id: string
  tournament_id: string
  team_id: string
  group_label: string | null
  seed_position: number | null
  is_confirmed: boolean
  registered_at: string
  team?: Team
  tournament?: Tournament
}

// ============================================
// FASES DE TORNEO
// ============================================
export interface TournamentPhase {
  id: string
  tournament_id: string
  name: string
  phase_type: 'groups' | 'knockout'
  phase_order: number
  is_active: boolean
  config: Record<string, any> | null
  created_at: string
  tournament?: Tournament
}

// ============================================
// ✅ CONFIGURACIÓN DE TORNEO (Pagos y Sanciones)
// ============================================
export interface TournamentConfig {
  id: string
  tournament_id: string
  // Configuración de puntos (heredada de category)
  puntos_victoria?: number
  puntos_empate?: number
  puntos_derrota?: number
  
  // ✅ Configuración de jugadores
  max_jugadores_por_equipo?: number
  min_jugadores_por_equipo?: number
  permitir_empates?: boolean
  
  // ✅ Configuración de pagos (en colones)
  inscription_fee: number        // Inscripción por jugador (default: 1000)
  yellow_card_fee: number        // Multa por amarilla (default: 1000)
  red_card_fee: number           // Multa por roja (default: 2000)
  
  // ✅ Configuración de sanciones
  red_card_suspension_matches: number  // Partidos de suspensión por roja (default: 1)
  
  // ✅ Configuración de elegibilidad
  min_players_to_play: number    // Mínimo de jugadores que deben pagar para jugar (default: 5)
  
  // ✅ Marcador por incomparecencia/forfeit
  forfeit_score_a: number        // Goles equipo que no juega (default: 0)
  forfeit_score_b: number        // Goles equipo ganador por forfeit (default: 3)
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface TournamentConfigFormData {
  inscription_fee: number
  yellow_card_fee: number
  red_card_fee: number
  red_card_suspension_matches: number
  min_players_to_play: number
  forfeit_score_a: number
  forfeit_score_b: number
}

// ============================================
// ✅ PAGOS DE JUGADORES
// ============================================
export interface PlayerPayment {
  id: string
  tournament_id: string
  player_id: string
  team_id: string
  payment_type: 'inscription' | 'yellow_card' | 'red_card'
  amount: number
  paid_at: string
  payment_method: 'cash' | 'transfer' | 'sinpe'
  match_id?: string  // Para tarjetas (referencia al partido)
  notes?: string
  created_at: string
  
  // ✅ Relaciones (si vienen con join)
  player?: Player
  team?: Team
  tournament?: Tournament
  match?: Match
}

export interface PlayerPaymentFormData {
  tournament_id: string
  player_id: string
  team_id: string
  payment_type: 'inscription' | 'yellow_card' | 'red_card'
  amount: number
  payment_method: 'cash' | 'transfer' | 'sinpe'
  match_id?: string
  notes?: string
}

// ============================================
// ✅ SUSPENSIONES DE JUGADORES
// ============================================
export interface PlayerSuspension {
  id: string
  tournament_id: string
  player_id: string
  team_id: string
  suspension_type: 'red_card' | 'admin'
  reason?: string
  matches_suspended: number
  matches_remaining: number
  match_id?: string  // Partido que causó la suspensión
  is_active: boolean
  resolved_at?: string
  created_at: string
  
  // ✅ Relaciones (si vienen con join)
  player?: Player
  team?: Team
  tournament?: Tournament
  match?: Match
}

export interface PlayerSuspensionFormData {
  tournament_id: string
  player_id: string
  team_id: string
  suspension_type: 'red_card' | 'admin'
  reason?: string
  matches_suspended: number
  match_id?: string
}

// ============================================
// ✅ ELEGIBILIDAD PARA JUGAR
// ============================================
export interface PlayerEligibility {
  player_id: string
  player_name: string
  team_id: string
  team_name: string
  has_paid_inscription: boolean
  is_suspended: boolean
  suspension_reason?: string
  suspension_matches_remaining: number
  total_yellow_cards: number
  total_red_cards: number
  is_eligible: boolean  // true si puede jugar
  ineligibility_reason?: string  // 'no_payment' | 'suspended' | 'both'
  has_unpaid_card_fees?: boolean
  unpaid_fees_count?: number
}

export interface TeamEligibilityCheck {
  team_id: string
  team_name: string
  total_players: number
  eligible_players: number
  ineligible_players: number
  can_play: boolean  // true si tiene >= min_players_to_play elegibles
  ineligible_list: PlayerEligibility[]
  forfeit_info?: {
    should_forfeit: boolean
    reason: string
    score: string
  }
}

export interface MatchEligibilityResult {
  match_id: string
  team_a: TeamEligibilityCheck
  team_b: TeamEligibilityCheck
  can_play: boolean
  forfeit?: {
    winner: 'A' | 'B' | 'none'
    score: string
    reason: string
  }
}

// ============================================
// VISTA PREVIA DE GRUPOS
// ============================================
export interface GroupPreview {
  group_label: string
  teams: Team[]
  matches_count: number
}

export interface TournamentPreview {
  groups: GroupPreview[]
  total_matches: number
  total_rounds: number
  estimated_duration_days: number
}

// ============================================
// TRANSACCIONES (PAGOS Y MULTAS)
// ============================================
export interface Transaction {
  id: string
  team_id: string | null
  user_id: string | null
  amount: number
  concept: string
  fee_type: 'inscription' | 'yellow_card' | 'red_card' | 'suspension' | 'other' | null
  status: 'pending' | 'paid' | 'cancelled'
  paid_by: string | null
  paid_at: string | null
  created_at: string
  team?: Team
}

export interface TransactionFormData {
  team_id?: string
  amount: number
  concept: string
  fee_type?: string
}

// ============================================
// SANCIONES (Legacy - para compatibilidad)
// ============================================
export interface Sanction {
  id: string
  user_id: string | null
  player_id: string | null
  teacher_id: string | null
  reason: string
  matches_count: number
  is_active: boolean
  created_by: string | null
  created_at: string
  player?: Player
  teacher?: Teacher
}

export interface SanctionFormData {
  player_id?: string
  teacher_id?: string
  reason: string
  matches_count: number
}

// ============================================
// REPORTES
// ============================================
export interface Report {
  id: string
  report_type: 'weekly' | 'monthly' | 'tournament'
  start_date: string
  end_date: string
  total_inscriptions: number
  total_yellow_cards: number
  total_red_cards: number
  total_amount: number
  generated_by: string | null
  created_at: string
}

// ============================================
// CONFIGURACIÓN DE PRECIOS (Legacy)
// ============================================
export interface FeeSetting {
  id: number
  fee_type: string
  amount: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// ESTADÍSTICAS DE EQUIPO (para tabla de posiciones)
// ============================================
export interface TeamStandings {
  position: number
  team_id: string
  team_name: string
  section: string | null
  subgroup: string | null
  group_label: string | null
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  yellow_cards: number
  red_cards: number
  form: ('W' | 'D' | 'L')[]
}

// ============================================
// FORMULARIOS DE REPORTE
// ============================================
export interface MatchReportFormData {
  score_a: number
  score_b: number
  status: 'scheduled' | 'live' | 'finished'
  team_a_fouls?: number
  team_b_fouls?: number
  team_a_yellow_cards?: number
  team_b_yellow_cards?: number
  team_a_red_cards?: number
  team_b_red_cards?: number
}

// ============================================
// TIMER EN VIVO
// ============================================
export interface MatchTimer {
  is_running: boolean
  current_period: 1 | 2 | 'extra'
  minutes: number
  seconds: number
  extra_minutes: number
  fouls_a: number
  fouls_b: number
}

// ============================================
// RESPUESTAS DE API GENÉRICAS
// ============================================
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============================================
// OPCIONES DE FILTRO
// ============================================
export interface FilterOptions {
  status?: string
  group?: string
  section?: string
  date_from?: string
  date_to?: string
  payment_status?: 'paid' | 'pending' | 'unpaid'
  suspension_status?: 'active' | 'resolved' | 'none'
}

// ============================================
// PAGINACIÓN
// ============================================
export interface PaginationParams {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// ============================================
// ✅ RESUMEN FINANCIERO DE TORNEO
// ============================================
export interface TournamentFinancialSummary {
  tournament_id: string
  tournament_name: string
  total_players: number
  players_paid_inscription: number
  players_pending_inscription: number
  total_inscription_collected: number
  total_yellow_fees_collected: number
  total_red_fees_collected: number
  total_collected: number
  active_suspensions: number
  last_updated: string
}

// ============================================
// ✅ RESUMEN DE ELEGIBILIDAD DE EQUIPO
// ============================================
export interface TeamPaymentSummary {
  team_id: string
  team_name: string
  section: string
  total_players: number
  players_paid: {
    count: number
    players: Array<{ id: string; name: string; paid_at: string }>
  }
  players_pending: {
    count: number
    players: Array<{ id: string; name: string }>
  }
  suspended_players: {
    count: number
    players: Array<{ id: string; name: string; reason: string; matches_remaining: number }>
  }
  can_play_next_match: boolean
  ineligible_reason?: string
}