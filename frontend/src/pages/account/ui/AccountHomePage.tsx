import { useSyncExternalStore } from 'react'
import { getAccount, subscribeSession } from '@/entities/account'

export function AccountHomePage() {
  const account = useSyncExternalStore(subscribeSession, getAccount)
  if (!account) return null

  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.22em] text-hub-muted uppercase">
        Your account
      </p>
      <h1 className="mt-3 font-hub-display text-4xl">Hello, {account.username}</h1>
      <p className="mt-4 text-hub-muted">Signed in as {account.email}</p>
    </section>
  )
}
