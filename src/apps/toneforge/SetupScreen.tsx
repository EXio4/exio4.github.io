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

const TONES = [
  { tone: 1, mark: 'ˉ', name: '1st', full: 'High level', char: 'mā' },
  { tone: 2, mark: 'ˊ', name: '2nd', full: 'Rising', char: 'má' },
  { tone: 3, mark: 'ˇ', name: '3rd', full: 'Dip-rise', char: 'mǎ' },
  { tone: 4, mark: 'ˋ', name: '4th', full: 'Falling', char: 'mà' },
]

function toggle(arr: number[], val: number): number[] {
  if (arr.includes(val)) return arr.filter(v => v !== val)
  return [...arr, val]
}

export function SetupScreen({ onStart }: Props) {
  const [tier, setTier] = useState<Tier>('easy')
  const [group, setGroup] = useState<InitialGroup | ''>('')
  const [rounds, setRounds] = useState(10)
  const [tones, setTones] = useState<number[]>([1, 2, 3, 4])

  const showGroup = tier === 'medium' || tier === 'hard'

  const handleStart = () => {
    const config: ToneForgeConfig = { tier, roundsPerGame: rounds, tones }
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

      <section className="tf-setup-section">
        <h2 className="tf-setup-label">Tones</h2>
        <div className="tf-tone-chips">
          {TONES.map((t) => {
            const active = tones.includes(t.tone)
            return (
              <button
                key={t.tone}
                className={`tf-tone-chip${active ? ' is-active' : ''}`}
                onClick={() => setTones(toggle(tones, t.tone))}
                disabled={!active && tones.length <= 1}
                style={{ '--tone': `var(--tone-${t.tone})` } as React.CSSProperties}
              >
                <span className="tf-tone-chip-mark">{t.mark}</span>
                <span className="tf-tone-chip-name">{t.name}</span>
                <span className="tf-tone-chip-desc">{t.full}</span>
                <span className="tf-tone-chip-example">{t.char}</span>
              </button>
            )
          })}
        </div>
      </section>

      <button className="tf-start-btn" onClick={handleStart}>
        Start Game
      </button>
    </div>
  )
}
