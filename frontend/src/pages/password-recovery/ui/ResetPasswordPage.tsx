import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@apollo/client/react'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { Link, useSearchParams } from 'react-router'
import { refreshAccessToken } from '@/entities/account'
import { ResetPasswordDocument } from '@/shared/api/gql/graphql'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'editing' | 'invalid' | 'success'>(
    token ? 'editing' : 'invalid',
  )
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [resetPassword, { loading }] = useMutation(ResetPasswordDocument)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Use at least eight characters.')
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    try {
      await resetPassword({ variables: { token: token!, password } })
      await refreshAccessToken()
      setStatus('success')
    } catch (cause) {
      if (
        CombinedGraphQLErrors.is(cause) &&
        cause.errors.some((item) => item.extensions?.code === 'INVALID_RESET_TOKEN')
      ) {
        setStatus('invalid')
      } else {
        setError('We could not reset your password. Please try again later.')
      }
    }
  }

  return (
    <section className="mx-auto max-w-md px-5 py-16 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.22em] text-hub-muted uppercase">
        Your account
      </p>
      <h1 className="mt-3 font-hub-display text-4xl font-semibold">Set a new password</h1>
      {status === 'invalid' && (
        <div className="mt-8 space-y-4">
          <p role="alert" className="text-hub-muted">
            This reset link is invalid or expired.
          </p>
          <Link to="/forgot-password" className="font-semibold text-hub-accent underline">
            Request a new link
          </Link>
        </div>
      )}
      {status === 'success' && (
        <div className="mt-8 space-y-4">
          <p role="status" className="text-hub-muted">
            Your password has been changed.
          </p>
          <Link to="/login" className="font-semibold text-hub-accent underline">
            Sign in
          </Link>
        </div>
      )}
      {status === 'editing' && (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <p className="text-hub-muted">
            Choose a new password of at least eight characters.
          </p>
          <div>
            <label htmlFor="new-password" className="block text-sm font-semibold">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3 text-hub-ink"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-semibold">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
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
            {loading ? 'Please wait…' : 'Reset password'}
          </button>
        </form>
      )}
    </section>
  )
}
