<script lang="ts" setup>
import { useProfileNavigation } from '@/components/00.shared/composables/useProfileNavigation.ts'
import { formatRelativeDate } from '@/components/00.shared/lib/date/FormatRelativeDate'
import { useDialogStore } from '@/components/00.shared/stores/dialog.ts'
import { openMarkEditForm } from '@/components/02.features/MarkEditForm'
import { useCoachmarks } from '@/components/02.features/Onboarding/model/useCoachmarks'
import CoachSpotlight from '@/components/02.features/Onboarding/ui/CoachSpotlight.vue'
import { useRouteStore } from '@/components/02.features/RouteToMark'
import { useAuthStore } from '../../Authentication/model/auth'
import { useShareStore } from '../../Share/model'
import { useMarkDetail } from '../model/useMarkDetail'
import CommentItem from './CommentItem.vue'
import MarkPeriod from './MarkPeriod.vue'

const props = defineProps<{
  markId: number
  fromProfile?: boolean
}>()

const scrollContainerRef = ref<HTMLElement | null>(null)
const markIdRef = toRef(props, 'markId')
const shareStore = useShareStore()
const routeStore = useRouteStore()
const authStore = useAuthStore()
const router = useRouter()
const { user } = authStore
const { close, destroy } = useDialogStore()

const { openProfile } = useProfileNavigation()

const {
  commentText,
  isSending,
  handlePostComment,
  formatDate,
  comments,
  fetchData,
  fetchComments,
  commentsLoading,
  commentsError,
  isLoading,
  error,
  mark,
  address,
  likeDisplay,
  isLiked,
  toggleLike,
  shareDisplay,
  registerShare,
  currentUserId,
  isMarkOwner,
  isDeletingMark,
  toggleCommentLike,
  saveCommentEdit,
  removeComment,
  submitReply,
  toggleReplies,
  removeMark,
  refreshMark,
} = useMarkDetail(
  markIdRef.value,
  scrollContainerRef,
)

function handleRoute() {
  if (!mark.value)
    return
  routeStore.buildRoute(mark.value)
  close()
}

function handleShowOnMap() {
  if (!mark.value)
    return
  shareStore.requestMapFocus(mark.value.geom.coordinates)
  destroy()
  router.push({ name: 'home-map' })
}

const confirmingMarkDelete = ref(false)
const hasPhotos = computed(() => !!mark.value?.photos?.length)
const isMarkActive = computed(() => mark.value?.meta?.status?.toLowerCase() === 'active')
const canShowOnMap = computed(() => props.fromProfile && isMarkActive.value)

function handleEditMark() {
  if (!mark.value)
    return
  openMarkEditForm(mark.value, refreshMark)
}

async function handleDeleteMark() {
  const ok = await removeMark()
  if (ok)
    close()
}

const ROUTE_TIP_ID = 'guest_route'
const ROUTE_TIP_TIMEOUT = 12000
const routeBtnRef = ref<HTMLElement | null>(null)
const showRouteTip = ref(false)
const { shouldShow, markSeen } = useCoachmarks()
let routeTipTimer: ReturnType<typeof setTimeout> | null = null

function dismissRouteTip() {
  if (!showRouteTip.value)
    return
  showRouteTip.value = false
  if (routeTipTimer) {
    clearTimeout(routeTipTimer)
    routeTipTimer = null
  }
  markSeen(ROUTE_TIP_ID)
}

onMounted(async () => {
  if (authStore.isAuthenticated)
    return
  if (!(await shouldShow(ROUTE_TIP_ID)))
    return
  setTimeout(() => {
    if (routeBtnRef.value) {
      showRouteTip.value = true
      routeTipTimer = setTimeout(dismissRouteTip, ROUTE_TIP_TIMEOUT)
    }
  }, 450)
})

onUnmounted(dismissRouteTip)

watch(markIdRef, () => {
  fetchData()
  fetchComments()
})

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

async function onShareClick() {
  if (!mark.value || shareStore.isGenerating)
    return

  const shared = await shareStore.shareMark({
    id: mark.value.id,
    title: mark.value.markName,
    description: mark.value.additionalInfo || '',
    url: window.location.href,
    date: formatDate(mark.value.date.startAt),
    markImg: mark.value.photos?.[0] || '',
    likes: likeDisplay.value,
    coordinates: mark.value.geom.coordinates,
  })

  if (shared)
    registerShare()
}

