<script setup lang="ts">
import type { SubscriptionListType } from '../model/useSubscriptionList'
import { useInfiniteScroll } from '@vueuse/core'
import { useProfileNavigation } from '@/components/00.shared/composables/useProfileNavigation'
import { useSubscriptionList } from '../model/useSubscriptionList'

const { type } = defineProps<{
  type: SubscriptionListType
}>()

const {
  items,
  hasMore,
  isLoading,
  isLoadingMore,
  error,
  loadMore,
  reload,
} = useSubscriptionList(type)

const { openProfile } = useProfileNavigation()

const listEl = ref<HTMLElement | null>(null)

useInfiniteScroll(listEl, loadMore, {
  distance: 200,
  canLoadMore: () => hasMore.value && !isLoadingMore.value && !isLoading.value,
})

const emptyText = computed(() =>
  type === 'subscriptions'
    ? 'Вы ещё ни на кого не подписаны'
    : 'У вас пока нет подписчиков',
)

loadMore()
</script>

<template>
  <div
    ref="listEl"
    class="subs-list"
  >
    <div
      v-if="isLoading"
      class="subs-list__state"
    >
      <u-icon
        icon="line-md:loading-twotone-loop"
        height="26"
      />
    </div>

    <u-block-error
      v-else-if="error && !items.length"
      compact
      title="Не удалось загрузить"
      :retrying="isLoading"
      @retry="reload"
    />

    <div
      v-else-if="items.length"
      class="subs-list__items"
    >
      <button
        v-for="person in items"
        :key="person.userId"
        class="subs-item"
        type="button"
        @click="openProfile(person.userId, {
          username: person.username,
          avatar: person.avatar,
          tag: person.tag,
          isPrivate: person.isPrivate,
        })"
      >
        <div class="subs-item__avatar">
          <u-avatar
            :size="44"
            rounded
            :alt-text="person.username"
            :src="person.avatar"
          />
          <span
            v-if="person.isPrivate"
            class="subs-item__lock"
            title="Закрытый профиль"
          >
            <u-icon
              icon="solar:lock-keyhole-bold"
              height="11"
            />
          </span>
        </div>
        <div class="subs-item__info">
          <span class="subs-item__name">{{ person.username }}</span>
          <span
            v-if="person.tag"
            class="subs-item__tag"
          >@{{ person.tag }}</span>
        </div>
        <u-icon
          class="subs-item__chevron"
          icon="line-md:chevron-right"
          height="18"
        />
      </button>

      <div
        v-if="isLoadingMore"
        class="subs-list__more"
      >
        <u-icon
          icon="line-md:loading-twotone-loop"
          height="22"
        />
      </div>
    </div>

    <div
      v-else
      class="subs-list__empty"
    >
      <u-icon
        icon="solar:users-group-rounded-bold-duotone"
        width="30"
        height="30"
      />
      <span>{{ emptyText }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.subs-list {
  overflow-y: auto;
  max-height: 100%;

  &__state,
  &__more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: var(--text-color-secondary);
  }

  &__items {
    display: flex;
    flex-direction: column;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 32px 16px;
    text-align: center;
    color: var(--text-color-secondary);

    span {
      @include label-text(13px, none);
      line-height: 1.4;
    }
  }
}

.subs-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid var(--border-subtle);

  &:hover,
  &:active {
    background: var(--surface-subtle);
  }

  &__avatar {
    position: relative;
    flex-shrink: 0;
  }

  &__lock {
    position: absolute;
    right: -2px;
    bottom: -2px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    color: var(--text-color-secondary);
    background: var(--bg-color-block);
    border: 1.5px solid var(--bg-color, var(--bg-color-block));
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    text-align: left;
  }

  &__name {
    @include value-text(16px, var(--text-color), 600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tag {
    @include label-text(12px, none);
  }

  &__chevron {
    color: var(--text-color-muted);
    flex-shrink: 0;
  }
}
</style>
