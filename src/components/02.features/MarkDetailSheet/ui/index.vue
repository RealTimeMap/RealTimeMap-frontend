<script lang="ts" setup>
import { formatRelativeDate } from '@/components/00.shared/lib/date/FormatRelativeDate'
import { useAuthStore } from '../../Authentication/model/auth'
import { useShareStore } from '../../Share/model'
import { useMarkDetail } from '../model/useMarkDetail'
import MarkPeriod from './MarkPeriod.vue'

const props = defineProps<{
  markId: number
}>()

const scrollContainerRef = ref<HTMLElement | null>(null)
const markIdRef = toRef(props, 'markId')
const shareStore = useShareStore()
const { user } = useAuthStore()

const {
  commentText,
  isSending,
  handlePostComment,
  formatDate,
  comments,
  fetchData,
  isLoading,
  error,
  mark,
  address,
} = useMarkDetail(
  markIdRef.value,
  scrollContainerRef,
)

watch(markIdRef, fetchData)

const isExpanded = ref(false)
const canExpand = ref(false)
const descRef = ref<HTMLElement | null>(null)

function checkClamping() {
  if (descRef.value && !isExpanded.value) {
    const el = descRef.value
    canExpand.value = el.scrollHeight > el.clientHeight
  }
}

watch(() => mark.value?.additionalInfo, () => {
  isExpanded.value = false
  canExpand.value = false
  nextTick(checkClamping)
})

function onShareClick() {
  if (mark.value && !shareStore.isGenerating) {
    shareStore.shareMark({
      id: mark.value.id,
      title: mark.value.markName,
      description: mark.value.additionalInfo || '',
      url: window.location.href,
      date: formatDate(mark.value.date.startAt),
      markImg: mark.value.photos[0] || '',
      likes: 124,
      coordinates: mark.value.geom.coordinates,
    })
  }
}

onMounted(() => {
  fetchData()
  setTimeout(checkClamping, 100)
  window.addEventListener('resize', checkClamping)
})
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
      <div class="header-block">
        <div
          class="gallery-block"
        >
          <img
            v-for="(src, i) in mark.photos"
            :key="i"
            :src="src"
            class="gallery-img"
            alt="Фото"
          >
        </div>
        <div class="header-block__text">
          <span class="header-block__title">
            {{ mark.markName }}
          </span>
          <span class="header-block__address">
            {{ address || 'не найден' }}
          </span>
        </div>
        <div class="header-block__badge">
          фото · {{ formatDate(mark.date.startAt) }}
        </div>
      </div>

      <mark-period
        :date="mark.date"
        :meta="mark.meta"
      />

      <div class="block owner-block">
        <u-avatar
          rounded
          :size="40"
          :src="mark.owner.avatar"
          :alt-text="mark.owner.username"
        />
        <div class="owner-info">
          <div class="owner-info__name">
            {{ mark.owner.username }}
          </div>
          <div class="owner-info__dop">
            {{ mark.owner.tag }} · {{ formatRelativeDate(mark.date.startAt) }}
          </div>
        </div>
      </div>

      <div
        v-if="mark.additionalInfo"
        class="desc-wrapper"
      >
        <p
          ref="descRef"
          class="desc-block"
          :class="{ 'is-expanded': isExpanded }"
        >
          {{ mark.additionalInfo }}
        </p>

        <button
          v-if="canExpand"
          class="expand-btn"
          @click="isExpanded = !isExpanded"
        >
          {{ isExpanded ? 'Скрыть' : 'Читать полностью' }}
        </button>
      </div>

      <div class="actions-bar">
        <span
          class="action-item"
          @click="onShareClick()"
        >
          <u-icon
            icon="line-md:arrow-down"
            width="16"
          />
          <span>0</span>
        </span>
      </div>

      <div
        v-if="comments"
        class="block comments-section"
      >
        <h3>Комментарии</h3>
        <u-drawer />

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
            class="comment-wrapper"
          >
            <div class="comment-item">
              <u-avatar
                rounded
                :size="34"
                :src="comment.author.avatar"
                :alt-text="comment.author.username"
              />
              <div class="comment-content">
                <span class="comment-author">{{ comment.author?.username }}</span>
                <div class="comment-text">
                  {{ comment.content }}
                </div>
                <div class="comment-content__social">
                  <div class="comment-likes">
                    <u-icon icon="line-md:heart" />
                    {{ comment.likes }}
                  </div>
                  <div class="comment-likes">
                    <u-icon icon="line-md:arrow-down" />
                    {{ comment.likes }}
                  </div>
                  <div class="comment-likes">
                    <u-icon icon="line-md:turn-left" />
                    Ответить
                  </div>
                  <div
                    v-if="comment.meta.repliesCount > 0"
                    class="comment-replies"
                  >
                    &mdash;
                    Ответы · {{ comment.meta.repliesCount }}
                  </div>
                </div>
              </div>
            </div>
            <u-drawer />
          </div>
        </div>
      </div>

      <div
        v-if="user"
        class="comment-form"
      >
        <div class="comment-form__wrapper">
          <u-avatar
            rounded
            :size="40"
            :src="user?.avatar"
            :alt-text="user?.username"
          />
          <u-input
            v-model="commentText"
            placeholder="Написать комментарий..."
          />
          <button
            class="send-btn"
            :disabled="!commentText.trim() || isSending"
            :loading="isSending"
            @click="handlePostComment"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
            /></svg>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss" src="./MarkDetailSheet.scss" />
