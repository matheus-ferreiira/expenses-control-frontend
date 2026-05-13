import { client, unwrap } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { ApiResponse } from '@/types/api'
import type {
  User,
  LoginCredentials,
  RegisterPayload,
  AuthTokenResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types/auth'

export const authApi = {
  login: (credentials: LoginCredentials) =>
    client
      .post<ApiResponse<AuthTokenResponse>>(API_ENDPOINTS.AUTH.LOGIN, credentials)
      .then(unwrap),

  register: (payload: RegisterPayload) =>
    client
      .post<ApiResponse<AuthTokenResponse>>(API_ENDPOINTS.AUTH.REGISTER, payload)
      .then(unwrap),

  logout: () =>
    client.post<ApiResponse<null>>(API_ENDPOINTS.AUTH.LOGOUT).then(unwrap),

  me: () =>
    client.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.ME).then(unwrap),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    client
      .post<ApiResponse<null>>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload)
      .then(unwrap),

  resetPassword: (payload: ResetPasswordPayload) =>
    client
      .post<ApiResponse<null>>(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload)
      .then(unwrap),
}
