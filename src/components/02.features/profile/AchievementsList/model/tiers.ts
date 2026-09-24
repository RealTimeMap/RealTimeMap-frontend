export interface Tier {
  key: string
  label: string
  color: string
}

const TIERS: { match: RegExp, tier: Tier }[] = [
  {
    match: /bronze|бронз/i,
    tier: {
      key: 'bronze',
      label: 'Бронза',
      color: '#cd7f32',
    },
  },
  {
    match: /silver|серебр/i,
    tier: {
      key: 'silver',
      label: 'Серебро',
      color: '#aab4bd',
    },
  },
  {
    match: /gold|золот/i,
    tier: {
      key: 'gold',
      label: 'Золото',
      color: '#e6b422',
    },
  },
  {
    match: /platin|платин/i,
    tier: {
      key: 'platinum',
      label: 'Платина',
      color: '#69c9d8',
    },
  },
  {
    match: /diamond|алмаз|бриллиант/i,
    tier: {
      key: 'diamond',
      label: 'Алмаз',
      color: '#6fa8ff',
    },
  },
]

export function tierOf(source?: { code?: string, title?: string } | null): Tier | null {
  if (!source)
    return null
  const hay = `${source.code ?? ''} ${source.title ?? ''}`
  return TIERS.find(t => t.match.test(hay))?.tier ?? null
}
