<script setup lang="ts">
import { NAvatar } from 'naive-ui'
import { useAuthStore } from '../../Authentication/models/auth'
import { StatsFull, StatsSummary } from '../widgets/ProfileStats/index'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
// --- БИЗНЕС-ЛОГИКА ---
const gameStats = computed(() => user.value?.gamification)
const currentLevel = computed(() => gameStats.value?.currentLevel ?? 0)
const maxVal = computed(() => {
  return gameStats.value?.progressPercent
})
</script>

<template>
  <div class="user-profile-view">
    <div class="user-profile-view__header">
      <u-experience-ring
        :size="88"
        :progress="maxVal"
        :stroke-width="3"
        :level="gameStats ? currentLevel : undefined"
      >
        <n-avatar
          :size="88"
          class="avatar-user"
          round
          :src="user?.avatar"
          :fallback-src="undefined"
        />
      </u-experience-ring>

      <div class="user-info">
        <h2>{{ user?.username || 'Guest' }}</h2>
      </div>
    </div>

    <div class="user-profile-view__stats">
      <stats-summary
        v-if="user"
        :user-id="user?.userId"
      />
      <stats-full
        v-if="user"
        :user-id="user?.userId"
      />
    </div>

    <div class="button-logout">
      <u-icon
        icon="material-symbols:logout"
        height="20"
        @click="authStore.logout()"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.user-profile-view {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  &__stats {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
  }
}

.button-logout {
  position: absolute;
  top: 20px;
  right: 20px;
  margin-left: auto;
  color: var(--red-color);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .xp-details {
    display: flex;
    flex-direction: column;
    font-size: 12px;
  }

  .xp-numbers {
    font-weight: 500;
    color: var(--color-text);
  }

  .xp-left {
    color: #888;
    font-size: 11px;
  }
}
</style>
