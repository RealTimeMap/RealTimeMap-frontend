<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'

/** Из настроек карты не видно — показываем её кусочек с кнопками. С карты превью не нужно. */
const { preview = false } = defineProps<{
  preview?: boolean
}>()

const {
  showMapZoom,
  showMapLocate,
  showMapSettings,
  showMapZoomLevel,
  showMapPitch,
  showMapSurprise,
  showMapLayers,
  showMapEditor,
} = storeToRefs(useSettingsStore())

/** Кнопки карты в том же порядке, что и на экране. text — вместо иконки, как на самой кнопке. */
const CONTROLS = [
  { key: 'zoom', model: showMapZoom, icon: 'app:zoom-in', label: 'Зум' },
  { key: 'pitch', model: showMapPitch, text: '3D', label: '3D / 2D' },
  { key: 'locate', model: showMapLocate, icon: 'app:locate-loop', label: 'Где я' },
  { key: 'surprise', model: showMapSurprise, icon: 'app:magic', label: 'Удиви меня' },
  { key: 'settings', model: showMapSettings, icon: 'app:settings', label: 'Настройки' },
  { key: 'layers', model: showMapLayers, icon: 'app:layers-loop', label: 'Слои' },
  { key: 'editor', model: showMapEditor, icon: 'app:edit', label: 'Редактор' },
  { key: 'zoomLevel', model: showMapZoomLevel, text: '12', label: 'Масштаб' },
] as const

const { close } = useDialogStore()
</script>

<template>
  <div class="map-editor">
    <div class="map-editor__header">
      <button
        class="button-back"
        type="button"
        @click="close"
      >
        <u-icon icon="app:arrow-left" />
      </button>
      <h2>Кнопки на карте</h2>
    </div>

    <p class="map-editor__hint">
      Нажмите, чтобы показать или скрыть
    </p>

    <div
      v-if="preview"
      class="map-editor__preview"
    >
      <button
        v-for="control in CONTROLS"
        :key="control.key"
        class="preview-button"
        :class="{ 'preview-button--off': !control.model.value }"
        type="button"
        :aria-label="control.label"
        :aria-pressed="control.model.value"
        @click="control.model.value = !control.model.value"
      >
        <span
          v-if="'text' in control"
          class="preview-button__text"
        >{{ control.text }}</span>
        <u-icon
          v-else
          :icon="control.icon"
          :loop="false"
          width="15"
        />
      </button>
    </div>

    <div class="map-editor__grid">
      <button
        v-for="control in CONTROLS"
        :key="control.key"
        class="control-tile"
        :class="{ 'control-tile--off': !control.model.value }"
        type="button"
        :aria-pressed="control.model.value"
        @click="control.model.value = !control.model.value"
      >
        <span class="control-tile__button">
          <span
            v-if="'text' in control"
            class="control-tile__text"
          >{{ control.text }}</span>
          <u-icon
            v-else
            :icon="control.icon"
            :loop="false"
            width="18"
          />
        </span>
        <span class="control-tile__label">{{ control.label }}</span>
      </button>
    </div>

    <p class="map-editor__note">
      Без кнопки редактора этот экран откроется из Профиль → Настройки
    </p>
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

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px 8px;
  }

  &__note {
    @include label-text(11px, none);
    margin: 0;
  }
}

// Превью — кнопки в одну строку на полосатом фоне; выключенные приглушены
.map-editor__preview {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 24px 12px;
  border-radius: 20px;
  border: 0.5px solid var(--border-subtle);
  background:
    repeating-linear-gradient(
      45deg,
      transparent 0 14px,
      color-mix(in srgb, var(--text-color) 4%, transparent) 14px 15px
    ),
    var(--surface-subtle);
}

.preview-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 12px;
  color: var(--text-color);
  background: var(--bg-block-solid, var(--bg-color-block));
  border: 0.5px solid var(--glass-border);
  box-shadow: var(--glass-shadow) 0 6px 16px;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    transform 0.12s ease;

  &:active {
    transform: scale(0.94);
  }

  &--off {
    opacity: 0.3;
  }

  &__text {
    @include value-text(12px, var(--text-color), 800);
  }
}

// Плитка повторяет кнопку на карте: выключенная — бледная и пунктирная
.control-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;

  &__button {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 15px;
    color: var(--text-color);
    background: var(--bg-block-solid, var(--bg-color-block));
    border: 1px solid var(--primary-color);
    box-shadow: var(--glass-shadow) 0 6px 16px;
    transition:
      opacity 0.2s ease,
      border-color 0.2s ease,
      transform 0.12s ease;
  }

  &:active &__button {
    transform: scale(0.94);
  }

  &__text {
    @include value-text(14px, var(--text-color), 800);
  }

  &__label {
    @include label-text(11px, none);
    color: var(--text-color);
    text-align: center;
  }

  &--off &__button {
    opacity: 0.4;
    border-style: dashed;
    border-color: var(--border-subtle);
    box-shadow: none;
  }

  &--off &__label {
    color: var(--text-color-secondary);
  }
}
</style>
