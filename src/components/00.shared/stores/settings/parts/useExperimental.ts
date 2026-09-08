import { getCookie, setCookie } from '@/components/00.shared/lib/cookie'

export type MarkMenuStyle = 'off' | 'popover' | 'orbit' | 'bar' | 'segment'

const MARK_MENU_STYLE_COOKIE = 'exp_mark_menu_style'
const VALID: MarkMenuStyle[] = ['off', 'popover', 'orbit', 'bar', 'segment']

function readStyle(): MarkMenuStyle {
  const saved = getCookie(MARK_MENU_STYLE_COOKIE) as MarkMenuStyle
  return VALID.includes(saved) ? saved : 'popover'
}

export function useExperimental() {
  const markMenuStyle = ref<MarkMenuStyle>(readStyle())

  function setMarkMenuStyle(style: MarkMenuStyle) {
    markMenuStyle.value = style
  }

  watch(markMenuStyle, (value) => {
    setCookie(MARK_MENU_STYLE_COOKIE, value, 365)
  })

  return {
    markMenuStyle,
    setMarkMenuStyle,
  }
}
