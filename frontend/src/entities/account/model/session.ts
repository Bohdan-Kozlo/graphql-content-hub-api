import { print } from 'graphql'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import {
  LoginDocument,
  LogoutDocument,
  RefreshSessionDocument,
  SignupDocument,
} from '@/shared/api/gql/graphql'

type Account = {
  id: string
  email: string
  username: string
  roles: string[]
  hasPassword: boolean
}

let accessToken: string | null = null
let currentAccount: Account | null = null
let refreshPromise: Promise<string | null> | null = null
let resetCache: () => Promise<unknown> = async () => {}
const listeners = new Set<() => void>()

export function getAccessToken() {
  return accessToken
}

export function getAccount() {
  return currentAccount
}

export function updateSessionUsername(username: string) {
  if (currentAccount) publish(accessToken, { ...currentAccount, username })
}

export function updateSessionHasPassword() {
  if (currentAccount) publish(accessToken, { ...currentAccount, hasPassword: true })
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setSessionCacheReset(reset: () => Promise<unknown>) {
  resetCache = reset
}

function publish(token: string | null, account: Account | null) {
  accessToken = token
  currentAccount = account
  listeners.forEach((listener) => listener())
}

async function request<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables,
  token?: string,
): Promise<TResult> {
  const response = await fetch('/graphql', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query: print(document), variables }),
  })
  const result = await response.json()
  if (!response.ok || result.errors?.length) {
    throw new Error(result.errors?.[0]?.message ?? 'Please try again.')
  }
  return result.data as TResult
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const data = await request(RefreshSessionDocument)
        const token = data.refreshTokens.accessToken as string
        publish(token, data.refreshTokens.account)
        return token
      } catch {
        if (currentAccount) await resetCache().catch(() => undefined)
        publish(null, null)
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

export async function signIn(email: string, password: string) {
  const data = await request(LoginDocument, { data: { email, password } })
  const token = data.login.accessToken as string
  await resetCache()
  publish(token, data.login.account)
}

export async function signUp(email: string, username: string, password: string) {
  const data = await request(SignupDocument, { data: { email, username, password } })
  const token = data.signup.accessToken as string
  await resetCache()
  publish(token, data.signup.account)
}

export async function signOut() {
  if (accessToken) {
    try {
      await request(LogoutDocument, undefined, accessToken)
    } catch {
      const renewed = await refreshAccessToken()
      if (renewed) await request(LogoutDocument, undefined, renewed)
    }
  }
  publish(null, null)
  await resetCache()
}
