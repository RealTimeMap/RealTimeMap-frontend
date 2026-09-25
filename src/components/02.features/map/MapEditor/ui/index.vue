<script setup lang="ts">
import type { MapSeasonMode } from '@/components/00.shared/stores/settings/parts/useMapLayers'
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { matchPreset, VIEW_PRESETS } from '../model/viewPresets'

const { preview = true } = defineProps<{
  preview?: boolean
}>()

const settings = useSettingsStore()
const {
  showMapZoom,
  showMapLocate,
  showMapSettings,
  showMapZoomLevel,
  showBuildings3D,
  showTrees,
  animateWater,
  markPreviewSwipe,
  mapSeason,
} = storeToRefs(settings)

const SEASON_OPTIONS: { value: MapSeasonMode, label: string }[] = [
  { value: 'auto', label: 'Авто' },
  { value: 'spring', label: 'Весна' },
  { value: 'summer', label: 'Лето' },
  { value: 'autumn', label: 'Осень' },
  { value: 'winter', label: 'Зима' },
  { value: 'off', label: 'Выкл.' },
]
const { close } = useDialogStore()

const activePreset = computed(() => matchPreset({
  buildings: showBuildings3D.value,
  trees: showTrees.value,
  water: animateWater.value,
}))

function applyPreset(effects: (typeof VIEW_PRESETS)[number]['effects']) {
  showBuildings3D.value = effects.buildings
  showTrees.value = effects.trees
  animateWater.value = effects.water
}

