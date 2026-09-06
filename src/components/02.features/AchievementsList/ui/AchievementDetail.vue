<script setup lang="ts">
import type { CatalogAchievement } from '@/components/00.shared/services/achievement/index.type'
import { achievementApi } from '@/components/00.shared/services/achievement'
import { tierOf } from '../model/tiers'

const props = defineProps<{
  id: number
  earned?: boolean
}>()

const achievement = ref<CatalogAchievement | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const tier = computed(() => tierOf(achievement.value))
const nextTier = computed(() => tierOf(achievement.value?.next))

async function load() {
  isLoading.value = true
  error.value = null
  try {
    achievement.value = await achievementApi.getAchievementById(props.id)
  }
  catch (e) {
    console.error('[Achievement detail]', e)
    error.value = 'Не удалось загрузить достижение'
  }
  finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div
    class="ach"
    :style="tier ? { '--tier': tier.color } : undefined"
  >
    <div
      v-if="isLoading"
      class="ach__state"
    >
      <u-icon
        icon="line-md:loading-twotone-loop"
        height="28"
      />
    </div>

    <div
      v-else-if="error"
      class="ach__state"
    >
      {{ error }}
    </div>

    <template v-else-if="achievement">
      <div class="ach__hero">
        <div
          class="ach__icon"
          :class="{ 'is-locked': !earned }"
        >
          <img
            :src="achievement.icon"
            :alt="achievement.title"
          >
        </div>
      </div>

      <div class="ach__head">
        <h2 class="ach__title">
          {{ achievement.title }}
        </h2>
        <span
          v-if="tier"
          class="ach__rank"
          :style="{ '--tier': tier.color }"
        >{{ tier.label }}</span>
        <span
          class="ach__badge"
          :class="earned ? 'is-earned' : 'is-locked'"
        >
          <u-icon
            :icon="earned ? 'solar:check-circle-bold' : 'solar:lock-keyhole-minimalistic-bold'"
            width="13"
          />
          {{ earned ? 'Получено' : 'Не получено' }}
        </span>
      </div>

      <p class="ach__desc">
        {{ achievement.desc }}
      </p>

      <div class="ach__stats">
        <div class="ach__stat">
          <span class="ach__stat-label">Цель</span>
          <span class="ach__stat-value">{{ achievement.threshold }}</span>
        </div>
        <div class="ach__stat ach__stat--reward">
          <span class="ach__stat-label">Награда</span>
          <span class="ach__stat-value">+{{ achievement.reward?.amount ?? 0 }} XP</span>
        </div>
      </div>

      <div
        v-if="achievement.next"
        class="ach__next"
      >
        <img
          class="ach__next-icon"
          :src="achievement.next.icon"
          :alt="achievement.next.title"
        >
        <div class="ach__next-body">
          <span class="ach__next-label">Следующая ступень</span>
          <span class="ach__next-title">
            {{ nextTier?.label ?? achievement.next.title }}
          </span>
        </div>
        <span
          v-if="achievement.next.reward?.amount"
          class="ach__next-xp"
        >+{{ achievement.next.reward.amount }} XP</span>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.ach {
  --tier: var(--primary-color);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;

  &__close {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 2;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: var(--text-color);
    background: var(--surface-subtle);
  }

  &__state {
    padding: 48px;
    color: var(--text-color-muted);
  }

  &__hero {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    padding: 8px 0 4px;

    &::before {
      content: '';
      position: absolute;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: radial-gradient(circle, color-mix(in srgb, var(--tier) 32%, transparent), transparent 70%);
      filter: blur(6px);
    }
  }

  &__icon {
    position: relative;
    width: 88px;
    height: 88px;
    display: grid;
    place-items: center;
    border-radius: 24px;
    background: color-mix(in srgb, var(--tier) 16%, transparent);
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--tier) 55%, transparent);

    &.is-locked img {
      filter: grayscale(1);
      opacity: 0.7;
    }

    img {
      width: 52px;
      height: 52px;
      object-fit: contain;
    }
  }

  &__head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  &__title {
    margin: 0;
    @include value-text(21px, var(--text-color), 700);
    letter-spacing: -0.3px;
  }

  &__rank {
    padding: 3px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--tier);
    background: color-mix(in srgb, var(--tier) 16%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tier) 45%, transparent);
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 11px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;

    &.is-earned {
      color: var(--access-color, #3fb950);
      background: color-mix(in srgb, var(--access-color, #3fb950) 14%, transparent);
    }

    &.is-locked {
      color: var(--text-color-secondary);
      background: var(--surface-subtle);
    }
  }

  &__desc {
    margin: 0;
    @include label-text(13px, none);
    line-height: 1.5;
  }

  &__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
    margin-top: 2px;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--bg-color-block);
    border: 0.5px solid var(--border-subtle);

    &--reward {
      color: #fff;
      border-color: transparent;
      @include gradient();

      .ach__stat-label {
        color: rgba(255, 255, 255, 0.75);
      }
      .ach__stat-value {
        color: #fff;
      }
    }
  }

  &__stat-label {
    @include label-text(11px);
  }

  &__stat-value {
    @include value-text(18px, var(--text-color), 700);
    font-variant-numeric: tabular-nums;
  }

  &__next {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    border-radius: 14px;
    text-align: left;
    background: var(--surface-subtle);
    border: 0.5px solid var(--border-subtle);

    &-icon {
      width: 38px;
      height: 38px;
      object-fit: contain;
      filter: grayscale(1);
      opacity: 0.85;
      flex-shrink: 0;
    }

    &-body {
      display: flex;
      flex-direction: column;
      gap: 1px;
      flex: 1;
      min-width: 0;
    }

    &-label {
      @include label-text(10px);
    }

    &-title {
      @include value-text(14px, var(--text-color), 700);
    }

    &-xp {
      flex-shrink: 0;
      @include value-text(12px, var(--primary-color), 700);
    }
  }
}
</style>
