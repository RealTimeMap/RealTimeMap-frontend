import type { LngLat } from '@yandex/ymaps3-types'
import type { User } from '@/utils/user/index.type'

export interface MarkAddResponse {
  additional_info?: string
  photo?: string[]
  id: number
  mark_name: string
  owner_id: number
  geom: {
    bbox?: number[]
    type: 'Point'
    coordinates: number[]
  }
  end_at: string
  is_ended: boolean
  category: {
    category_name: string
    color: string
    id: number
    icon: string
  }
}

export interface MarkAddPayload {
  additional_info?: string
  photo?: string[]
  latitude: number
  longitude: number
  mark_name: string
  start_at?: string
  duration?: 12 | 24 | 36 | 48
  category_id: number
}

export interface Mark {
  id: number
  mark_name: string
  start_at: string
  end_at: string
  is_ended: boolean
  duration: number
  owner_id: number
  additional_info: string
  geom: {
    type: string
    coordinates: LngLat
  }
  photo: string[]
  category: {
    id: number
    category_name: string
    color: string
    icon: string
  }
}

export interface MarkFull extends Mark {
  owner: User
}
