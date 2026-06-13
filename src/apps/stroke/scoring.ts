import type { StarRating, StrokeAttemptEvent } from './types.ts'

interface CalculateStarsInput {
  completed: boolean
  strokeCount: number
  totalMistakes: number
}

export interface StrokeEventSummary {
  correctStrokes: number
  mistakeEvents: number
  totalMistakes: number
  worstStrokeMistakes: number
}

export function calculateStars({
  completed,
  strokeCount,
  totalMistakes,
}: CalculateStarsInput): StarRating {
  if (!completed || strokeCount <= 0) return 0
  if (totalMistakes === 0) return 3

  const lowMistakeThreshold = Math.ceil(strokeCount * 0.25)
  return totalMistakes <= lowMistakeThreshold ? 2 : 1
}

export function summarizeStrokeEvents(events: StrokeAttemptEvent[]): StrokeEventSummary {
  return events.reduce<StrokeEventSummary>(
    (summary, event) => ({
      correctStrokes: summary.correctStrokes + (event.type === 'correct' ? 1 : 0),
      mistakeEvents: summary.mistakeEvents + (event.type === 'mistake' ? 1 : 0),
      totalMistakes: Math.max(summary.totalMistakes, event.totalMistakes),
      worstStrokeMistakes: Math.max(summary.worstStrokeMistakes, event.mistakesOnStroke),
    }),
    {
      correctStrokes: 0,
      mistakeEvents: 0,
      totalMistakes: 0,
      worstStrokeMistakes: 0,
    },
  )
}
