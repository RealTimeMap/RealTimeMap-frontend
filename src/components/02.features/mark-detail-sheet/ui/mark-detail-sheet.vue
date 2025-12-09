<script lang="ts" setup>
import { NButton, NInput } from 'naive-ui'
import { useMarkDetail } from '../models/useMarkDetail'

const props = defineProps<{
  markId: number
}>()
const scrollContainerRef = ref<HTMLElement | null>(null)

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
  props.markId,
  scrollContainerRef,
)

watch(() => props.markId, fetchData)

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

<style scoped lang="scss">
.mark-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  padding-bottom: 20px;
}

.block {
  width: 100%;
}

.label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.text {
  font-size: 15px;
  line-height: 1.4;
  white-space: pre-wrap;
  color: #333;
}

.header-block {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 28px;
    border-radius: 6px;
    object-fit: cover;
    height: 28px;
  }
}

.cat-name {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.mark-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.gallery-block {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px;

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.gallery-img {
  height: 120px;
  width: auto;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid #eee;
}

.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  &.status--active {
    background: #e6f7ed;
    color: #00a854;
  }
  &.status--ended {
    background: #f5f5f5;
    color: #888;
  }
}

.owner-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.owner-name {
  font-weight: 600;
  font-size: 14px;
}

.state-text {
  text-align: center;
  padding: 20px;
  color: #666;

  &.error {
    color: red;
  }
}

/* --- COMMENTS STYLES --- */
.comments-section {
  display: flex;
  flex-direction: column;
  gap: 16px;

  h3 {
    font-size: 18px;
    margin: 0;
    font-weight: 600;
  }
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 8px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #aaa;
  }
}

.no-comments {
  color: #999;
  font-size: 14px;
  font-style: italic;
  padding: 10px 0;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 4px;
}

.comment-content {
  flex: 1;
  box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.1);
  padding: 10px 12px;
  border-radius: 12px;
  border-top-left-radius: 2px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.comment-date {
  font-size: 11px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  line-height: 1.4;
  color: var(--color-text);
  word-break: break-word;
}

.comment-form {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin-top: 8px;
}

.comment-input {
  flex: 1;
}

.send-btn {
  height: 34px;
  width: 34px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
