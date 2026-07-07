"use client";

import { BondForm } from "@/components/BondForm";
import { StatCard } from "@/components/StatCard";
import { fetchHedge, fetchPnL } from "@/lib/api";
import { BondInput, HedgeResponse, PnLResponse } from "@/types/api";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEFAULT_BOND: BondInput = {
  maturity: 10,
  coupon_rate: 0.04,
  face_value: 100,
};

export default function RiskPage() {
  const [tab, setTab] = useState<"pnl" | "hedge">("pnl");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Risk Tools</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          P&L attribution and hedge analysis
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {(["pnl", "hedge"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded text-sm transition-colors ${
              tab === t
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "pnl" ? "P&L Attribution" : "Hedge Calculator"}
          </button>
        ))}
      </div>

      {tab === "pnl" ? <PnLTab /> : <HedgeTab />}
    </div>
  );
}

// ---- P&L Attribution tab ----

function PnLTab() {
  const [bond, setBond] = useState<BondInput>(DEFAULT_BOND);
  const [shift, setShift] = useState("5");
  const [result, setResult] = useState<PnLResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPnL(bond, parseFloat(shift));
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const barData = result
    ? [
        {
          name: "DV01",
          value: result.dv01_pnl,
          fill: result.dv01_pnl >= 0 ? "#3b82f6" : "#ef4444",
        },
        { name: "Convexity", value: result.convexity_pnl, fill: "#10b981" },
        { name: "Residual", value: result.residual, fill: "#6b7280" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="col-span-2">
          <BondForm bond={bond} onChange={setBond} label="Position Bond" />
        </div>
        <div className="space-y-3">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
              Rate Shift (bps)
            </label>
            <input
              type="number"
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              placeholder="+5 = rates rose 5bps"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2
                         text-sm font-mono text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              positive = rates rose, negative = rates fell
            </p>
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700
                       text-white rounded px-4 py-3 text-sm font-semibold transition-colors"
          >
            {loading ? "Computing..." : "Attribute P&L"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Rate Move"
              value={`${result.rate_shift_bps > 0 ? "+" : ""}${result.rate_shift_bps} bps`}
              highlight={result.rate_shift_bps > 0 ? "negative" : "positive"}
            />
            <StatCard
              label="Actual P&L"
              value={`$${result.actual_pnl.toFixed(4)}`}
              sub="per $100 face"
              highlight={result.actual_pnl >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Explained"
              value={`$${result.explained_pnl.toFixed(4)}`}
              sub="DV01 + convexity"
            />
            <StatCard
              label="Residual"
              value={`$${result.residual.toFixed(4)}`}
              sub={
                Math.abs(result.residual / (result.actual_pnl || 1)) < 0.05
                  ? "✓ within tolerance"
                  : "⚠ investigate"
              }
              highlight={
                Math.abs(result.residual / (result.actual_pnl || 1)) < 0.05
                  ? "positive"
                  : "negative"
              }
            />
          </div>

          {/* Attribution breakdown chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">P&L Components</p>
            <p className="text-xs text-gray-600 mb-4">
              How much of the actual P&L does each factor explain?
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${v.toFixed(3)}`}
                />
                <ReferenceLine y={0} stroke="#374151" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 6,
                  }}
                  formatter={(v: any) => [`$${v.toFixed(6)}`, "P&L"]}
                  labelStyle={{ color: "#9ca3af", fontSize: 11 }}
                  itemStyle={{ color: "#d1d5db" }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Carry note */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Carry (separate accrual track)
            </p>
            <p className="text-sm font-mono text-gray-300">
              ${result.carry_pnl.toFixed(4)} per $100 face · not included in P&L
              above
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ---- Hedge Calculator tab ----

function HedgeTab() {
  const [position, setPosition] = useState<BondInput>(DEFAULT_BOND);
  const [hedgeInstrument, setHedgeInstrument] = useState<BondInput>({
    maturity: 10,
    coupon_rate: 0.0448,
    face_value: 100,
  });
  const [positionFace, setPositionFace] = useState("10000000");
  const [result, setResult] = useState<HedgeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHedge(
        position,
        hedgeInstrument,
        parseFloat(positionFace),
      );
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <BondForm
          bond={position}
          onChange={setPosition}
          label="Position (Long)"
        />
        <BondForm
          bond={hedgeInstrument}
          onChange={setHedgeInstrument}
          label="Hedge Instrument (will SHORT)"
        />
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
            Position Face Value ($)
          </label>
          <input
            type="number"
            value={positionFace}
            onChange={(e) => setPositionFace(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2
                       text-sm font-mono text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700
                     text-white rounded px-6 py-3 text-sm font-semibold transition-colors"
        >
          {loading ? "Computing..." : "Compute Hedge"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Hedge Ratio"
              value={result.hedge_ratio.toFixed(4)}
              sub="units of hedge per unit of position"
            />
            <StatCard
              label="Hedge Notional"
              value={`$${(Math.abs(result.hedge_notional) / 1e6).toFixed(2)}M`}
              sub={
                result.hedge_notional < 0
                  ? "SELL hedge instrument"
                  : "BUY hedge instrument"
              }
              highlight={result.hedge_notional < 0 ? "negative" : "positive"}
            />
            <StatCard
              label="Position DV01"
              value={`$${((result.position_dv01 * parseFloat(positionFace)) / 100).toFixed(2)}`}
              sub="total dollar DV01"
            />
            <StatCard
              label="Convexity Mismatch"
              value={result.convexity_mismatch.toFixed(2)}
              sub={
                Math.abs(result.convexity_mismatch) > 10
                  ? "⚠ hedge will drift"
                  : "✓ well matched"
              }
              highlight={
                Math.abs(result.convexity_mismatch) < 10
                  ? "positive"
                  : "negative"
              }
            />
          </div>

          {/* Residual DV01 chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">
              Residual DV01 After Hedge
            </p>
            <p className="text-xs text-gray-600 mb-4">
              Bars near zero = well hedged at that bucket. Large bars = basis
              risk remaining.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={result.residual_dv01}>
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
                <ReferenceLine y={0} stroke="#4b5563" strokeWidth={2} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 6,
                  }}
                  formatter={(v: any) => [`$${v.toFixed(6)}`, "Residual DV01"]}
                  labelFormatter={(l) => `${l}Y bucket`}
                  labelStyle={{ color: "#9ca3af", fontSize: 11 }}
                  itemStyle={{ color: "#d1d5db" }}
                />
                <Bar dataKey="dv01" radius={[3, 3, 0, 0]}>
                  {result.residual_dv01.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.dv01 >= 0 ? "#3b82f6" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>Blue = long exposure remaining</span>
              <span>Red = short exposure remaining (over-hedged)</span>
              <span>
                Total residual: $
                {(
                  (result.total_residual_dv01 * parseFloat(positionFace)) /
                  100
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
