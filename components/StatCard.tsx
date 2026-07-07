'use client'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  highlight?: 'positive' | 'negative' | 'neutral'
}

export function StatCard({ label, value, sub, highlight }: StatCardProps) {
  const valueColor =
    highlight === 'positive'
      ? 'text-green-400'
      : highlight === 'negative'
      ? 'text-red-400'
      : 'text-white'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-xl font-mono font-semibold ${valueColor}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}