<script setup lang="ts">
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { tierOf } from '../model/tiers'
import { useAchievements } from '../model/useAchievements'
import AchievementDetail from './AchievementDetail.vue'

const props = defineProps<{
  userId: number
}>()

type FilterKey = 'all' | 'earned' | 'locked'
const FILTERS: { key: FilterKey, label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'earned', label: 'Открытые' },
  { key: 'locked', label: 'Закрытые' },
]
const filter = ref<FilterKey>('all')

const activeIndex = computed(() => FILTERS.findIndex(f => f.key === filter.value))

const { close, open } = useDialogStore()
const { items, unlockedIds, total, earnedCount, isLoading, error, load } = useAchievements(props.userId)

const rows = computed(() => items.value.map(achievement => ({
  achievement,
  tier: tierOf(achievement),
  nextTier: tierOf(achievement.next),
  earned: unlockedIds.value.has(achievement.id),
})))

const earnedRows = computed(() => rows.value.filter(r => r.earned))
const lockedRows = computed(() => rows.value.filter(r => !r.earned))

interface Row {
  achievement: typeof rows.value[number]['achievement']
  tier: ReturnType<typeof tierOf>
  nextTier: ReturnType<typeof tierOf>
  earned: boolean
}
type Entry
  = | { kind: 'header', label: string, count: number }
    | { kind: 'row', row: Row }

const entries = computed<Entry[]>(() => {
  if (filter.value === 'earned')
    return earnedRows.value.map(row => ({ kind: 'row', row }))
  if (filter.value === 'locked')
    return lockedRows.value.map(row => ({ kind: 'row', row }))

  const list: Entry[] = []
  if (earnedRows.value.length) {
    list.push({ kind: 'header', label: 'Открытые', count: earnedRows.value.length })
    earnedRows.value.forEach(row => list.push({ kind: 'row', row }))
  }
  if (lockedRows.value.length) {
    list.push({ kind: 'header', label: 'Закрытые', count: lockedRows.value.length })
    lockedRows.value.forEach(row => list.push({ kind: 'row', row }))
  }
  return list
})

const hasVisible = computed(() =>
  filter.value === 'earned' ? earnedRows.value.length > 0 : filter.value === 'locked' ? lockedRows.value.length > 0 : rows.value.length > 0,
)

function openDetail(id: number, earned: boolean) {
  open(AchievementDetail, { id, earned }, {
    position: 'end center',
    headerModal: false,
    width: '400px',
  })
}

onMounted(load)
</script>

