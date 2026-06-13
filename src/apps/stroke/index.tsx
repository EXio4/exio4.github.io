import { useCallback, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { DeckView } from './components/DeckView.tsx'
import { RotationBlocker } from './components/RotationBlocker.tsx'
import { PracticeView } from './components/PracticeView.tsx'
import { ReviewView } from './components/ReviewView.tsx'
import { StrokeDashboard } from './components/StrokeDashboard.tsx'
import {
  DEFAULT_SETTINGS,
  getAllProgress,
  getSettings,
  openStrokeDatabase,
  saveAttempt,
  saveProgress,
} from './db.ts'
import { applyReviewResult, createInitialProgress } from './srs.ts'
import type { CharacterProgress, StrokeAttempt, StrokeSettings } from './types.ts'
import './stroke.css'

export default function StrokeApp() {
  const [db, setDb] = useState<IDBDatabase | null>(null)
  const [progress, setProgress] = useState<CharacterProgress[]>([])
  const [settings, setSettings] = useState<StrokeSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let canceled = false

    async function load() {
      try {
        const nextDb = await openStrokeDatabase()
        const [nextProgress, nextSettings] = await Promise.all([
          getAllProgress(nextDb),
          getSettings(nextDb),
        ])

        if (canceled) {
          nextDb.close()
          return
        }

        setDb(nextDb)
        setProgress(nextProgress)
        setSettings(nextSettings)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to open Stroke progress.')
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    void load()

    return () => {
      canceled = true
      setDb((current) => {
        current?.close()
        return null
      })
    }
  }, [])

  const handleSaveAttempt = useCallback(
    async (attempt: StrokeAttempt) => {
      if (!db) return
      await saveAttempt(db, attempt)

      if (attempt.completed && attempt.stars > 0) {
        const existing =
          progress.find((entry) => entry.character === attempt.character) ??
          createInitialProgress(attempt.character, attempt.startedAt)
        const next = applyReviewResult(existing, {
          reviewedAt: attempt.completedAt ?? new Date().toISOString(),
          stars: attempt.stars,
        })

        await saveProgress(db, next)
        setProgress((current) => upsertProgress(current, next))
      }
    },
    [db, progress],
  )

  if (loading) {
    return <div className="stroke-message">Loading Stroke…</div>
  }

  if (error) {
    return (
      <div className="stroke-message">
        <h1>Stroke could not start</h1>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <RotationBlocker>
      <Routes>
        <Route path="/" element={<StrokeDashboard progress={progress} settings={settings} />} />
        <Route path="/decks/:deckId" element={<DeckView progress={progress} />} />
        <Route path="/review" element={<ReviewView progress={progress} />} />
        <Route
          path="/practice/:deckId/:character"
          element={
            <PracticeView
              progress={progress}
              settings={settings}
              onSaveAttempt={handleSaveAttempt}
            />
          }
        />
        <Route
          path="*"
          element={
            <div className="stroke-message">
              <h1>Stroke page not found</h1>
              <p>That route is not part of the writing trainer.</p>
            </div>
          }
        />
      </Routes>
    </RotationBlocker>
  )
}

function upsertProgress(records: CharacterProgress[], next: CharacterProgress): CharacterProgress[] {
  const found = records.some((entry) => entry.character === next.character)
  if (!found) return [...records, next]
  return records.map((entry) => (entry.character === next.character ? next : entry))
}
