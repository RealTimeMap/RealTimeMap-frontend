import { expect, openApp, test } from './support/fixtures'

test('свой профиль показывает уровень, достижения, статистику и метки', async ({ page }) => {
  await openApp(page, '/profile/me')

  await expect(page.locator('.level-card')).toContainText('Исследователь')
  await expect(page.locator('.achievements-widget')).toContainText('Достижение 1')
  await expect(page.locator('.stats-card')).toContainText('12')
  await expect(page.locator('.user-profile-view__marks-grid > *')).toHaveCount(4)
  await expect(page.getByText('Показать все метки')).toBeVisible()
})

test('чужой профиль показывает кнопку подписки', async ({ page }) => {
  await openApp(page, '/profile/7')
  await expect(page.locator('.user-info h2')).toHaveText('Other')
  await expect(page.getByRole('button', { name: 'Подписаться' })).toBeVisible()
})

test('без сервера профиль берёт данные из офлайн-кэша API', async ({ page, context, api }) => {
  await openApp(page, '/profile/me')
  await expect(page.locator('.stats-card')).toContainText('12')
  await expect(page.locator('.achievements-widget')).toContainText('Достижение 1')

  api.setServerDown(true)
  const offline = await context.newPage()
  await openApp(offline, '/profile/me')

  await expect(offline.locator('.stats-card')).toContainText('12')
  await expect(offline.locator('.achievements-widget')).toContainText('Достижение 1')
  await expect(offline.getByText('Статистика недоступна')).toHaveCount(0)
})
