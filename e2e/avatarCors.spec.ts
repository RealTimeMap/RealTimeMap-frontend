import { IMAGE_ORIGIN } from './support/env'
import { expect, openApp, test } from './support/fixtures'

// Аватар в профиле грузится с crossorigin, чтобы взять из него цвет фона.
// Если CORS-загрузка падает (хост без заголовков, старый кэш service worker), картинка всё равно видна
test('аватар показывается, даже если CORS-загрузка не удалась', async ({ page }) => {
  // CORS-запрос картинки (с заголовком Origin) падает, обычный проходит
  await page.route(`${IMAGE_ORIGIN}/avatar.png`, route => route.request().headers().origin
    ? route.abort('failed')
    : route.continue())
  await openApp(page, '/profile/me')

  const avatar = page.locator('.user-profile-view .u-avatar img')
  await expect(avatar).not.toHaveAttribute('crossorigin')
  await expect.poll(() => avatar.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
})
