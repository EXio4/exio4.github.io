import { useState } from 'react'
import type { ToneForgeConfig, Tier, InitialGroup } from './toneforge.ts'
import { useT } from './LangContext.tsx'
import { LangSwitcher } from './LangContext.tsx'

interface Props {
  onStart: (config: ToneForgeConfig) => void
}

const TIERS: { key: Tier }[] = [
  { key: 'easy' },
  { key: 'medium' },
  { key: 'hard' },
  { key: 'expert' },
]

const TIER_EMOJI: Record<string, string> = {
  easy: '🌱',
  medium: '🔥',
  hard: '💎',
  expert: '👑',
}

const ROUND_OPTIONS = [5, 10, 15, 20]

const TONES = [
  { tone: 1, mark: 'ˉ', char: 'mā' },
  { tone: 2, mark: 'ˊ', char: 'má' },
  { tone: 3, mark: 'ˇ', char: 'mǎ' },
  { tone: 4, mark: 'ˋ', char: 'mà' },
]

const CONSONANT_GROUPS: { key: InitialGroup; initials: string }[] = [
  { key: 'labials',   initials: 'b p m f' },
  { key: 'alveolars', initials: 'd t n l' },
  { key: 'velars',    initials: 'g k h' },
  { key: 'palatals',  initials: 'j q x' },
  { key: 'retroflex', initials: 'zh ch sh r' },
  { key: 'dentals',   initials: 'z c s' },
]

function toggle<T>(arr: T[], val: T): T[] {
  if (arr.includes(val)) return arr.filter(v => v !== val)
  return [...arr, val]
}

export function SetupScreen({ onStart }: Props) {
  const { t } = useT()
  const [tier, setTier] = useState<Tier>('easy')
  const [rounds, setRounds] = useState(10)
  const [groups, setGroups] = useState<InitialGroup[]>([])
  const [tones, setTones] = useState<number[]>([1, 2, 3, 4])

  const handleStart = () => {
    const config: ToneForgeConfig = { tier, roundsPerGame: rounds, tones }
    if (groups.length > 0) config.initialGroups = groups
    onStart(config)
  }

  const tierLabels: Record<string, string> = {
    easy: t.tierEasy,
    medium: t.tierMedium,
    hard: t.tierHard,
    expert: t.tierExpert,
  }
  const tierDescs: Record<string, string> = {
    easy: t.tierEasyDesc,
    medium: t.tierMediumDesc,
    hard: t.tierHardDesc,
    expert: t.tierExpertDesc,
  }

  const groupLabels: Record<string, string> = {
    labials: t.groupLabials,
    alveolars: t.groupAlveolars,
    velars: t.groupVelars,
    palatals: t.groupPalatals,
    retroflex: t.groupRetroflex,
    dentals: t.groupDentals,
  }

  const toneNames: Record<number, string> = {
    1: t.tone1Name,
    2: t.tone2Name,
    3: t.tone3Name,
    4: t.tone4Name,
  }
  const toneFulls: Record<number, string> = {
    1: t.tone1Full,
    2: t.tone2Full,
    3: t.tone3Full,
    4: t.tone4Full,
  }

  return (
    <div className="tf-setup">
      <LangSwitcher />

      <h1 className="tf-setup-title">{t.setupTitle}</h1>
      <p className="tf-setup-desc">{t.setupDesc}</p>

      <section className="tf-setup-section">
        <h2 className="tf-setup-label">{t.rounds}: {rounds}</h2>
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
        <h2 className="tf-setup-label">{t.difficulty}</h2>
        <div className="tf-tier-grid">
          {TIERS.map((ti) => (
            <button
              key={ti.key}
              className={`tf-tier-card${tier === ti.key ? ' is-active' : ''}`}
              onClick={() => setTier(ti.key)}
            >
              <span className="tf-tier-emoji">{TIER_EMOJI[ti.key]}</span>
              <span className="tf-tier-name">{tierLabels[ti.key]}</span>
              <span className="tf-tier-desc">{tierDescs[ti.key]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="tf-setup-section">
        <h2 className="tf-setup-label">{t.consonants}</h2>
        <div className="tf-consonant-grid">
          {CONSONANT_GROUPS.map((g) => {
            const active = groups.includes(g.key)
            return (
              <button
                key={g.key}
                className={`tf-consonant-chip${active ? ' is-active' : ''}`}
                onClick={() => setGroups(toggle(groups, g.key))}
              >
                <span className="tf-consonant-name">{groupLabels[g.key]}</span>
                <span className="tf-consonant-initials">{g.initials}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="tf-setup-section">
        <h2 className="tf-setup-label">{t.tones}</h2>
        <div className="tf-tone-chips">
          {TONES.map((to) => {
            const active = tones.includes(to.tone)
            return (
              <button
                key={to.tone}
                className={`tf-tone-chip${active ? ' is-active' : ''}`}
                onClick={() => setTones(toggle(tones, to.tone))}
                disabled={active && tones.length <= 1}
                style={{ '--tone': `var(--tone-${to.tone})` } as React.CSSProperties}
              >
                <span className="tf-tone-chip-mark">{to.mark}</span>
                <span className="tf-tone-chip-name">{toneNames[to.tone]}</span>
                <span className="tf-tone-chip-desc">{toneFulls[to.tone]}</span>
                <span className="tf-tone-chip-example">{to.char}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="tf-start-sticky">
        <button className="tf-start-btn" onClick={handleStart}>
          {t.startGame}
        </button>
      </div>
    </div>
  )
}
