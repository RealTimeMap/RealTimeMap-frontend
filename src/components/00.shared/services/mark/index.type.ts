import type { MapPoint } from '@/types/shared/map'

interface Geometry {
  type: 'Point'
  coordinates: MapPoint
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

export interface MarkCategory {
  id: number
  categoryName: string
  color: string
  icon: string
}

interface Author {
  id: number
  username: string
  avatar: string
  tag: string
}

export interface MyMarkPayload {
  userid: number
  page: number
  pageSize: number
}

export interface MyMarkResponse {
  items: Mark[]
  page: number
  pageSize: number
  totalPages: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

export interface Mark {
  id: number
  markName: string
  geom: Geometry
  photos: string[]
}

export interface MarkAddPayload extends Omit<
  Mark,
  'id' | 'ownerId' | 'category' | 'geom' | 'photos'
> {
  additionalInfo: string
  startAt: string
  endAt: string
  categoryId: number
  longitude: number
  latitude: number
  photo?: string[]
}

export interface Cluster {
  center: Geometry
  count: number
}

export interface MarkFull extends Mark {
  additionalInfo?: string
  category: MarkCategory
  owner: Author
  date: {
    startAt: string
    endAt: string
    progressPercent: number
    daysPassed: number
    daysLeft: number
  }
  meta: {
    status: string
    markType: 'user'
  }
}

export interface MarkCreateResponse {
  allowedCategories: MarkCategory[]
  // allowedDuration: number[]
}

export interface MarkComment {
  id: number
  content: string
  author: Author
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
  entityId: number
  entity: 'mark'
  parentId?: number | null
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
export type MarkCommentResponse = PaginatedResponse<MarkComment>
