export function useViewportHeight(varName = '--viewport-height') {
  const apply = () => {
    const height = window.visualViewport?.height ?? window.innerHeight
    document.documentElement.style.setProperty(varName, `${height}px`)

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
  })
}
