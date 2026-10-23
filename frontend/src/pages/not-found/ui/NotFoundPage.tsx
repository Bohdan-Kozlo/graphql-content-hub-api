import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <h1 className="font-hub-display text-4xl">Page not found</h1>
      <Link to="/" className="mt-6 inline-block text-hub-accent underline">
        Go home
      </Link>
    </div>
  )
}
