<script setup lang="ts">
import type { Mark, MarkFull } from '@/components/00.shared/services/mark/index.type'
import type { MapPoint } from '@/types/shared/map'
import { storeToRefs } from 'pinia'
import { distanceMeters, formatDistance } from '@/components/00.shared/lib/geo'
import { markApi } from '@/components/00.shared/services/mark'
import { useAuthStore } from '@/components/00.shared/stores/auth'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { markLifespan } from '../model/markLifespan'
import { useMarksViewStore } from '../model/marksView'

const props = defineProps<{
  userCoordinates: MapPoint | null
}>()

/** Подробности (автор, категория) догружаем только для первых карточек — дальше лента редко листается. */
const DETAILS_LIMIT = 20

const view = useMarksViewStore()
const { marks, previewId } = storeToRefs(view)
const { showNearbyStrip } = storeToRefs(useSettingsStore())
const authStore = useAuthStore()

interface NearbyItem {
  mark: Mark
  distance: number | null
}

const items = computed<NearbyItem[]>(() => {
  const user = props.userCoordinates
  return marks.value
    .map(mark => ({ mark, distance: user ? distanceMeters(user, mark.geom.coordinates as MapPoint) : null }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
})

// --- Подробности меток ---
const details = shallowRef(new Map<number, MarkFull>())
const requested = new Set<number>()

watch(items, async (list) => {
  for (const { mark } of list.slice(0, DETAILS_LIMIT)) {
    if (requested.has(mark.id))
      continue
    requested.add(mark.id)
    try {
      const full = await markApi.getMarkFull(mark.id)
      details.value = new Map(details.value).set(mark.id, full)
    }
    catch {
      // Карточка остаётся без автора и категории
    }
  }
}, { immediate: true })

type Status = 'own' | 'active' | 'expiring' | 'ended' | 'unknown'

function statusOf(item: NearbyItem): Status {
  const lifespan = markLifespan(item.mark, Date.now())
  const full = details.value.get(item.mark.id)
  const endAt = lifespan?.endAt ?? Date.parse(full?.date?.endAt ?? '')
  if (Number.isFinite(endAt) && endAt <= Date.now())
    return 'ended'
  if (full?.owner?.id && full.owner.id === authStore.user?.userId)
    return 'own'
  if (lifespan?.expiring)
    return 'expiring'
  return Number.isFinite(endAt) ? 'active' : 'unknown'
}

const STATUS_LABEL: Record<Status, string> = {
  own: 'Ваша · активна',
  active: 'Активна',
  expiring: 'Скоро закончится',
  ended: 'Завершилась',
  unknown: 'Метка',
}

function subtitle(item: NearbyItem): string {
  const full = details.value.get(item.mark.id)
  return [
    full?.category?.categoryName,
    full?.owner ? `@${full.owner.tag || full.owner.username}` : null,
  ].filter(Boolean).join(' · ')
}

const countLabel = computed(() => {
  const n = marks.value.length
  const mod10 = n % 10
  const mod100 = n % 100
  const word = mod10 === 1 && mod100 !== 11
    ? 'метка'
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'метки' : 'меток'
  return `${n} ${word} рядом`
})

function select(item: NearbyItem) {
  view.preview(item.mark.id, { fly: true })
}

// Открытую метку держим в видимой части ленты
const strip = ref<HTMLElement | null>(null)
watch(previewId, async (id) => {
  if (id === null || !showNearbyStrip.value)
    return
  await nextTick()
  strip.value?.querySelector<HTMLElement>(`[data-mark-id="${id}"]`)
    ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
})
</script>

<template>
  <transition
    name="nearby"
    mode="out-in"
  >
    <section
      v-if="marks.length && showNearbyStrip"
      key="strip"
      class="nearby"
      aria-label="Метки рядом"
    >
      <button
        class="nearby__hide"
        type="button"
        @click="showNearbyStrip = false"
      >
        Скрыть
        <u-icon
          icon="app:arrow-down"
          width="12"
        />
      </button>

      <ul
        ref="strip"
        class="nearby__strip"
      >
        <li
          v-for="item in items"
          :key="item.mark.id"
          :data-mark-id="item.mark.id"
        >
          <button
            class="nearby-card"
            :class="[`nearby-card--status-${statusOf(item)}`, { 'nearby-card--selected': previewId === item.mark.id }]"
            type="button"
            @click="select(item)"
          >
            <span class="nearby-card__top">
              <span class="nearby-card__status">
                <span class="nearby-card__dot" />
                {{ STATUS_LABEL[statusOf(item)] }}
              </span>
              <span
                v-if="item.distance !== null"
                class="nearby-card__distance"
              >{{ formatDistance(item.distance) }}</span>
            </span>
            <span class="nearby-card__title">{{ item.mark.markName }}</span>
            <span
              v-if="subtitle(item)"
              class="nearby-card__subtitle"
            >{{ subtitle(item) }}</span>
          </button>
        </li>
      </ul>
    </section>

    <button
      v-else-if="marks.length"
      key="pill"
      class="nearby-pill"
      type="button"
      @click="showNearbyStrip = true"
    >
      <u-icon
        icon="app:places-loop"
        :loop="false"
        width="16"
      />
      {{ countLabel }}
    </button>
  </transition>
</template>

<style scoped lang="scss">
$above-nav: calc(108px + var(--safe-bottom));

.nearby {
  --status-active: oklch(0.74 0.15 150);
  --status-expiring: oklch(0.78 0.14 75);

  position: fixed;
  left: 0;
  right: 0;
  bottom: $above-nav;
  z-index: 6;
  pointer-events: none;

  &__hide {
    pointer-events: auto;
    position: absolute;
    left: 5%;
    top: -30px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 0.5px solid var(--glass-border);
    border-radius: 999px;
    background: var(--bg-block-solid, var(--bg-color-block));
    @include label-text(11px, none);
    cursor: pointer;
  }

  &__strip {
    pointer-events: auto;
    list-style: none;
    margin: 0;
    padding: 0 5%;
    display: flex;
    gap: 10px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: 5%;
    overscroll-behavior-x: contain;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    li {
      flex: 0 0 auto;
      scroll-snap-align: start;
    }
  }
}

.nearby-card {
  --dot: var(--text-color-secondary);

  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 232px;
  height: 88px;
  padding: 10px 14px;
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  background: var(--bg-block-solid, var(--bg-color-block));
  box-shadow: var(--glass-shadow) 0 8px 24px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.12s ease;

  &:active {
    transform: scale(0.98);
  }

  &--selected {
    border-color: var(--primary-color);
  }

  &--status-own {
    --dot: var(--primary-color);
  }

  &--status-active {
    --dot: var(--status-active);
  }

  &--status-expiring {
    --dot: var(--status-expiring);
  }

  &--status-ended {
    --dot: var(--text-color-secondary);
    opacity: 0.7;
  }

  &__top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    @include label-text(11px, uppercase);
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__dot {
    flex: 0 0 auto;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--dot);
  }

  &__distance {
    flex: 0 0 auto;
    @include label-text(11px, none);
    font-variant-numeric: tabular-nums;
  }

  &__title {
    @include value-text(15px, var(--text-color), 800);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__subtitle {
    @include label-text(12px, none);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.nearby-pill {
  position: fixed;
  left: 50%;
  bottom: $above-nav;
  transform: translateX(-50%);
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 0.5px solid var(--glass-border);
  border-radius: 999px;
  background: var(--bg-block-solid, var(--bg-color-block));
  box-shadow: var(--glass-shadow) 0 8px 24px;
  @include value-text(13px, var(--text-color), 700);
  cursor: pointer;

  :deep(svg) {
    color: var(--primary-color);
  }
}

.nearby-enter-active,
.nearby-leave-active {
  transition:
    opacity 0.22s ease,
    translate 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.nearby-enter-from,
.nearby-leave-to {
  opacity: 0;
  translate: 0 16px;
}
</style>
