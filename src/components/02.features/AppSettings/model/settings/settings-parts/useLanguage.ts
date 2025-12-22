import type { MessageLanguages } from '@/providers/withI18n'
import { useI18n } from 'vue-i18n'
import { getCookie, setCookie } from '@/shared/lib/cookie'
import messages from '@/shared/lib/i18n'

const LANG_COOKIE_NAME = 'app_lang'

function getInitialLanguage(
  supportedLangs: readonly MessageLanguages[],
  defaultLang: MessageLanguages = 'en',
): MessageLanguages {
  const savedLang = getCookie(LANG_COOKIE_NAME)
  if (savedLang && supportedLangs.includes(savedLang as MessageLanguages)) {
    return savedLang as MessageLanguages
  }

  const browserLang = navigator.language.split('-')[0]
  if (browserLang && supportedLangs.includes(browserLang as MessageLanguages)) {
    return browserLang as MessageLanguages
  }

  return defaultLang
}

export function useLanguage() {
  const { locale } = useI18n()

  const availableLanguages = computed(() => Object.keys(messages) as MessageLanguages[])
  const initialLang = getInitialLanguage(availableLanguages.value)
  const currentLang = ref<MessageLanguages>(initialLang)

  function setLanguage(lang: MessageLanguages) {
    if (availableLanguages.value.includes(lang)) {
      currentLang.value = lang
    }
    else {
      console.warn(`[Settings Store] Attempted to set unsupported language: ${lang}`)
    }
  }

  watch(currentLang, (newLang) => {
    setCookie(LANG_COOKIE_NAME, newLang, 365)

    locale.value = newLang
  }, { immediate: true })

  return {
    currentLang,
    availableLanguages,
    setLanguage,
  }
}
