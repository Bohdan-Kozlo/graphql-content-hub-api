import { useState } from 'react'
import { useNavigate } from 'react-router'
import { signOut } from '@/entities/account'

export function SignOutButton() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleSignOut() {
    setBusy(true)
    setFailed(false)
    try {
      await signOut()
      navigate('/')
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={busy}
        className="text-hub-muted hover:text-hub-ink"
      >
        Sign out
      </button>
      {failed && (
        <span role="alert" className="text-red-600">
          Could not sign out. Please try again.
        </span>
      )}
    </>
  )
}
