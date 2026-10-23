import { z } from 'zod'

const credentials = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export type AccountFormValues = z.infer<typeof credentials> & { username?: string }

export function accountSchema(mode: 'login' | 'signup') {
  return credentials
    .extend({ username: z.string().optional() })
    .superRefine((values, context) => {
      if (mode !== 'signup') return
      if (!values.username || values.username.trim().length < 2) {
        context.addIssue({
          code: 'custom',
          path: ['username'],
          message: 'Use at least two characters.',
        })
      }
      if (values.password.length < 8) {
        context.addIssue({
          code: 'custom',
          path: ['password'],
          message: 'Use at least eight characters.',
        })
      }
    })
}
