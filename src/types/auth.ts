export interface User {
  id: string
  name: string
  email: string
  email_verified_at: string | null
  avatar: string | null
  locale: string
  timezone: string
  created_at: string
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthTokenResponse {
  user: User
  token: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}
