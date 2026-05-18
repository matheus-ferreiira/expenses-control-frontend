import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'
import type { ApiResponse } from '@/types/api'

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false,
})

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      router.push({ name: 'login' }).catch(() => {})
    }
    return Promise.reject(error)
  },
)

export { client }

export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data
}

export function unwrapPaginated<T>(
  response: AxiosResponse<ApiResponse<T[]>>,
): { data: T[]; meta: import('@/types/api').PaginationMeta } {
  return {
    data: response.data.data,
    meta: response.data.meta!,
  }
}
