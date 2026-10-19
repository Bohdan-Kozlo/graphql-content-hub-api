import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Link, Route, Routes } from 'react-router'

const PublicContentPage = lazy(
  () => import('./features/content/PublicContentPage'),
)

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
          <span className="text-xs font-semibold tracking-[0.22em] text-hub-muted uppercase">
            Stories worth sharing
          </span>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t border-hub-line px-5 py-8 text-center text-sm text-hub-muted">
        Content Hub · A place for ideas, stories, and perspectives
      </footer>
    </div>
  )
}

function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <p className="mb-5 text-xs font-bold tracking-[0.25em] text-hub-accent uppercase">
        Welcome to Content Hub
      </p>
      <h1 className="max-w-2xl font-hub-display text-5xl font-semibold tracking-tight sm:text-7xl">
        Ideas for curious minds.
      </h1>
      <p className="mt-7 max-w-xl text-lg leading-8 text-hub-muted">
        The public catalog is being prepared. Published stories are available at
        their direct links.
      </p>
    </div>
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
          <Route path="/" element={<Home />} />
          <Route path="/content/:id" element={<PublicContentPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Shell>
  )
}
