import { z } from 'zod'

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Use at least two characters.')
    .max(50, 'Use at most 50 characters.'),
  bio: z.string().max(500, 'Use at most 500 characters.'),
  avatarUrl: z
    .string()
    .trim()
    .max(2048, 'Use at most 2048 characters.')
    .refine((value) => {
      if (!value) return true
      try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        return false
      }
    }, 'Enter an absolute HTTP(S) URL.'),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
