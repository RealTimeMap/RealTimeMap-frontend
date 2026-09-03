<script setup lang="ts">
import type { Mark } from '@/components/00.shared/services/mark/index.type'
import type { User } from '@/components/00.shared/services/user/index.type'
import { markApi } from '@/components/00.shared/services/mark'
import { useChatsStore } from '@/components/00.shared/stores/chats'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import AppSettings from '@/components/02.features/AppSetting'
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'
import MarkDetailsSheet from '@/components/02.features/MarkDetailSheet'
import { useCoachOnView } from '@/components/02.features/Onboarding/model/useCoachOnView'
import CoachHint from '@/components/02.features/Onboarding/ui/CoachHint.vue'
import { StatsFull, StatsSummary } from '@/components/04.widgets/ProfileStats'
import Achievements from '../widgets/Achievements/index'
import LevelBlock from '../widgets/LevelBlock'

const props = defineProps<{
  user: User | null
  isOwn?: boolean
}>()

const emit = defineEmits<{
  (e: 'colorExtracted', color: string): void
}>()

const chatsStore = useChatsStore()
const authStore = useAuthStore()
const gameStats = computed(() => props.user?.gamification)
const currentLevel = computed(() => gameStats.value?.currentLevel ?? 0)
const maxVal = computed(() => {
  return gameStats.value?.progressPercent
})
const { open } = useDialogStore()

const refetchingLevel = ref(false)
async function retryLevel() {
  refetchingLevel.value = true
  try {
    await authStore.fetchUser()
  }
  finally {
    refetchingLevel.value = false
  }
}

function openSettings() {
  open(AppSettings, {
    user: props.user,
  }, {
    height: '100%',
    width: '500px',
    headerModal: false,
    transition: 'slide-right',
    classModal: 'modal-settings',
    position: 'center end',
    swipeable: false,
  })
}

const myMarks = ref<Mark[]>()
async function getMyMark() {
  const userId = props.user?.userId
  if (!userId)
    return

  try {
    const data = await markApi.getAllMarks({
      userid: userId,
      page: 1,
      pageSize: 4,
    })
    myMarks.value = data.items
  }
  catch (e) {
    console.error(e)
  }
}

watch(() => props.user?.userId, (id) => {
  if (id)
    getMyMark()
}, { immediate: true })

const levelRef = ref<HTMLElement | null>(null)
const achiveRef = ref<HTMLElement | null>(null)
const statsRef = ref<HTMLElement | null>(null)

const { activeTip: profileTip, dismiss: dismissProfileTip } = useCoachOnView(
  [
    {
      id: 'profile_level',
      el: levelRef,
      icon: 'solar:medal-ribbons-star-bold-duotone',
      text: 'Это ваш уровень — растёт за активность на карте',
    },
    {
      id: 'profile_achievements',
      el: achiveRef,
      icon: 'solar:cup-star-bold-duotone',
      text: 'Достижения открываются за ваши действия — вот бейджи',
    },
    {
      id: 'profile_stats',
      el: statsRef,
      icon: 'solar:chart-2-bold-duotone',
      text: 'Статистика — ваша активность в цифрах',
    },
  ],
  { enabled: () => !!props.isOwn && authStore.isAuthenticated },
)

