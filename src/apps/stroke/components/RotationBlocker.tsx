import { useEffect, useState } from 'react'

const LANDSCAPE_QUERY = '(orientation: landscape) and (max-width: 1399px)'

export function RotationBlocker({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(LANDSCAPE_QUERY)
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setBlocked(e.matches)
    handler(mql)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return (
    <div className={`stroke-root${blocked ? ' is-landscape-blocked' : ''}`}>
      {children}
      {blocked && (
        <div className="stroke-landscape-overlay" role="alert">
          <div className="stroke-landscape-dialog">
            <svg className="stroke-rotate-icon" viewBox="0 0 48 48" width="64" height="64" fill="none">
              <rect x="8" y="4" width="32" height="40" rx="4" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="24" cy="36" r="2" fill="currentColor" />
              <path d="M14 12h20v18H14z" fill="currentColor" opacity="0.12" />
              <path d="M34 24l-5 5m5-5l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2>Rotate to Portrait</h2>
            <p>This app works best in portrait orientation. Please turn your device.</p>
          </div>
        </div>
      )}
    </div>
  )
}
