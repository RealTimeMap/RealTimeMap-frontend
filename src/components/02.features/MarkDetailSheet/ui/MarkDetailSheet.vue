<script lang="ts" setup>
import { useMarkDetail } from '../models/useMarkDetail'

const props = defineProps<{
  markId: number
}>()
const scrollContainerRef = ref<HTMLElement | null>(null)
const markIdRef = toRef(props, 'markId')

const {
  commentText,
  isSending,
  handlePostComment,
  formatDate,
  statusClass,
  statusText,
  comments,
  fetchData,
  isLoading,
  error,
  mark,
} = useMarkDetail(
  markIdRef.value,
  scrollContainerRef,
)

watch(markIdRef, fetchData)

onMounted(fetchData)
</script>

<template>
  <div class="mark-container">
    <div
      v-if="isLoading && !mark"
      class="state-text"
    >
      Загрузка...
    </div>

    <div
      v-else-if="error"
      class="state-text error"
    >
      {{ error }}
    </div>

    <template v-else-if="mark">
      <div
        v-if="mark.photo?.length"
        class="block gallery-block"
      >
        <img
          v-for="(src, i) in mark.photo"
          :key="i"
          :src="src"
          class="gallery-img"
          alt="Фото"
        >
      </div>

      <div class="block header-block">
        <div
          class="cat-icon"
          :style="{ background: `${mark.category.color}20` }"
        >
          <img
            :src="mark.category.icon"
            :alt="mark.category.category_name"
          >
        </div>
        <div>
          <div
            class="cat-name"
            :style="{ color: mark.category.color }"
          >
            {{ mark.category.category_name }}
          </div>
          <h2 class="mark-title">
            {{ mark.mark_name }}
          </h2>
        </div>
      </div>

      <div class="block info-block">
        <div class="label">
          Описание
        </div>
        <div class="text">
          {{ mark.additional_info || 'Нет описания' }}
        </div>
      </div>

      <div class="block info-block">
        <div class="label">
          Время действия
        </div>
        <div class="time-row">
          <span>{{ formatDate(mark.end_at) }}</span>
          <span
            class="status-badge"
            :class="statusClass"
          >{{ statusText }}</span>
        </div>
      </div>

      <!-- OWNER -->
      <div class="block owner-block">
        <img
          :src="mark.owner.avatar || '/default-avatar.png'"
          class="avatar"
          alt="Ava"
        >
        <div>
          <div class="label">
            Автор
          </div>
          <div class="owner-name">
            {{ mark.owner.username }}
          </div>
        </div>
      </div>

      <div class="block comments-section">
        <h3>Комментарии ({{ comments.length }})</h3>

        <div
          ref="scrollContainerRef"
          class="comments-list"
        >
          <div
            v-if="comments.length === 0"
            class="no-comments"
          >
            Пока нет комментариев. Будьте первым!
          </div>

          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <img
              :src="comment.owner.avatar || '/default-avatar.png'"
              class="comment-avatar"
              alt="User"
            >
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.owner?.username || 'Пользователь' }}</span>
                <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
              </div>
              <div class="comment-text">
                {{ comment.content }}
              </div>
            </div>
          </div>
        </div>

        <div class="comment-form">
          <n-input
            v-model:value="commentText"
            type="textarea"
            placeholder="Написать комментарий..."
            :autosize="{ minRows: 1, maxRows: 4 }"
            :disabled="isSending"
            class="comment-input"
          />
          <n-button
            type="primary"
            class="send-btn"
            :disabled="!commentText.trim() || isSending"
            :loading="isSending"
            @click="handlePostComment"
          >
            <template #icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
              /></svg>
            </template>
          </n-button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss" src="../styles/index.scss" />
