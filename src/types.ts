export interface Player {
  id: number
  name: string
  profit: number
  history: Array<{ chose: number; took: number }>
}

export interface RoundResult {
  round: number
  choices: number[]
  actualTakes: number[]
  stockBefore: number
  totalTaken: number
  remaining: number
  replenished: number
  newStock: number
}

export interface GameOptions {
  showResourceFlow: boolean
  showHistory: boolean
}

export interface GameState {
  resourceName: string
  resourceNamePlural: string
  stock: number
  initialStock: number
  round: number
  communicationAllowed: boolean
  options: GameOptions
  players: Player[]
  history: RoundResult[]
  lastRound: RoundResult | null
}

export interface SetupConfig {
  resourceName: string
  resourceNamePlural: string
  initialStock: number
  players: Array<{ name: string }>
  options: GameOptions
}
