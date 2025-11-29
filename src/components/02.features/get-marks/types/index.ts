import type { LngLat } from '@yandex/ymaps3-types'
import type { User } from '@/utils/user/index.type'

export interface Mark {
  id: string
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
