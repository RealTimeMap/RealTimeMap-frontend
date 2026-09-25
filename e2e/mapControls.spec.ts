import { expect, openApp, test } from './support/fixtures'

test('кнопка «на север» появляется после поворота и возвращает карту', async ({ page }) => {
  await openApp(page)
  const canvas = page.locator('.maplibregl-canvas')
  await expect(canvas).toBeVisible()

  const compass = page.getByRole('button', { name: 'Повернуть карту на север' })
  await expect(compass).toHaveCount(0)

  await page.waitForTimeout(3000)
  await canvas.focus()
  for (let i = 0; i < 4; i++)
    await page.keyboard.press('Shift+ArrowLeft')

  await expect(compass).toBeVisible()
  await compass.click()
  await expect(compass).toHaveCount(0)
})

test('режим следования держит пользователя в центре, пока карту не сдвинули', async ({ page, context }) => {
  await openApp(page)
  const canvas = page.locator('.maplibregl-canvas')
  await expect(canvas).toBeVisible()

  // Нажатие до загрузки карты тоже включает режим — перелёт выполнится после load
  const locate = page.getByRole('button', { name: 'Следовать за мной' })
  await locate.click()
  await expect(page.getByRole('button', { name: 'Перестать следовать за мной' })).toHaveAttribute('aria-pressed', 'true')
  await page.waitForTimeout(2500)

  await context.setGeolocation({ latitude: 55.7600, longitude: 37.6300 })

  const userMarker = page.locator('.custom-map-marker--user')
  const offsetFromCenter = async () => {
    const [m, c] = await Promise.all([userMarker.boundingBox(), canvas.boundingBox()])
    // Пин привязан к координате нижней точкой
    return Math.hypot(m!.x + m!.width / 2 - (c!.x + c!.width / 2), m!.y + m!.height - (c!.y + c!.height / 2))
  }
  await expect.poll(offsetFromCenter, { timeout: 8000 }).toBeLessThan(40)

  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + 200, box.y + 400)
  await page.mouse.down()
  await page.mouse.move(box.x + 100, box.y + 250, { steps: 8 })
  await page.mouse.up()

  await expect(page.getByRole('button', { name: 'Следовать за мной' })).toHaveAttribute('aria-pressed', 'false')
})

test('3D-здания включаются и выключаются в редакторе карты без ошибок', async ({ page }) => {
  await openApp(page)
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await page.waitForTimeout(2000)

  await page.getByRole('button', { name: 'Редактор карты' }).click()
  await page.getByRole('button', { name: 'Настроить по отдельности' }).click()
  const row = page.locator('.me-row', { hasText: '3D-здания' })
  await expect(row).toBeVisible()

  const toggle = row.locator('input, [role="switch"], .u-switch').first()
  await toggle.click()
  await page.waitForTimeout(2000)
  await toggle.click()
  await page.waitForTimeout(500)
})

test('пресет вида карты включает нужные эффекты', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Редактор карты' }).click()
  const presets = page.getByRole('radiogroup', { name: 'Вид карты' })
  await expect(presets.getByRole('radio', { name: /Экономно/ })).toHaveAttribute('aria-checked', 'true')

  await presets.getByRole('radio', { name: /Красиво/ }).click()
  await expect(presets.getByRole('radio', { name: /Красиво/ })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: 'Настроить по отдельности' }).click()
  await expect(page.locator('.me-row', { hasText: 'Деревья' }).getByRole('switch')).toHaveAttribute('aria-checked', 'true')
})
