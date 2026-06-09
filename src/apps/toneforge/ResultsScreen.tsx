import type { ToneStats, ToneForgeConfig } from './toneforge.ts'
import { useT } from './LangContext.tsx'

interface Props {
  stats: ToneStats
  config: ToneForgeConfig
  suggestion: Partial<ToneForgeConfig>
  onPlayAgain: (config?: Partial<ToneForgeConfig>) => void
  onBack: () => void
}

const TONE_RESULT_KEYS = ['tone1Result', 'tone2Result', 'tone3Result', 'tone4Result'] as const
const TONE_MARKS: Record<number, string> = { 1: 'ˉ', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ' }

export function ResultsScreen({ stats, onPlayAgain, suggestion, onBack }: Props) {
  const { t } = useT()
  const accuracy = stats.totalRounds > 0
    ? Math.round((stats.totalCorrect / stats.totalRounds) * 100)
    : 0

  const tones = [1, 2, 3, 4]
  const weakestTone = tones
    .filter((tone) => stats.byTone[tone])
    .sort((a, b) => {
      const aa = stats.byTone[a]
      const bb = stats.byTone[b]
      return (aa.correct / aa.total) - (bb.correct / bb.total)
    })[0]

  return (
    <div className="tf-results">
      <button className="tf-back-btn" onClick={onBack}>{t.back}</button>

      <h1 className="tf-results-title">{t.gameOver}</h1>

      {/* Score */}
      <div className="tf-results-score">
        <div className="tf-score-ring" style={{ '--pct': accuracy } as React.CSSProperties}>
          <span className="tf-score-num">{accuracy}%</span>
        </div>
        <p className="tf-score-detail">
          {t.correctCount.replace('{correct}', String(stats.totalCorrect)).replace('{total}', String(stats.totalRounds))}
        </p>
      </div>

      {/* Streak */}
      <div className="tf-streak">
        {t.bestStreak} <strong>{stats.bestStreak}</strong>
      </div>

      {/* Per-tone accuracy */}
      <section className="tf-tone-bars">
        <h2 className="tf-tone-bars-title">{t.accuracyByTone}</h2>
        {tones.map((tone) => {
          const d = stats.byTone[tone]
          const pct = d ? Math.round((d.correct / d.total) * 100) : null
          const key = TONE_RESULT_KEYS[tone - 1]
          return (
            <div key={tone} className="tf-tone-bar-row">
              <span className="tf-tone-bar-label">
                {TONE_MARKS[tone]} {t[key]}
              </span>
              <div className="tf-tone-bar-track">
                <div
                  className="tf-tone-bar-fill"
                  style={{
                    width: `${pct ?? 0}%`,
                    backgroundColor: `var(--tone-${tone})`,
                  }}
                />
              </div>
              <span className={`tf-tone-bar-pct${tone === weakestTone ? ' is-weak' : ''}`}>
                {pct !== null ? `${pct}%` : '—'}
              </span>
            </div>
          )
        })}
      </section>

      {/* Actions */}
      <div className="tf-results-actions">
        <button className="tf-start-btn" onClick={() => onPlayAgain()}>
          {t.playAgain}
        </button>
        {suggestion.tier && (
          <button
            className="tf-start-btn is-ghost"
            onClick={() => onPlayAgain(suggestion)}
          >
            {t.practiceWeak}
          </button>
        )}
      </div>
    </div>
  )
}
