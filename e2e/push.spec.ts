import { expect, openApp, test } from './support/fixtures'

test('уведомления в браузере: предложение после входа, системный запрос — только по нажатию', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __asked: number, __permission: NotificationPermission }
    w.__asked = 0
    w.__permission = 'default'
    Object.defineProperty(Notification, 'permission', { get: () => w.__permission })
    Notification.requestPermission = async () => {
      w.__asked++
      w.__permission = 'denied'
      return 'denied'
    }
  })
  await openApp(page)

  await expect(page.getByText('Включить уведомления?')).toBeVisible({ timeout: 10_000 })
  // Сам по себе браузерный запрос не вызывался: без нажатия Safari и Firefox его отклоняют
  expect(await page.evaluate(() => (window as unknown as { __asked: number }).__asked)).toBe(0)

  await page.getByRole('button', { name: 'Включить' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __asked: number }).__asked)).toBe(1)
})

test('не ответили на предложение — после перезапуска оно появляется снова', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Notification, 'permission', { get: () => 'default' })
  })
  await openApp(page)
  await expect(page.getByText('Включить уведомления?')).toBeVisible({ timeout: 10_000 })

  await page.reload()
  await expect(page.getByText('Включить уведомления?')).toBeVisible({ timeout: 10_000 })
})
