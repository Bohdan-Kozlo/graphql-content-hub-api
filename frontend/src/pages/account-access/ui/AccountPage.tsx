import { useSyncExternalStore } from 'react'
import { Link, Navigate } from 'react-router'
import { getAccount, subscribeSession } from '@/entities/account'
import { AccountForm } from './AccountForm'

export default function AccountPage({ mode }: { mode: 'login' | 'signup' }) {
  const account = useSyncExternalStore(subscribeSession, getAccount)
  if (account) return <Navigate to="/account" replace />

  const signingUp = mode === 'signup'
  return (
    <section className="mx-auto max-w-md px-5 py-16 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.22em] text-hub-muted uppercase">
        Your account
      </p>
      <h1 className="mt-3 font-hub-display text-4xl font-semibold">
        {signingUp ? 'Join Content Hub' : 'Welcome back'}
      </h1>
      <p className="mt-3 text-hub-muted">
        {signingUp
          ? 'Create an account to take part in the conversation.'
          : 'Sign in to continue reading with your account.'}
      </p>
      <AccountForm mode={mode} />
      {!signingUp && (
        <p className="mt-4 text-right text-sm">
          <Link to="/forgot-password" className="font-semibold text-hub-accent underline">
            Forgot password?
          </Link>
        </p>
      )}
      <p className="mt-7 text-center text-sm text-hub-muted">
        {signingUp ? 'Already have an account?' : 'New here?'}{' '}
        <Link
          to={signingUp ? '/login' : '/signup'}
          className="font-semibold text-hub-accent underline"
        >
          {signingUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </section>
  )
}
