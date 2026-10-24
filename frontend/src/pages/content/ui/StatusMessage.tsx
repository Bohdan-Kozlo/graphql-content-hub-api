import { Link } from 'react-router'

type Props = {
  title: string
  message: string
}

export function StatusMessage({ title, message }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <p className="mb-4 text-xs font-bold tracking-[0.22em] text-hub-accent uppercase">
        Content Hub
      </p>
      <h1 className="font-hub-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-xl text-lg text-hub-muted">{message}</p>
      <Link
        to="/"
        className="mt-8 inline-block font-semibold text-hub-accent underline underline-offset-4"
      >
        Back to home
      </Link>
    </div>
  )
}
