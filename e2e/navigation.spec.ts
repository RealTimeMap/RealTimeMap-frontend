import { expect, navItem, openApp, test } from './support/fixtures'

test('все разделы нижней навигации открываются', async ({ page }) => {
  await openApp(page)
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()

  await navItem(page, 'Места').click()
  await expect(page.getByText('Новая личная метка')).toBeVisible()

  await navItem(page, 'Чаты').click()
  await expect(page.getByText('Пока нет переписок')).toBeVisible()

  await navItem(page, 'Профиль').click()
  await expect(page.locator('.user-info h2')).toHaveText('Tester')

  await navItem(page, 'Карта').click()
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await expect(page).toHaveURL('/')
})

test('настройки открываются из профиля', async ({ page }) => {
  await openApp(page, '/profile/me')
  await page.locator('.button-settings').dispatchEvent('click')
  await expect(page.getByText('Тема оформления')).toBeVisible()
  await expect(page.getByText('Активные сессии')).toBeVisible()
})

test('неизвестный адрес ведёт на 404', async ({ page }) => {
  await page.goto('/no-such-page')
  await expect(page.getByText(/не найдена/i)).toBeVisible()
})

// Штатные ошибки (разрыв WebSocket, запрет уведомлений) не должны предлагать баг-репорт
test('обычный запуск не показывает тост «Что-то пошло не так»', async ({ page }) => {
  await openApp(page)
  await navItem(page, 'Профиль').click()
  await expect(page.locator('.user-profile-view')).toBeVisible()
  await page.waitForTimeout(3000)
  await expect(page.getByText('Что-то пошло не так')).toHaveCount(0)
})
