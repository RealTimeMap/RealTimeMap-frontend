import type { Page } from '@playwright/test'
import { expect, openApp, test } from './support/fixtures'

const chat = {
  chatId: 1,
  type: 'direct',
  title: 'Анна',
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
  peerId: 101,
  isAdmin: false,
  lastMessage: { messageId: 10, username: 'Анна', content: 'Привет' },
}

/** Флаг, который Safari 18+ ставит у popstate после системного свайпа «назад». */
test.beforeEach(async ({ page, api }) => {
  await page.addInitScript(() => {
    Object.defineProperty(PopStateEvent.prototype, 'hasUAVisualTransition', {
      get: () => (window as unknown as { uaTransition?: boolean }).uaTransition ?? false,
    })
  })
  api.respond(/^\/chats\/?$/, [chat])
  await openApp(page)
  await page.locator('.bottom-nav__item', { hasText: 'Чаты' }).click()
  await page.getByText('Анна', { exact: true }).click()
  await expect(page).toHaveURL(/\/chats\/1/)
  await page.waitForTimeout(600)
})

async function goBack(page: Page, browserAnimated: boolean) {
  await page.evaluate((animated) => {
    (window as unknown as { uaTransition?: boolean }).uaTransition = animated
    history.back()
  }, browserAnimated)
  await expect(page).toHaveURL(/\/chats$/)
}

test('после системного свайпа «назад» своя анимация не проигрывается второй раз', async ({ page }) => {
  await goBack(page, true)
  await expect(page.locator('.slide-right-leave-active, .slide-right-enter-active')).toHaveCount(0)
})

test('обычный переход назад по-прежнему анимирован', async ({ page }) => {
  await goBack(page, false)
  await expect(page.locator('.slide-right-leave-active').first()).toBeAttached()
})
