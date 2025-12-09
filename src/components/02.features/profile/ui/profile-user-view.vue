<script setup lang="ts">
import { NAvatar } from 'naive-ui'
import { useAuthStore } from '../../authentication/model/auth'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

// --- БИЗНЕС-ЛОГИКА ---
const gameStats = computed(() => user.value?.gamefication)
const currentVal = computed(() => gameStats.value?.current_exp ?? 0)
const currentLevel = computed(() => gameStats.value?.current_level ?? 0)
const currentColor = computed(() => user.value?.gamefication?.current_level_color)

const maxVal = computed(() => {
  return gameStats.value?.next_level?.required_exp ?? currentVal.value
})

const progressPercentage = computed(() => {
  if (maxVal.value === 0)
    return 0
  const percent = (currentVal.value / maxVal.value) * 100
  return Math.min(100, Math.max(0, percent))
})
</script>

<template>
  <div class="user-profile-view">
    <div class="user-profile-view--header">
      <u-experience-ring
        :size="60"
        :progress="progressPercentage"
        :color="currentColor"
        :level="gameStats ? currentLevel : undefined"
      >
        <n-avatar
          :size="60"
          class="avatar-user"
          round
          :src="user?.avatar"
          :fallback-src="undefined"
        />
      </u-experience-ring>

      <div class="user-info">
        <h2>{{ user?.username || 'Guest' }}</h2>

        <div
          v-if="gameStats"
          class="xp-details"
        >
          <span class="xp-numbers">
            {{ currentVal.toLocaleString() }} / {{ maxVal.toLocaleString() }} XP
          </span>

          <span
            v-if="gameStats.exp_for_level_up > 0"
            class="xp-left"
          >
            Осталось: {{ gameStats.exp_for_level_up.toLocaleString() }}
          </span>
        </div>
      </div>
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

  &--header {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

.button-logout {
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
