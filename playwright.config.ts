import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'
import { API_BASE, API_ORIGIN, IMAGE_PORT, APP_PORT as PORT } from './e2e/support/env'

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    ...devices['Pixel 7'],
    baseURL: `http://localhost:${PORT}`,
    serviceWorkers: 'block',
    permissions: ['geolocation'],
    geolocation: { latitude: 55.7558, longitude: 37.6173 },
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'mobile-chromium' },
  ],

  webServer: [
    {
      command: `bun run icons && vite build --outDir .e2e-dist && exec vite preview --outDir .e2e-dist --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      // Всегда свежая сборка: переиспользованный сервер тихо тестирует старый код
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        VITE_API_BASE_URL: API_BASE,
        VITE_WS_URL: API_ORIGIN,
      },
    },
    {
      command: `exec node e2e/support/imageServer.mjs ${IMAGE_PORT}`,
      url: `http://localhost:${IMAGE_PORT}/health`,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
