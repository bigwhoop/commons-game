import { useState, useEffect } from 'react'
import Setup from './components/Setup'
import GameBoard from './components/GameBoard'
import type { GameState, GameOptions, SetupConfig } from './types'

const GAME_KEY = 'cc-pp-game'
const SETUP_KEY = 'cc-pp-setup'

const DEFAULT_OPTIONS: GameOptions = {
  showResourceFlow: false,
  showHistory: false,
  logisticGrowth: false,
}

function loadFromStorage<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as T) : null
  } catch {
    return null
  }
}

function loadGameState(): GameState | null {
  const state = loadFromStorage<GameState>(GAME_KEY)
  if (!state) return null
  return { ...state, options: { ...DEFAULT_OPTIONS, ...state.options } }
}

function loadSetupConfig(): SetupConfig | null {
  const config = loadFromStorage<SetupConfig>(SETUP_KEY)
  if (!config) return null
  return { ...config, options: { ...DEFAULT_OPTIONS, ...config.options } }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(loadGameState)
  const [savedSetup, setSavedSetup] = useState<SetupConfig | null>(loadSetupConfig)

  useEffect(() => {
    if (gameState) {
      localStorage.setItem(GAME_KEY, JSON.stringify(gameState))
    } else {
      localStorage.removeItem(GAME_KEY)
    }
  }, [gameState])

  function startGame(config: SetupConfig) {
    localStorage.setItem(SETUP_KEY, JSON.stringify(config))
    setSavedSetup(config)
    setGameState({
      resourceName: config.resourceName,
      resourceNamePlural: config.resourceNamePlural,
      stock: config.initialStock,
      initialStock: config.initialStock,
      round: 1,
      communicationAllowed: false,
      options: config.options,
      players: config.players.map((p, i) => ({
        id: i,
        name: p.name,
        profit: 0,
        history: [],
      })),
      history: [],
      lastRound: null,
    })
  }

  function processRound(choices: number[]) {
    setGameState(prev => {
      if (!prev) return prev
      const stockBefore = prev.stock
      const totalChosen = choices.reduce((s, c) => s + c, 0)

      let actualTakes: number[]
      if (totalChosen <= stockBefore) {
        actualTakes = [...choices]
      } else if (stockBefore === 0) {
        actualTakes = choices.map(() => 0)
      } else {
        let scaled = choices.map(c => Math.floor((c * stockBefore) / totalChosen))
        let remainder = stockBefore - scaled.reduce((s, v) => s + v, 0)
        for (let i = 0; i < scaled.length && remainder > 0; i++) {
          if (choices[i] > 0) { scaled[i]++; remainder-- }
        }
        actualTakes = scaled
      }

      const totalTaken = actualTakes.reduce((s, v) => s + v, 0)
      const remaining = stockBefore - totalTaken
      const replenished = prev.options.logisticGrowth
        ? Math.round(remaining * (1 - remaining / prev.initialStock))
        : Math.floor(remaining * 0.5)
      const newStock = Math.max(0, remaining + replenished)

      const roundResult = {
        round: prev.round,
        choices,
        actualTakes,
        stockBefore,
        totalTaken,
        remaining,
        replenished,
        newStock,
      }

      return {
        ...prev,
        stock: newStock,
        round: prev.round + 1,
        players: prev.players.map((p, i) => ({
          ...p,
          profit: p.profit + actualTakes[i],
          history: [...p.history, { chose: choices[i], took: actualTakes[i] }],
        })),
        history: [...prev.history, roundResult],
        lastRound: roundResult,
      }
    })
  }

  function toggleCommunication() {
    setGameState(prev => prev ? { ...prev, communicationAllowed: !prev.communicationAllowed } : prev)
  }

  function toggleOption(key: keyof GameOptions) {
    setGameState(prev => prev ? { ...prev, options: { ...prev.options, [key]: !prev.options[key] } } : prev)
  }

  function actOfGod() {
    setGameState(prev => prev ? { ...prev, stock: Math.floor(prev.stock / 2) } : prev)
  }

  function resetGame() {
    setGameState(null)
  }

  function clearAll() {
    localStorage.removeItem(GAME_KEY)
    localStorage.removeItem(SETUP_KEY)
    setGameState(null)
    setSavedSetup(null)
  }

  if (!gameState) {
    return <Setup onStart={startGame} savedConfig={savedSetup} onClear={savedSetup ? clearAll : undefined} />
  }

  return (
    <GameBoard
      gameState={gameState}
      onProcessRound={processRound}
      onToggleCommunication={toggleCommunication}
      onToggleOption={toggleOption}
      onReset={resetGame}
      onActOfGod={actOfGod}
    />
  )
}
