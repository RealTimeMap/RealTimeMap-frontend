import { API_ORIGIN } from './support/env'
import { expect, navItem, openApp, test } from './support/fixtures'

// Сессию завершили с другого устройства: сервер начинает отвечать 401
test('отзыв сессии сбрасывает аккаунт, а не только страницу профиля', async ({ page }) => {
  await openApp(page)
  const avatarMarker = page.locator('.marker-photo__img[src*="avatar.png"]')
  await expect(avatarMarker).toHaveCount(1)

  await navItem(page, 'Профиль').click()
  await page.locator('.button-settings').dispatchEvent('click')
  await expect(page.getByText('Тема оформления')).toBeVisible()

  await page.route(`${API_ORIGIN}/**`, route => route.fulfill({
    status: 401,
    json: { message: 'Unauthorized' },
    headers: { 'access-control-allow-origin': '*' },
  }))
  // Любой запрос приложения — например, загрузка чатов при переходе во вкладку
  await navItem(page, 'Чаты').dispatchEvent('click')

  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByText('Тема оформления')).toHaveCount(0)
  await expect(navItem(page, 'Чаты')).toHaveCount(0)

  await navItem(page, 'Карта').click()
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await expect(avatarMarker).toHaveCount(0)
})

// В установленном PWA браузер может стереть cookie, записанную скриптом
test('вход сохраняется, даже если браузер стёр cookie с токеном', async ({ page, context }) => {
  await openApp(page)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('rtm_auth_token'))).toBe('e2e-token')

  await context.clearCookies()
  await page.reload()

  await expect(navItem(page, 'Чаты')).toBeVisible()
  await expect(page).not.toHaveURL(/\/login/)
})
