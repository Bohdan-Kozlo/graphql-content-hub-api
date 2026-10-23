import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const THEME_STORAGE_KEY = 'content-hub-theme'

function readSavedTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [savedTheme, setSavedTheme] = useState<Theme | null>(readSavedTheme)
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme)
  const theme = savedTheme ?? systemTheme
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const update = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? 'dark' : 'light')
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function chooseTheme() {
    setSavedTheme(nextTheme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // Keep the choice in memory when storage is unavailable.
    }
  }

  return (
    <button
      type="button"
      onClick={chooseTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      className="shrink-0 rounded-full border border-hub-line px-4 py-2 text-sm font-semibold text-hub-ink hover:bg-hub-surface"
    >
      {nextTheme === 'dark' ? 'Dark theme' : 'Light theme'}
    </button>
  )
}
