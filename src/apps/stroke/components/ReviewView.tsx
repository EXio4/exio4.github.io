import { Link } from 'react-router-dom'
import { getDueCharacters } from '../srs.ts'
import type { CharacterProgress } from '../types.ts'

interface Props {
  progress: CharacterProgress[]
}

export function ReviewView({ progress }: Props) {
  const due = getDueCharacters(progress, new Date().toISOString())
  const next = due[0]?.character

  if (!next) {
    return (
      <div className="stroke-message">
        <h1>Review clear</h1>
        <p>No characters are due right now.</p>
        <Link className="stroke-primary-btn" to="/apps/stroke">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="stroke-message">
      <p className="stroke-kicker">Review Queue</p>
      <h1>{due.length} due</h1>
      <p>Start with {next} and continue until the queue is clear.</p>
      <Link className="stroke-primary-btn" to={`/apps/stroke/practice/review/${next}`}>
        Start Review
      </Link>
    </div>
  )
}
