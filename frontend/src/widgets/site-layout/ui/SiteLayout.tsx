import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { getAccount, subscribeSession } from '@/entities/account'
import { SignOutButton } from './SignOutButton'
import { ThemeToggle } from './ThemeToggle'

export function SiteLayout({ children }: { children: ReactNode }) {
  const account = useSyncExternalStore(subscribeSession, getAccount)
  const location = useLocation()
  const returnTo = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth/google/complete',
  ].includes(location.pathname)
    ? '/account'
    : `${location.pathname}${location.search}${location.hash}`

  return (
    <div className="min-h-screen bg-hub-page text-hub-ink">
      <header className="border-b border-hub-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
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
          <nav
            aria-label="Account"
            className="flex flex-wrap items-center gap-3 text-sm font-semibold"
          >
            {account ? (
              <>
                {account.roles.some((role) => role === 'EDITOR' || role === 'ADMIN') && (
                  <Link to="/editor" className="text-hub-accent">
                    Editor
                  </Link>
                )}
                <Link to="/following" className="text-hub-accent">
                  Following
                </Link>
                <Link to="/saved" className="text-hub-accent">
                  Saved
                </Link>
                <Link to="/history" className="text-hub-accent">
                  History
                </Link>
                <Link to="/account" className="text-hub-accent">
                  {account.username}
                </Link>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link to="/login" state={{ from: returnTo }} className="text-hub-accent">
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  state={{ from: returnTo }}
                  className="hidden text-hub-muted hover:text-hub-ink sm:inline"
                >
                  Join
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t border-hub-line px-5 py-8 text-center text-sm text-hub-muted">
        Content Hub · A place for ideas, stories, and perspectives
      </footer>
    </div>
  )
}
