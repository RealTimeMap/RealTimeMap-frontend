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
