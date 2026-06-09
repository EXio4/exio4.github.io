import AppCard from '../components/AppCard.tsx'
import './Home.css'

const APPS = [
  {
    slug: 'counter',
    name: 'Counter',
    description: 'A stateful counter with increment, decrement and reset. Demonstrates local React state management.',
    emoji: '🔢',
  },
  {
    slug: 'markdown',
    name: 'Markdown Preview',
    description: 'A split-pane editor that renders Markdown in real-time using the marked library.',
    emoji: '📝',
  },
]

export default function Home() {
  return (
    <section className="home">
      <h1 className="home-title">Apps</h1>
      <p className="home-subtitle">
        A collection of small reference applications, each lazy-loaded on demand.
      </p>
      <ul className="app-grid">
        {APPS.map((app) => (
          <li key={app.slug}>
            <AppCard {...app} href={`/apps/${app.slug}`} />
          </li>
        ))}
      </ul>
    </section>
  )
}
