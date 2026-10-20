import { lazy, Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Route, Routes } from 'react-router'

const PublicContentPage = lazy(
  () => import('./features/content/PublicContentPage'),
)
const PublicCatalogPage = lazy(
  () => import('./features/catalog/PublicCatalogPage'),
)

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'content-hub-theme'

function readSavedTheme(): Theme | null {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null
  } catch {
    return null
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-hub-page text-hub-ink">
      <header className="border-b border-hub-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            to="/"
            className="font-hub-display text-2xl font-semibold tracking-tight text-hub-accent"
            aria-label="Content Hub home"
          >
            Content Hub<span className="text-hub-peach">.</span>
          </Link>
          <span className="hidden text-xs font-semibold tracking-[0.22em] text-hub-muted uppercase md:inline">
            Stories worth sharing
          </span>
          <ThemeToggle />
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t border-hub-line px-5 py-8 text-center text-sm text-hub-muted">
        Content Hub · A place for ideas, stories, and perspectives
      </footer>
    </div>
  )
}

function ThemeToggle() {
  const [savedTheme, setSavedTheme] = useState<Theme | null>(readSavedTheme)
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme)
  const theme = savedTheme ?? systemTheme
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', updateSystemTheme)
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function chooseTheme(next: Theme) {
    setSavedTheme(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Keep the selected theme active for this session when storage is unavailable.
    }
  }

  return (
    <button
      type="button"
      onClick={() => chooseTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} theme`}
      className="shrink-0 rounded-full border border-hub-line px-4 py-2 text-sm font-semibold text-hub-ink hover:bg-hub-surface"
    >
      {nextTheme === 'dark' ? 'Dark theme' : 'Light theme'}
    </button>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <h1 className="font-hub-display text-4xl">Page not found</h1>
      <Link to="/" className="mt-6 inline-block text-hub-accent underline">
        Go home
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <Shell>
      <Suspense
        fallback={
          <div
            className="mx-auto max-w-6xl px-5 py-24 text-hub-muted"
            role="status"
          >
            Loading page…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<PublicCatalogPage />} />
          <Route path="/content/:id" element={<PublicContentPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Shell>
  )
}
