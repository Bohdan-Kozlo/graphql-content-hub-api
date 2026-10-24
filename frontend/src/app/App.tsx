import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { client } from './api/apollo-client'
import {
  getAccount,
  refreshAccessToken,
  setSessionCacheReset,
  subscribeSession,
} from '@/entities/account'
import { SiteLayout } from '@/widgets/site-layout'

const PublicCatalogPage = lazy(() =>
  import('@/pages/catalog').then(({ PublicCatalogPage }) => ({
    default: PublicCatalogPage,
  })),
)
const PublicContentPage = lazy(() =>
  import('@/pages/content').then(({ PublicContentPage }) => ({
    default: PublicContentPage,
  })),
)
const AccountPage = lazy(() =>
  import('@/pages/account-access').then(({ AccountPage }) => ({ default: AccountPage })),
)
const GoogleCompletionPage = lazy(() =>
  import('@/pages/account-access').then(({ GoogleCompletionPage }) => ({
    default: GoogleCompletionPage,
  })),
)
const AccountHomePage = lazy(() =>
  import('@/pages/account').then(({ AccountHomePage }) => ({ default: AccountHomePage })),
)
const SavedPage = lazy(() =>
  import('@/pages/saved').then(({ SavedPage }) => ({ default: SavedPage })),
)
const FollowingPage = lazy(() =>
  import('@/pages/following').then(({ FollowingPage }) => ({ default: FollowingPage })),
)
const HistoryPage = lazy(() =>
  import('@/pages/history').then(({ HistoryPage }) => ({ default: HistoryPage })),
)
const PublicProfilePage = lazy(() =>
  import('@/pages/profile').then(({ PublicProfilePage }) => ({
    default: PublicProfilePage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/not-found').then(({ NotFoundPage }) => ({ default: NotFoundPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/pages/password-recovery').then(({ ForgotPasswordPage }) => ({
    default: ForgotPasswordPage,
  })),
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/password-recovery').then(({ ResetPasswordPage }) => ({
    default: ResetPasswordPage,
  })),
)

function ProtectedAccountRoute({
  ready,
  children,
}: {
  ready: boolean
  children: ReactNode
}) {
  const account = useSyncExternalStore(subscribeSession, getAccount)
  const location = useLocation()

  if (!ready) return <p role="status">Restoring session…</p>
  if (!account) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    )
  }
  return children
}

function AccountAccessRoute({
  ready,
  mode,
}: {
  ready: boolean
  mode: 'login' | 'signup'
}) {
  if (!ready) return <p role="status">Restoring session…</p>
  return <AccountPage mode={mode} />
}

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSessionCacheReset(() => client.clearStore())
    let active = true
    void refreshAccessToken().then(() => {
      if (active) setReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <SiteLayout>
      <Suspense
        fallback={
          <p role="status" className="mx-auto max-w-6xl px-5 py-24 text-hub-muted">
            Loading page…
          </p>
        }
      >
        <Routes>
          <Route path="/" element={<PublicCatalogPage />} />
          <Route path="/content/:id" element={<PublicContentPage />} />
          <Route path="/users/:id" element={<PublicProfilePage />} />
          <Route
            path="/login"
            element={<AccountAccessRoute ready={ready} mode="login" />}
          />
          <Route
            path="/signup"
            element={<AccountAccessRoute ready={ready} mode="signup" />}
          />
          <Route
            path="/account"
            element={
              <ProtectedAccountRoute ready={ready}>
                <AccountHomePage />
              </ProtectedAccountRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedAccountRoute ready={ready}>
                <SavedPage />
              </ProtectedAccountRoute>
            }
          />
          <Route
            path="/following"
            element={
              <ProtectedAccountRoute ready={ready}>
                <FollowingPage />
              </ProtectedAccountRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedAccountRoute ready={ready}>
                <HistoryPage />
              </ProtectedAccountRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/google/complete" element={<GoogleCompletionPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </SiteLayout>
  )
}
