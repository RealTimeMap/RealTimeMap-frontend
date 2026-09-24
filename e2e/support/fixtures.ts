import type { Locator, Page } from '@playwright/test'
import { test as base, expect } from '@playwright/test'
import { MockApi } from './mockApi'

interface Fixtures {
  api: MockApi
  /** Необработанные исключения на странице; тест падает, если они есть. */
  pageErrors: string[]
}

export const test = base.extend<Fixtures>({
  api: [async ({ context, baseURL }, use) => {
    const api = new MockApi()
    await api.install(context)
    await context.addCookies([{ name: 'token', value: 'e2e-token', url: baseURL! }])
    await context.addInitScript(() => {
      localStorage.setItem('CapacitorStorage.rtm_welcome_seen', 'true')
      // Подсказки онбординга считаются просмотренными, чтобы не перекрывать интерфейс
      const getItem = Storage.prototype.getItem
      Storage.prototype.getItem = function (key: string) {
        if (key.startsWith('CapacitorStorage.coach_'))
          return 'true'
        return getItem.call(this, key)
      }
    })
    await use(api)
  }, { auto: true }],

  pageErrors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await use(errors)
    expect(errors, 'необработанные исключения на странице').toEqual([])
  }, { auto: true }],
})

export { expect }

export function navItem(page: Page, label: string): Locator {
  return page.locator('.bottom-nav__item', { hasText: label })
}

export async function openApp(page: Page, path = '/') {
  await page.goto(path)
  await expect(navItem(page, 'Карта')).toBeVisible()
}

/** Замеряет паузы между кадрами анимации во время действия. */
export async function measureFrames(page: Page, action: () => Promise<void>, windowMs = 1000) {
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number[], __rec: boolean, __t0: number }
    w.__frames = []
    w.__rec = true
    const loop = (t: number) => {
      if (!w.__rec)
        return
      w.__frames.push(t)
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
    w.__t0 = performance.now()
  })
  await action()
  await page.waitForTimeout(windowMs + 200)
  return page.evaluate((ms) => {
    const w = window as unknown as { __frames: number[], __rec: boolean, __t0: number }
    w.__rec = false
    const frames = w.__frames.filter(t => t >= w.__t0 && t <= w.__t0 + ms)
    const gaps = frames.slice(1).map((t, i) => t - frames[i]!)
    return { maxGap: Math.max(0, ...gaps), frames: frames.length }
  }, windowMs)
}
