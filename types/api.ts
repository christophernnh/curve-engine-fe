// Mirror the go types

export interface PillarPoint {
  maturity_years: number
  zero_rate: number
  discount_factor: number
  par_yield: number
}

export interface TenorRate {
  maturity_years: number
  zero_rate: number
  discount_factor: number
}

export interface CurveResponse {
  pillars: PillarPoint[]
  rates: TenorRate[]
  interpolation: string
  source_date: string
}

export interface ForwardRateResponse {
  t1: number
  t2: number
  forward_rate: number
}

export interface CashflowPoint {
  time_years: number
  amount: number
  present_value: number
}

export interface PriceResponse {
  npv: number
  price_pct: number
  ytm: number
  cashflows: CashflowPoint[]
}

export interface BucketedDV01Point {
  maturity_years: number
  dv01: number
}

export interface RiskResponse {
  dv01: number
  modified_duration: number
  convexity: number
  bucketed_dv01: BucketedDV01Point[]
}

export interface CarryResponse {
  horizon_months: number
  carry: number
  rolldown: number
  total: number
  breakeven_bps: number
}

export interface PnLResponse {
  rate_shift_bps: number
  actual_pnl: number
  dv01_pnl: number
  convexity_pnl: number
  explained_pnl: number
  residual: number
  carry_pnl: number
}

export interface HedgeResponse {
  hedge_ratio: number
  hedge_notional: number
  position_dv01: number
  hedge_dv01_per_unit: number
  convexity_mismatch: number
  residual_dv01: BucketedDV01Point[]
  total_residual_dv01: number
}

export interface BondInput {
  maturity: number
  coupon_rate: number
  face_value: number
  credit_spread_bps?: number
}

export interface ApiError {
  error: string
}