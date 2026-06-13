import type { StarRating, StrokeAttemptEvent } from '../types.ts'
import { summarizeStrokeEvents } from '../scoring.ts'

interface Props {
  events: StrokeAttemptEvent[]
  stars: StarRating
  totalMistakes: number
  onNext: () => void
  onRetry: () => void
}

export function ResultPanel({ events, stars, totalMistakes, onNext, onRetry }: Props) {
  const summary = summarizeStrokeEvents(events)

  return (
    <section className="stroke-result" aria-live="polite">
      <div>
        <p className="stroke-kicker">Result</p>
        <h2>{renderStars(stars)}</h2>
      </div>
      <div className="stroke-result-stats">
        <span>{totalMistakes} mistakes</span>
        <span>{summary.correctStrokes} strokes completed</span>
        <span>{summary.worstStrokeMistakes} worst stroke</span>
      </div>
      <div className="stroke-result-actions">
        <button type="button" className="stroke-secondary-btn" onClick={onRetry}>
          Retry
        </button>
        <button type="button" className="stroke-primary-btn" onClick={onNext}>
          Continue
        </button>
      </div>
    </section>
  )
}

function renderStars(stars: StarRating): string {
  if (stars === 0) return 'No score'
  return `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`
}
