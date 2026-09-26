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

test('метка от сервера на другом конце света: карта перелетает к ней и открывает карточку', async ({ page, api }) => {
  const far = mark(99, 7.746, 48.583)
  api.mapMarks = [mark(1, 37.6175, 55.756), far]
  const queries: URLSearchParams[] = []
  api.respond(/^\/marks\/random$/, (url: URL) => {
    queries.push(url.searchParams)
    return far
  })
  await openApp(page)
  await marksLoaded(page)

  await surpriseButton(page).click()

  const status = page.getByRole('status')
  await expect(status).toContainText('Летим к «Метка 99»')
  await expect(page.locator('.mark-preview__card')).toContainText('Метка 99', { timeout: 15_000 })
  await expect(status).toHaveCount(0)
  expect(queries[0]?.has('radius')).toBe(false)
})

test('сервер не ответил и меток нет — подсказка попробовать ещё раз', async ({ page }) => {
  await openApp(page)

  await surpriseButton(page).click()

  await expect(page.getByText('Не получилось найти метку')).toBeVisible()
})

test('встряхивание телефона работает как кнопка, одиночный рывок — нет', async ({ page, api }) => {
  api.mapMarks = [mark(1, 37.6175, 55.756), mark(2, 37.618, 55.7555)]
  await openApp(page)
  await marksLoaded(page)
  const jolt = () => page.evaluate(() => window.dispatchEvent(new DeviceMotionEvent('devicemotion', { acceleration: { x: 20, y: 4, z: 2 } })))
  // Покачивание длится полсекунды — запоминаем, что класс появлялся, а не ловим момент
  await page.evaluate(() => {
    const map = document.querySelector('.maplibregl-map')!
    new MutationObserver(() => {
      if (map.classList.contains('map-shaken'))
        (window as unknown as { shaken: boolean }).shaken = true
    }).observe(map, { attributes: true, attributeFilter: ['class'] })
  })

  await jolt()
  await page.waitForTimeout(500)
  await expect(page.locator('.mark-preview__card')).toHaveCount(0)

  for (let i = 0; i < 3; i++) {
    await jolt()
    await page.waitForTimeout(180)
  }
  // Карта качнулась в ответ на встряхивание
  await expect.poll(() => page.evaluate(() => (window as unknown as { shaken?: boolean }).shaken)).toBe(true)
  await expect(page.locator('.mark-preview__card')).toContainText(/Метка [12]/)
})
