<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'

const { preview = true } = defineProps<{
  preview?: boolean
}>()

const settings = useSettingsStore()
const {
  showMapZoom,
  showMapLocate,
  showMapSettings,
  showMapZoomLevel,
} = storeToRefs(settings)
const { close } = useDialogStore()

const anyVisible = computed(() =>
  showMapZoom.value || showMapLocate.value || showMapSettings.value || showMapZoomLevel.value,
)
</script>

<template>
  <div class="map-editor">
    <div class="map-editor__header">
      <button
        class="button-back"
        type="button"
        @click="close"
      >
        <u-icon icon="line-md:arrow-small-left" />
      </button>
      <h2>Редактор карты</h2>
    </div>

    <p class="map-editor__hint">
      Выберите, какие кнопки показывать на карте
    </p>

    <div
      v-if="preview"
      class="map-editor__preview"
    >
      <div class="mc-stack">
        <div
          v-if="showMapZoom"
          class="mc-stack__group mc-stack__group--zoom"
        >
          <u-icon
            icon="lucide:plus"
            width="16"
          />
          <span class="mc-stack__line" />
          <u-icon
            icon="lucide:minus"
            width="16"
          />
        </div>
        <div
          v-if="showMapLocate"
          class="mc-stack__group"
        >
          <u-icon
            icon="line-md:my-location"
            width="16"
          />
        </div>
        <div
          v-if="showMapSettings"
          class="mc-stack__group"
        >
          <u-icon
            icon="solar:settings-bold"
            width="16"
          />
        </div>
        <div
          v-if="showMapZoomLevel"
          class="mc-stack__group mc-stack__zoom"
        >
          <span class="mc-stack__zoom-value">12</span>
          <span class="mc-stack__zoom-label">ZOOM</span>
        </div>

        <span
          v-if="!anyVisible"
          class="map-editor__empty"
        >Панель скрыта</span>
      </div>
    </div>

    <div class="map-editor__rows">
      <div class="me-row">
        <span class="me-row__icon"><u-icon
          icon="lucide:zoom-in"
          width="18"
        /></span>
        <div class="me-row__text">
          <span class="me-row__label">Зум +/−</span>
          <span class="me-row__hint">Кнопки приближения и отдаления</span>
        </div>
        <u-switch v-model="showMapZoom" />
      </div>

      <div class="me-row">
        <span class="me-row__icon"><u-icon
          icon="line-md:my-location"
          width="18"
        /></span>
        <div class="me-row__text">
          <span class="me-row__label">Моё местоположение</span>
          <span class="me-row__hint">Перелёт к вашей точке</span>
        </div>
        <u-switch v-model="showMapLocate" />
      </div>

      <div class="me-row">
        <span class="me-row__icon"><u-icon
          icon="solar:settings-bold"
          width="18"
        /></span>
        <div class="me-row__text">
          <span class="me-row__label">Настройки</span>
          <span class="me-row__hint">Кнопка-шестерёнка</span>
        </div>
        <u-switch v-model="showMapSettings" />
      </div>

      <div class="me-row">
        <span class="me-row__icon"><u-icon
          icon="lucide:gauge"
          width="18"
        /></span>
        <div class="me-row__text">
          <span class="me-row__label">Индикатор зума</span>
          <span class="me-row__hint">Текущий уровень масштаба</span>
        </div>
        <u-switch v-model="showMapZoomLevel" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.map-editor {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;

  &__header {
    display: flex;
    gap: 12px;
    align-items: center;

    .button-back {
      @include glass-panel(12px, 10px, false);
      display: flex;
      cursor: pointer;
    }

    h2 {
      margin: 0;
      @include value-text(24px, var(--text-color), 700);
    }
  }

  &__hint {
    @include label-text(13px, none);
    margin: -8px 0 0;
  }

  &__preview {
    display: grid;
    place-items: center;
    padding: 24px;
    border-radius: 20px;
    background:
      repeating-linear-gradient(
        45deg,
        transparent 0 14px,
        color-mix(in srgb, var(--text-color) 4%, transparent) 14px 15px
      ),
      var(--surface-subtle);
    border: 0.5px solid var(--border-subtle);
  }

  &__empty {
    @include label-text(12px, none);
  }

  &__rows {
    display: flex;
    flex-direction: column;
  }
}

.mc-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  &__group {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: var(--text-color);
    background: var(--bg-block-solid, var(--bg-color-block));
    border: 0.5px solid var(--glass-border);
    box-shadow: var(--glass-shadow) 0px 6px 16px;

    &--zoom {
      height: auto;
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 8px 0;
    }
  }

  &__line {
    width: 55%;
    height: 1px;
    background: var(--border-subtle);
  }

  &__zoom {
    flex-direction: column;
    gap: 0;
  }

  &__zoom-value {
    @include value-text(15px, var(--text-color), 800);
    line-height: 1;
  }

  &__zoom-label {
    @include label-text(7px, uppercase);
    letter-spacing: 1px;
  }
}

.me-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 2px;
  border-top: 0.5px solid var(--border-subtle);

  &:first-child {
    border-top: none;
  }

  &__icon {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--text-color);
    background: var(--surface-subtle);
  }

  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
  }

  &__hint {
    @include label-text(11px, none);
  }
}
</style>
