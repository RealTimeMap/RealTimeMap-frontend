<script lang="ts" setup>
import type { MarkComment } from '@/components/00.shared/services/mark/index.type'

const props = defineProps<{
  comment: MarkComment
  currentUserId: number | null
  isReply?: boolean
  onLike: (c: MarkComment) => void
  onSave: (c: MarkComment, content: string) => void
  onDelete: (c: MarkComment) => void
  onReply: (parent: MarkComment, content: string) => void | Promise<boolean>
  onToggleReplies: (c: MarkComment) => void
  onOpenProfile: (id: number) => void
}>()

const isDeleted = computed(() => props.comment.meta.status === 'deleted')
const isOwn = computed(() =>
  !isDeleted.value && props.comment.author?.id === props.currentUserId,
)
const canReply = computed(() =>
  props.currentUserId != null
  && !props.isReply
  && !isDeleted.value
  && props.comment.meta.canReply,
)
const repliesCount = computed(() => props.comment.meta.repliesCount ?? 0)
const hasReplyThread = computed(() =>
  !props.isReply && !isDeleted.value && repliesCount.value > 0,
)

const isEditing = ref(false)
const draft = ref('')
const confirmingDelete = ref(false)

const isReplying = ref(false)
const replyDraft = ref('')
const isSubmittingReply = ref(false)

function startEdit() {
  draft.value = props.comment.content
  isEditing.value = true
  confirmingDelete.value = false
}

function cancelEdit() {
  isEditing.value = false
  draft.value = ''
}

function submitEdit() {
  const value = draft.value.trim()
  if (!value || value === props.comment.content) {
    cancelEdit()
    return
  }
  props.onSave(props.comment, value)
  isEditing.value = false
}

function confirmDelete() {
  props.onDelete(props.comment)
  confirmingDelete.value = false
}

function startReply() {
  isReplying.value = true
  replyDraft.value = ''
}

function cancelReply() {
  isReplying.value = false
  replyDraft.value = ''
}

async function submitReply() {
  const value = replyDraft.value.trim()
  if (!value)
    return
  isSubmittingReply.value = true
  try {
    await props.onReply(props.comment, value)
    cancelReply()
  }
  finally {
    isSubmittingReply.value = false
  }
}
</script>

