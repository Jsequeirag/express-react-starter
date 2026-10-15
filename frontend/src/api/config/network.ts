import axios from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from 'axios'
import { useAuthStore } from '@/store/useAuthStore'
import type { ApiError } from '@/lib/utils/error'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

const baseURL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

const client: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

client.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data

    if (
      body !== null &&
      typeof body === 'object' &&
      'success' in body &&
      'data' in body
    ) {
      const apiResponse = body as ApiResponse<unknown>

      if (apiResponse.success) {
        return apiResponse.data
      }
    }

    return body
  },
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    return Promise.reject(data ?? error)
  },
)


export const request = async <T = unknown>(
  options: AxiosRequestConfig,
): Promise<T> => {
  return (await client(options)) as T
}
