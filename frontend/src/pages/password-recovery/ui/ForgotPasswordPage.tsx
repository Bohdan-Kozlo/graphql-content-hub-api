import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { Link } from 'react-router'
import { RequestPasswordResetDocument } from '@/shared/api/gql/graphql'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [requestReset, { loading }] = useMutation(RequestPasswordResetDocument)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await requestReset({ variables: { email } })
      setSubmitted(true)
    } catch {
      setError('We could not process your request. Please try again later.')
    }
  }

  return (
    <section className="mx-auto max-w-md px-5 py-16 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.22em] text-hub-muted uppercase">
        Your account
      </p>
      <h1 className="mt-3 font-hub-display text-4xl font-semibold">
        Reset your password
      </h1>
      {submitted ? (
        <p role="status" className="mt-8 text-hub-muted">
          If an account exists for this email, we’ll send a reset link. Please check your
          inbox or try again later.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <p className="text-hub-muted">
            Enter your email and we’ll send a link to set a new password.
          </p>
          <div>
            <label htmlFor="recovery-email" className="block text-sm font-semibold">
              Email
            </label>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3 text-hub-ink"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            disabled={loading}
            className="w-full rounded-full bg-hub-accent px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Please wait…' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="mt-7 text-center text-sm">
        <Link to="/login" className="font-semibold text-hub-accent underline">
          Back to sign in
        </Link>
      </p>
    </section>
  )
}
