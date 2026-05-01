import type { LngLat } from '@yandex/ymaps3-types'

export interface MarkAddResponse {
  additionalInfo?: string
  photo?: string[]
  id: number
  markName: string
  ownerId: number
  geom: {
    bbox?: number[]
    type: 'Point'
    coordinates: number[]
  }
  endAt: string
  isEnded: boolean
  category: {
    categoryName: string
    color: string
    id: number
    icon: string
  }
}

export interface MarkAddPayload {
  additionalInfo?: string
  photo?: string[]
  latitude: number
  longitude: number
  markName: string
  startAt?: string
  duration?: 12 | 24 | 36 | 48
  categoryId: number
}

export interface MarkCategory {
  id: number
  categoryName: string
  color: string
  icon: string
}

export interface Mark {
  id: number
  markName: string
  startAt: string
  endAt: string
  isEnded: boolean
  duration: number
  owner_id: number
  additionalInfo: string
  geom: {
    type: string
    coordinates: LngLat
  }
  photos: string[]
  category: MarkCategory
}

export interface Cluster {
  center: {
    type: 'Point'
    coordinates: LngLat
  }
  count: number
}

export interface ClusterResponse {
  cluster: Cluster[]
  success: boolean
}

export interface MarksResponse {
  marks: Mark[]
  success: boolean
}

export type MarksOrClusterResponse = MarksResponse | ClusterResponse

export interface MarkFull extends Mark {
  owner: {
    id: number
    username: string
    avatar: string
    tag: string
  }
}

export interface MarkCreateResponse {
  allowedCategories: MarkCategory[]
  allowedDuration: number[]
}

export interface MarkComment {
  id: number
  content: string
  author: {
    id: number
    username: string
    tag: string
    avatar: string
  }
  likes: number
  dislikes: number
  meta: {
    canReply: boolean
    haveReplies: boolean
    repliesCount: number
  }
}

export interface MarkCommentPayload {
  content: string
  parentId?: number | null
}

export interface MarkCommentResponse {
  items: MarkComment[]
  total: number
  page: number
  pageSize: number
}
