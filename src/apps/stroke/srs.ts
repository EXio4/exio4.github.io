import type { CharacterProgress, StarRating } from './types.ts'

const DEFAULT_EASE = 2.0
const MAX_EASE = 2.5
const MIN_EASE = 1.3
const WEAK_REVIEW_DELAY_MINUTES = 10
const DAY_MS = 24 * 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

interface ReviewResult {
  reviewedAt: string
  stars: StarRating
}

export function createInitialProgress(character: string, now = new Date().toISOString()): CharacterProgress {
  return {
    character,
    bestStars: 0,
    attempts: 0,
    dueAt: now,
    intervalDays: 0,
    ease: DEFAULT_EASE,
    lapses: 0,
  }
}

export function applyReviewResult(
  progress: CharacterProgress,
  result: ReviewResult,
): CharacterProgress {
  const reviewedAt = new Date(result.reviewedAt)
  let intervalDays = progress.intervalDays
  let ease = progress.ease
  let lapses = progress.lapses
  let dueAt = reviewedAt.toISOString()

  if (result.stars === 3) {
    intervalDays = intervalDays === 0 ? 2 : Math.ceil(intervalDays * ease)
    ease = clampEase(ease + 0.05)
    dueAt = addDays(reviewedAt, intervalDays).toISOString()
  } else if (result.stars === 2) {
    intervalDays = intervalDays === 0 ? 1 : Math.ceil(intervalDays * 1.2)
    dueAt = addDays(reviewedAt, intervalDays).toISOString()
  } else if (result.stars === 1) {
    intervalDays = 0
    ease = clampEase(ease - 0.10)
    lapses += 1
    dueAt = new Date(reviewedAt.getTime() + WEAK_REVIEW_DELAY_MINUTES * MINUTE_MS).toISOString()
  }

  return {
    ...progress,
    bestStars: maxStars(progress.bestStars, result.stars),
    attempts: progress.attempts + 1,
    lastPracticedAt: result.reviewedAt,
    dueAt,
    intervalDays,
    ease,
    lapses,
  }
}

export function getDueCharacters(
  records: CharacterProgress[],
  now = new Date().toISOString(),
): CharacterProgress[] {
  const nowTime = new Date(now).getTime()
  return records
    .filter((record) => new Date(record.dueAt).getTime() <= nowTime)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.character.localeCompare(b.character))
}

export function getPracticeQueue(
  characters: string[],
  records: CharacterProgress[],
  now = new Date().toISOString(),
): string[] {
  const progressByCharacter = new Map(records.map((record) => [record.character, record]))
  const nowTime = new Date(now).getTime()

  return characters
    .map((character, index) => {
      const record = progressByCharacter.get(character)
      const phase = getQueuePhase(record, nowTime)
      return { character, index, phase }
    })
    .sort((a, b) => a.phase - b.phase || a.index - b.index)
    .map((entry) => entry.character)
}

function getQueuePhase(record: CharacterProgress | undefined, nowTime: number): number {
  if (!record) return 1
  return new Date(record.dueAt).getTime() <= nowTime ? 0 : 2
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

function clampEase(ease: number): number {
  return Number(Math.min(MAX_EASE, Math.max(MIN_EASE, ease)).toFixed(2))
}

function maxStars(a: StarRating, b: StarRating): StarRating {
  return Math.max(a, b) as StarRating
}
