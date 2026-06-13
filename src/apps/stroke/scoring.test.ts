import { describe, expect, it } from 'vitest'
import { calculateStars, summarizeStrokeEvents } from './scoring.ts'
import type { StrokeAttemptEvent } from './types.ts'

describe('Stroke scoring', () => {
  it('gives no stars for incomplete attempts', () => {
    expect(calculateStars({ completed: false, strokeCount: 8, totalMistakes: 0 })).toBe(0)
  })

  it('maps mistake counts to the V1 star thresholds', () => {
    expect(calculateStars({ completed: true, strokeCount: 8, totalMistakes: 0 })).toBe(3)
    expect(calculateStars({ completed: true, strokeCount: 8, totalMistakes: 2 })).toBe(2)
    expect(calculateStars({ completed: true, strokeCount: 8, totalMistakes: 3 })).toBe(1)
  })

  it('never divides by zero or upgrades malformed completed attempts', () => {
    expect(calculateStars({ completed: true, strokeCount: 0, totalMistakes: 0 })).toBe(0)
    expect(calculateStars({ completed: true, strokeCount: -1, totalMistakes: 0 })).toBe(0)
  })

  it('summarizes mixed HanziWriter stroke callback events', () => {
    const events: StrokeAttemptEvent[] = [
      { type: 'mistake', strokeNum: 0, mistakesOnStroke: 1, totalMistakes: 1, strokesRemaining: 2 },
      { type: 'correct', strokeNum: 0, mistakesOnStroke: 1, totalMistakes: 1, strokesRemaining: 2 },
      { type: 'correct', strokeNum: 1, mistakesOnStroke: 0, totalMistakes: 1, strokesRemaining: 1 },
      { type: 'correct', strokeNum: 2, mistakesOnStroke: 0, totalMistakes: 1, strokesRemaining: 0 },
    ]

    expect(summarizeStrokeEvents(events)).toEqual({
      correctStrokes: 3,
      mistakeEvents: 1,
      totalMistakes: 1,
      worstStrokeMistakes: 1,
    })
  })
})
