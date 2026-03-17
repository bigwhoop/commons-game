import { useState } from 'react'
import type { GameState, GameOptions, Player, RoundResult } from '../types'

interface Props {
  gameState: GameState
  onProcessRound: (choices: number[]) => void
  onToggleCommunication: () => void
  onToggleOption: (key: keyof GameOptions) => void
  onReset: () => void
}

interface Color {
  bg: string
  light: string
  border: string
  text: string
}

const COLORS: Color[] = [
  { bg: 'bg-blue-500',    light: 'bg-blue-950',    border: 'border-blue-500',    text: 'text-blue-400'    },
  { bg: 'bg-violet-500',  light: 'bg-violet-950',  border: 'border-violet-500',  text: 'text-violet-400'  },
  { bg: 'bg-rose-500',    light: 'bg-rose-950',    border: 'border-rose-500',    text: 'text-rose-400'    },
  { bg: 'bg-emerald-500', light: 'bg-emerald-950', border: 'border-emerald-500', text: 'text-emerald-400' },
  { bg: 'bg-orange-500',  light: 'bg-orange-950',  border: 'border-orange-500',  text: 'text-orange-400'  },
  { bg: 'bg-cyan-500',    light: 'bg-cyan-950',    border: 'border-cyan-500',    text: 'text-cyan-400'    },
  { bg: 'bg-pink-500',    light: 'bg-pink-950',    border: 'border-pink-500',    text: 'text-pink-400'    },
  { bg: 'bg-amber-500',   light: 'bg-amber-950',   border: 'border-amber-500',   text: 'text-amber-400'   },
]

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4',
  5: 'grid-cols-3', 6: 'grid-cols-3', 7: 'grid-cols-4', 8: 'grid-cols-4',
}

type View = 'input' | 'results' | 'final'