<template>
  <div
    class="comment-item"
    :class="{ 'comment-item--deleted': isDeleted, 'comment-item--reply': isReply }"
  >
    <u-avatar
      rounded
      :size="isReply ? 28 : 34"
      :src="comment.author.avatar"
      :alt-text="comment.author.username"
      @click="onOpenProfile(comment.author.id)"
    />

    <div class="comment-content">
      <span class="comment-author">{{ comment.author?.username }}</span>

      <div
        v-if="isDeleted"
        class="comment-text comment-text--muted"
      >
        {{ comment.content }}
      </div>

      <template v-else-if="isEditing">
        <textarea
          v-model="draft"
          class="comment-edit-area"
          rows="2"
          placeholder="Изменить комментарий..."
        />
        <div class="comment-edit-actions">
          <button
            class="comment-btn comment-btn--ghost"
            @click="cancelEdit"
          >
            Отмена
          </button>
          <button
            class="comment-btn comment-btn--primary"
            :disabled="!draft.trim()"
            @click="submitEdit"
          >
            Сохранить
          </button>
        </div>
      </template>

      <div
        v-else
        class="comment-text"
      >
        {{ comment.content }}
      </div>

      <div
        v-if="!isDeleted && !isEditing"
        class="comment-content__social"
      >
        <button
          class="comment-pill"
          :class="{ 'comment-pill--active': comment.meta.isLiked }"
          @click="onLike(comment)"
        >
          <u-icon :icon="comment.meta.isLiked ? 'line-md:heart-filled' : 'line-md:heart'" />
          {{ comment.likes }}
        </button>

        <button
          v-if="canReply"
          class="comment-pill"
          @click="startReply"
        >
          <u-icon icon="line-md:turn-left" />
        </button>

        <template v-if="isOwn">
          <button
            class="comment-pill"
            @click="startEdit"
          >
            <u-icon icon="solar:pen-linear" />
          </button>

          <button
            v-if="!confirmingDelete"
            class="comment-pill comment-pill--danger"
            @click="confirmingDelete = true"
          >
            <u-icon icon="solar:trash-bin-trash-linear" />
          </button>

          <template v-else>
            <button
              class="comment-pill comment-pill--danger"
              @click="confirmDelete"
            >
              Точно удалить
            </button>
            <button
              class="comment-pill"
              @click="confirmingDelete = false"
            >
              Отмена
            </button>
          </template>
        </template>
      </div>

      <div
        v-if="isReplying"
        class="comment-reply-box"
      >
        <textarea
          v-model="replyDraft"
          class="comment-edit-area"
          rows="2"
          placeholder="Ваш ответ..."
        />
        <div class="comment-edit-actions">
          <button
            class="comment-btn comment-btn--ghost"
            :disabled="isSubmittingReply"
            @click="cancelReply"
          >
            Отмена
          </button>
          <button
            class="comment-btn comment-btn--primary"
            :disabled="!replyDraft.trim() || isSubmittingReply"
            @click="submitReply"
          >
            Ответить
          </button>
        </div>
      </div>

      <button
        v-if="hasReplyThread"
        class="comment-thread-toggle"
        :disabled="comment.isLoadingReplies"
        @click="onToggleReplies(comment)"
      >
        <u-icon
          :icon="comment.isLoadingReplies
            ? 'line-md:loading-twotone-loop'
            : (comment.showReplies ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear')"
          width="14"
        />
        {{ comment.showReplies ? 'Скрыть ответы' : `Показать ответы · ${repliesCount}` }}
      </button>

      <div
        v-if="comment.showReplies && comment.replies?.length"
        class="comment-replies"
      >
        <comment-item
          v-for="reply in comment.replies"
          :key="reply.id"
          is-reply
          :comment="reply"
          :current-user-id="currentUserId"
          :on-like="onLike"
          :on-save="onSave"
          :on-delete="onDelete"
          :on-reply="onReply"
          :on-toggle-replies="onToggleReplies"
          :on-open-profile="onOpenProfile"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comment-item {
  display: flex;
  gap: 12px;
  padding: 10px 0;

  &--deleted {
    opacity: 0.6;
  }

  &--reply {
    padding: 8px 0;
  }
}

.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  &__social {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 2px;
  }
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.2;
}

.comment-text {
  font-size: 14px;
  color: var(--text-color);
  line-height: 1.4;
  word-break: break-word;

  &--muted {
    color: var(--text-color-muted);
    font-style: italic;
  }
}

.comment-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 999px;
  cursor: pointer;
  background: var(--surface-subtle);
  border: 0.5px solid var(--border-subtle);
  color: var(--text-color-secondary);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  transition:
    color 0.2s ease,
    background 0.2s ease;

  :deep(svg) {
    width: 13px;
    height: 13px;
  }

  &--active {
    color: var(--primary-color);
  }

  &--danger {
    color: var(--danger-color, #e5484d);
  }
}

.comment-edit-area {
  width: 100%;
  resize: none;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--text-color);
  background: var(--surface-subtle);
  border: 0.5px solid var(--border-subtle);
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

.comment-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.comment-reply-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.comment-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &--ghost {
    background: var(--surface-subtle);
    color: var(--text-color-secondary);
  }

  &--primary {
    background: var(--primary-color);
    color: #fff;

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }
}

.comment-thread-toggle {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-color);
}

.comment-replies {
  display: flex;
  flex-direction: column;
  margin-top: 4px;
  padding-left: 6px;
  border-left: 1.5px solid var(--border-subtle);
}
</style>
