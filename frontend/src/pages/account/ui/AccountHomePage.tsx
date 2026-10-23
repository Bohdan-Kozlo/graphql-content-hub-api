import { useEffect, useState, useSyncExternalStore } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { getAccount, subscribeSession, updateSessionUsername } from '@/entities/account'
import { PublicProfileDocument, UpdateProfileDocument } from '@/shared/api/gql/graphql'
import { profileSchema } from '../model/profile-schema'
import type { ProfileFormValues } from '../model/profile-schema'

export function AccountHomePage() {
  const account = useSyncExternalStore(subscribeSession, getAccount)
  const { data, loading, error, refetch } = useQuery(PublicProfileDocument, {
    variables: { id: account?.id ?? '' },
    skip: !account,
  })
  const [updateProfile] = useMutation(UpdateProfileDocument)
  const [message, setMessage] = useState('')
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: account?.username ?? '', bio: '', avatarUrl: '' },
  })

  useEffect(() => {
    const profile = data?.publicProfile
    if (profile) {
      reset({
        username: profile.username,
        bio: profile.bio ?? '',
        avatarUrl: profile.avatarUrl ?? '',
      })
    }
  }, [data, reset])

  async function submit(values: ProfileFormValues) {
    setMessage('')
    try {
      const result = await updateProfile({ variables: { data: values } })
      const updated = result.data?.updateProfile
      if (!updated) throw new Error('Missing updated profile')
      updateSessionUsername(updated.username)
      reset({
        username: updated.username,
        bio: updated.bio ?? '',
        avatarUrl: updated.avatarUrl ?? '',
      })
      setMessage('Profile saved.')
    } catch {
      setMessage('Could not save your profile. Please try again.')
    }
  }
  if (!account) return null

  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.22em] text-hub-muted uppercase">
        Your account
      </p>
      <h1 className="mt-3 font-hub-display text-4xl">Hello, {account.username}</h1>
      <p className="mt-4 text-hub-muted">Signed in as {account.email}</p>
      <Link
        to={`/users/${encodeURIComponent(account.id)}`}
        className="mt-5 inline-block font-semibold text-hub-accent underline underline-offset-4"
      >
        View public profile
      </Link>
      <div className="mt-14 max-w-xl border-t border-hub-line pt-10">
        <h2 className="font-hub-display text-2xl font-semibold">Edit profile</h2>
        {loading && (
          <p role="status" className="mt-5 text-hub-muted">
            Loading profile…
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 text-hub-muted">
            Unable to load profile.{' '}
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-hub-accent underline"
            >
              Try again
            </button>
          </p>
        )}
        <form onSubmit={handleSubmit(submit)} noValidate className="mt-7 space-y-5">
          <div>
            <label htmlFor="profile-username" className="block text-sm font-semibold">
              Username
            </label>
            <input
              id="profile-username"
              autoComplete="username"
              maxLength={50}
              {...register('username')}
              className="mt-2 w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3"
            />
            {errors.username && (
              <p role="alert" className="mt-1 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="profile-avatar" className="block text-sm font-semibold">
              Avatar URL
            </label>
            <input
              id="profile-avatar"
              type="url"
              maxLength={2048}
              {...register('avatarUrl')}
              className="mt-2 w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3"
            />
            {errors.avatarUrl && (
              <p role="alert" className="mt-1 text-sm text-red-600">
                {errors.avatarUrl.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="profile-bio" className="block text-sm font-semibold">
              Biography
            </label>
            <textarea
              id="profile-bio"
              rows={5}
              maxLength={500}
              {...register('bio')}
              className="mt-2 w-full rounded-xl border border-hub-line bg-hub-surface px-4 py-3"
            />
            {errors.bio && (
              <p role="alert" className="mt-1 text-sm text-red-600">
                {errors.bio.message}
              </p>
            )}
          </div>
          {message && (
            <p role={message === 'Profile saved.' ? 'status' : 'alert'}>{message}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || loading || Boolean(error)}
            className="rounded-full bg-hub-accent px-7 py-3 font-semibold text-hub-page disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </section>
  )
}
