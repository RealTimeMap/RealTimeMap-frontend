import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'
import pkg from './package.json'

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
        './src/shared/services/api',
        './src/components/01.kit/*',
      ],

      dts: './src/types/dts/auto-imports.d.ts',
    }),

    Components({
      dirs: ['src/components/01.kit'],
      extensions: ['ts'],
      deep: true,
      dts: 'src/types/dts/components.d.ts',
      exclude: [
        /[\\/]node_modules[\\/]/,
        /[\\/]\.git[\\/]/,
        /[\\/]models[\\/]/,
      ],
    }),

    VitePWA({
      registerType: 'autoUpdate',
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

  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/scss/_mixins.scss" as *;`,
      },
    },
  },
})
