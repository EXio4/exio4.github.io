import { Link } from 'react-router-dom'
import './AppCard.css'

interface AppCardProps {
  href: string
  name: string
  description: string
  emoji: string
}

export default function AppCard({ href, name, description, emoji }: AppCardProps) {
  return (
    <Link to={href} className="app-card">
      <span className="app-card-emoji" role="img" aria-label={name}>
        {emoji}
      </span>
      <div>
        <h2 className="app-card-name">{name}</h2>
        <p className="app-card-desc">{description}</p>
      </div>
    </Link>
  )
}
