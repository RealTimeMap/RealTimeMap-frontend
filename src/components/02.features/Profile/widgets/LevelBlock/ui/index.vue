<script setup lang="ts">
import type { UserGemefication } from '@/utils/user/index.type'

const props = defineProps<{
  gamification: UserGemefication
}>()

const remainingXp = computed(() => {
  return props.gamification.xpForNextLevel - props.gamification.currentXp
})
</script>

<template>
  <div class="level-card">
    <div class="level-card__main">
      <div class="level-badge">
        <span class="level-badge__label">УР.</span>
        <span class="level-badge__value">{{ gamification.currentLevel }}</span>
      </div>

      <div class="level-info">
        <div class="level-info__header">
          <h3 class="current-rank">
            {{ gamification.currentLevelName }}
          </h3>
          <span class="rank-tag">ЗВАНИЕ</span>
        </div>

        <div class="xp-stats">
          <span class="xp-stats__current">
            {{ gamification.currentXp }} / {{ gamification.xpForNextLevel }} XP
          </span>
          <span class="xp-stats__divider">
            •
          </span>
          <span class="xp-stats__remaining">
            ещё {{ remainingXp }} до ур. {{ gamification.nextLevel.level }}
          </span>
        </div>

        <div class="progress-container">
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${gamification.progressPercent}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <u-drawer />

    <div class="level-card__footer">
      <span class="footer-label">Следующее звание</span>
      <div class="next-rank">
        <u-icon
          icon="solar:bank-bold"
          width="16"
        />
        <span class="next-rank__name">
          {{ gamification.nextLevel.levelName }}
          <span class="next-rank__level">· ур. {{ gamification.nextLevel.level }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.level-card {
  @include glass-panel(20px, 14px);
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__main {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.level-badge {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, #5370f9 0%, #7c4dff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(83, 112, 249, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);

  &__label {
    @include label-text(9px);
    font-weight: 800;
    letter-spacing: 0.5px;
  }

  &__value {
    @include value-text(22px);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.5px;
  }
}

.level-info {
  flex-grow: 1;

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;

    .current-rank {
      @include value-text(20px);
    }

    .rank-tag {
      background: rgba(255, 255, 255, 0.06);
      border: 0.5px solid rgba(255, 255, 255, 0.08);
      padding: 2px 6px;
      border-radius: 5px;
      @include label-text(9px);
    }
  }
}

.xp-stats {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 600;
  display: flex;
  gap: 6px;

  &__current {
    color: rgba(255, 255, 255, 0.5);
  }
}

.progress-container {
  width: 100%;

  .progress-track {
    height: 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #5370f9 0%, #7c4dff 100%);
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(83, 112, 249, 0.5);
    transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.footer-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  font-weight: 500;
}

.next-rank {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);

  svg {
    color: rgba(255, 255, 255, 0.3);
  }

  &__name {
    font-size: 13px;
    font-weight: 700;
  }

  &__level {
    color: rgba(255, 255, 255, 0.3);
    font-weight: 500;
  }
}
</style>
