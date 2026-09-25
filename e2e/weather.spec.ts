import { expect, openApp, test } from './support/fixtures'

test('плашка погоды предупреждает о скором дожде и показывает прогноз осадков', async ({ page, api }) => {
  api.precipitation = [0, 0, 0.4, 0.8, 0.5, 0, 0, 0, 0, 0, 0, 0]
  await openApp(page)

  const chip = page.getByRole('button', { name: /Погода: 14°/ })
  await expect(chip).toContainText(/Дождь через \d+ мин/)
  await chip.click()
  await expect(page.getByText('Осадки на 3 часа')).toBeVisible()
})

test('без осадков плашка показывает состояние неба', async ({ page }) => {
  await openApp(page)
  await expect(page.getByRole('button', { name: /Погода: 14°/ })).toContainText('Ясно')
})
