import AppCard from '../components/AppCard.tsx'
import './Home.css'

interface App {
  slug: string
  name: string
  description: string
  emoji: string
  group: string
}

interface GroupDef {
  key: string
  name: string
  description: string
  emoji: string
}

const GROUPS: GroupDef[] = [
  {
    key: 'chinese',
    name: 'Chinese Learning',
    description: 'Games and tools for learning Mandarin Chinese.',
    emoji: '🀄',
  },
  {
    key: 'tools',
    name: 'Tools & Demos',
    description: 'Reference implementations and utility apps.',
    emoji: '🛠️',
  },
]

const APPS: App[] = [
  {
    slug: 'toneforge',
    name: 'ToneForge',
    description: 'Master the five Mandarin tones through interactive drills and exercises.',
    emoji: '🎵',
    group: 'chinese',
  },
  {
    slug: 'counter',
    name: 'Counter',
    description: 'A stateful counter with increment, decrement and reset.',
    emoji: '🔢',
    group: 'tools',
  },
  {
    slug: 'markdown',
    name: 'Markdown Preview',
    description: 'A split-pane editor that renders Markdown in real-time.',
    emoji: '📝',
    group: 'tools',
  },
]

export default function Home() {
  return (
    <section className="home">
      <h1 className="home-title">Dashboard</h1>
      <p className="home-subtitle">
        A collection of small apps and learning tools, each lazy-loaded on demand.
      </p>

      {GROUPS.map((group) => {
        const apps = APPS.filter((a) => a.group === group.key)
        return (
          <section key={group.key} className="home-group">
            <div className="home-group-header">
              <span className="home-group-emoji">{group.emoji}</span>
              <div>
                <h2 className="home-group-name">{group.name}</h2>
                <p className="home-group-desc">{group.description}</p>
              </div>
            </div>

            {apps.length > 0 ? (
              <ul className="app-grid">
                {apps.map((app) => (
                  <li key={app.slug}>
                    <AppCard {...app} href={`/apps/${app.slug}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="home-group-empty">
                Nothing here yet — check back soon.
              </p>
            )}
          </section>
        )
      })}
    </section>
  )
}
