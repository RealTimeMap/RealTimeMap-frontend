<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { THEMES } from '@/components/00.shared/lib/theme'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import ThemePreview from './ThemePreview.vue'
import ThemeThumb from './ThemeThumb.vue'

const settings = useSettingsStore()
const { theme, resolvedTheme } = storeToRefs(settings)
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

    <theme-preview :theme="resolvedTheme" />

    <button
      type="button"
      class="theme-picker__system"
      :class="{ 'theme-picker__system--active': theme === 'system' }"
      @click="settings.setTheme('system')"
    >
      <u-icon
        icon="solar:smartphone-2-bold-duotone"
        width="20"
      />
      <span class="theme-picker__system-text">
        <span class="theme-picker__system-title">Как в системе</span>
        <span class="theme-picker__system-hint">Автоматически по настройкам телефона</span>
      </span>
      <u-icon
        v-if="theme === 'system'"
        icon="solar:check-circle-bold"
        width="20"
        class="theme-picker__system-check"
      />
    </button>

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
  overflow-x: auto;
  padding: 4px 18px 8px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;

  mask-image: linear-gradient(to right, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%);

  &::-webkit-scrollbar {
    display: none;
  }

  > * {
    flex: 0 0 auto;
  }
}

.theme-picker__system {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: var(--text-color);
  @include glass-panel(16px, 12px 14px, false, false);
  border: 0.5px solid var(--border-subtle);
  transition: border-color 0.2s ease;

  &--active {
    border-color: var(--primary-color);
  }

  &-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &-title {
    font-size: 14px;
    font-weight: 600;
  }

  &-hint {
    @include label-text(11px, none);
  }

  &-check {
    color: var(--primary-color);
    flex-shrink: 0;
  }
}
</style>
