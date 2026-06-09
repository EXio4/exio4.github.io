import { useState } from 'react'
import type { ToneForgeConfig, Tier, InitialGroup } from './toneforge.ts'

interface Props {
  onStart: (config: ToneForgeConfig) => void
}

const TIERS: { key: Tier; label: string; desc: string; emoji: string }[] = [
  { key: 'easy', label: 'Easy', desc: 'Same syllable, pick the tone', emoji: '🌱' },
  { key: 'medium', label: 'Medium', desc: 'Mixed syllables, 3 replays', emoji: '🔥' },
  { key: 'hard', label: 'Hard', desc: '6 options, 1 replay', emoji: '💎' },
  { key: 'expert', label: 'Expert', desc: 'Type the answer, no hints', emoji: '👑' },
]

const GROUPS: { key: InitialGroup | ''; label: string }[] = [
  { key: '', label: 'All initials' },
  { key: 'labials', label: 'b p m f' },
  { key: 'alveolars', label: 'd t n l' },
  { key: 'velars', label: 'g k h' },
  { key: 'palatals', label: 'j q x' },
  { key: 'retroflex', label: 'zh ch sh r' },
  { key: 'dentals', label: 'z c s' },
  { key: 'retroflex_vs_dental', label: 'zh/ch/sh vs z/c/s' },
  { key: 'aspirated_vs_unaspirated', label: 'Aspirated contrast' },
]

const ROUND_OPTIONS = [5, 10, 15, 20]

export function SetupScreen({ onStart }: Props) {
  const [tier, setTier] = useState<Tier>('easy')
  const [group, setGroup] = useState<InitialGroup | ''>('')
  const [rounds, setRounds] = useState(10)

  const showGroup = tier === 'medium' || tier === 'hard'

  const handleStart = () => {
    const config: ToneForgeConfig = { tier, roundsPerGame: rounds }
    if (showGroup && group) config.initialGroup = group as InitialGroup
    onStart(config)
  }

  return (
    <div className="tf-setup">
      <h1 className="tf-setup-title">ToneForge</h1>
      <p className="tf-setup-desc">
        Train your ear for Mandarin tones. Listen to a syllable and identify which
        of the four tones you heard.
      </p>

      <section className="tf-setup-section">
        <h2 className="tf-setup-label">Difficulty</h2>
        <div className="tf-tier-grid">
          {TIERS.map((t) => (
            <button
              key={t.key}
              className={`tf-tier-card${tier === t.key ? ' is-active' : ''}`}
              onClick={() => setTier(t.key)}
            >
              <span className="tf-tier-emoji">{t.emoji}</span>
              <span className="tf-tier-name">{t.label}</span>
              <span className="tf-tier-desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {showGroup && (
        <section className="tf-setup-section">
          <h2 className="tf-setup-label">Focus initials</h2>
          <select
            className="tf-select"
            value={group}
            onChange={(e) => setGroup(e.target.value as InitialGroup | '')}
          >
            {GROUPS.map((g) => (
              <option key={g.key} value={g.key}>{g.label}</option>
            ))}
          </select>
        </section>
      )}

      <section className="tf-setup-section">
        <h2 className="tf-setup-label">Rounds: {rounds}</h2>
        <div className="tf-rounds-row">
          {ROUND_OPTIONS.map((n) => (
            <button
              key={n}
              className={`tf-rounds-btn${rounds === n ? ' is-active' : ''}`}
              onClick={() => setRounds(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <button className="tf-start-btn" onClick={handleStart}>
        Start Game
      </button>
    </div>
  )
}
