import { expect, openApp, test } from './support/fixtures'

// Раньше каждая область карты писалась в Preferences под своим ключом и не удалялась
test('старый кэш меток из Preferences удаляется, база кэша обновляется до v2', async ({ page, context }) => {
  await context.addInitScript(() => {
    if (sessionStorage.getItem('seeded'))
      return
    sessionStorage.setItem('seeded', '1')
    for (let i = 0; i < 30; i++)
      localStorage.setItem(`CapacitorStorage.map_cache_55.7${i}_37.6${i}_55.8_37.7_z15`, '{"marks":[],"clusters":[]}')
    localStorage.setItem('CapacitorStorage.map_last_visible_marks', '{"marks":[],"clusters":[]}')
    // База кэша API первой версии — как у пользователей до обновления
    const req = indexedDB.open('rtm-api-cache', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('responses', { keyPath: 'key' }).createIndex('savedAt', 'savedAt')
    req.onsuccess = () => req.result.close()
  })

  await openApp(page)

  const legacyKeys = () => page.evaluate(() => Object.keys(localStorage).filter(k => k.includes('map_cache_') || k.includes('map_last_visible_marks')).length)
  await expect.poll(legacyKeys).toBe(0)
  expect(await page.evaluate(() => localStorage.getItem('CapacitorStorage.rtm_marks_cache_v2'))).toBe('true')

  const db = await page.evaluate(() => new Promise<{ version: number, stores: string[] }>((resolve) => {
    const req = indexedDB.open('rtm-api-cache')
    req.onsuccess = () => {
      resolve({ version: req.result.version, stores: [...req.result.objectStoreNames].sort() })
      req.result.close()
    }
  }))
  expect(db).toEqual({ version: 2, stores: ['marks', 'responses'] })
})
