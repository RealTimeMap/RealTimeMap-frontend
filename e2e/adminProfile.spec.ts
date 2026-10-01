import { expect, openApp, test } from './support/fixtures'

test('значок админа по нажатию показывает подсказку, и она гаснет сама', async ({ page, api }) => {
  api.respond(/^\/profile\/99$/, { userId: 99, username: 'Модератор', tag: 'mod', avatar: '', isAdmin: true })
  await openApp(page, '/profile/99')

  await page.getByRole('button', { name: 'Администратор' }).click()
  await expect(page.getByText('следит за порядком на карте')).toBeVisible()
  await expect(page.getByText('следит за порядком на карте')).toBeHidden({ timeout: 6000 })
})

test('у обычного пользователя значка нет', async ({ page }) => {
  await openApp(page, '/profile/7')
  await expect(page.locator('.user-info h2')).toHaveText('Other')
  await expect(page.getByRole('button', { name: 'Администратор' })).toHaveCount(0)
})
