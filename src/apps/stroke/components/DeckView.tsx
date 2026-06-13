import { Link, useParams } from 'react-router-dom'
import { getDeck, getDeckCharacters } from '../content.ts'
import { getPracticeQueue } from '../srs.ts'
import type { CharacterProgress } from '../types.ts'

interface Props {
  progress: CharacterProgress[]
}

export function DeckView({ progress }: Props) {
  const { deckId = '' } = useParams()
  const deck = getDeck(deckId)

  if (!deck) {
    return <StrokeAppMessage title="Deck not found" body="That deck is not part of Stroke V1." />
  }

  const characters = getDeckCharacters(deck.id)
  const queue = getPracticeQueue(
    characters.map((entry) => entry.character),
    progress,
    new Date().toISOString(),
  )
  const first = queue[0] ?? characters[0]?.character
  const progressByCharacter = new Map(progress.map((entry) => [entry.character, entry]))

  return (
    <div className="stroke-page">
      <header className="stroke-heading">
        <div>
          <p className="stroke-kicker">Essentials</p>
          <h1>{deck.name}</h1>
          <p>{deck.description}</p>
        </div>
        <Link className="stroke-secondary-btn" to="/apps/stroke">
          Dashboard
        </Link>
      </header>

      <div className="stroke-action-row">
        <Link className="stroke-primary-btn" to={`/apps/stroke/practice/${deck.id}/${first}`}>
          Start Practice
        </Link>
      </div>

      <section className="stroke-character-grid" aria-label={`${deck.name} characters`}>
        {characters.map((entry) => {
          const itemProgress = progressByCharacter.get(entry.character)
          return (
            <Link
              key={entry.character}
              className="stroke-character-tile"
              to={`/apps/stroke/practice/${deck.id}/${entry.character}`}
            >
              <span className="stroke-tile-glyph">{entry.character}</span>
              <span>{entry.pinyinMarked}</span>
              <span>{renderStars(itemProgress?.bestStars ?? 0)}</span>
            </Link>
          )
        })}
      </section>
    </div>
  )
}

export function StrokeAppMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="stroke-message">
      <h1>{title}</h1>
      <p>{body}</p>
      <Link className="stroke-primary-btn" to="/apps/stroke">
        Back to Stroke
      </Link>
    </div>
  )
}

function renderStars(stars: number): string {
  return stars > 0 ? `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : 'New'
}
