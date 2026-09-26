<script setup lang="ts">
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import MapViewSection from './MapViewSection.vue'

const settings = useSettingsStore()
const {
  showPublicMarks,
  showPersonalMarks,
  showHeatmap,
  showWeather,
} = storeToRefs(settings)
</script>

<template>
  <div class="map-layers">
    <div class="map-layers__header">
      <h2>Слои карты</h2>
    </div>

    <p class="map-layers__hint">
      Что показывать на карте
    </p>

    <div class="map-layers__rows">
      <div class="me-row">
        <span class="me-row__icon"><u-icon
          icon="app:map-loop"
          width="18"
        /></span>
        <div class="me-row__text">
          <span class="me-row__label">Публичные метки</span>
          <span class="me-row__hint">Всё, что видно всем вокруг</span>
        </div>
        <u-switch v-model="showPublicMarks" />
      </div>

      <div class="me-row">
        <span class="me-row__icon"><u-icon
          icon="app:places-loop"
          width="18"
        /></span>
        <div class="me-row__text">
          <span class="me-row__label">Личные метки</span>
          <span class="me-row__hint">Только ваши</span>
        </div>
        <u-switch v-model="showPersonalMarks" />
      </div>

      <div class="me-row">
        <span class="me-row__icon"><u-icon
          icon="app:flame-loop"
          width="18"
        /></span>
        <div class="me-row__text">
          <span class="me-row__label">Тепловая карта</span>
          <span class="me-row__hint">Где больше всего активности — вместо кружков-кластеров</span>
        </div>
        <u-switch v-model="showHeatmap" />
      </div>

      <div class="me-row">
        <span class="me-row__icon"><u-icon
          icon="app:weather-partly"
          width="18"
        /></span>
        <div class="me-row__text">
          <span class="me-row__label">Погода</span>
          <span class="me-row__hint">Температура и когда начнётся дождь или снег</span>
        </div>
        <u-switch v-model="showWeather" />
      </div>
    </div>

    <map-view-section />
  </div>
</template>

<style scoped lang="scss">
.map-layers {
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
}
</style>
