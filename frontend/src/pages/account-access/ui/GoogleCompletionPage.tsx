import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { getAccount, refreshAccessToken } from '@/entities/account'

export function GoogleCompletionPage() {
  const [search] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  useEffect(() => {
    let active = true
    void refreshAccessToken().then((token) => {
      if (active) setStatus(token ? 'success' : 'failed')
    })
    return () => {
      active = false
    }
  }, [])

  if (status === 'failed') return <Navigate to="/login?google=failed" replace />
  if (status === 'success') {
    const requested = search.get('returnTo')
    const safe =
      requested?.startsWith('/') &&
      !requested.startsWith('//') &&
      !requested.includes('\\')
        ? requested
        : '/account'
    return <Navigate to={getAccount() ? safe : '/login?google=failed'} replace />
  }
  return (
    <p role="status" className="mx-auto max-w-6xl px-5 py-24">
      Completing Google sign-in…
    </p>
  )
}
