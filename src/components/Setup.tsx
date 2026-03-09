import { useState } from 'react'
import type { SetupConfig } from '../types'

interface Props {
  onStart: (config: SetupConfig) => void
  savedConfig: SetupConfig | null
  onClear?: () => void
}

export default function Setup({ onStart, savedConfig, onClear }: Props) {
  const [resourceName, setResourceName] = useState(savedConfig?.resourceName ?? '')
  const [resourceNamePlural, setResourceNamePlural] = useState(savedConfig?.resourceNamePlural ?? '')
  const [initialStock, setInitialStock] = useState(savedConfig?.initialStock ?? 15)
  const [players, setPlayers] = useState<Array<{ name: string }>>(
    savedConfig?.players ?? [{ name: '' }, { name: '' }, { name: '' }]
  )

  function addPlayer() {
    if (players.length < 8) setPlayers(p => [...p, { name: '' }])
  }

  function removePlayer(i: number) {
    setPlayers(p => p.filter((_, j) => j !== i))
  }

  function updateName(i: number, value: string) {
    setPlayers(p => p.map((player, j) => j === i ? { ...player, name: value } : player))
  }

  const canStart = resourceName.trim() && resourceNamePlural.trim() && players.length >= 2 && players.every(p => p.name.trim())

  return (
    <div className="min-h-screen bg-[#111316] p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-bold text-[#E0DDD0] mb-8 tracking-tight">Commons Game</h1>

        {/* Resource */}
        <div className="bg-[#1C1F24] rounded-2xl p-6 mb-4 border border-[#2E3338]">
          <h2 className="text-xs font-bold text-[#7A8290] uppercase tracking-widest mb-4">Shared Resource</h2>
          <div className="flex gap-4 items-start mb-4">
            <img src="/resource.png" alt="resource" className="w-14 h-14 object-contain shrink-0 opacity-90 mt-5" />
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#7A8290] mb-1 uppercase tracking-wide">Singular</label>
                <input
                  className="w-full border border-[#2E3338] bg-[#252830] rounded-xl px-3 py-2 text-lg text-[#E0DDD0] placeholder-[#3D4350] focus:outline-none focus:border-[#7A8290] transition-colors"
                  placeholder="e.g. Tree"
                  value={resourceName}
                  onChange={e => setResourceName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[#7A8290] mb-1 uppercase tracking-wide">Plural</label>
                <input
                  className="w-full border border-[#2E3338] bg-[#252830] rounded-xl px-3 py-2 text-lg text-[#E0DDD0] placeholder-[#3D4350] focus:outline-none focus:border-[#7A8290] transition-colors"
                  placeholder="e.g. Trees"
                  value={resourceNamePlural}
                  onChange={e => setResourceNamePlural(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#7A8290] mb-1 uppercase tracking-wide">Initial stock</label>
            <input
              type="number"
              min={1}
              max={200}
              className="w-28 border border-[#2E3338] bg-[#252830] rounded-xl px-3 py-2 text-lg text-[#E0DDD0] focus:outline-none focus:border-[#7A8290] transition-colors"
              value={initialStock}
              onChange={e => setInitialStock(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <p className="text-xs text-[#4E5564] mt-1">
              Each round: players take 0–3 · 50% of remainder is replenished
            </p>
          </div>
        </div>

        {/* Players */}
        <div className="bg-[#1C1F24] rounded-2xl p-6 mb-6 border border-[#2E3338]">
          <h2 className="text-xs font-bold text-[#7A8290] uppercase tracking-widest mb-4">Resource Users</h2>
          <div className="space-y-3">
            {players.map((p, i) => (
              <div key={i} className="flex gap-3 items-center">
                <img src="/resource-user.png" alt="" className="w-10 h-10 object-contain shrink-0 opacity-80" />
                <input
                  className="flex-1 border border-[#2E3338] bg-[#252830] rounded-xl px-3 py-2 text-[#E0DDD0] placeholder-[#3D4350] focus:outline-none focus:border-[#7A8290] transition-colors"
                  placeholder={`Player ${i + 1} label…`}
                  value={p.name}
                  onChange={e => updateName(i, e.target.value)}
                />
                {players.length > 2 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="text-[#3D4350] hover:text-red-400 text-2xl leading-none transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {players.length < 8 && (
            <button
              onClick={addPlayer}
              className="mt-3 text-[#4E5564] hover:text-[#E0DDD0] text-sm transition-colors"
            >
              + Add player
            </button>
          )}
        </div>

        <button
          disabled={!canStart}
          onClick={() => onStart({ resourceName, resourceNamePlural, initialStock, players, options: { showResourceFlow: false, showHistory: false } })}
          className="w-full bg-[#C8A942] hover:bg-[#D4B84E] disabled:bg-[#2E3338] disabled:text-[#3D4350] text-[#111316] text-xl font-bold py-4 rounded-2xl transition-colors tracking-wide mb-4"
        >
          Start Game
        </button>

        {onClear && (
          <p className="text-center">
            <button
              onClick={onClear}
              className="text-[#3D4350] hover:text-red-400 text-sm transition-colors"
            >
              Clear saved data
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