onMounted(() => {
  fetchData()
  fetchComments()
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
      <div
        v-if="isMarkOwner"
        class="owner-fab"
      >
        <template v-if="!confirmingMarkDelete">
          <button
            class="owner-fab__btn"
            aria-label="Редактировать метку"
            @click="handleEditMark()"
          >
            <u-icon
              icon="solar:pen-linear"
              width="17"
            />
          </button>
          <button
            class="owner-fab__btn owner-fab__btn--danger"
            aria-label="Удалить метку"
            @click="confirmingMarkDelete = true"
          >
            <u-icon
              icon="solar:trash-bin-trash-linear"
              width="17"
            />
          </button>
        </template>
        <template v-else>
          <button
            class="owner-fab__btn owner-fab__btn--danger"
            :disabled="isDeletingMark"
            aria-label="Подтвердить удаление"
            @click="handleDeleteMark()"
          >
            <u-icon
              :icon="isDeletingMark ? 'line-md:loading-twotone-loop' : 'line-md:confirm'"
              width="17"
            />
          </button>
          <button
            class="owner-fab__btn"
            :disabled="isDeletingMark"
            aria-label="Отмена"
            @click="confirmingMarkDelete = false"
          >
            <u-icon
              icon="line-md:close"
              width="15"
            />
          </button>
        </template>
      </div>

      <div
        v-if="hasPhotos"
        class="header-block"
      >
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
          <u-icon
            icon="solar:gallery-bold"
            width="12"
            height="12"
          />
          {{ mark.photos.length }} фото · {{ formatDate(mark.date.startAt) }}
        </div>
      </div>

      <div
        v-else
        class="header-nophoto"
      >
        <div class="header-nophoto__icon">
          <u-icon
            icon="solar:map-point-bold-duotone"
            width="26"
            height="26"
          />
        </div>
        <div class="header-nophoto__info">
          <span class="header-nophoto__title">{{ mark.markName }}</span>
          <span class="header-nophoto__address">
            {{ address || 'не найден' }} · {{ formatDate(mark.date.startAt) }}
          </span>
        </div>
      </div>

      <mark-period
        :date="mark.date"
        :meta="mark.meta"
      />

      <div
        class="block owner-block"
      >
        <u-avatar
          rounded
          :size="40"
          :src="mark.owner.avatar"
          :alt-text="mark.owner.username"
          @click="openProfile(mark.owner.id)"
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
          :class="{ 'action-item--active': isLiked }"
          @click="toggleLike()"
        >
          <u-icon
            :icon="isLiked ? 'line-md:heart-filled' : 'line-md:heart'"
            width="16"
          />
          <span>{{ likeDisplay }}</span>
        </span>

        <span
          class="action-item"
          @click="onShareClick()"
        >
          <u-icon
            icon="line-md:arrow-down"
            width="16"
          />
          <span>{{ shareDisplay }}</span>
        </span>

        <span
          ref="routeBtnRef"
          class="action-item"
          :class="{ 'action-item--active': routeStore.activeMarkId === markId }"
          @click="handleRoute()"
        >
          <u-icon
            :icon="routeStore.isBuilding ? 'line-md:loading-twotone-loop' : 'solar:route-bold'"
            width="16"
          />
          <span>{{ routeStore.activeMarkId === markId ? 'Показать маршрут' : 'Маршрут' }}</span>
        </span>
      </div>

      <button
        v-if="canShowOnMap"
        type="button"
        class="show-on-map-btn"
        @click="handleShowOnMap()"
      >
        <u-icon
          icon="solar:map-point-wave-bold"
          width="18"
        />
        Показать на карте
      </button>

      <div class="block comments-section">
        <h3>Комментарии</h3>
        <u-drawer />

        <div
          ref="scrollContainerRef"
          class="comments-list"
        >
          <div
            v-if="commentsLoading && comments.length === 0"
            class="comments-skeleton"
          >
            <div
              v-for="i in 3"
              :key="i"
              class="comments-skeleton__row"
            >
              <div class="comments-skeleton__avatar" />
              <div class="comments-skeleton__lines">
                <div class="comments-skeleton__line comments-skeleton__line--short" />
                <div class="comments-skeleton__line" />
              </div>
            </div>
          </div>

          <u-block-error
            v-else-if="commentsError"
            title="Комментарии недоступны"
            message="Не удалось загрузить комментарии"
            :retrying="commentsLoading"
            @retry="fetchComments"
          />

          <template v-else>
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
              <comment-item
                :comment="comment"
                :current-user-id="currentUserId"
                :on-like="toggleCommentLike"
                :on-save="saveCommentEdit"
                :on-delete="removeComment"
                :on-reply="submitReply"
                :on-toggle-replies="toggleReplies"
                :on-open-profile="openProfile"
              />
              <u-drawer />
            </div>
          </template>
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

    <coach-spotlight
      v-if="showRouteTip"
      :target="routeBtnRef"
      text="Проложите маршрут сюда — прямо на карте"
      @close="dismissRouteTip"
    />
  </div>
</template>

<style scoped lang="scss" src="./MarkDetailSheet.scss" />
