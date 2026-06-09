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

const ROUND_OPTIONS = [5, 10, 15, 20]

const TONES = [
  { tone: 1, mark: 'ˉ', name: '1st', full: 'High level', char: 'mā' },
  { tone: 2, mark: 'ˊ', name: '2nd', full: 'Rising', char: 'má' },
  { tone: 3, mark: 'ˇ', name: '3rd', full: 'Dip-rise', char: 'mǎ' },
  { tone: 4, mark: 'ˋ', name: '4th', full: 'Falling', char: 'mà' },
]

const CONSONANT_GROUPS: { key: InitialGroup; label: string; initials: string }[] = [
  { key: 'labials',   label: 'Labials',   initials: 'b p m f' },
  { key: 'alveolars', label: 'Alveolars', initials: 'd t n l' },
  { key: 'velars',    label: 'Velars',    initials: 'g k h' },
  { key: 'palatals',  label: 'Palatals',  initials: 'j q x' },
  { key: 'retroflex', label: 'Retroflex', initials: 'zh ch sh r' },
  { key: 'dentals',   label: 'Dentals',   initials: 'z c s' },
]

function toggle<T>(arr: T[], val: T): T[] {
  if (arr.includes(val)) return arr.filter(v => v !== val)
  return [...arr, val]
}

export function SetupScreen({ onStart }: Props) {
  const [tier, setTier] = useState<Tier>('easy')
  const [rounds, setRounds] = useState(10)
  const [groups, setGroups] = useState<InitialGroup[]>([])
  const [tones, setTones] = useState<number[]>([1, 2, 3, 4])

  const handleStart = () => {
    const config: ToneForgeConfig = { tier, roundsPerGame: rounds, tones }
    if (groups.length > 0) config.initialGroups = groups
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

      <section className="tf-setup-section">
        <h2 className="tf-setup-label">Consonants</h2>
        <div className="tf-consonant-grid">
          {CONSONANT_GROUPS.map((g) => {
            const active = groups.includes(g.key)
            return (
              <button
                key={g.key}
                className={`tf-consonant-chip${active ? ' is-active' : ''}`}
                onClick={() => setGroups(toggle(groups, g.key))}
              >
                <span className="tf-consonant-name">{g.label}</span>
                <span className="tf-consonant-initials">{g.initials}</span>
              </button>
            )
          })}
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
                disabled={active && tones.length <= 1}
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
