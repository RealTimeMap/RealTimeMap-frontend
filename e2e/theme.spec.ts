import { expect, openApp, test } from './support/fixtures'

test.use({ colorScheme: 'light' })

// В режиме «системная тема» смена темы ОС перекрашивала интерфейс, но карта оставалась светлой.
test('карта переключает стиль вслед за системной темой', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'app_theme', value: 'system', url: baseURL! }])
  await openApp(page)
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()

  const darkStyle = page.waitForRequest(/dark-matter-gl-style\/style\.json/, { timeout: 5000 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await darkStyle
})
