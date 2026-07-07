'use client'

import { BondInput } from '@/types/api'

interface BondFormProps {
  bond: BondInput
  onChange: (bond: BondInput) => void
  showSpread?: boolean
  label?: string
}

export function BondForm({
  bond,
  onChange,
  showSpread = false,
  label = 'Bond',
}: BondFormProps) {
  const field = (
    key: keyof BondInput,
    label: string,
    placeholder: string,
    hint?: string
  ) => (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        type="number"
        step="any"
        placeholder={placeholder}
        value={bond[key] ?? ''}
        onChange={(e) =>
          onChange({ ...bond, [key]: parseFloat(e.target.value) || 0 })
        }
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2
                   text-sm font-mono text-white placeholder-gray-600
                   focus:outline-none focus:border-blue-500 transition-colors"
      />
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
  )

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {field('maturity', 'Maturity (Years)', '10', 'e.g. 2, 5, 10, 30')}
        {field('coupon_rate', 'Coupon Rate', '0.04', 'decimal — 0.04 = 4%')}
        {field('face_value', 'Face Value', '100', 'typically 100')}
        {showSpread &&
          field(
            'credit_spread_bps',
            'Credit Spread (bps)',
            '0',
            '0 for Treasury, e.g. 50 for corporate'
          )}
      </div>
    </div>
  )
}