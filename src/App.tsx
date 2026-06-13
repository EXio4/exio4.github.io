import { lazy, Suspense } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import ShellLoading from './components/ShellLoading.tsx'

// Lazy-load each micro-frontend app so it's only fetched when navigated to.
const CounterApp = lazy(() => import('./apps/counter'))
const MarkdownApp = lazy(() => import('./apps/markdown'))
const ToneForgeApp = lazy(() => import('./apps/toneforge'))
const StrokeApp = lazy(() => import('./apps/stroke'))

import Home from './pages/Home.tsx'

const APP_LABELS: Record<string, string> = {
  '/apps/toneforge': 'ToneForge',
  '/apps/stroke': 'Stroke',
  '/apps/counter': 'Counter',
  '/apps/markdown': 'Markdown',
}

function AppShell() {
  const { pathname } = useLocation()
  const inApp = pathname !== '/'
  const appLabel = APP_LABELS[pathname]

  return (
    <div className="shell">
      <header className="shell-header">
        <Link to="/" className="shell-logo">
          exio4<span className="shell-logo-dot">.</span>
        </Link>
        {inApp && appLabel && (
          <span className="shell-breadcrumb">
            <span className="shell-breadcrumb-sep">/</span>
            <Link to={pathname} className="shell-breadcrumb-link">
              {appLabel}
            </Link>
          </span>
        )}
      </header>

      <main className="shell-content">
        <Suspense fallback={<ShellLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/apps/counter/*" element={<CounterApp />} />
            <Route path="/apps/markdown/*" element={<MarkdownApp />} />
            <Route path="/apps/toneforge/*" element={<ToneForgeApp />} />
            <Route path="/apps/stroke/*" element={<StrokeApp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="shell-footer">
        <a href="https://github.com/EXio4" target="_blank" rel="noreferrer">
          github.com/EXio4
        </a>
      </footer>
    </div>
  )
}

function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">Go home</Link>
    </div>
  )
}

export default AppShell
