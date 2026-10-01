import { expect, openApp, test } from './support/fixtures'

test.use({ hasTouch: false, isMobile: false, viewport: { width: 1280, height: 800 } })

test('выход удаляет push-токен устройства до отзыва сессии', async ({ page, api }) => {
  let body: unknown
  page.on('request', (request) => {
    if (request.method() === 'DELETE' && request.url().endsWith('/tokens/me'))
      body = request.postDataJSON()
  })
  await page.addInitScript(() => localStorage.setItem('device_id', 'e2e-device'))
  await openApp(page)
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByRole('button', { name: 'Выйти из аккаунта' }).click()

  await expect(page).toHaveURL(/\/login/)
  const removed = api.requests.indexOf('DELETE /tokens/me')
  expect(removed).toBeGreaterThanOrEqual(0)
  expect(removed).toBeLessThan(api.requests.indexOf('POST /auth/logout'))
  expect(body).toEqual({ deviceId: 'e2e-device' })
})