/** Тонкая настройка свёрнута; если пресет не совпал — раскрыта, чтобы было видно, что включено. */
const showDetails = ref(activePreset.value === null)
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
          :class="{ 'mc-stack__group--disabled': !showMapZoom }"
          class="mc-stack__group mc-stack__group--zoom"
        >
          <u-icon
            icon="app:plus"
            width="16"
          />
          <span class="mc-stack__line" />
          <u-icon
            icon="app:minus"
            width="16"
          />
        </div>
        <div
          :class="{ 'mc-stack__group--disabled': !showMapLocate }"
          class="mc-stack__group"
        >
          <u-icon
            icon="app:locate-loop"
            width="16"
          />
        </div>
        <div
          :class="{ 'mc-stack__group--disabled': !showMapSettings }"
          class="mc-stack__group"
        >
          <u-icon
            icon="app:settings"
            width="16"
          />
        </div>
        <div
          :class="{ 'mc-stack__group--disabled': !showMapZoomLevel }"
          class="mc-stack__group mc-stack__zoom"
        >
          <span class="mc-stack__zoom-value">12</span>
          <span class="mc-stack__zoom-label">ZOOM</span>
        </div>
      </div>
    </div>

    <div class="map-editor__rows">
      <div class="me-row">
        <span class="me-row__icon"><u-icon
          icon="app:zoom-in"
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
          icon="app:locate-loop"
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
          icon="app:settings"
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
          icon="app:gauge"
          width="18"
        /></span>
        <div class="me-row__text">
          <span class="me-row__label">Индикатор зума</span>
          <span class="me-row__hint">Текущий уровень масштаба</span>
        </div>
        <u-switch v-model="showMapZoomLevel" />
      </div>
    </div>

    <p class="map-editor__hint map-editor__hint--section">
      Вид карты
    </p>

    <div
      class="view-presets"
      role="radiogroup"
      aria-label="Вид карты"
    >
      <button
        v-for="preset in VIEW_PRESETS"
        :key="preset.id"
        class="view-presets__option"
        :class="{ 'view-presets__option--active': activePreset === preset.id }"
        type="button"
        role="radio"
        :aria-checked="activePreset === preset.id"
        @click="applyPreset(preset.effects)"
      >
        <span class="view-presets__label">{{ preset.label }}</span>
        <span class="view-presets__hint">{{ preset.hint }}</span>
      </button>
    </div>

    <button
      class="view-details"
      type="button"
      :aria-expanded="showDetails"
      @click="showDetails = !showDetails"
    >
      {{ activePreset ? 'Настроить по отдельности' : 'Своя настройка' }}
      <u-icon
        class="view-details__chevron"
        :class="{ 'view-details__chevron--open': showDetails }"
        icon="app:arrow-filled"
        width="9"
      />
    </button>

    <div class="map-editor__rows">
      <template v-if="showDetails">
        <div class="me-row">
          <span class="me-row__icon"><u-icon
            icon="app:city"
            width="18"
          /></span>
          <div class="me-row__text">
            <span class="me-row__label">3D-здания</span>
            <span class="me-row__hint">Объёмные дома с тенями на крупном масштабе</span>
          </div>
          <u-switch v-model="showBuildings3D" />
        </div>

        <div class="me-row">
          <span class="me-row__icon"><u-icon
            icon="app:tree"
            width="18"
          /></span>
          <div class="me-row__text">
            <span class="me-row__label">Деревья</span>
            <span class="me-row__hint">Кроны в парках и лесах, меняют цвет вместе с сезоном</span>
          </div>
          <u-switch v-model="showTrees" />
        </div>

        <div class="me-row">
          <span class="me-row__icon"><u-icon
            icon="app:map-loop"
            width="18"
          /></span>
          <div class="me-row__text">
            <span class="me-row__label">Живая вода</span>
            <span class="me-row__hint">Блики на реках и прудах, зимой — лёд</span>
          </div>
          <u-switch v-model="animateWater" />
        </div>
      </template>

      <div class="me-row">
        <span class="me-row__icon"><u-icon
          icon="app:arrow-right"
          width="18"
        /></span>
        <div class="me-row__text">
          <span class="me-row__label">Листание меток</span>
          <span class="me-row__hint">Свайп по карточке метки переключает на соседние</span>
        </div>
        <u-switch v-model="markPreviewSwipe" />
      </div>

      <div class="me-row me-row--stacked">
        <div class="me-row__head">
          <span class="me-row__icon"><u-icon
            icon="app:map-loop"
            width="18"
          /></span>
          <div class="me-row__text">
            <span class="me-row__label">Сезон карты</span>
            <span class="me-row__hint">Осенью парки желтеют, зимой город в снегу. «Авто» — по дате и вашей широте</span>
          </div>
        </div>
        <div
          class="season-picker"
          role="radiogroup"
          aria-label="Сезон карты"
        >
          <button
            v-for="option in SEASON_OPTIONS"
            :key="option.value"
            class="season-picker__option"
            :class="{ 'season-picker__option--active': mapSeason === option.value }"
            type="button"
            role="radio"
            :aria-checked="mapSeason === option.value"
            @click="mapSeason = option.value"
          >
            {{ option.label }}
          </button>
        </div>
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

    &--section {
      margin: 4px 0 -8px;
    }
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

    &--disabled {
      opacity: 0.3;
      pointer-events: none;
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

  &--stacked {
    flex-direction: column;
    align-items: stretch;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.view-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  &__option {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 10px;
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    background: var(--surface-subtle);
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;

    &--active {
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 10%, var(--surface-subtle));
    }
  }

  &__label {
    @include value-text(14px, var(--text-color), 700);
  }

  &__option--active &__label {
    color: var(--primary-color);
  }

  &__hint {
    @include label-text(11px, none);
    line-height: 1.3;
  }
}

.view-details {
  display: flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  margin: -6px 0 -6px;
  padding: 4px 0;
  border: none;
  background: none;
  @include value-text(13px, var(--primary-color), 600);
  cursor: pointer;

  &__chevron {
    transform: rotate(90deg);
    transition: transform 0.2s ease;

    &--open {
      transform: rotate(-90deg);
    }
  }
}

.season-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 46px;

  &__option {
    padding: 6px 12px;
    border: 0.5px solid var(--border-subtle);
    border-radius: 999px;
    background: var(--surface-subtle);
    @include value-text(13px, var(--text-color), 600);
    cursor: pointer;
    transition:
      background 0.15s ease,
      color 0.15s ease;

    &--active {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: #fff;
    }
  }
}
</style>
