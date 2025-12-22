<script setup lang="ts">
import type { ThemeName } from '@/components/02.features/AppSettings/model/settings/settings-parts/useTheme'
import { MoonOutline, SunnyOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const model = defineModel<ThemeName>({ required: true })

function toggleTheme() {
  model.value = model.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <button
    class="theme-switcher"
    :class="`is-${model}`"
    aria-label="Переключить тему"
    @click="toggleTheme"
  >
    <div class="theme-switcher__track">
      <div class="theme-switcher__thumb">
        <transition
          name="fade"
          mode="out-in"
        >
          <n-icon
            v-if="model === 'light'"
            key="light"
            :component="SunnyOutline"
            class="theme-switcher__icon"
          />
          <n-icon
            v-else
            key="dark"
            :component="MoonOutline"
            class="theme-switcher__icon"
          />
        </transition>
      </div>
    </div>
  </button>
</template>

<style lang="scss" scoped>
.theme-switcher {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &__track {
    position: relative;
    width: 64px;
    height: 32px;
    background-color: var(--n-rail-color-active, #dbeafe);
    border-radius: 16px;
    transition: background-color 0.3s ease;
  }

  &__thumb {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 24px;
    height: 24px;
    background-color: #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  &__icon {
    font-size: 16px;
    color: #facc15;
  }

  &.is-dark {
    .theme-switcher__track {
      background-color: var(--n-rail-color-active, #374151);
    }
    .theme-switcher__thumb {
      transform: translateX(32px);
    }
    .theme-switcher__icon {
      color: #7dd3fc;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
