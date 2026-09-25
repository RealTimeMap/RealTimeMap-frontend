import type { ComputedRef, InjectionKey } from 'vue'
import type { ThemeBase } from './theme'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { themeBase } from './theme'

/**
 * Светлый или тёмный стиль у карты прямо сейчас. Не то же, что тема приложения: у шара и ночью
 * карта тёмная и в светлой теме. Дома, деревья, небо и вода красятся под стиль карты, а не под тему.
 */
export const MAP_STYLE_BASE: InjectionKey<ComputedRef<ThemeBase>> = Symbol('mapStyleBase')

export function useMapStyleBase(): ComputedRef<ThemeBase> {
  const provided = inject(MAP_STYLE_BASE, null)
  if (provided)
    return provided
  const { resolvedTheme } = storeToRefs(useSettingsStore())
  return computed(() => themeBase(resolvedTheme.value))
}
