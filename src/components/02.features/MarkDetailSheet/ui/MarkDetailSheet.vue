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
          v-if="mark.photos?.length"
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
        <div class="header-block__title">
          {{ mark.markName }}
        </div>
        <div class="header-block__badge">
          фото · {{ formatDate(mark.startAt) }}
        </div>
      </div>

      <div class="block owner-block">
        <img
          :src="mark.owner.avatar || '/default-avatar.png'"
          class="avatar"
          :alt="mark.owner.username.slice(0, 2).toUpperCase()"
        >
        <div class="owner-info">
          <div class="owner-info__name">
            {{ mark.owner.username }}
          </div>
          <div class="owner-info__dop">
            @{{ mark.owner.username }} · добавил 2 дня назад
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
              <img
                src=""
                class="avatar"
                :alt="comment.author.username.slice(0, 2).toUpperCase()"
              >
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

      <div class="comment-form">
        <div class="comment-form__wrapper">
          <img
            src="https://avatars.githubusercontent.com/u/71484693?v=4"
            class="avatar"
            alt="HE"
          >
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

<style scoped lang="scss" src="../styles/index.scss" />
