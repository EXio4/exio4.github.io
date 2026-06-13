export type StarRating = 0 | 1 | 2 | 3

export type StrokeInputType = 'pen' | 'touch' | 'mouse' | 'unknown'

export interface HanziWriterCharacterData {
  strokes: string[]
  medians: number[][][]
  radStrokes?: number[]
}

export interface StrokePoint {
  x: number
  y: number
}

export interface StrokeAttemptEvent {
  type: 'correct' | 'mistake'
  strokeNum: number
  mistakesOnStroke: number
  totalMistakes: number
  strokesRemaining: number
  isBackwards?: boolean
  drawnPath?: {
    pathString: string
    points: StrokePoint[]
  }
}

export interface CharacterProgress {
  character: string
  bestStars: StarRating
  attempts: number
  lastPracticedAt?: string
  dueAt: string
  intervalDays: number
  ease: number
  lapses: number
}

export interface StrokeAttempt {
  id?: number
  character: string
  deckId: string
  startedAt: string
  completedAt?: string
  completed: boolean
  stars: StarRating
  totalMistakes: number
  strokeCount: number
  inputType: StrokeInputType
  leniency: number
  canvasSize: number
  strokeEvents: StrokeAttemptEvent[]
}

export interface StrokeSettings {
  dailyGoal: number
  leniency: number
  inputHintDismissed: boolean
}

export interface StrokeCourse {
  id: string
  name: string
  description: string
  deckIds: string[]
}

export interface StrokeDeck {
  id: string
  courseId: string
  name: string
  description: string
  characterIds: string[]
}

export interface StrokeCharacter {
  character: string
  deckIds: string[]
  pinyin: string
  pinyinMarked: string
  meaning: string
  radical: string
  example: string
  strokeCount: number
}
