import type { Page } from '@playwright/test'
import { expect, openApp, test } from './support/fixtures'

test.use({ hasTouch: false, isMobile: false, viewport: { width: 1280, height: 800 } })

async function openDialog(page: Page) {
  await openApp(page)
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByRole('button', { name: 'Удалить аккаунт' }).click()
  await expect(page.getByText('Удалить аккаунт?')).toBeVisible()
}

test('удаление аккаунта с паролем выходит из аккаунта и ведёт на вход', async ({ page }) => {
  let body: unknown
  await page.route(/\/auth\/me$/, (route) => {
    body = route.request().postDataJSON()
    return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
  })
  await openDialog(page)

  const submit = page.getByRole('button', { name: 'Удалить', exact: true })
  await expect(submit).toBeDisabled()
  await page.getByPlaceholder('Пароль для подтверждения').fill('Secret123!')
  await submit.click()

  await expect(page).toHaveURL(/\/login/)
  expect(body).toEqual({ password: 'Secret123!' })
  await expect.poll(() => page.evaluate(() => localStorage.getItem('rtm_auth_token'))).toBeNull()
})

test('неверный пароль — ошибка, аккаунт и сессия остаются', async ({ page }) => {
  await page.route(/\/auth\/me$/, route => route.fulfill({
    status: 401,
    json: { message: 'invalid password' },
    headers: { 'access-control-allow-origin': '*' },
  }))
  await openDialog(page)

  await page.getByPlaceholder('Пароль для подтверждения').fill('wrong')
  await page.getByRole('button', { name: 'Удалить', exact: true }).click()

  await expect(page.getByText('Неверный пароль')).toBeVisible()
  await expect(page).not.toHaveURL(/\/login/)
  expect(await page.evaluate(() => localStorage.getItem('rtm_auth_token'))).toBe('e2e-token')
})
