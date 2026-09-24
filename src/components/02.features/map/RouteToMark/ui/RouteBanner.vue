<script setup lang="ts">
import type { RouteProfile } from '../model/fetchRoute'
import { useRouteStore } from '../model/useRoute'

const store = useRouteStore()
const { profile, isBuilding, formattedDistance, formattedDuration } = storeToRefs(store)

const modes: { id: RouteProfile, icon: string, label: string }[] = [
  { id: 'foot-walking', icon: 'app:walk', label: 'Пешком' },
  { id: 'cycling-regular', icon: 'app:bike', label: 'Вело' },
  { id: 'driving-car', icon: 'app:car', label: 'Авто' },
]

const expanded = ref(false)
const activeMode = computed(() => modes.find(m => m.id === profile.value) ?? modes[0])

const textRef = ref<HTMLElement | null>(null)
const collapsedWidth = ref(180)
const isMounted = ref(false)

function calculateCompactWidth() {
  if (!textRef.value)
    return
  const textWidth = textRef.value.offsetWidth
  collapsedWidth.value = textWidth + 80
}

watch([formattedDistance, formattedDuration, isBuilding], async () => {
  await nextTick()
  calculateCompactWidth()
})

onMounted(async () => {
  await nextTick()
  calculateCompactWidth()
  isMounted.value = true
})

const currentWidth = computed(() => (expanded.value ? 290 : collapsedWidth.value))

function toggleExpand() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div
    class="route-widget"
    :class="{ 'route-widget--expanded': expanded }"
    :style="{ width: isMounted ? `${currentWidth}px` : 'max-content' }"
  >
    <button
      class="head"
      type="button"
      @click="toggleExpand"
    >
      <u-icon
        class="head__icon"
        :icon="isBuilding ? 'app:loading' : activeMode.icon"
        height="18"
      />

      <span class="head__text">
        <span
          ref="textRef"
          class="head__measure"
        >
          <template v-if="isBuilding">Строю…</template>
          <template v-else>
            <span class="accent">{{ formattedDistance }}</span> · {{ formattedDuration }}
          </template>
        </span>
      </span>

      <u-icon
        class="head__chevron"
        icon="app:chevron-down"
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
$ease-ios: cubic-bezier(0.25, 1, 0.5, 1);

.route-widget {
  @include glass-panel(22px, 0, false);
  position: absolute;
  top: calc(74px + var(--safe-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  overflow: hidden;
  box-sizing: border-box;

  transition:
    width 0.35s $ease-ios,
    border-radius 0.35s $ease-ios;

  &--expanded {
    border-radius: 20px;

    .head__chevron {
      transform: rotate(180deg);
    }

    .drawer {
      grid-template-rows: 1fr;
    }

    .drawer__inner {
      opacity: 1;
      transform: translateY(0);
      visibility: visible;
      transition-delay: 0.05s;
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
  padding: 9px 12px;
  cursor: pointer;
  background: transparent;
  border: none;
  outline: none;
  box-sizing: border-box;

  &__icon {
    color: var(--secondary-color, rgb(169, 140, 255));
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    display: flex;
    overflow: hidden;
    white-space: nowrap;
    @include value-text(14px, var(--text-color), 600);
  }

  &__measure {
    display: inline-block;
    width: max-content;
    white-space: nowrap;
  }

  &__chevron {
    color: var(--text-color-secondary);
    flex-shrink: 0;
    transition: transform 0.35s $ease-ios;
  }
}

.drawer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s $ease-ios;

  &__wrapper {
    min-height: 0;
    overflow: hidden;
  }

  &__inner {
    width: 290px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 12px 12px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-6px);
    transition:
      opacity 0.2s ease,
      transform 0.25s $ease-ios,
      visibility 0.2s;
  }
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
  padding: 11px 4px;
  border-radius: 14px;
  color: var(--text-color-secondary);
  background: var(--surface-subtle);
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
  padding: 10px;
  border-radius: 12px;
  background: rgba(229, 72, 77, 0.12);
  border: 1px solid rgba(229, 72, 77, 0.3);
  @include value-text(13px, rgb(255, 113, 118), 600);
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.7;
  }
}
</style>
