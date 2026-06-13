import { CHARACTERS, DECKS, getCharacter, getDeckCharacters } from './content.ts'
import { calculateStars, summarizeStrokeEvents } from './scoring.ts'
import { getDueCharacters, getPracticeQueue } from './srs.ts'
import type { CharacterProgress, StarRating, StrokeAttemptEvent, StrokeCharacter } from './types.ts'

export type DashboardRecommendationKind = 'review' | 'learn' | 'practice'

export interface DashboardRecommendation {
  kind: DashboardRecommendationKind
  label: string
  detail: string
  to: string
}

export interface DashboardSummary {
  dueCount: number
  graduated: number
  goalCompleted: number
  goalPercent: number
  newCount: number
  nextCharacters: StrokeCharacter[]
  recommendation: DashboardRecommendation
}

export interface DeckSummary {
  due: number
  graduated: number
  newCount: number
  nextCharacter: string
  percent: number
}

export interface PracticeStatus {
  completedStrokes: number
  currentStroke: number
  progressPercent: number
  projectedStars: StarRating
  recentMistake: boolean
  totalMistakes: number
}

export function buildDashboardSummary(
  progress: CharacterProgress[],
  dailyGoal: number,
  now = new Date().toISOString(),
): DashboardSummary {
  const progressByCharacter = new Map(progress.map((entry) => [entry.character, entry]))
  const due = getDueCharacters(progress, now)
  const newCharacters = CHARACTERS.filter((entry) => !progressByCharacter.has(entry.character))
  const practicedToday = progress.filter((entry) => isSameDay(entry.lastPracticedAt, now)).length
  const graduated = progress.filter((entry) => entry.bestStars === 3).length

  return {
    dueCount: due.length,
    graduated,
    goalCompleted: practicedToday,
    goalPercent: dailyGoal > 0 ? Math.min(100, Math.round((practicedToday / dailyGoal) * 100)) : 0,
    newCount: newCharacters.length,
    nextCharacters: getNextCharacters(progress, now),
    recommendation: getDashboardRecommendation(due.length, newCharacters, progress, now),
  }
}

export function buildDeckSummary(
  characters: string[],
  progress: CharacterProgress[],
  now = new Date().toISOString(),
): DeckSummary {
  const progressByCharacter = new Map(progress.map((entry) => [entry.character, entry]))
  const nowTime = new Date(now).getTime()
  const queue = getPracticeQueue(characters, progress, now)

  const graduated = characters.filter((character) => progressByCharacter.get(character)?.bestStars === 3).length
  const due = characters.filter((character) => {
    const record = progressByCharacter.get(character)
    return record ? new Date(record.dueAt).getTime() <= nowTime : false
  }).length
  const newCount = characters.filter((character) => !progressByCharacter.has(character)).length

  return {
    due,
    graduated,
    newCount,
    nextCharacter: queue[0] ?? characters[0] ?? '',
    percent: characters.length > 0 ? Math.round((graduated / characters.length) * 100) : 0,
  }
}

export function getPracticeStatus(events: StrokeAttemptEvent[], strokeCount: number): PracticeStatus {
  const summary = summarizeStrokeEvents(events)
  const completedStrokes = Math.min(strokeCount, summary.correctStrokes)
  const latest = events[events.length - 1]
  const totalMistakes = summary.totalMistakes

  return {
    completedStrokes,
    currentStroke: Math.min(strokeCount, completedStrokes + 1),
    progressPercent: strokeCount > 0 ? Math.round((completedStrokes / strokeCount) * 100) : 0,
    projectedStars: calculateStars({
      completed: true,
      strokeCount,
      totalMistakes,
    }),
    recentMistake: latest?.type === 'mistake',
    totalMistakes,
  }
}

export function getSessionQueue(
  deckId: string,
  currentCharacter: string,
  progress: CharacterProgress[],
  now = new Date().toISOString(),
): StrokeCharacter[] {
  const characters =
    deckId === 'review'
      ? getDueCharacters(progress, now).map((entry) => entry.character)
      : getDeckCharacters(deckId).map((entry) => entry.character)

  const queue = getPracticeQueue(characters, progress, now).filter(
    (character) => character !== currentCharacter,
  )
  return queue
    .map((character) => getCharacter(character))
    .filter((entry): entry is StrokeCharacter => Boolean(entry))
    .slice(0, 5)
}

function getNextCharacters(progress: CharacterProgress[], now: string): StrokeCharacter[] {
  const progressByCharacter = new Map(progress.map((entry) => [entry.character, entry]))
  const dueCharacters = getDueCharacters(progress, now)
    .map((entry) => getCharacter(entry.character))
    .filter((entry): entry is StrokeCharacter => Boolean(entry))
  const newCharacters = CHARACTERS.filter((entry) => !progressByCharacter.has(entry.character))
  const reviewCharacters = CHARACTERS.filter((entry) => {
    const record = progressByCharacter.get(entry.character)
    return record && record.bestStars > 0 && record.bestStars < 3
  })

  return dedupeCharacters([...dueCharacters, ...newCharacters, ...reviewCharacters]).slice(0, 5)
}

function getDashboardRecommendation(
  dueCount: number,
  newCharacters: StrokeCharacter[],
  progress: CharacterProgress[],
  now: string,
): DashboardRecommendation {
  if (dueCount > 0) {
    return {
      kind: 'review',
      label: `Review ${dueCount} due`,
      detail: 'Clear the memory queue before learning more.',
      to: '/apps/stroke/review',
    }
  }

  const firstNew = newCharacters[0]
  if (firstNew) {
    const deckId = firstNew.deckIds[0] ?? DECKS[0].id
    return {
      kind: 'learn',
      label: `Start ${getDeckLabel(deckId)}`,
      detail: `Next up: ${firstNew.character} ${firstNew.pinyinMarked}`,
      to: `/apps/stroke/practice/${deckId}/${firstNew.character}`,
    }
  }

  const next = getNextCharacters(progress, now)[0] ?? CHARACTERS[0]
  const deckId = next.deckIds[0] ?? DECKS[0].id
  return {
    kind: 'practice',
    label: `Sharpen ${next.character}`,
    detail: `${next.pinyinMarked} · ${next.meaning}`,
    to: `/apps/stroke/practice/${deckId}/${next.character}`,
  }
}

function getDeckLabel(deckId: string): string {
  return DECKS.find((deck) => deck.id === deckId)?.name ?? 'Practice'
}

function dedupeCharacters(characters: StrokeCharacter[]): StrokeCharacter[] {
  const seen = new Set<string>()
  return characters.filter((entry) => {
    if (seen.has(entry.character)) return false
    seen.add(entry.character)
    return true
  })
}

function isSameDay(a: string | undefined, b: string): boolean {
  if (!a) return false
  return new Date(a).toDateString() === new Date(b).toDateString()
}
