import type { AxiosError, Method } from 'axios'
import type { ApiError, BackendErrorDetail, RequestConfig } from './api.types'
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
  try {
    const response = await api.request<T>({
      method,
      url,
      data,
      ...config,
    })
    return response.data
  }
  catch (error) {
    const normalizedError = normalizeError(error as AxiosError)
    throw normalizedError
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

  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>('DELETE', url, config)
  },
}
