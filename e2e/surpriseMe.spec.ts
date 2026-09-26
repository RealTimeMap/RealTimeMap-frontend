import type { Page } from '@playwright/test'
import type { MapMark } from './support/mockApi'
import { expect, openApp, test } from './support/fixtures'

function mark(id: number, lng: number, lat: number): MapMark {
  return { id, markName: `Метка ${id}`, geom: { type: 'Point', coordinates: [lng, lat] }, photos: [] }
}

const surpriseButton = (page: Page) => page.getByRole('button', { name: /Удиви меня/ })
/** Метки приходят по сокету после загрузки карты — ждём их карточки в ленте «Что рядом». */
const marksLoaded = (page: Page) => expect(page.locator('.nearby-card').first()).toBeVisible()

test('без ответа сервера «Удиви меня» открывает случайную метку из тех, что в кадре', async ({ page, api }) => {
  api.mapMarks = [mark(1, 37.6175, 55.756), mark(2, 37.618, 55.7555), mark(3, 37.6168, 55.7562)]
  await openApp(page)
  await marksLoaded(page)

  await surpriseButton(page).click()

  await expect(page.locator('.mark-preview__card')).toContainText(/Метка [123]/)
})

test('метка от сервера: карта перелетает к ней и открывает карточку', async ({ page, api }) => {
  const far = mark(99, 37.64, 55.765)
  api.mapMarks = [mark(1, 37.6175, 55.756), far]
  const queries: URLSearchParams[] = []
  api.respond(/^\/marks\/random$/, (url: URL) => {
    queries.push(url.searchParams)
    return far
  })
  await openApp(page)
  await marksLoaded(page)

  await surpriseButton(page).click()

  await expect(page.locator('.mark-preview__card')).toContainText('Метка 99')
  expect(queries[0]?.get('radius')).toBe('3000')
  expect(Number(queries[0]?.get('lat'))).toBeCloseTo(55.7558, 1)
})

test('рядом пусто — подсказка отдалить карту', async ({ page }) => {
  await openApp(page)

  await surpriseButton(page).click()

  await expect(page.getByText('Рядом пока пусто')).toBeVisible()
})

test('встряхивание телефона работает как кнопка, одиночный рывок — нет', async ({ page, api }) => {
  api.mapMarks = [mark(1, 37.6175, 55.756), mark(2, 37.618, 55.7555)]
  await openApp(page)
  await marksLoaded(page)
  const jolt = () => page.evaluate(() => window.dispatchEvent(new DeviceMotionEvent('devicemotion', { acceleration: { x: 20, y: 4, z: 2 } })))

  await jolt()
  await page.waitForTimeout(500)
  await expect(page.locator('.mark-preview__card')).toHaveCount(0)

  for (let i = 0; i < 3; i++) {
    await jolt()
    await page.waitForTimeout(180)
  }
  await expect(page.locator('.mark-preview__card')).toContainText(/Метка [12]/)
})
