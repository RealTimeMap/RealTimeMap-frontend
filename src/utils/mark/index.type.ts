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

export interface MarkCategory {
  id: number
  category_name: string
  color: string
  icon: string
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
  category: MarkCategory
}

export interface MarkFull extends Mark {
  owner: User
}

export interface MarkCreateResponse {
  allowed_category: MarkCategory[]
  allowed_duration: number[]
}

export interface MarkComment {
  content: string
  id: number
  owner: User
  created_at: string
  replies: any[]
  stats: {
    likes_count: number
    dislikes_count: number
    total_replies: number
  }
}

export interface MarkCommentPayload {
  content: string
  parent_id?: number | null
}

export interface MarkCommentResponse {
  items: MarkComment[]
  total: number
  page: number
  page_size: number
}
