"use client";

import { StatCard } from "@/components/StatCard";
import { fetchCurve, fetchForwardRate } from "@/lib/api";
import { CurveResponse } from "@/types/api";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function CurvePage() {
  const [curve, setCurve] = useState<CurveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Forward rate tool state
  const [t1, setT1] = useState("5");
  const [t2, setT2] = useState("10");
  const [forwardRate, setForwardRate] = useState<number | null>(null);
  const [fwdLoading, setFwdLoading] = useState(false);
  const [fwdError, setFwdError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurve()
      .then(setCurve)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleForwardRate = async () => {
    setFwdLoading(true);
    setFwdError(null);
    try {
      const res = await fetchForwardRate(parseFloat(t1), parseFloat(t2));
      setForwardRate(res.forward_rate);
    } catch (e: any) {
      setFwdError(e.message);
    } finally {
      setFwdLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!curve) return null;

  // Chart data: use the 50 interpolated display points for smooth rendering
  const chartData = curve.rates.map((r) => ({
    maturity: r.maturity_years.toFixed(1),
    rate: parseFloat((r.zero_rate * 100).toFixed(4)),
  }));

  // Key summary stats from pillars
  const shortest = curve.pillars.find(
    (p) => Math.abs(p.maturity_years - 0.0833333333) < 0.01,
  );

  const twoYear = curve.pillars.find(
    (p) => Math.abs(p.maturity_years - 2) < 0.01,
  );

  const tenYear = curve.pillars.find(
    (p) => Math.abs(p.maturity_years - 10) < 0.01,
  );
  const longest = curve.pillars[curve.pillars.length - 1];

  const slope =
    tenYear && twoYear ? (tenYear.zero_rate - twoYear.zero_rate) * 10000 : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">
            US Treasury Yield Curve
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bootstrapped from Treasury.gov par yields · Source date:{" "}
            {curve.source_date}
          </p>
        </div>
        <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded font-mono">
          {curve.interpolation}
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Short End (1M)"
          value={`${(shortest!.zero_rate * 100).toFixed(2)}%`}
          sub="zero rate"
        />
        <StatCard
          label="2Y Zero Rate"
          value={`${((twoYear?.zero_rate ?? 0) * 100).toFixed(2)}%`}
          sub="zero rate"
        />
        <StatCard
          label="10Y Zero Rate"
          value={`${((tenYear?.zero_rate ?? 0) * 100).toFixed(2)}%`}
          sub="zero rate"
        />
        <StatCard
          label="2s10s Slope"
          value={slope !== null ? `${slope.toFixed(1)} bps` : "—"}
          sub="10Y minus 2Y"
          highlight={slope !== null && slope > 0 ? "positive" : "negative"}
        />
      </div>

      {/* Yield curve chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-4">Zero Rate Curve (%)</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="maturity"
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
              label={{
                value: "Maturity (Years)",
                position: "insideBottom",
                offset: -2,
                fill: "#6b7280",
                fontSize: 11,
              }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v.toFixed(2)}%`}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: 6,
              }}
              labelStyle={{ color: "#9ca3af", fontSize: 11 }}
              formatter={(v: any) => [`${v?.toFixed(4) ?? "—"}%`, "Zero Rate"]}
              labelFormatter={(l) => `Maturity: ${l}Y`}
              itemStyle={{ color: "#d1d5db" }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pillars table + Forward rate tool side by side */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pillars table */}
        <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-3">Bootstrapped Pillars</p>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-2">Maturity</th>
                <th className="text-right pb-2">Par Yield</th>
                <th className="text-right pb-2">Zero Rate</th>
                <th className="text-right pb-2">D(t)</th>
              </tr>
            </thead>
            <tbody>
              {curve.pillars.map((p) => (
                <tr
                  key={p.maturity_years}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="py-2 text-gray-300">
                    {p.maturity_years.toFixed(4)}Y
                  </td>
                  <td className="py-2 text-right text-gray-300">
                    {(p.par_yield * 100).toFixed(4)}%
                  </td>
                  <td className="py-2 text-right text-blue-400">
                    {(p.zero_rate * 100).toFixed(4)}%
                  </td>
                  <td className="py-2 text-right text-gray-400">
                    {p.discount_factor.toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Forward rate tool */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col gap-4">
          <p className="text-sm text-gray-400">Forward Rate Calculator</p>
          <p className="text-xs text-gray-600">
            What rate does today's curve imply for a loan starting at T1 and
            ending at T2?
          </p>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">
              T1 (start, years)
            </label>
            <input
              type="number"
              value={t1}
              onChange={(e) => setT1(e.target.value)}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-3 py-2
                         text-sm font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">
              T2 (end, years)
            </label>
            <input
              type="number"
              value={t2}
              onChange={(e) => setT2(e.target.value)}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-3 py-2
                         text-sm font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleForwardRate}
            disabled={fwdLoading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700
                       text-white text-sm rounded px-4 py-2 transition-colors"
          >
            {fwdLoading ? "Computing..." : "Compute F(T1, T2)"}
          </button>
          {fwdError && <p className="text-xs text-red-400">{fwdError}</p>}
          {forwardRate !== null && !fwdError && (
            <div className="bg-gray-800 rounded p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">
                F({t1}Y → {t2}Y)
              </p>
              <p className="text-2xl font-mono font-semibold text-blue-400">
                {(forwardRate * 100).toFixed(4)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      Fetching Treasury.gov data...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-red-400">
      Error: {message}
    </div>
  );
}
