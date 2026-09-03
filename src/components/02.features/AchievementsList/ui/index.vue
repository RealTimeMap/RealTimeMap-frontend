<script setup lang="ts">
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { tierOf } from '../model/tiers'
import { useAchievements } from '../model/useAchievements'

const props = defineProps<{
  userId: number
}>()

const { close } = useDialogStore()
const { items, total, hasNext, isLoading, error, loadMore } = useAchievements(props.userId)

const rows = computed(() => items.value.map(item => ({
  item,
  tier: tierOf(item.achievement),
  nextTier: tierOf(item.achievement.next),
})))

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime()))
    return ''
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 240)
    loadMore()
}

onMounted(loadMore)
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
      >{{ total }}</span>
    </div>

    <div
      class="achievements-list__body"
      @scroll="onScroll"
    >
      <div
        v-for="{ item, tier, nextTier } in rows"
        :key="item.achievement.id"
        class="achive"
        :style="tier ? { '--tier': tier.color } : undefined"
      >
        <div
          class="achive__icon"
          :class="{ 'has-tier': !!tier }"
        >
          <img
            :src="item.achievement.icon"
            :alt="item.achievement.title"
          >
        </div>

        <div class="achive__body">
          <div class="achive__top">
            <span class="achive__title">{{ item.achievement.title }}</span>
            <span
              v-if="item.achievement.reward?.amount"
              class="achive__xp"
            >+{{ item.achievement.reward.amount }} XP</span>
          </div>
          <p class="achive__desc">
            {{ item.achievement.desc }}
          </p>

          <div
            v-if="tier || item.achievement.next"
            class="achive__tiers"
          >
            <span
              v-if="tier"
              class="achive__tier is-current"
            >{{ tier.label }}</span>

            <template v-if="item.achievement.next">
              <div class="achive__bar">
                <div
                  class="achive__bar-fill"
                  :style="{ width: `${item.progress ?? 0}%` }"
                />
              </div>
              <span
                class="achive__tier is-next"
                :style="nextTier ? { '--tier': nextTier.color } : undefined"
              >{{ nextTier?.label ?? item.achievement.next.title }}</span>
            </template>
          </div>

          <span class="achive__date">Получено {{ formatDate(item.unlockedAt) }}</span>
        </div>
      </div>

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
        Пока нет полученных достижений — действуйте на карте, чтобы открыть первое.
      </div>

      <div
        v-else-if="!hasNext"
        class="achievements-list__end"
      >
        Это всё 🎉
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
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
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
  @include glass-panel(16px, 14px, false);
  box-shadow: none;

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

  &__title {
    @include value-text(15px, var(--text-color), 700);
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

  // Трек ступеней: [текущая] → прогресс → [следующая]
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

  &__bar {
    flex: 1;
    height: 5px;
    border-radius: 3px;
    overflow: hidden;
    background: color-mix(in srgb, var(--text-color) 8%, transparent);
  }

  &__bar-fill {
    height: 100%;
    border-radius: 3px;
    background: var(--tier, var(--primary-color));
    transition: width 0.3s ease;
  }

  &__date {
    margin-top: 2px;
    @include label-text(11px, none);
  }
}
</style>
