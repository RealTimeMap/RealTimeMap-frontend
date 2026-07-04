<script setup lang="ts">
import type { NearestAchievementItem } from '@/utils/achievement/index.type'
// import { useDialogStore } from '@/shared/stores/dialog'
import { achievementApi } from '@/utils/achievement'

const props = defineProps<{
  userId: number
}>()

const achievements = shallowRef<NearestAchievementItem[]>([])
const isLoading = ref(false)
// const { open } = useDialogStore()

const activeItem = ref<NearestAchievementItem | null>(null)
const targetEl = ref<HTMLElement | null>(null)

async function loadAchievements() {
  if (!props.userId)
    return
  isLoading.value = true
  try {
    const res = await achievementApi.getNearestAchievements(props.userId)
    achievements.value = res.items
  }
  finally {
    isLoading.value = false
  }
}

function handleItemClick(event: MouseEvent, item: NearestAchievementItem) {
  if (activeItem.value?.achievement.id === item.achievement.id) {
    activeItem.value = null
    targetEl.value = null
    return
  }

  activeItem.value = item
  targetEl.value = event.currentTarget as HTMLElement
}

onMounted(loadAchievements)
</script>

<template>
  <div class="achievements-widget">
    <div class="header">
      <div class="title-group">
        <h3>Достижения</h3>
        <span class="badge">{{ achievements.length }} / 32</span>
      </div>
      <button class="all-link">
        Все
        <u-icon
          icon="weui:arrow-filled"
          width="8"
        />
      </button>
    </div>

    <div class="achievements-wrapper">
      <div
        v-if="isLoading"
        class="loader"
      >
        ...
      </div>

      <template v-else>
        <div
          v-for="item in achievements"
          :key="item.achievement.id"
          class="achive-card"
          :class="{ 'is-active': activeItem?.achievement.id === item.achievement.id }"
          @click="handleItemClick($event, item)"
        >
          <div class="icon-container">
            <img
              :src="item.achievement.icon"
              :alt="item.achievement.title"
            >
          </div>
          <span class="short-title">{{ item.achievement.title }}</span>
        </div>
      </template>
    </div>

    <u-tooltip
      :show="!!activeItem"
      :target="targetEl"
      :width="200"
      @close="activeItem = null"
    >
      <template v-if="activeItem">
        <div class="tooltip-title">
          {{ activeItem.achievement.title }}
        </div>
        <div class="tooltip-desc">
          {{ activeItem.achievement.desc }}
        </div>

        <div class="tooltip-progress">
          <div class="progress-info">
            <span>Прогресс</span>
            <span>{{ activeItem.current }} / {{ activeItem.threshold }}</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${activeItem.progress}%` }"
            />
          </div>
        </div>
      </template>
    </u-tooltip>
  </div>
</template>

<style scoped lang="scss">
.achievements-widget {
  min-height: 80px;
  @include glass-panel(20px, 14px);
  width: 100%;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .title-group {
      display: flex;
      align-items: center;
      gap: 8px;
      h3 {
        @include value-text(13px);
      }
      .badge {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.4);
        padding: 1px 7px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.06);
      }
    }
    .all-link {
      display: flex;
      align-items: center;
      background: none;
      gap: 4px;
      border: none;
      color: #5370f9;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
  }
}

.achievements-wrapper {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  min-height: 56px;
}

.achive-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border-radius: 10px;
  width: 100%;

  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);

  filter: grayscale(1);
  opacity: 0.8;

  &:active {
    transform: scale(0.96);
  }

  &.is-active {
    opacity: 1;
    filter: grayscale(0.2);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(83, 112, 249, 0.5);
  }

  img {
    height: 22px;
    object-fit: contain;
    opacity: 0.4;
  }

  .short-title {
    width: 100%;
    text-align: center;
    @include label-text(10px, none, rgba(255, 255, 255, 0.3));
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.tooltip-title {
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 2px;
  text-align: center;
}
.tooltip-desc {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.3;
  margin-bottom: 10px;
  text-align: center;
}
.tooltip-progress {
  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    font-weight: 700;
    color: #5370f9;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .progress-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    overflow: hidden;
    .progress-fill {
      height: 100%;
      background: #5370f9;
      box-shadow: 0 0 8px #5370f9;
    }
  }
}

.loader {
  grid-column: span 5;
  text-align: center;
  color: rgba(255, 255, 255, 0.2);
}
</style>
