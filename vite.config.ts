import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

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
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/scss/_mixins.scss" as *;`,
      },
    },
  },
})
