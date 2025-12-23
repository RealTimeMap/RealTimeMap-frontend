import type messages from '@/shared/lib/i18n'
import type en from '@/shared/lib/i18n/en-US'
import 'vue-i18n'

type MessageSchema = typeof en
type MessageLanguages = keyof typeof messages

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema { }

  export interface ComposerCustom {
    message: MessageSchema
    locale: MessageLanguages
  }

  export interface VueI18nCustom {
    message: MessageSchema
    locale: MessageLanguages
  }
}
