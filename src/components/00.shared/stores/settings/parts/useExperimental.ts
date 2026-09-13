import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'

export type MarkMenuStyle = 'off' | 'popover' | 'orbit' | 'bar' | 'segment'

export type SplashStyle = 'off' | 'shield' | 'spin'

const MARK_MENU_STYLE_COOKIE = 'exp_mark_menu_style'
const VALID: MarkMenuStyle[] = ['off', 'popover', 'orbit', 'bar', 'segment']

const SPLASH_STYLE_COOKIE = 'exp_splash_style'
const SPLASH_VALID: SplashStyle[] = ['off', 'shield', 'spin']

function readStyle(): MarkMenuStyle {
  const saved = getCookie(MARK_MENU_STYLE_COOKIE) as MarkMenuStyle
  return VALID.includes(saved) ? saved : 'popover'
}

function readSplashStyle(): SplashStyle {
  const saved = getCookie(SPLASH_STYLE_COOKIE) as SplashStyle
  return SPLASH_VALID.includes(saved) ? saved : 'shield'
}

export function useExperimental() {
  const markMenuStyle = ref<MarkMenuStyle>(readStyle())

  const splashStyle = ref<SplashStyle>(readSplashStyle())

  function setMarkMenuStyle(style: MarkMenuStyle) {
    markMenuStyle.value = style
  }

  function setSplashStyle(style: SplashStyle) {
    splashStyle.value = style
  }

  watch(markMenuStyle, (value) => {
    setCookie(MARK_MENU_STYLE_COOKIE, value, 365)
  })

  watch(splashStyle, (value) => {
    setCookie(SPLASH_STYLE_COOKIE, value, 365)
  })

  return {
    markMenuStyle,
    setMarkMenuStyle,
    splashStyle,
    setSplashStyle,
  }
}
