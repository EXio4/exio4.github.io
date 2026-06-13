import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CharacterInfo } from './CharacterInfo.tsx'
import { HanziWriterSurface, type HanziWriterSurfaceHandle } from './HanziWriterSurface.tsx'
import { ResultPanel } from './ResultPanel.tsx'
import { StrokeAppMessage } from './DeckView.tsx'
import { getCharacter, getDeck, getDeckCharacters } from '../content.ts'
import { calculateStars } from '../scoring.ts'
import { getDueCharacters, getPracticeQueue } from '../srs.ts'
import type {
  CharacterProgress,
  StarRating,
  StrokeAttempt,
  StrokeAttemptEvent,
  StrokeInputType,
  StrokeSettings,
} from '../types.ts'

interface Props {
  progress: CharacterProgress[]
  settings: StrokeSettings
  onSaveAttempt: (attempt: StrokeAttempt) => Promise<void>
}

export function PracticeView({ progress, settings, onSaveAttempt }: Props) {
  const { deckId = '', character = '' } = useParams()
  const navigate = useNavigate()
  const writerRef = useRef<HanziWriterSurfaceHandle>(null)
  const completedRef = useRef(false)
  const eventsRef = useRef<StrokeAttemptEvent[]>([])
  const inputTypeRef = useRef<StrokeInputType>('unknown')
  const canvasSizeRef = useRef(360)
  const startedAtRef = useRef(new Date().toISOString())
  const routeKeyRef = useRef(`${deckId}:${character}`)
  const [attemptKey, setAttemptKey] = useState(0)
  const [events, setEvents] = useState<StrokeAttemptEvent[]>([])
  const [inputType, setInputType] = useState<StrokeInputType>('unknown')
  const [, setCanvasSize] = useState(360)
  const [result, setResult] = useState<{ stars: StarRating; totalMistakes: number } | null>(null)
  const characterInfo = getCharacter(character)
  const strokeCount = characterInfo?.strokeCount ?? 0
  const deck = deckId === 'review' ? undefined : getDeck(deckId)

  const sequence = useMemo(() => {
    if (deckId === 'review') {
      return getDueCharacters(progress, new Date().toISOString()).map((entry) => entry.character)
    }
    if (!deck) return []
    return getPracticeQueue(
      getDeckCharacters(deck.id).map((entry) => entry.character),
      progress,
      new Date().toISOString(),
    )
  }, [deck, deckId, progress])

  const resetAttempt = useCallback(() => {
    completedRef.current = false
    eventsRef.current = []
    inputTypeRef.current = 'unknown'
    canvasSizeRef.current = 360
    startedAtRef.current = new Date().toISOString()
    setAttemptKey((value) => value + 1)
    setEvents([])
    setInputType('unknown')
    setCanvasSize(360)
    setResult(null)
  }, [])

  useEffect(() => {
    const routeKey = `${deckId}:${character}`
    if (routeKeyRef.current === routeKey) return
    routeKeyRef.current = routeKey
    resetAttempt()
  }, [character, deckId, resetAttempt])

  const handleCanvasSizeChange = useCallback((size: number) => {
    canvasSizeRef.current = size
    setCanvasSize(size)
  }, [])

  const handleInputTypeChange = useCallback((nextInputType: StrokeInputType) => {
    inputTypeRef.current = nextInputType
    setInputType(nextInputType)
  }, [])

  const handleStrokeEvent = useCallback((event: StrokeAttemptEvent) => {
    eventsRef.current = [...eventsRef.current, event]
    setEvents(eventsRef.current)
  }, [])

  const handleComplete = useCallback(async (summary: { totalMistakes: number }) => {
    if (completedRef.current) return
    completedRef.current = true

    const completedAt = new Date().toISOString()
    const stars = calculateStars({
      completed: true,
      strokeCount,
      totalMistakes: summary.totalMistakes,
    })
    const attempt: StrokeAttempt = {
      character,
      deckId,
      startedAt: startedAtRef.current,
      completedAt,
      completed: true,
      stars,
      totalMistakes: summary.totalMistakes,
      strokeCount,
      inputType: inputTypeRef.current,
      leniency: settings.leniency,
      canvasSize: canvasSizeRef.current,
      strokeEvents: eventsRef.current,
    }

    setResult({ stars, totalMistakes: summary.totalMistakes })
    await onSaveAttempt(attempt)
  }, [character, deckId, onSaveAttempt, settings.leniency, strokeCount])

  if (!characterInfo || (!deck && deckId !== 'review')) {
    return <StrokeAppMessage title="Practice not found" body="That character is not available in Stroke V1." />
  }

  const handleNext = () => {
    const next = getNextCharacter(sequence, character)
    if (next) {
      navigate(`/apps/stroke/practice/${deckId}/${next}`)
      return
    }
    navigate(deckId === 'review' ? '/apps/stroke/review' : `/apps/stroke/decks/${deckId}`)
  }

  return (
    <div className="stroke-practice-page">
      <header className="stroke-practice-topbar">
        <Link className="stroke-secondary-btn" to={deckId === 'review' ? '/apps/stroke/review' : `/apps/stroke/decks/${deckId}`}>
          Back
        </Link>
        <div>
          <p className="stroke-kicker">{deckId === 'review' ? 'Review' : deck?.name}</p>
          <h1>{characterInfo.character}</h1>
        </div>
        <div className="stroke-practice-actions">
          <button type="button" className="stroke-icon-btn" onClick={() => writerRef.current?.animate()} aria-label="Animate stroke order">
            ▶
          </button>
          <button type="button" className="stroke-icon-btn" onClick={() => writerRef.current?.hint()} aria-label="Show hint">
            ?
          </button>
        </div>
      </header>

      <section className="stroke-practice-layout">
        <div className="stroke-writing-column">
          <HanziWriterSurface
            ref={writerRef}
            character={character}
            attemptKey={attemptKey}
            leniency={settings.leniency}
            onCanvasSizeChange={handleCanvasSizeChange}
            onComplete={handleComplete}
            onInputTypeChange={handleInputTypeChange}
            onStrokeEvent={handleStrokeEvent}
          />
          <div className="stroke-writing-footer">
            <span>{inputType === 'pen' ? 'Apple Pencil detected' : 'Apple Pencil recommended'}</span>
            <button type="button" className="stroke-secondary-btn" onClick={resetAttempt}>
              Retry
            </button>
          </div>
          {result && (
            <ResultPanel
              events={events}
              stars={result.stars}
              totalMistakes={result.totalMistakes}
              onNext={handleNext}
              onRetry={resetAttempt}
            />
          )}
        </div>

        <CharacterInfo character={characterInfo} />
      </section>
    </div>
  )
}

function getNextCharacter(sequence: string[], character: string): string | null {
  const withoutCurrent = sequence.filter((entry) => entry !== character)
  if (withoutCurrent.length > 0) return withoutCurrent[0]
  const index = sequence.indexOf(character)
  return index >= 0 ? sequence[index + 1] ?? null : null
}
