import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn, signUp } from '@/entities/account'
import { accountSchema } from '../model/account-schema'
import type { AccountFormValues } from '../model/account-schema'

function submitLabel(mode: 'login' | 'signup', isSubmitting: boolean) {
  if (isSubmitting) return 'Please wait…'
  return mode === 'signup' ? 'Create account' : 'Sign in'
}

export function AccountForm({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({ resolver: zodResolver(accountSchema(mode)) })

  async function submit(values: AccountFormValues) {
    setSubmitError('')
    try {
      if (mode === 'signup') {
        await signUp(values.email, values.username?.trim() ?? '', values.password)
      } else {
        await signIn(values.email, values.password)
      }
      const destination = (location.state as { from?: string } | null)?.from
      const safeDestination =
        destination?.startsWith('/') && !destination.startsWith('//')
          ? destination
          : '/account'
      navigate(safeDestination, { replace: true })
    } catch {
      setSubmitError(
        mode === 'login'
          ? 'Email or password is incorrect.'
          : 'Could not create your account. Check your details and try again.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5" noValidate>
      {mode === 'signup' && (
        <div>
          <label htmlFor="username" className="block text-sm font-semibold">
            Username
          </label>
          <input
            id="username"
            autoComplete="username"
            {...register('username')}
            className="mt-2 w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3 text-hub-ink"
          />
          {errors.username && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {errors.username.message}
            </p>
          )}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="mt-2 w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3 text-hub-ink"
        />
        {errors.email && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          {...register('password')}
          className="mt-2 w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3 text-hub-ink"
        />
        {errors.password && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>
      {submitError && (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      )}
      <button
        disabled={isSubmitting}
        className="w-full rounded-full bg-hub-accent px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {submitLabel(mode, isSubmitting)}
      </button>
    </form>
  )
}
