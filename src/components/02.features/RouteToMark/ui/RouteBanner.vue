<script setup lang="ts">
import type { RouteProfile } from '../model/fetchRoute'
import { storeToRefs } from 'pinia'
import { useRouteStore } from '../model/useRoute'

const store = useRouteStore()
const { profile, isBuilding, formattedDistance, formattedDuration } = storeToRefs(store)

const modes: { id: RouteProfile, icon: string, label: string }[] = [
  {
    id: 'foot-walking',
    icon: 'material-symbols:directions-walk-rounded',
    label: 'Пешком',
  },
  {
    id: 'cycling-regular',
    icon: 'material-symbols:directions-bike-rounded',
    label: 'Вело',
  },
  {
    id: 'driving-car',
    icon: 'material-symbols:directions-car-rounded',
    label: 'Авто',
  },
]

const expanded = ref(false)
const activeMode = computed(() => modes.find(m => m.id === profile.value) ?? modes[0])
</script>

<template>
  <div
    class="route-widget"
    :class="{ 'route-widget--expanded': expanded }"
  >
    <button
      class="head"
      type="button"
      @click="expanded = !expanded"
    >
      <u-icon
        class="head__icon"
        :icon="isBuilding ? 'line-md:loading-twotone-loop' : activeMode.icon"
        height="18"
      />
      <span class="head__text">
        <template v-if="isBuilding">Строю…</template>
        <template v-else>
          <span class="accent">{{ formattedDistance }}</span> · {{ formattedDuration }}
        </template>
      </span>
      <u-icon
        class="head__chevron"
        icon="line-md:chevron-down"
        height="16"
      />
    </button>

    <div class="drawer">
      <div class="drawer__wrapper">
        <div class="drawer__inner">
          <div class="modes">
            <button
              v-for="mode in modes"
              :key="mode.id"
              class="mode"
              :class="{ 'mode--active': profile === mode.id }"
              type="button"
              @click="store.setProfile(mode.id)"
            >
              <u-icon
                :icon="mode.icon"
                height="22"
              />
              <span>{{ mode.label }}</span>
            </button>
          </div>

          <button
            class="remove"
            type="button"
            @click="store.clearRoute()"
          >
            Убрать маршрут
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.route-widget {
  @include glass-panel(22px, 0, false);
  position: absolute;
  top: calc(74px + var(--safe-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  width: 180px;
  max-width: calc(100% - 24px);
  overflow: hidden;
  transition:
    width 0.4s cubic-bezier(0.25, 1, 0.5, 1),
    border-radius 0.4s cubic-bezier(0.25, 1, 0.5, 1);

  &--expanded {
    width: 300px;
    border-radius: 20px;

    .head__chevron {
      transform: rotate(180deg);
    }
  }
}

.accent {
  color: var(--secondary-color, rgb(169, 140, 255));
  font-weight: 700;
}

.head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  cursor: pointer;
  background: transparent;
  border: none;
  outline: none;

  &__icon {
    color: var(--secondary-color, rgb(169, 140, 255));
    flex-shrink: 0;
  }

  &__text {
    white-space: nowrap;
    flex: 1;
    text-align: left;
    @include value-text(14px, var(--text-color), 600);
  }

  &__chevron {
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
}

.drawer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.25, 1, 0.5, 1);

  &__wrapper {
    min-height: 0;
    overflow: hidden;
  }

  &__inner {
    display: flex;
    flex-direction: column;
    gap: 10px;
    /* Паддинг всегда на месте, прыжков не будет */
    padding: 0 12px 12px;
    opacity: 0;
    transform: translateY(-8px);
    transition:
      opacity 0.25s ease,
      transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  }
}

.route-widget--expanded .drawer {
  grid-template-rows: 1fr;
}

.route-widget--expanded .drawer__inner {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.05s;
}

.modes {
  display: flex;
  gap: 8px;
}

.mode {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 12px 4px;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  border: none;
  font-size: 12px;
  font-weight: 500;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &--active {
    color: #fff;
    background: var(--secondary-color, rgb(169, 140, 255));
  }
}

.remove {
  width: 100%;
  padding: 11px;
  border-radius: 12px;
  background: rgba(229, 72, 77, 0.12);
  border: 1px solid rgba(229, 72, 77, 0.3);
  @include value-text(14px, rgb(255, 113, 118), 600);
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.7;
  }
}
</style>
