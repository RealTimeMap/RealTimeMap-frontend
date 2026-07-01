<script setup lang="ts">
import { NAvatar } from 'naive-ui'
// import { markApi } from '@/utils/mark'
import { useAuthStore } from '../../Authentication/models/auth'
import Achievements from '../widgets/Achievements/index'
import LevelBlock from '../widgets/LevelBlock'
import { StatsFull, StatsSummary } from '../widgets/ProfileStats/index'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
// --- БИЗНЕС-ЛОГИКА ---
const gameStats = computed(() => user.value?.gamification)
const currentLevel = computed(() => gameStats.value?.currentLevel ?? 0)
const maxVal = computed(() => {
  return gameStats.value?.progressPercent
})

// const myMarks = ref()

// async function getMyMark() {
//   try {
//     const data = await markApi.getMyMark({
//       userid: user.value?.userId,
//       page: 1,
//       pageSize: 4,
//     })
//     myMarks.value = data.items
//   }
//   catch (e) {
//     console.error(e)
//   }
// }

// getMyMark()
</script>

<template>
  <div class="user-profile-view">
    <div class="user-profile-view__header">
      <u-experience-ring
        :size="88"
        :progress="maxVal"
        :stroke-width="3"
        :level="gameStats ? currentLevel : undefined"
        :show-ring="false"
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
        <span class="user-info__tag">
          {{ user?.tag || '' }}
        </span>
      </div>
    </div>

    <div class="user-profile-view__level">
      <level-block
        v-if="user?.gamification"
        :gamification="user.gamification"
      />
    </div>

    <div class="user-profile-view__achive">
      <achievements
        v-if="user"
        :user-id="user?.userId"
      />
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

    <!-- <div class="">
      {{ myMarks }}
    </div> -->

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

  &__achive,
  &__level {
    display: flex;
    width: 100%;
    justify-content: center;
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
  align-items: center;
  gap: 0px;

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }

  &__tag {
    @include label-text(14px, none);
  }
}
</style>
