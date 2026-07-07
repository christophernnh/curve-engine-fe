import type {
  CurveResponse,
  ForwardRateResponse,
  PriceResponse,
  RiskResponse,
  CarryResponse,
  PnLResponse,
  HedgeResponse,
  BondInput,
} from '@/types/api'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// Generic fetch helper -- throws on non-2xx responses with the
// server's error message rather than a raw HTTP error.
async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? `API error ${res.status}`)
  }

  return data as T
}

// ---- Curve endpoints ----

export async function fetchCurve(): Promise<CurveResponse> {
  return apiFetch<CurveResponse>('/api/curve')
}

export async function fetchForwardRate(
  t1: number,
  t2: number
): Promise<ForwardRateResponse> {
  return apiFetch<ForwardRateResponse>(
    `/api/curve/forward?t1=${t1}&t2=${t2}`
  )
}

// ---- Bond analysis endpoints ----

export async function fetchPrice(bond: BondInput): Promise<PriceResponse> {
  return apiFetch<PriceResponse>('/api/price', {
    method: 'POST',
    body: JSON.stringify({ bond }),
  })
}

export async function fetchRisk(bond: BondInput): Promise<RiskResponse> {
  return apiFetch<RiskResponse>('/api/risk', {
    method: 'POST',
    body: JSON.stringify({ bond }),
  })
}

export async function fetchCarry(
  bond: BondInput,
  horizonMonths: number
): Promise<CarryResponse> {
  return apiFetch<CarryResponse>('/api/carry', {
    method: 'POST',
    body: JSON.stringify({ bond, horizon_months: horizonMonths }),
  })
}

export async function fetchPnL(
  bond: BondInput,
  rateShiftBps: number
): Promise<PnLResponse> {
  return apiFetch<PnLResponse>('/api/pnl', {
    method: 'POST',
    body: JSON.stringify({ bond, rate_shift_bps: rateShiftBps }),
  })
}

export async function fetchHedge(
  position: BondInput,
  hedgeInstrument: BondInput,
  positionFace: number
): Promise<HedgeResponse> {
  return apiFetch<HedgeResponse>('/api/hedge', {
    method: 'POST',
    body: JSON.stringify({
      position,
      hedge_instrument: hedgeInstrument,
      position_face: positionFace,
    }),
  })
}