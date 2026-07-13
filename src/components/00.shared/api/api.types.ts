import type { AxiosError, AxiosRequestConfig } from 'axios'

export interface BackendErrorDetail {
  message: string
  [key: string]: any
}

export interface ApiError {
  message: string
  status?: number | undefined
  details?: BackendErrorDetail | any
  config?: RequestConfig
  raw: AxiosError
}

export type ErrorNotificationStrategy = 'none' | 'toast' | 'custom'

export interface NotificationOptions {
  strategy: ErrorNotificationStrategy
  message?: string
}

export interface RequestConfig extends AxiosRequestConfig {
  suppressErrorNotify?: NotificationOptions
}
