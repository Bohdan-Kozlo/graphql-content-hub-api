import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@apollo/client/react'
import { updateSessionHasPassword } from '@/entities/account'
import { SetFirstPasswordDocument } from '@/shared/api/gql/graphql'

export function SetFirstPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [setFirstPassword] = useMutation(SetFirstPasswordDocument)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8 || password !== confirmation) {
      setError('Use at least 8 characters and matching passwords.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await setFirstPassword({ variables: { password } })
      onSuccess()
      updateSessionHasPassword()
    } catch {
      setError('Could not set a password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-14 max-w-xl border-t border-hub-line pt-10">
      <h2 className="font-hub-display text-2xl font-semibold">Set a password</h2>
      <p className="mt-2 text-hub-muted">
        If you joined with Google, add a password to sign in with email too.
      </p>
      <form className="mt-6 space-y-5" onSubmit={(event) => void submit(event)}>
        <label htmlFor="first-password" className="block text-sm font-semibold">
          New password
        </label>
        <input
          id="first-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3"
        />
        <label htmlFor="confirm-first-password" className="block text-sm font-semibold">
          Confirm password
        </label>
        <input
          id="confirm-first-password"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3"
        />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-hub-accent px-7 py-3 font-semibold text-hub-page disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Set password'}
        </button>
      </form>
    </div>
  )
}
