import type { ToneStats, ToneForgeConfig } from './toneforge.ts'

interface Props {
  stats: ToneStats
  config: ToneForgeConfig
  suggestion: Partial<ToneForgeConfig>
  onPlayAgain: (config?: Partial<ToneForgeConfig>) => void
}

const TONE_LABELS: Record<number, { name: string; mark: string }> = {
  1: { name: '1st (level)', mark: 'ˉ' },
  2: { name: '2nd (rising)', mark: 'ˊ' },
  3: { name: '3rd (dip)', mark: 'ˇ' },
  4: { name: '4th (falling)', mark: 'ˋ' },
}

export function ResultsScreen({ stats, onPlayAgain, suggestion }: Props) {
  const accuracy = stats.totalRounds > 0
    ? Math.round((stats.totalCorrect / stats.totalRounds) * 100)
    : 0

  const tones = [1, 2, 3, 4]
  const weakestTone = tones
    .filter((t) => stats.byTone[t])
    .sort((a, b) => {
      const aa = stats.byTone[a]
      const bb = stats.byTone[b]
      return (aa.correct / aa.total) - (bb.correct / bb.total)
    })[0]

  return (
    <div className="tf-results">
      <h1 className="tf-results-title">Game Over</h1>

      {/* Score */}
      <div className="tf-results-score">
        <div className="tf-score-ring" style={{ '--pct': accuracy } as React.CSSProperties}>
          <span className="tf-score-num">{accuracy}%</span>
        </div>
        <p className="tf-score-detail">
          {stats.totalCorrect} / {stats.totalRounds} correct
        </p>
      </div>

      {/* Streak */}
      <div className="tf-streak">
        Best streak: <strong>{stats.bestStreak}</strong>
      </div>

      {/* Per-tone accuracy */}
      <section className="tf-tone-bars">
        <h2 className="tf-tone-bars-title">Accuracy by tone</h2>
        {tones.map((tone) => {
          const d = stats.byTone[tone]
          const pct = d ? Math.round((d.correct / d.total) * 100) : null
          return (
            <div key={tone} className="tf-tone-bar-row">
              <span className="tf-tone-bar-label">
                {TONE_LABELS[tone].mark} {TONE_LABELS[tone].name}
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
          Play Again
        </button>
        {suggestion.tier && (
          <button
            className="tf-start-btn is-ghost"
            onClick={() => onPlayAgain(suggestion)}
          >
            Practice Weak Spots
          </button>
        )}
      </div>
    </div>
  )
}
