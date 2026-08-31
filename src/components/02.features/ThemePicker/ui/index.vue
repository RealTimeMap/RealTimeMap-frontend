<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { THEMES } from '@/components/00.shared/lib/theme'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import ThemePreview from './ThemePreview.vue'
import ThemeThumb from './ThemeThumb.vue'

const settings = useSettingsStore()
const { theme } = storeToRefs(settings)
const { close } = useDialogStore()
</script>

<template>
  <div class="theme-picker">
    <div class="theme-picker__header">
      <button
        class="button-back"
        type="button"
        @click="close"
      >
        <u-icon icon="line-md:arrow-small-left" />
      </button>
      <h2>Тема оформления</h2>
    </div>

    <p class="theme-picker__hint">
      Выберите оформление — изменения применяются сразу
    </p>

    <theme-preview :theme="theme" />

    <div class="theme-picker__row">
      <theme-thumb
        v-for="item in THEMES"
        :key="item.id"
        :theme="item"
        :active="theme === item.id"
        @select="settings.setTheme(item.id)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.theme-picker {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  height: 100%;
}

.theme-picker__header {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;

  .button-back {
    @include glass-panel(12px, 10px, false);
  }

  h2 {
    @include value-text(24px, var(--text-color), 700);
  }
}

.theme-picker__hint {
  @include label-text(13px, none);
}

.theme-picker__row {
  display: flex;
  gap: 12px;
}
</style>
