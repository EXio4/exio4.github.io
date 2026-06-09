import { useState } from 'react'
import type { ToneForgeState, SyllableEntry } from './toneforge.ts'
import { normalize } from './pinyin.ts'
import { useT } from './LangContext.tsx'

interface Props {
  state: ToneForgeState
  feedback: { correct: boolean; chosenIndex: number } | null
  replayCount: number
  onAnswer: (index: number) => void
  onReplay: () => void
  onBack: () => void
}

const TIER_MAX_REPLAYS: Record<string, number> = {
  easy: Infinity,
  medium: 3,
  hard: 1,
  expert: 0,
}

function replayLabel(t: { replay: string; replayCount: string }, max: number, used: number): string {
  if (max === Infinity) return t.replay
  const left = max - used
  return t.replayCount.replace('{n}', String(left))
}

export function GameScreen({ state, feedback, replayCount, onAnswer, onReplay, onBack }: Props) {
  const { t } = useT()
  const round = state.currentRound!
  const tier = state.config.tier
  const isExpert = tier === 'expert'
  const maxReplays = TIER_MAX_REPLAYS[tier] ?? 3
  const canReplay = replayCount < maxReplays

  const [expertInput, setExpertInput] = useState('')
  const [expertSubmitted, setExpertSubmitted] = useState(false)

  const roundKey = `${state.roundIndex}-${round.correct.syllableTone}`

  const progressPct = state.totalRounds > 0
    ? ((state.roundIndex) / state.totalRounds) * 100
    : 0

  const handleExpertSubmit = () => {
    if (expertSubmitted) return
    const norm = normalize(expertInput.trim())
    if (!norm || norm.tone === 0) return
    const isCorrect = norm.base === round.correct.base && norm.tone === round.correct.tone
    const idx = isCorrect ? 0 : -1
    setExpertSubmitted(true)
    onAnswer(idx)
  }

  const handleExpertKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleExpertSubmit()
  }

  return (
    <div className="tf-game">
      {/* Progress + back */}
      <div className="tf-topbar">
        <button className="tf-back-chevron" onClick={onBack} aria-label={t.back}>←</button>
        <span className="tf-progress-text">
          {t.round} {state.roundIndex + 1} / {state.totalRounds}
        </span>
      </div>
      <div className="tf-progress">
        <div className="tf-progress-bar" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Audio button */}
      <button
        className="tf-audio-btn"
        onClick={onReplay}
        disabled={!canReplay && replayCount > 0}
        aria-label={t.playAudio}
      >
        <span className="tf-audio-icon">🔊</span>
        <span className="tf-audio-label">
          {replayCount === 0 ? t.listen : replayLabel(t, maxReplays, replayCount)}
        </span>
      </button>

      {/* Options */}
      {isExpert ? (
        <div className="tf-expert" key={roundKey}>
          <input
            className="tf-expert-input"
            type="text"
            value={expertInput}
            onChange={(e) => setExpertInput(e.target.value)}
            onKeyDown={handleExpertKeyDown}
            disabled={expertSubmitted || feedback !== null}
            placeholder={t.expertPlaceholder}
            autoFocus
          />
          <button
            className="tf-expert-submit"
            onClick={handleExpertSubmit}
            disabled={expertSubmitted || feedback !== null}
          >
            {t.submit}
          </button>
        </div>
      ) : (
        <div className="tf-options">
          {round.options.map((opt, i) => (
            <OptionButton
              key={opt.syllableTone}
              entry={opt}
              index={i}
              disabled={feedback !== null}
              state={
                !feedback ? 'idle'
                : i === round.correctIndex ? 'correct'
                : i === feedback.chosenIndex ? 'wrong'
                : 'dimmed'
              }
              onClick={() => onAnswer(i)}
            />
          ))}
        </div>
      )}

      {/* Expert feedback */}
      {isExpert && feedback && (
        <div className={`tf-feedback${feedback.correct ? ' is-correct' : ' is-wrong'}`}>
          {feedback.correct ? (
            <span>{t.correct}</span>
          ) : (
            <span>
              {t.wrongAnswer.split('{answer}')[0]}
              <strong className="tf-feedback-answer">
                {round.correct.syllableTone}
              </strong>
              {t.wrongAnswer.split('{answer}')[1] ?? ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

interface OptionButtonProps {
  entry: SyllableEntry
  index: number
  disabled: boolean
  state: 'idle' | 'correct' | 'wrong' | 'dimmed'
  onClick: () => void
}

function OptionButton({ entry, disabled, state, onClick }: OptionButtonProps) {
  const cls = `tf-option${state !== 'idle' ? ` is-${state}` : ''}`
  return (
    <button
      className={cls}
      disabled={disabled}
      onClick={onClick}
      style={{ '--tone': `var(--tone-${entry.tone})` } as React.CSSProperties}
    >
      <span className="tf-option-pinyin">{entry.syllableTone}</span>
    </button>
  )
}
