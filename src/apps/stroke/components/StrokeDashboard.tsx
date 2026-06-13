import { Link } from 'react-router-dom'
import { CHARACTERS, DECKS, getDeckCharacters } from '../content.ts'
import { buildDashboardSummary, buildDeckSummary } from '../session.ts'
import type { CharacterProgress, StrokeSettings } from '../types.ts'

interface Props {
  progress: CharacterProgress[]
  settings: StrokeSettings
}

export function StrokeDashboard({ progress, settings }: Props) {
  const now = new Date().toISOString()
  const summary = buildDashboardSummary(progress, settings.dailyGoal, now)

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

      <section className="stroke-today-panel">
        <div className="stroke-today-copy">
          <p className="stroke-kicker">Today's Path</p>
          <h2>{summary.recommendation.label}</h2>
          <p>{summary.recommendation.detail}</p>
          <Link className="stroke-primary-btn" to={summary.recommendation.to}>
            Begin
          </Link>
        </div>

        <div className="stroke-next-strip" aria-label="Next characters">
          {summary.nextCharacters.map((entry) => (
            <Link
              key={entry.character}
              className="stroke-next-chip"
              to={`/apps/stroke/practice/${entry.deckIds[0]}/${entry.character}`}
            >
              <span>{entry.character}</span>
              <small>{entry.pinyinMarked}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="stroke-review-band">
        <div>
          <span className="stroke-review-count">{summary.dueCount}</span>
          <div>
            <h2>Memory Queue</h2>
            <p>
              {summary.dueCount > 0
                ? 'Your review queue is ready.'
                : `${summary.newCount} new characters are still untouched.`}
            </p>
          </div>
        </div>
        {summary.dueCount > 0 && (
          <Link className="stroke-primary-btn" to="/apps/stroke/review">
            Start Review
          </Link>
        )}
      </section>

      <section className="stroke-stat-row" aria-label="Progress summary">
        <div>
          <span>{summary.goalCompleted}</span>
          <p>Today / {settings.dailyGoal}</p>
          <div className="stroke-mini-meter" aria-label={`${summary.goalPercent}% of daily goal`}>
            <span style={{ width: `${summary.goalPercent}%` }} />
          </div>
        </div>
        <div>
          <span>{summary.graduated}</span>
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
            const deckSummary = buildDeckSummary(
              characters.map((entry) => entry.character),
              progress,
              now,
            )
            const nextCharacter = characters.find((entry) => entry.character === deckSummary.nextCharacter)
            return (
              <Link key={deck.id} className="stroke-deck-card" to={`/apps/stroke/decks/${deck.id}`}>
                <div>
                  <h3>{deck.name}</h3>
                  <p>{deck.description}</p>
                </div>
                <div className="stroke-deck-focus">
                  <span>Next</span>
                  <strong>{nextCharacter ? `${nextCharacter.character} ${nextCharacter.pinyinMarked}` : 'Done'}</strong>
                </div>
                <div className="stroke-progress-bar" aria-label={`${deckSummary.percent}% complete`}>
                  <span style={{ width: `${deckSummary.percent}%` }} />
                </div>
                <p className="stroke-deck-meta">
                  {deckSummary.due} due · {deckSummary.newCount} new · {deckSummary.graduated}/{characters.length} at 3 stars
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
