import { execSync } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

function resolveAppVersion(): string {
  if (process.env.APP_VERSION)
    return process.env.APP_VERSION.replace(/^v/, '')

  try {
    return execSync('git describe --tags --abbrev=0', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
      .replace(/^v/, '')
  }
  catch {
    return '0.0.0'
  }
}

export default defineConfig({
  plugins: [
    vue(),

    vueDevTools(),

    autoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
      ],
      dirs: [
        './src/components/00.shared/api',
        './src/components/01.kit/*',
      ],

      dts: './src/types/dts/auto-imports.d.ts',
    }),

    Components({
      dirs: ['src/components/01.kit'],
      extensions: ['ts'],
      deep: true,
      dts: 'src/types/dts/components.d.ts',
      globs: ['src/components/01.kit/**/index.ts'],
      exclude: [
        /[\\/]node_modules[\\/]/,
        /[\\/]\.git[\\/]/,
        /[\\/]model[\\/]/,
      ],
    }),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/basemaps\.cartocdn\.com\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'carto-map-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },

  build: {
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'maplibre', test: /node_modules[\\/]maplibre-gl/, priority: 30 },
          ],
        },
      },
    },
  },

  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/scss/_mixins.scss" as *;`,
      },
    },
  },
})
