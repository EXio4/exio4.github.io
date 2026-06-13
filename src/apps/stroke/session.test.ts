import { describe, expect, it } from 'vitest'
import {
  buildDashboardSummary,
  buildDeckSummary,
  getPracticeStatus,
} from './session.ts'
import type { CharacterProgress, StrokeAttemptEvent } from './types.ts'

const NOW = '2026-06-13T12:00:00.000Z'

function progress(
  character: string,
  dueAt: string,
  bestStars: 0 | 1 | 2 | 3,
  lastPracticedAt?: string,
): CharacterProgress {
  return {
    character,
    bestStars,
    attempts: 1,
    lastPracticedAt,
    dueAt,
    intervalDays: bestStars === 3 ? 3 : 0,
    ease: 2.3,
    lapses: bestStars === 1 ? 1 : 0,
  }
}

describe('Stroke session surfaces', () => {
  it('recommends a first lesson when there is no progress', () => {
    const summary = buildDashboardSummary([], 10, NOW)

    expect(summary.recommendation).toMatchObject({
      kind: 'learn',
      label: 'Start Numbers',
      to: '/apps/stroke/practice/numbers/一',
    })
    expect(summary.nextCharacters.map((entry) => entry.character)).toEqual(['一', '二', '三', '四', '五'])
    expect(summary.goalCompleted).toBe(0)
  })

  it('prioritizes due reviews over new characters', () => {
    const summary = buildDashboardSummary(
      [
        progress('一', '2026-06-12T12:00:00.000Z', 2, NOW),
        progress('二', '2026-06-14T12:00:00.000Z', 3, NOW),
      ],
      10,
      NOW,
    )

    expect(summary.dueCount).toBe(1)
    expect(summary.goalCompleted).toBe(2)
    expect(summary.recommendation).toMatchObject({
      kind: 'review',
      label: 'Review 1 due',
      to: '/apps/stroke/review',
    })
  })

  it('summarizes deck pressure and next character', () => {
    const summary = buildDeckSummary(
      ['一', '二', '三'],
      [
        progress('一', '2026-06-12T12:00:00.000Z', 2),
        progress('二', '2026-06-15T12:00:00.000Z', 3),
      ],
      NOW,
    )

    expect(summary).toMatchObject({
      due: 1,
      newCount: 1,
      graduated: 1,
      percent: 33,
      nextCharacter: '一',
    })
  })

  it('turns HanziWriter callbacks into live practice status', () => {
    const events: StrokeAttemptEvent[] = [
      { type: 'mistake', strokeNum: 0, mistakesOnStroke: 1, totalMistakes: 1, strokesRemaining: 2 },
      { type: 'correct', strokeNum: 0, mistakesOnStroke: 1, totalMistakes: 1, strokesRemaining: 2 },
      { type: 'correct', strokeNum: 1, mistakesOnStroke: 0, totalMistakes: 1, strokesRemaining: 1 },
    ]

    expect(getPracticeStatus(events, 3)).toEqual({
      completedStrokes: 2,
      currentStroke: 3,
      progressPercent: 67,
      projectedStars: 2,
      totalMistakes: 1,
      recentMistake: false,
    })
  })

  it('keeps a fresh practice attempt legible', () => {
    expect(getPracticeStatus([], 5)).toEqual({
      completedStrokes: 0,
      currentStroke: 1,
      progressPercent: 0,
      projectedStars: 3,
      totalMistakes: 0,
      recentMistake: false,
    })
  })
})
