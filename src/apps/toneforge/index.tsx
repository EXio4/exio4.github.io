import { useReducer, useCallback, useRef } from 'react'
import {
  createGame,
  startRound,
  submitAnswer,
  advanceRound,
  getStats,
  suggestNextConfig,
  type ToneForgeState,
  type ToneForgeConfig,
  type Tier,
} from './toneforge.ts'
import { SetupScreen } from './SetupScreen.tsx'
import { GameScreen } from './GameScreen.tsx'
import { ResultsScreen } from './ResultsScreen.tsx'
import { LangProvider } from './LangContext.tsx'
import './toneforge.css'

type Action =
  | { type: 'START'; config: ToneForgeConfig }
  | { type: 'ANSWER'; choiceIndex: number }
  | { type: 'NEXT' }
  | { type: 'REPLAY' }
  | { type: 'BACK' }

interface UIState {
  engine: ToneForgeState
  feedback: { correct: boolean; chosenIndex: number } | null
  replayCount: number
}

function nextRound(state: UIState): UIState {
  const engine = advanceRound(state.engine)
  return { engine, feedback: null, replayCount: 0 }
}

function reducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'START': {
      const engine = startRound(createGame(action.config))
      return { engine, feedback: null, replayCount: 0 }
    }
    case 'ANSWER': {
      if (state.engine.phase !== 'listening' || !state.engine.currentRound) return state
      const result = submitAnswer(state.engine, action.choiceIndex)
      return {
        ...state,
        engine: result.state,
        feedback: {
          correct: result.correct,
          chosenIndex: action.choiceIndex,
        },
      }
    }
    case 'NEXT':
      return nextRound(state)
    case 'REPLAY':
      return { ...state, replayCount: state.replayCount + 1 }
    case 'BACK':
      return {
        engine: createGame({ tier: 'easy', roundsPerGame: 10 }),
        feedback: null,
        replayCount: 0,
      }
  }
}

export default function ToneForgeApp() {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    engine: createGame({ tier: 'easy', roundsPerGame: 10 }),
    feedback: null,
    replayCount: 0,
  }))

  const audioRef = useRef<HTMLAudioElement>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const handleStart = useCallback((config: ToneForgeConfig) => {
    dispatch({ type: 'START', config })
    setTimeout(() => {
      audioRef.current?.play()
    }, 200)
  }, [])

  const handleAnswer = useCallback((choiceIndex: number) => {
    dispatch({ type: 'ANSWER', choiceIndex })
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => {
      dispatch({ type: 'NEXT' })
      setTimeout(() => {
        audioRef.current?.play()
      }, 150)
    }, 1200)
  }, [])

  const handleReplay = useCallback(() => {
    dispatch({ type: 'REPLAY' })
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
    }
  }, [])

  const handleBack = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    dispatch({ type: 'BACK' })
  }, [])

  const handlePlayAgain = useCallback((config?: Partial<ToneForgeConfig>) => {
    const next = config
      ? { tier: 'easy' as Tier, roundsPerGame: 10, ...config }
      : { tier: 'easy' as Tier, roundsPerGame: 10 }
    handleStart(next)
  }, [handleStart])

  const audioUrl = state.engine.currentRound?.audioUrl

  if (state.engine.phase === 'idle') {
    return (
      <LangProvider>
        <SetupScreen onStart={handleStart} />
      </LangProvider>
    )
  }

  if (state.engine.phase === 'finished') {
    return (
      <LangProvider>
        <ResultsScreen
          stats={getStats(state.engine)}
          config={state.engine.config}
          suggestion={suggestNextConfig(getStats(state.engine))}
          onPlayAgain={handlePlayAgain}
          onBack={handleBack}
        />
      </LangProvider>
    )
  }

  return (
    <LangProvider>
      <div className="tf-app">
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}
        <GameScreen
          state={state.engine}
          feedback={state.feedback}
          replayCount={state.replayCount}
          onAnswer={handleAnswer}
          onReplay={handleReplay}
          onBack={handleBack}
        />
      </div>
    </LangProvider>
  )
}
