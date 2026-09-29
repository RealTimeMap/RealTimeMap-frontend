import { expect, openApp, test } from './support/fixtures'

test.use({ hasTouch: false, isMobile: false, viewport: { width: 1280, height: 800 } })

test('на компьютере «Скачать приложение» показывает QR-код для телефона', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByText('Скачать приложение').click()

  await expect(page.getByRole('img', { name: /QR-код/ }).locator('svg')).toBeVisible()
  await expect(page.getByRole('link', { name: /на этот компьютер/ }))
    .toHaveAttribute('href', 'https://github.com/RealTimeMap/RealTimeMap-frontend/releases/latest/download/rtm.apk')
})
