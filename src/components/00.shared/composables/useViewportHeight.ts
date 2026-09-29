const KEYBOARD_MIN_PX = 120

export function useViewportHeight(varName = '--viewport-height') {
  const apply = () => {
    const height = window.visualViewport?.height ?? window.innerHeight
    document.documentElement.style.setProperty(varName, `${height}px`)
    document.documentElement.classList.toggle('keyboard-open', window.innerHeight - height > KEYBOARD_MIN_PX)

    if (window.scrollY !== 0)
      window.scrollTo(0, 0)
  }

  onMounted(() => {
    apply()
    window.visualViewport?.addEventListener('resize', apply)
    window.visualViewport?.addEventListener('scroll', apply)
    window.addEventListener('orientationchange', apply)
  })

  onUnmounted(() => {
    window.visualViewport?.removeEventListener('resize', apply)
    window.visualViewport?.removeEventListener('scroll', apply)
    window.removeEventListener('orientationchange', apply)
    document.documentElement.style.removeProperty(varName)
    document.documentElement.classList.remove('keyboard-open')
  })
}