export default function GameBoard({ gameState, onProcessRound, onToggleCommunication, onToggleOption, onReset }: Props) {
  const [view, setView] = useState<View>('input')
  const [choices, setChoices] = useState<Array<number | null>>(() => gameState.players.map(() => null))

  const { resourceName, resourceNamePlural, stock, round, players, history, lastRound, communicationAllowed, initialStock, options } = gameState

  const allChosen = choices.every(c => c !== null)
  const stockLow = (stock / initialStock) < 0.35 && stock > 0
  const pendingCount = choices.filter(c => c === null).length

  function handleChoice(playerIdx: number, value: number) {
    setChoices(prev => prev.map((c, i) => i === playerIdx ? value : c))
  }

  function handleProcessRound() {
    onProcessRound(choices as number[])
    setView('results')
  }

  function handleNextRound() {
    setChoices(gameState.players.map(() => null))
    setView('input')
  }

  // ── FINAL SCOREBOARD ────────────────────────────────────────────────────────
  if (view === 'final') {
    const ranked = [...players].sort((a, b) => b.profit - a.profit)
    const medals = ['🥇', '🥈', '🥉']
    return (
      <div className="min-h-screen bg-[#111316] flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <h1 className="text-5xl font-bold text-[#E0DDD0] text-center mb-1 tracking-tight">Game Over</h1>
          <p className="text-[#7A8290] text-center mb-8">{history.length} rounds played</p>

          <div className="bg-[#1C1F24] rounded-2xl p-6 border border-[#2E3338] mb-6 space-y-2">
            {ranked.map((p, rank) => {
              const color = COLORS[players.findIndex(pl => pl.id === p.id) % COLORS.length]
              return (
                <div key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border ${color.light} ${color.border}`}>
                  <span className="text-2xl w-8 text-center">{medals[rank] ?? `${rank + 1}.`}</span>
                  <PlayerAvatar player={p} color={color} size="lg" />
                  <span className={`flex-1 font-bold text-xl ${color.text}`}>{p.name}</span>
                  <span className="text-3xl font-bold text-[#E0DDD0]">{p.profit}</span>
                  <span className="text-[#7A8290] text-sm">profit</span>
                </div>
              )
            })}
          </div>

          <button
            onClick={onReset}
            className="w-full bg-[#C8A942] hover:bg-[#D4B84E] text-[#111316] text-lg font-bold py-3 rounded-2xl transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    )
  }

  // ── RESULTS VIEW ────────────────────────────────────────────────────────────
  if (view === 'results') {
    // lastRound is always set when view === 'results'
    const r = lastRound as RoundResult
    const rationed = r.totalTaken > r.stockBefore

    return (
      <div className="min-h-screen bg-[#111316] p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#E0DDD0] tracking-tight">Round {r.round} — Results</h1>
            {rationed && (
              <span className="bg-red-950 text-red-400 text-sm font-bold px-3 py-1 rounded-full border border-red-800">
                Over-harvested — rationed!
              </span>
            )}
          </div>

          {/* Stock flow */}
          {options.showResourceFlow && (
            <div className="bg-[#1C1F24] rounded-2xl p-6 mb-4 border border-[#2E3338]">
              <p className="text-xs font-bold text-[#7A8290] uppercase tracking-widest mb-4">Stock</p>
              <div className="flex items-center gap-6 flex-wrap">
                <FlowBox label="Before" value={r.stockBefore} />
                <FlowArrow label={`−${r.totalTaken} taken`} red />
                <FlowBox label="Remaining" value={r.remaining} />
                <FlowArrow label={`+${r.replenished} added`} />
                <FlowBox label="New stock" value={r.newStock} green />
              </div>
            </div>
          )}

          {/* Player breakdown */}
          <div className="bg-[#1C1F24] rounded-2xl p-6 mb-4 border border-[#2E3338]">
            <p className="text-xs font-bold text-[#7A8290] uppercase tracking-widest mb-4">Players</p>
            <table className="w-full">
              <thead>
                <tr className="text-[#7A8290] text-base text-left">
                  <th className="pb-3 font-medium">Player</th>
                  <th className="pb-3 font-medium text-center">Chose</th>
                  <th className="pb-3 font-medium text-center">Got</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const color = COLORS[i % COLORS.length]
                  const chose = r.choices[i]
                  const got = r.actualTakes[i]
                  const wasRationed = chose !== got
                  return (
                    <tr key={p.id} className="border-t border-[#252830]">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar player={p} color={color} size="lg" />
                          <span className={`font-bold text-xl ${color.text}`}>{p.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-center text-[#8E99A8] text-2xl">{chose}</td>
                      <td className="py-4 text-center">
                        <span className={`text-2xl font-bold ${wasRationed ? 'text-red-400' : 'text-[#E0DDD0]'}`}>{got}</span>
                        {wasRationed && <span className="text-sm text-red-500 ml-1">↓</span>}
                      </td>
                      <td className="py-4 text-right text-3xl font-bold text-[#E0DDD0]">{p.profit}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            {r.newStock > 0
              ? (
                <button
                  onClick={handleNextRound}
                  className="flex-1 bg-[#C8A942] hover:bg-[#D4B84E] text-[#111316] text-xl font-bold py-4 rounded-xl transition-colors"
                >
                  Next Round →
                </button>
              )
              : (
                <div className="flex-1 bg-red-950 border-2 border-red-800 rounded-xl p-4 text-red-400 font-bold text-center text-lg">
                  The commons has collapsed — stock depleted!
                </div>
              )
            }
            <button
              onClick={() => setView('final')}
              className="px-6 bg-[#252830] hover:bg-[#2C3038] text-[#8E99A8] text-lg font-bold py-4 rounded-xl transition-colors border border-[#2E3338]"
            >
              End Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── INPUT VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#111316]">
      {communicationAllowed && (
        <div className="bg-[#2A2210] border-b border-[#C8A942] text-[#C8A942] text-center py-2.5 font-bold text-lg tracking-wide">
          💬 Communication is allowed this round
        </div>
      )}

      <div className="p-6">
        {/* Top bar: round + controls */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="bg-[#1C1F24] rounded-2xl px-5 py-2 border border-[#2E3338] text-center">
            <p className="text-xs font-bold text-[#7A8290] uppercase tracking-widest">Round</p>
            <p className="text-4xl font-bold text-[#E0DDD0] leading-none">{round}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <MiniToggle
              label="Flow"
              checked={options.showResourceFlow}
              onChange={() => onToggleOption('showResourceFlow')}
            />
            <MiniToggle
              label="History"
              checked={options.showHistory}
              onChange={() => onToggleOption('showHistory')}
            />
            <MiniToggle
              label="Comm"
              checked={communicationAllowed}
              onChange={onToggleCommunication}
            />
            <div className="w-px h-6 bg-[#2E3338] mx-1" />
            <button
              onClick={onReset}
              className="px-3 py-2 rounded-xl text-sm font-bold bg-[#252830] text-[#4E5564] hover:bg-[#2C3038] border border-[#2E3338] transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Stock display */}
        <div className={`rounded-2xl p-4 mb-6 border-2 transition-colors ${
          stock === 0 ? 'bg-red-950 border-red-800' :
          stockLow    ? 'bg-amber-950 border-amber-700' :
                        'bg-[#1C1F24] border-[#2E3338]'
        }`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${
            stock === 0 ? 'text-red-400' : stockLow ? 'text-amber-400' : 'text-[#7A8290]'
          }`}>
            {stock === 1 ? resourceName : resourceNamePlural}
          </p>
          <StockCards stock={stock} initialStock={initialStock} />
          {stock === 0 && (
            <p className="text-red-400 font-bold text-center mt-3">
              The commons has collapsed — no resources remain!
            </p>
          )}
        </div>

        {/* Player cards */}
        <div className={`grid gap-4 mb-6 ${GRID_COLS[players.length] ?? 'grid-cols-4'}`}>
          {players.map((p, i) => {
            const color = COLORS[i % COLORS.length]
            const choice = choices[i]
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-4 border-2 transition-all bg-[#1C1F24] ${
                  choice !== null ? color.border : 'border-[#2E3338]'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <PlayerAvatar player={p} color={color} size="xl" />
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-lg truncate ${color.text}`}>{p.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-4xl font-bold text-[#E0DDD0] leading-none">
                      {p.profit}
                      <span className="text-[#7A8290] ml-2">{stock === 1 ? resourceName : resourceNamePlural}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map(n => (
                    <button
                      key={n}
                      disabled={stock === 0 && n > 0}
                      onClick={() => handleChoice(i, n)}
                      className={`py-3 rounded-xl text-2xl font-bold transition-all ${
                        choice === n
                          ? `${color.bg} text-white shadow-lg scale-105`
                          : `bg-[#252830] ${color.text} hover:bg-[#2C3038] disabled:opacity-25 disabled:cursor-not-allowed`
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Round history */}
        {options.showHistory && history.length > 0 && (
          <div className="bg-[#1C1F24] rounded-2xl p-4 border border-[#2E3338] mb-4 overflow-x-auto">
            <p className="text-xs font-bold text-[#7A8290] uppercase tracking-widest mb-3">History</p>
            <table className="text-sm w-full min-w-max">
              <thead>
                <tr className="text-[#4E5564]">
                  <th className="text-left pr-4 pb-1 font-medium">Rnd</th>
                  {players.map(p => (
                    <th key={p.id} className="px-3 text-center pb-1 font-medium">{p.name}</th>
                  ))}
                  <th className="px-3 text-right pb-1 font-medium">Stock after</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.round} className="border-t border-[#252830]">
                    <td className="text-[#4E5564] py-1 pr-4">{h.round}</td>
                    {players.map((p, i) => (
                      <td key={p.id} className="px-3 text-center text-[#8E99A8] py-1">{h.actualTakes[i]}</td>
                    ))}
                    <td className={`px-3 text-right py-1 font-bold ${h.newStock === 0 ? 'text-red-400' : 'text-[#7A8290]'}`}>
                      {h.newStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            disabled={!allChosen || stock === 0}
            onClick={handleProcessRound}
            className="flex-1 bg-[#C8A942] hover:bg-[#D4B84E] disabled:bg-[#252830] disabled:text-[#3D4350] text-[#111316] text-xl font-bold py-4 rounded-xl transition-colors"
          >
            {stock === 0
              ? 'Stock depleted'
              : !allChosen
                ? `Waiting for ${pendingCount} player${pendingCount > 1 ? 's' : ''}…`
                : 'Process Round →'
            }
          </button>
          <button
            onClick={() => setView('final')}
            className="px-6 bg-[#252830] hover:bg-[#2C3038] text-[#7A8290] text-lg font-bold py-4 rounded-xl transition-colors border border-[#2E3338]"
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

type AvatarSize = 'sm' | 'lg' | 'xl'

function PlayerAvatar({ player, color, size }: { player: Player; color: Color; size: AvatarSize }) {
  const dims: Record<AvatarSize, string> = {
    sm: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-14 h-14 text-xl',
  }
  return (
    <div className={`${dims[size]} rounded-full ${color.bg} flex items-center justify-center text-white font-bold shrink-0`}>
      {player.name[0]?.toUpperCase()}
    </div>
  )
}

function MiniToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
        checked
          ? 'bg-[#252830] text-[#E0DDD0] border-[#4E5564]'
          : 'bg-[#252830] text-[#3D4350] border-[#2E3338]'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${checked ? 'bg-[#C8A942]' : 'bg-[#2E3338]'}`} />
      {label}
    </button>
  )
}

function StockCards({ stock, initialStock }: { stock: number; initialStock: number }) {
  // Pick card width so the full grid feels comfortably packed
  const cardClass =
    initialStock <= 20 ? 'w-12' :
    initialStock <= 35 ? 'w-10' :
    initialStock <= 55 ? 'w-8'  :
    initialStock <= 90 ? 'w-6'  : 'w-5'

  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: stock }, (_, i) => (
        <img
          key={i}
          src="resource.png"
          alt=""
          className={`${cardClass} h-auto object-contain opacity-90`}
        />
      ))}
    </div>
  )
}

function FlowBox({ label, value, green }: { label: string; value: number; green?: boolean }) {
  return (
    <div className={`flex-1 min-w-[80px] text-center p-4 rounded-xl border ${
      green ? 'bg-emerald-950 border-emerald-800' : 'bg-[#252830] border-[#2E3338]'
    }`}>
      <p className="text-sm text-[#4E5564] mb-1">{label}</p>
      <p className={`text-4xl font-bold ${green ? 'text-emerald-400' : 'text-[#E0DDD0]'}`}>{value}</p>
    </div>
  )
}

function FlowArrow({ label, red }: { label: string; red?: boolean }) {
  return (
    <div className={`shrink-0 text-center px-4 py-3 rounded-xl border ${
      red ? 'bg-red-950 border-red-800' : 'bg-emerald-950 border-emerald-800'
    }`}>
      <p className={`text-2xl font-bold ${red ? 'text-red-400' : 'text-emerald-400'}`}>{label}</p>
    </div>
  )
}