function openMark(markId: number) {
  open(MarkDetailsSheet, { markId, fromProfile: true }, {
    headerModal: false,
    position: 'end center',
  })
}
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
        <u-avatar
          :size="96"
          rounded
          :alt-text="user?.username"
          :src="user?.avatar"
          @color-extracted="(color) => emit('colorExtracted', color)"
        />
      </u-experience-ring>

      <div class="user-info">
        <h2>{{ user?.username || 'Guest' }}</h2>
        <span class="user-info__tag">
          {{ user?.tag || '' }}
        </span>
      </div>
    </div>

    <div
      v-if="!isOwn && user && authStore.isAuthenticated"
      class="user-action"
    >
      <button class="button-sub">
        Подписаться
      </button>
      <button
        class="button-message"
        @click="chatsStore.newChat(user.userId)"
      >
        <u-icon
          icon="line-md:chat-round"
          height="20"
        />
      </button>
    </div>

    <div
      ref="levelRef"
      class="user-profile-view__level"
      :class="{ 'coach-highlight': profileTip?.id === 'profile_level' }"
    >
      <level-block
        v-if="user?.gamification"
        :gamification="user.gamification"
      />
      <u-block-error
        v-else-if="user && isOwn"
        compact
        title="Уровень недоступен"
        :retrying="refetchingLevel"
        @retry="retryLevel"
      />
    </div>

    <div
      ref="achiveRef"
      class="user-profile-view__achive"
      :class="{ 'coach-highlight': profileTip?.id === 'profile_achievements' }"
    >
      <achievements
        v-if="user"
        :user-id="user?.userId"
        :is-own="isOwn"
      />
    </div>

    <div
      ref="statsRef"
      class="user-profile-view__stats"
      :class="{ 'coach-highlight': profileTip?.id === 'profile_stats' }"
    >
      <stats-summary
        v-if="user"
        :user-id="user?.userId"
      />
      <stats-full
        v-if="user"
        :user-id="user?.userId"
      />
    </div>

    <div
      v-if="myMarks && myMarks.length"
      class="user-profile-view__marks"
    >
      <!-- <h3 class="user-profile-view__marks-title">
        Метки
      </h3> -->
      <div class="user-profile-view__marks-grid">
        <u-mark-card
          v-for="item in myMarks"
          :key="item.id"
          :mark="item"
          @click="openMark(item.id)"
        />
      </div>
    </div>

    <div
      v-else-if="isOwn && myMarks"
      class="user-profile-view__empty"
    >
      <u-icon
        icon="solar:point-on-map-bold-duotone"
        width="26"
        height="26"
      />
      <span>Пока нет меток — дважды коснитесь карты, чтобы создать первую</span>
    </div>

    <div
      v-if="isOwn"
      class="button-settings"
    >
      <u-icon
        icon="line-md:cog-loop"
        height="20"
        @click="openSettings()"
      />
    </div>

    <coach-hint
      v-if="profileTip"
      :text="profileTip.text"
      :icon="profileTip.icon"
      @close="dismissProfileTip"
    />
  </div>
</template>

<style lang="scss" scoped>
.user-profile-view {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 90%;
  max-width: 400px;
  margin: 0 auto;

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

  &__marks {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__marks-title {
    @include label-text(12px, uppercase);
  }

  &__marks-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
    color: var(--text-color-secondary, var(--text-color));
    @include glass-panel(16px, 18px, false);

    span {
      @include label-text(13px, none);
      line-height: 1.4;
    }
  }
}

.coach-highlight {
  border-radius: 18px;
  outline: 2px solid var(--primary-color);
  outline-offset: 8px;
  transition: outline-color 0.3s ease;
  animation: coach-pulse 1.6s ease-in-out infinite;
}

@keyframes coach-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary-color) 35%, transparent);
  }
  50% {
    box-shadow: 0 0 0 10px color-mix(in srgb, var(--primary-color) 0%, transparent);
  }
}

.button-settings {
  position: absolute;
  top: 0;
  right: 0;
  width: 38px;
  height: 38px;
  border-radius: 13px;
  background: var(--bg-color-block);
  border: 1px solid var(--border-subtle);
  color: var(--text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
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

.user-action {
  display: flex;
  align-items: center;
  gap: 12px;
}

.button-sub {
  height: 44px;
  @include glass-panel(14px, 11px, false);
  @include gradient();
  /* Текст на акцентном градиенте — всегда белый */
  @include value-text(14px, #fff, 700);
  width: 100%;
  border: none;
}

.button-message {
  @include glass-panel(14px, 11px);
  color: var(--text-color);
  height: 44px;
  min-width: 44px;
}
</style>
