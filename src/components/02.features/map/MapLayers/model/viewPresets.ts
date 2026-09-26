export type ViewPresetId = 'beautiful' | 'balanced' | 'light'

/** Что включает пресет: эффекты, которые заметно нагружают телефон. */
export interface ViewEffects {
  buildings: boolean
  trees: boolean
  water: boolean
}

export interface ViewPreset {
  id: ViewPresetId
  label: string
  hint: string
  effects: ViewEffects
}

export const VIEW_PRESETS: ViewPreset[] = [
  {
    id: 'beautiful',
    label: 'Красиво',
    hint: '3D-дома с тенями, деревья, живая вода',
    effects: { buildings: true, trees: true, water: true },
  },
  {
    id: 'balanced',
    label: 'Баланс',
    hint: '3D-дома с тенями, без деревьев и анимации воды',
    effects: { buildings: true, trees: false, water: false },
  },
  {
    id: 'light',
    label: 'Экономно',
    hint: 'Плоская карта — быстрее и бережёт батарею',
    effects: { buildings: false, trees: false, water: false },
  },
]

/** Какой пресет сейчас выбран; null — настройки поменяли вручную. */
export function matchPreset(effects: ViewEffects): ViewPresetId | null {
  return VIEW_PRESETS.find(({ effects: preset }) =>
    preset.buildings === effects.buildings && preset.trees === effects.trees && preset.water === effects.water,
  )?.id ?? null
}
