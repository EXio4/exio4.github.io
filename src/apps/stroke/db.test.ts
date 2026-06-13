import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  deleteStrokeDatabase,
  getAllProgress,
  getAttemptsForCharacter,
  getSettings,
  openStrokeDatabase,
  saveAttempt,
  saveProgress,
  saveSettings,
} from './db.ts'
import type { CharacterProgress, StrokeAttempt } from './types.ts'

const NOW = '2026-06-13T12:00:00.000Z'

function sampleProgress(character = '人'): CharacterProgress {
  return {
    character,
    bestStars: 2,
    attempts: 4,
    lastPracticedAt: NOW,
    dueAt: '2026-06-14T12:00:00.000Z',
    intervalDays: 1,
    ease: 2.3,
    lapses: 0,
  }
}

function sampleAttempt(character = '人'): StrokeAttempt {
  return {
    character,
    deckId: 'common',
    startedAt: NOW,
    completedAt: '2026-06-13T12:01:00.000Z',
    completed: true,
    stars: 2,
    totalMistakes: 1,
    strokeCount: 2,
    inputType: 'pen',
    leniency: 1,
    canvasSize: 420,
    strokeEvents: [
      {
        type: 'mistake',
        strokeNum: 0,
        mistakesOnStroke: 1,
        totalMistakes: 1,
        strokesRemaining: 1,
      },
    ],
  }
}

describe('Stroke IndexedDB', () => {
  beforeEach(async () => {
    await deleteStrokeDatabase()
  })

  it('opens with default settings when nothing has been saved', async () => {
    const db = await openStrokeDatabase()
    const settings = await getSettings(db)

    expect(settings).toEqual(DEFAULT_SETTINGS)
    db.close()
  })

  it('persists settings, progress, and attempt history', async () => {
    const db = await openStrokeDatabase()

    await saveSettings(db, { dailyGoal: 12, leniency: 0.85 })
    await saveProgress(db, sampleProgress())
    const attemptId = await saveAttempt(db, sampleAttempt())

    expect(attemptId).toBeGreaterThan(0)
    expect(await getSettings(db)).toEqual({
      ...DEFAULT_SETTINGS,
      dailyGoal: 12,
      leniency: 0.85,
    })
    expect(await getAllProgress(db)).toEqual([sampleProgress()])
    expect(await getAttemptsForCharacter(db, '人')).toMatchObject([
      {
        id: attemptId,
        character: '人',
        stars: 2,
        totalMistakes: 1,
      },
    ])

    db.close()
  })

  it('keeps attempt queries scoped by character and newest first', async () => {
    const db = await openStrokeDatabase()

    await saveAttempt(db, { ...sampleAttempt('人'), startedAt: '2026-06-13T12:00:00.000Z' })
    const newer = await saveAttempt(db, {
      ...sampleAttempt('人'),
      startedAt: '2026-06-13T12:05:00.000Z',
      totalMistakes: 0,
      stars: 3,
    })
    await saveAttempt(db, sampleAttempt('口'))

    const attempts = await getAttemptsForCharacter(db, '人')

    expect(attempts).toHaveLength(2)
    expect(attempts[0]).toMatchObject({ id: newer, stars: 3 })
    expect(attempts[1]).toMatchObject({ stars: 2 })

    db.close()
  })
})
