import { expect, navItem, openApp, test } from './support/fixtures'

test.use({ hasTouch: false, isMobile: false, viewport: { width: 1280, height: 800 } })

const settings = (page: import('@playwright/test').Page) => page.locator('.settings')

test('«назад» (свайп от края) закрывает модалку, а не уходит со страницы', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Настройки' }).click()
  await expect(settings(page)).toBeVisible()
  const url = page.url()

  await page.goBack()
  await expect(settings(page)).toBeHidden()
  expect(page.url()).toBe(url)
})

test('две модалки закрываются по одной', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByRole('button', { name: /Активные сессии/ }).click()
  await expect(page.locator('.modal-wrapper')).toHaveCount(2)

  await page.goBack()
  await expect(page.locator('.modal-wrapper')).toHaveCount(1)
  await expect(settings(page)).toBeVisible()
  await page.goBack()
  await expect(settings(page)).toBeHidden()
})

test('после закрытия крестиком «назад» работает как обычно', async ({ page }) => {
  await openApp(page)
  await navItem(page, 'Места').click()
  await expect(page).toHaveURL(/\/places/)
  await navItem(page, 'Карта').click()
  await expect(page).not.toHaveURL(/\/places/)

  await page.getByRole('button', { name: 'Настройки' }).click()
  await expect(settings(page)).toBeVisible()
  await settings(page).locator('.button-back').click()
  await expect(settings(page)).toBeHidden()

  await page.goBack()
  await expect(page).toHaveURL(/\/places/)
})
