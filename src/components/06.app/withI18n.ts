import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import messages from '@/components/00.shared/lib/i18n'

export type MessageLanguages = keyof typeof messages
export type MessageSchema = typeof messages['en']

const i18n = createI18n<
  [MessageSchema],
  MessageLanguages
>({
  locale: 'en',
  fallbackLocale: 'en',
  legacy: false,
  messages,
})

export function withI18n(app: App) {
  app.use(i18n)
  return app
}

export { i18n }
