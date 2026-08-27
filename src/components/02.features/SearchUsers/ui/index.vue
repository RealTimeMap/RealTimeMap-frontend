<script setup lang="ts">
import { useProfileNavigation } from '@/components/00.shared/composables/useProfileNavigation'
import { useUserSearch } from '../model/useUserSearch'

const { query, results, total, isLoading, hasQuery, clear } = useUserSearch()
const { openProfile } = useProfileNavigation()

function goToProfile(userId: number) {
  clear()
  openProfile(userId)
}
</script>

<template>
  <div class="user-search">
    <div class="user-search__bar">
      <u-icon
        class="user-search__icon"
        icon="line-md:search"
        height="20"
      />
      <input
        v-model="query"
        class="user-search__input"
        type="text"
        placeholder="Поиск людей по @тегу"
        enterkeyhint="search"
      >
      <button
        v-if="query"
        class="user-search__clear"
        type="button"
        @click="clear"
      >
        <u-icon
          icon="line-md:close"
          height="18"
        />
      </button>
    </div>

    <transition name="panel">
      <div
        v-if="hasQuery"
        class="user-search__panel"
      >
        <div
          v-if="isLoading"
          class="user-search__state"
        >
          <u-icon
            icon="line-md:loading-twotone-loop"
            height="24"
          />
        </div>

        <template v-else-if="results.length">
          <div class="user-search__group">
            <span>Люди</span>
            <span class="user-search__count">{{ total }}</span>
          </div>
          <transition-group
            name="result"
            tag="div"
            class="result-list"
          >
            <button
              v-for="(person, index) in results"
              :key="person.userId"
              class="result"
              type="button"
              :style="{ transitionDelay: `${index * 35}ms` }"
              @click="goToProfile(person.userId)"
            >
              <u-avatar
                :size="40"
                rounded
                :alt-text="person.username"
                :src="person.avatar"
              />
              <div class="result__info">
                <span class="result__name">{{ person.username }}</span>
                <span class="result__meta">
                  <u-icon
                    v-if="person.isPrivate"
                    icon="solar:lock-keyhole-minimalistic-bold"
                    height="13"
                  />
                  @{{ person.tag }}
                </span>
              </div>
              <u-icon
                class="result__chevron"
                icon="line-md:chevron-right"
                height="18"
              />
            </button>
          </transition-group>
        </template>

        <div
          v-else
          class="user-search__state user-search__state--empty"
        >
          <span class="user-search__empty-title">Ничего не нашлось</span>
          <span class="user-search__empty-hint">Введите <b>@тег</b>, чтобы искать людей</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.user-search {
  position: absolute;
  top: calc(12px + var(--safe-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__bar {
    display: flex;
    align-items: center;
    gap: 10px;
    @include glass-panel(16px, 12px 16px, false);
  }

  &__icon {
    color: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    padding: 0;
    @include value-text(16px, var(--text-color), 500);

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }

  &__clear {
    display: flex;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    flex-shrink: 0;
  }

  &__panel {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 60vh;
    overflow-y: auto;
    transform-origin: top center;
    @include glass-panel(18px, 0, false);
  }

  &__group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 8px;
    @include label-text(11px);
  }

  &__count {
    @include label-text(11px, none);
  }

  &__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 18px 16px;
    color: rgba(255, 255, 255, 0.5);

    &--empty {
      gap: 6px;
    }
  }

  &__empty-title {
    @include value-text(16px, var(--text-color), 700);
  }

  &__empty-hint {
    @include label-text(12px, none);

    b {
      color: var(--secondary-color);
    }
  }
}

.panel-enter-active {
  transition:
    opacity 0.22s ease,
    transform 0.28s cubic-bezier(0.3, 1.2, 0.4, 1);
}

.panel-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.18s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.result-list {
  display: flex;
  flex-direction: column;
}

.result-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s cubic-bezier(0.3, 1.2, 0.4, 1);
}

.result-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:hover,
  &:active {
    background: rgba(255, 255, 255, 0.06);
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
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 4px;
    @include label-text(12px, none);
  }

  &__chevron {
    color: rgba(255, 255, 255, 0.35);
    flex-shrink: 0;
  }
}
</style>
