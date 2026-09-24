import type { AxiosError, Method } from 'axios'
import type { ApiError, BackendErrorDetail, RequestConfig } from './api.types'
import axios from 'axios'
import { useIsOnline } from '@/components/00.shared/composables/useNetworkWatch'
import { cacheKey, isCacheable, readCache, writeCache } from './cache'
import { api } from './http'

function isBackendError(data: any): data is BackendErrorDetail {
  return data && typeof data.message === 'string'
}

function normalizeError(error: AxiosError): ApiError {
  const apiError: ApiError = {
    message: 'Произошла неизвестная ошибка',
    status: error.response?.status,
    config: error.config as RequestConfig,
    raw: error,
  }

  if (error.response) {
    const errorData = error.response.data
    apiError.details = errorData
    if (isBackendError(errorData)) {
      apiError.message = errorData.message
    }
    else {
      apiError.message = error.message
    }
  }
  else if (error.request) {
    apiError.message = 'Сервер не отвечает. Проверьте подключение к сети.'
  }
  else {
    apiError.message = error.message
  }

  return apiError
}

async function request<T>(
  method: Method,
  url: string,
  config: RequestConfig = {},
  data?: any,
): Promise<T> {
  const cacheable = method === 'GET' && isCacheable(url, config)
  const key = cacheable ? cacheKey(url, config) : ''

  if (cacheable && !useIsOnline().value) {
    const cached = await readCache<T>(key)
    if (cached !== undefined)
      return cached
  }

  try {
    const response = await api.request<T>({
      method,
      url,
      data,
      ...config,
    })
    if (cacheable)
      writeCache(key, response.data)
    return response.data
  }
  catch (error) {
    const axiosError = error as AxiosError
    if (cacheable && !axiosError.response && !axios.isCancel(error)) {
      const cached = await readCache<T>(key)
      if (cached !== undefined)
        return cached
    }
    throw normalizeError(axiosError)
  }
}

export const apiService = {
  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>('GET', url, config)
  },

  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return request<T>('POST', url, config, data)
  },

  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return request<T>('PUT', url, config, data)
  },

  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return request<T>('PATCH', url, config, data)
  },

  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>('DELETE', url, config)
  },
}
