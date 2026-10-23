import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { getAccount, subscribeSession } from '@/entities/account'
import { SignOutButton } from './SignOutButton'
import { ThemeToggle } from './ThemeToggle'

export function SiteLayout({ children }: { children: ReactNode }) {
  const account = useSyncExternalStore(subscribeSession, getAccount)

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
          <nav
            aria-label="Account"
            className="flex items-center gap-3 text-sm font-semibold"
          >
            {account ? (
              <>
                <Link to="/account" className="text-hub-accent">
                  {account.username}
                </Link>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link to="/login" className="text-hub-accent">
                  Sign in
                </Link>
                <Link
                  to="/signup"
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
