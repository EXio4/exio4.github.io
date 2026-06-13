import { Link } from 'react-router-dom'
import { CHARACTERS, DECKS, getDeckCharacters } from '../content.ts'
import { getDueCharacters } from '../srs.ts'
import type { CharacterProgress, StrokeSettings } from '../types.ts'

interface Props {
  progress: CharacterProgress[]
  settings: StrokeSettings
}

export function StrokeDashboard({ progress, settings }: Props) {
  const now = new Date().toISOString()
  const due = getDueCharacters(progress, now)
  const practicedToday = progress.filter((entry) => isToday(entry.lastPracticedAt)).length
  const graduated = progress.filter((entry) => entry.bestStars === 3).length

  return (
    <div className="stroke-page">
      <header className="stroke-heading">
        <div>
          <p className="stroke-kicker">Stroke</p>
          <h1>Write Chinese characters</h1>
        </div>
        <Link className="stroke-secondary-btn" to="/apps/stroke/review">
          Review
        </Link>
      </header>

      <section className="stroke-review-band">
        <div>
          <span className="stroke-review-count">{due.length}</span>
          <div>
            <h2>Due today</h2>
            <p>
              {due.length > 0
                ? 'Your review queue is ready.'
                : 'Nothing due right now. Pick a deck to keep warming up.'}
            </p>
          </div>
        </div>
        {due.length > 0 && (
          <Link className="stroke-primary-btn" to="/apps/stroke/review">
            Start Review
          </Link>
        )}
      </section>

      <section className="stroke-stat-row" aria-label="Progress summary">
        <div>
          <span>{practicedToday}</span>
          <p>Today / {settings.dailyGoal}</p>
        </div>
        <div>
          <span>{graduated}</span>
          <p>Graduated</p>
        </div>
        <div>
          <span>{CHARACTERS.length}</span>
          <p>V1 Characters</p>
        </div>
      </section>

      <section className="stroke-section">
        <div className="stroke-section-heading">
          <h2>Essentials</h2>
          <p>Practice with local HanziWriter data, stored fully on-device.</p>
        </div>
        <div className="stroke-deck-grid">
          {DECKS.map((deck) => {
            const characters = getDeckCharacters(deck.id)
            const summary = summarizeDeck(characters.map((entry) => entry.character), progress)
            return (
              <Link key={deck.id} className="stroke-deck-card" to={`/apps/stroke/decks/${deck.id}`}>
                <div>
                  <h3>{deck.name}</h3>
                  <p>{deck.description}</p>
                </div>
                <div className="stroke-progress-bar" aria-label={`${summary.percent}% complete`}>
                  <span style={{ width: `${summary.percent}%` }} />
                </div>
                <p className="stroke-deck-meta">
                  {summary.graduated}/{characters.length} at 3 stars
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function summarizeDeck(characters: string[], progress: CharacterProgress[]) {
  const progressByCharacter = new Map(progress.map((entry) => [entry.character, entry]))
  const graduated = characters.filter((character) => progressByCharacter.get(character)?.bestStars === 3).length
  return {
    graduated,
    percent: Math.round((graduated / characters.length) * 100),
  }
}

function isToday(value?: string): boolean {
  if (!value) return false
  return new Date(value).toDateString() === new Date().toDateString()
}
