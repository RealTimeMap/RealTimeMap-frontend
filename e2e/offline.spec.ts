import { expect, openApp, test } from './support/fixtures'

test.use({ serviceWorkers: 'allow' })

// Полный офлайн PWA: оболочка из precache service worker'а,
// данные — из офлайн-кэша API, аватар — из кэша картинок.
test('профиль открывается без сети после первого визита', async ({ page, context, api }) => {
  await openApp(page, '/profile/me')
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.ready.then(() => true))).toBe(true)

  // Первый визит страницу не контролирует — после перезагрузки запросы идут через SW
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  const avatar = page.locator('.user-profile-view__header .u-avatar img')
  await expect.poll(() => avatar.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  await expect(page.locator('.stats-card')).toContainText('12')

  api.setServerDown(true)
  await context.setOffline(true)
  await page.reload()

  await expect(page.locator('.user-info h2')).toHaveText('Tester')
  await expect(page.locator('.stats-card')).toContainText('12')
  await expect.poll(() => avatar.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
})