<template>
  <div class="achievements-list">
    <div class="achievements-list__header">
      <button
        class="button-back"
        @click="close"
      >
        <u-icon icon="line-md:arrow-small-left" />
      </button>
      <h2>Достижения</h2>
      <span
        v-if="total"
        class="achievements-list__count"
      >{{ earnedCount }} / {{ total }}</span>
    </div>

    <div
      class="achievements-list__filter"
      :style="{ '--tabs': FILTERS.length, '--active': activeIndex }"
    >
      <span class="achievements-list__pill" />
      <button
        v-for="f in FILTERS"
        :key="f.key"
        type="button"
        class="achievements-list__tab"
        :class="{ 'is-active': filter === f.key }"
        @click="filter = f.key"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="achievements-list__body">
      <template
        v-for="entry in entries"
        :key="entry.kind === 'header' ? `h-${entry.label}` : entry.row.achievement.id"
      >
        <div
          v-if="entry.kind === 'header'"
          class="achievements-list__section"
        >
          <span>{{ entry.label }}</span>
          <span class="achievements-list__section-count">{{ entry.count }}</span>
        </div>

        <button
          v-else
          type="button"
          class="achive"
          :class="{ 'is-locked': !entry.row.earned }"
          :style="entry.row.tier ? { '--tier': entry.row.tier.color } : undefined"
          @click="openDetail(entry.row.achievement.id, entry.row.earned)"
        >
          <div
            class="achive__icon"
            :class="{ 'has-tier': !!entry.row.tier }"
          >
            <img
              :src="entry.row.achievement.icon"
              :alt="entry.row.achievement.title"
            >
          </div>

          <div class="achive__body">
            <div class="achive__top">
              <div class="achive__title-wrap">
                <span class="achive__title">{{ entry.row.achievement.title }}</span>
                <span
                  v-if="entry.row.tier"
                  class="achive__rank"
                  :style="{ '--tier': entry.row.tier.color }"
                >{{ entry.row.tier.label }}</span>
              </div>
              <span
                v-if="entry.row.achievement.reward?.amount"
                class="achive__xp"
              >+{{ entry.row.achievement.reward.amount }} XP</span>
            </div>
            <p class="achive__desc">
              {{ entry.row.achievement.desc }}
            </p>

            <div
              v-if="entry.row.achievement.next"
              class="achive__tiers"
            >
              <span class="achive__next-hint">Далее</span>
              <u-icon
                class="achive__arrow"
                icon="solar:alt-arrow-right-linear"
                width="14"
              />
              <span
                class="achive__tier is-next"
                :style="entry.row.nextTier ? { '--tier': entry.row.nextTier.color } : undefined"
              >{{ entry.row.nextTier?.label ?? entry.row.achievement.next.title }}</span>
            </div>

            <span
              class="achive__status"
              :class="{ 'is-earned': entry.row.earned }"
            >
              <u-icon
                :icon="entry.row.earned ? 'solar:check-circle-bold' : 'solar:lock-keyhole-minimalistic-linear'"
                width="13"
              />
              {{ entry.row.earned ? 'Получено' : 'Не получено' }}
            </span>
          </div>
        </button>
      </template>

      <div
        v-if="isLoading"
        class="achievements-list__state"
      >
        <u-icon
          icon="line-md:loading-twotone-loop"
          height="26"
        />
      </div>

      <div
        v-else-if="error"
        class="achievements-list__state"
      >
        {{ error }}
      </div>

      <div
        v-else-if="!items.length"
        class="achievements-list__state"
      >
        Достижений пока нет.
      </div>

      <div
        v-else-if="!hasVisible"
        class="achievements-list__state"
      >
        {{ filter === 'earned' ? 'Пока нет открытых достижений.' : 'Все достижения уже открыты 🎉' }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.achievements-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--profile-bg, var(--bg-color));
  color: var(--text-color);
  gap: 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;

    .button-back {
      @include glass-panel(12px, 10px, false);
      display: flex;
      cursor: pointer;
    }

    h2 {
      margin: 0;
      @include value-text(22px, var(--text-color), 700);
    }
  }

  &__count {
    margin-left: auto;
    @include label-text(12px, none);
    padding: 4px 10px;
    border-radius: 10px;
    background: var(--bg-color-block);
    font-variant-numeric: tabular-nums;
  }

  &__filter {
    position: relative;
    display: flex;
    padding: 4px;
    border-radius: 14px;
    background: var(--bg-color-block);
    border: 0.5px solid var(--border-subtle);
  }

  &__pill {
    position: absolute;
    top: 4px;
    left: 4px;
    bottom: 4px;
    width: calc((100% - 8px) / var(--tabs));
    border-radius: 10px;
    background: var(--primary-color);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--primary-color) 40%, transparent);
    transform: translateX(calc(var(--active) * 100%));
    transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  &__tab {
    position: relative;
    z-index: 1;
    flex: 1;
    padding: 9px 0;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    background: transparent;
    color: var(--text-color-secondary);
    font-size: 13px;
    font-weight: 600;
    transition: color 0.25s ease;

    &.is-active {
      color: #fff;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    @include label-text(12px, uppercase);

    &:first-child {
      margin-top: 0;
    }

    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-subtle);
    }
  }

  &__section-count {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--bg-color-block);
    font-variant-numeric: tabular-nums;
  }

  &__state,
  &__end {
    text-align: center;
    padding: 20px;
    @include label-text(13px, none);
    line-height: 1.4;
  }
}

.achive {
  display: flex;
  gap: 14px;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  @include glass-panel(16px, 14px, true, false);
  box-shadow: none;
  transition: transform 0.12s ease;

  &:active {
    transform: scale(0.99);
  }

  &.is-locked {
    opacity: 0.62;

    .achive__icon img {
      filter: grayscale(1);
    }
  }

  &__icon {
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);

    // подсветка ступени (bronze/silver/gold) — по --tier
    &.has-tier {
      background: color-mix(in srgb, var(--tier) 18%, transparent);
      box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--tier) 55%, transparent);
    }

    img {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex-wrap: wrap;
  }

  &__title {
    @include value-text(15px, var(--text-color), 700);
  }

  &__rank {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 7px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--tier);
    background: color-mix(in srgb, var(--tier) 16%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tier) 45%, transparent);
  }

  &__next-hint {
    @include label-text(11px, none);
  }

  &__xp {
    flex-shrink: 0;
    @include value-text(12px, var(--primary-color), 700);
    padding: 2px 8px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  }

  &__desc {
    margin: 0;
    @include label-text(12px, none);
    line-height: 1.4;
  }

  &__tiers {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__tier {
    flex-shrink: 0;
    padding: 2px 9px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;

    &.is-current {
      color: #fff;
      background: var(--tier, var(--primary-color));
    }

    &.is-next {
      color: var(--tier, var(--text-color-secondary));
      background: color-mix(in srgb, var(--tier, var(--text-color)) 14%, transparent);
    }
  }

  &__arrow {
    flex-shrink: 0;
    color: var(--text-color-muted);
  }

  &__status {
    margin-top: 4px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    @include label-text(11px, none);

    &.is-earned {
      color: var(--access-color, #3fb950);
    }
  }
}
</style>
