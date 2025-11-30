<script lang="ts" setup>
import type { MarkFull } from '@/utils/mark/index.type'
import { computed, onMounted, ref } from 'vue'
import { markApi } from '@/utils/mark'

const props = defineProps<{
  markId: number
}>()

const marksCache = new Map<number, MarkFull>()
const mark = ref<MarkFull | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

async function fetchData() {
  error.value = null

  if (marksCache.has(props.markId)) {
    mark.value = marksCache.get(props.markId)!
    isLoading.value = false
    return
  }

  try {
    const data = await markApi.getMarkFull(props.markId)
    marksCache.set(props.markId, data)
    mark.value = data
  }
  catch (e) {
    console.error(e)
    error.value = 'Ошибка загрузки.'
  }
  finally {
    isLoading.value = false
  }
}

function formatDate(dateString?: string) {
  if (!dateString)
    return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime()))
    return '—'

  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusText = computed(() => (mark.value?.is_ended ? 'Завершена' : 'Активна'))
const statusClass = computed(() => (mark.value?.is_ended ? 'status--ended' : 'status--active'))

watch(() => props.markId, fetchData)

onMounted(fetchData)
</script>

<template>
  <div class="mark-container">
    <div
      v-if="isLoading"
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
          <span>{{ formatDate(mark.start_at) }} — {{ formatDate(mark.end_at) }}</span>
          <span
            class="status-badge"
            :class="statusClass"
          >{{ statusText }}</span>
        </div>
      </div>

      <div class="block owner-block">
        <img
          :src="mark.owner.avatar"
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
    </template>
  </div>
</template>

<style scoped lang="scss">
.mark-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px; /* Отступы между основными блоками */
  position: relative;
}

/* Кнопка закрытия */
.close-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
  color: #999;
  z-index: 10;
  padding: 5px;

  &:hover {
    color: #333;
  }
}

/* Общие стили блоков */
.block {
  width: 100%;
}

/* Заголовки полей (Label) */
.label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Обычный текст */
.text {
  font-size: 15px;
  line-height: 1.4;
  white-space: pre-wrap;
  color: #333;
}

/* --- 1. Шапка --- */
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

/* --- 2. Галерея --- */
.gallery-block {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px; /* место под скроллбар, если нужен */

  /* Скрываем скроллбар */
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

/* --- 4. Время --- */
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

/* --- 5. Автор --- */
.owner-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #eee; /* Отделяем автора чертой */
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

/* Состояния */
.state-text {
  text-align: center;
  padding: 20px;
  color: #666;

  &.error {
    color: red;
  }
}
</style>
