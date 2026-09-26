<script setup lang="ts">
import type { MapSeasonMode } from '@/components/00.shared/stores/settings/parts/useMapLayers'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { matchPreset, VIEW_PRESETS } from '../model/viewPresets'

const {
  showBuildings3D,
  showTrees,
  animateWater,
  markPreviewSwipe,
  mapSeason,
} = storeToRefs(useSettingsStore())

const SEASON_OPTIONS: { value: MapSeasonMode, label: string }[] = [
  { value: 'auto', label: 'Авто' },
  { value: 'spring', label: 'Весна' },
  { value: 'summer', label: 'Лето' },
  { value: 'autumn', label: 'Осень' },
  { value: 'winter', label: 'Зима' },
  { value: 'off', label: 'Выкл.' },
]

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
  <div class="map-view">
    <p class="map-view__title">
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

    <div class="map-view__rows">
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
.map-view {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__title {
    @include label-text(13px, none);
    margin: 4px 0 -8px;
  }

  &__rows {
    display: flex;
    flex-direction: column;
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
