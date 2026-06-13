import { describe, expect, it } from 'vitest'
import {
  applyReviewResult,
  createInitialProgress,
  getDueCharacters,
  getPracticeQueue,
} from './srs.ts'
import type { CharacterProgress, StarRating } from './types.ts'

const NOW = '2026-06-13T12:00:00.000Z'

function progress(character: string, dueAt: string, bestStars: StarRating = 0): CharacterProgress {
  return {
    character,
    bestStars,
    attempts: 0,
    dueAt,
    intervalDays: 0,
    ease: 2.3,
    lapses: 0,
  }
}

describe('Stroke SRS', () => {
  it('creates new progress records due immediately', () => {
    expect(createInitialProgress('人', NOW)).toEqual({
      character: '人',
      bestStars: 0,
      attempts: 0,
      dueAt: NOW,
      intervalDays: 0,
      ease: 2.3,
      lapses: 0,
    })
  })

  it('schedules perfect reviews strongly', () => {
    const next = applyReviewResult(createInitialProgress('人', NOW), {
      reviewedAt: NOW,
      stars: 3,
    })

    expect(next.bestStars).toBe(3)
    expect(next.attempts).toBe(1)
    expect(next.intervalDays).toBe(3)
    expect(next.ease).toBeCloseTo(2.38)
    expect(next.dueAt).toBe('2026-06-16T12:00:00.000Z')
  })

  it('schedules ok reviews modestly and weak reviews soon', () => {
    const ok = applyReviewResult(createInitialProgress('口', NOW), {
      reviewedAt: NOW,
      stars: 2,
    })
    const weak = applyReviewResult(createInitialProgress('日', NOW), {
      reviewedAt: NOW,
      stars: 1,
    })

    expect(ok.intervalDays).toBe(1)
    expect(ok.dueAt).toBe('2026-06-14T12:00:00.000Z')
    expect(weak.intervalDays).toBe(0)
    expect(weak.dueAt).toBe('2026-06-13T12:10:00.000Z')
    expect(weak.lapses).toBe(1)
  })

  it('filters due characters and leaves future reviews alone', () => {
    const records = [
      progress('人', '2026-06-13T11:59:59.000Z'),
      progress('口', '2026-06-14T12:00:00.000Z'),
      progress('日', '2026-06-13T12:00:00.000Z'),
    ]

    expect(getDueCharacters(records, NOW).map((entry) => entry.character)).toEqual(['人', '日'])
  })

  it('builds a practice queue with due cards first, then new deck cards', () => {
    const records = [
      progress('一', '2026-06-14T12:00:00.000Z', 3),
      progress('二', '2026-06-13T11:00:00.000Z', 1),
    ]

    expect(getPracticeQueue(['一', '二', '三'], records, NOW)).toEqual(['二', '三', '一'])
  })
})
