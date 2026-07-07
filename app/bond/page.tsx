"use client";

import { BondForm } from "@/components/BondForm";
import { StatCard } from "@/components/StatCard";
import { fetchCarry, fetchPrice, fetchRisk } from "@/lib/api";
import {
  BondInput,
  CarryResponse,
  PriceResponse,
  RiskResponse,
} from "@/types/api";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEFAULT_BOND: BondInput = {
  maturity: 10,
  coupon_rate: 0.04,
  face_value: 100,
  credit_spread_bps: 0,
};

export default function BondPage() {
  const [bond, setBond] = useState<BondInput>(DEFAULT_BOND);
  const [horizon, setHorizon] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [price, setPrice] = useState<PriceResponse | null>(null);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [carry, setCarry] = useState<CarryResponse | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, r, c] = await Promise.all([
        fetchPrice(bond),
        fetchRisk(bond),
        fetchCarry(bond, horizon),
      ]);
      setPrice(p);
      setRisk(r);
      setCarry(c);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const priceHighlight =
    price === null
      ? "neutral"
      : price.price_pct > 100
        ? "positive"
        : price.price_pct < 100
          ? "negative"
          : "neutral";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Bond Analyzer</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Price, risk, and carry analysis using the live bootstrapped curve
        </p>
      </div>

      {/* Input */}
      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="col-span-2">
          <BondForm
            bond={bond}
            onChange={setBond}
            showSpread
            label="Bond Definition"
          />
        </div>
        <div className="space-y-3">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Carry Horizon
            </p>
            <div className="flex gap-2">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setHorizon(m)}
                  className={`flex-1 py-2 rounded text-sm font-mono transition-colors
                    ${
                      horizon === m
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={analyze}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700
                       text-white rounded px-4 py-3 text-sm font-semibold transition-colors"
          >
            {loading ? "Analyzing..." : "Analyze Bond"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {price && risk && carry && (
        <>
          {/* Valuation */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Valuation
            </p>
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                label="Price"
                value={`${price.price_pct.toFixed(4)}`}
                sub="% of face value"
                highlight={priceHighlight}
              />
              <StatCard
                label="NPV"
                value={`$${price.npv.toFixed(4)}`}
                sub="per $100 face"
              />
              <StatCard
                label="YTM"
                value={`${(price.ytm * 100).toFixed(4)}%`}
                sub="yield to maturity"
              />
              <StatCard
                label="Status"
                value={
                  price.price_pct > 100.01
                    ? "PREMIUM"
                    : price.price_pct < 99.99
                      ? "DISCOUNT"
                      : "PAR"
                }
                sub={
                  price.price_pct > 100.01
                    ? "coupon > market rate"
                    : price.price_pct < 99.99
                      ? "coupon < market rate"
                      : "coupon = market rate"
                }
                highlight={price.price_pct >= 99.99 ? "positive" : "negative"}
              />
            </div>
          </div>

          {/* Risk */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Risk Measures
            </p>
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label="DV01"
                value={`$${risk.dv01.toFixed(4)}`}
                sub="per $100 face per 1bp"
              />
              <StatCard
                label="Modified Duration"
                value={`${risk.modified_duration.toFixed(4)}`}
                sub="years"
              />
              <StatCard
                label="Convexity"
                value={risk.convexity.toFixed(4)}
                sub="curvature of price/rate curve"
              />
            </div>
          </div>

          {/* Bucketed DV01 chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Bucketed DV01</p>
            <p className="text-xs text-gray-600 mb-4">
              Where on the curve does your rate risk live? ($ per $100 face per
              1bp)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={risk.bucketed_dv01}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="maturity_years"
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}Y`}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${v.toFixed(3)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 6,
                  }}
                  formatter={(v: any) => [`$${v.toFixed(6)}`, "DV01"]}
                  labelFormatter={(l) => `${l}Y bucket`}
                  labelStyle={{ color: "#9ca3af", fontSize: 11 }}
                  itemStyle={{ color: "#d1d5db" }}
                />
                <Bar dataKey="dv01" radius={[3, 3, 0, 0]}>
                  {risk.bucketed_dv01.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.dv01 > 0 ? "#3b82f6" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Carry */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Carry & Rolldown ({carry.horizon_months}M horizon)
            </p>
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                label="Carry"
                value={`$${carry.carry.toFixed(4)}`}
                sub="coupon income minus funding cost"
                highlight={carry.carry >= 0 ? "positive" : "negative"}
              />
              <StatCard
                label="Rolldown"
                value={`$${carry.rolldown.toFixed(4)}`}
                sub="price gain from aging down curve"
                highlight={carry.rolldown >= 0 ? "positive" : "negative"}
              />
              <StatCard
                label="Total"
                value={`$${carry.total.toFixed(4)}`}
                sub="per $100 face"
                highlight={carry.total >= 0 ? "positive" : "negative"}
              />
              <StatCard
                label="Breakeven"
                value={`${Math.abs(carry.breakeven_bps).toFixed(2)} bps`}
                sub="rate move to wipe out carry"
              />
            </div>
          </div>

          {/* Cashflow waterfall */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Cashflow Schedule</p>
            <p className="text-xs text-gray-600 mb-4">
              Blue = coupon, dark = principal+coupon at maturity. Height =
              present value.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={price.cashflows.map((cf) => ({
                  time: cf.time_years,
                  pv: cf.present_value,
                  isFinal: Math.abs(cf.time_years - bond.maturity) < 0.01,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}Y`}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 6,
                  }}
                  formatter={(v: any) => [`$${v.toFixed(4)}`, "Present Value"]}
                  labelFormatter={(l) => `t = ${l}Y`}
                  labelStyle={{ color: "#9ca3af", fontSize: 11 }}
                  itemStyle={{ color: "#d1d5db" }}
                />
                <Bar dataKey="pv" radius={[2, 2, 0, 0]}>
                  {price.cashflows.map((cf, i) => (
                    <Cell
                      key={i}
                      fill={
                        Math.abs(cf.time_years - bond.maturity) < 0.01
                          ? "#1d4ed8"
                          : "#3b82f6"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
