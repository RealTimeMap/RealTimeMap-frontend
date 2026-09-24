import { expect, measureFrames, navItem, openApp, test } from './support/fixtures'

// Карта в keep-alive не должна пересоздавать WebGL-буфер при возврате:
// до исправления анимация замирала на 300+ мс.
test('возврат на карту из профиля без фриза анимации', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  await openApp(page)
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await page.waitForTimeout(3000)

  await navItem(page, 'Профиль').click()
  await expect(page.locator('.user-profile-view')).toBeVisible()
  await page.waitForTimeout(1500)

  const { maxGap } = await measureFrames(page, () => navItem(page, 'Карта').click())
  expect(maxGap, 'самая длинная пауза между кадрами, мс').toBeLessThan(150)
})

test('на карте в простое крутится только иконка активного пункта', async ({ page }) => {
  await openApp(page)
  await page.waitForTimeout(1500)

  const loopsPerItem = () => page.locator('.bottom-nav__item').evaluateAll(items =>
    items.map(li => li.querySelectorAll('[repeatCount="indefinite"]').length > 0))

  await expect.poll(loopsPerItem).toEqual([true, false, false, false])
  await expect(page.locator('.map-controls__group [repeatCount="indefinite"]')).toHaveCount(0)
})
