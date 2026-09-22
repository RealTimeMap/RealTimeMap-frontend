<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

interface UOption {
  label: string
  value: number
  color?: string
  icon?: string
}

interface Props {
  label: string
  options: UOption[]
  parentPadding?: number
  required?: boolean
}

const { options, parentPadding = 0 } = defineProps<Props>()

const modal = defineModel<number | null>()
const selectRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const dropDown = ref(false)
const search = ref('')

const activeOption = computed<UOption | undefined>(() => {
  return options.find(
    option => option.value === modal.value,
  )
})

const value = computed(() => {
  return options.find(
    option => option.value === modal.value,
  )?.label ?? 'Выберите категорию'
})

const filteredOptions = computed<UOption[]>(() => {
  const query = search.value.trim().toLowerCase()
  if (!query)
    return options
  return options.filter(option => option.label.toLowerCase().includes(query))
})

function selectOption(value: UOption) {
  modal.value = value.value
  dropDown.value = false
}

function visibleSelect() {
  dropDown.value = !dropDown.value
}

function clearSearch() {
  search.value = ''
  searchRef.value?.focus()
}

watch(dropDown, (open) => {
  if (open) {
    search.value = ''
    nextTick(() => searchRef.value?.focus())
  }
})

onClickOutside(selectRef, () => {
  dropDown.value = false
})
</script>

<template>
  <div
    ref="selectRef"
    class="u-select"
    :class="{ 'is-open': dropDown }"
    :style="{ '--u-select-offset': `${parentPadding}px` }"
    @click="visibleSelect"
  >
    <div
      v-if="activeOption?.icon"
    >
      <div
        class="u-select__icon"
        :style="{ '--color-icon-bg': activeOption.color }"
      >
        <u-icon
          :icon="activeOption.icon"
        />
      </div>
    </div>

    <div class="u-select__value">
      <span class="label-text">{{ label }}<span
        v-if="required"
        class="u-select__required"
      >*</span></span>
      <div
        class="value-text"
      >
        {{ value }}
      </div>
    </div>

    <u-icon
      class="u-select__arrow"
      :class="{ 'is-open': dropDown }"
      icon="app:chevron-left"
      width="16"
      height="16"
    />

    <transition name="fade-down">
      <div
        v-show="dropDown"
        class="u-select__list"
        @click.stop
      >
        <div class="u-select__search">
          <u-icon
            class="u-select__search-icon"
            icon="app:search"
            width="16"
            height="16"
          />
          <input
            ref="searchRef"
            v-model="search"
            type="text"
            class="u-select__search-input value-text"
            placeholder="Поиск категории"
          >
          <button
            v-if="search"
            type="button"
            class="u-select__search-clear"
            aria-label="Очистить"
            @click="clearSearch"
          >
            <u-icon
              icon="app:close"
              width="14"
              height="14"
            />
          </button>
        </div>

        <div
          v-if="filteredOptions.length"
          class="u-select__list-wrapper"
        >
          <div
            v-for="item in filteredOptions"
            :key="item.value"
            class="u-select__list-item"
            :class="{ 'is-active': item.value === modal }"
            @click="selectOption(item)"
          >
            <div
              class="u-select__icon"
              :style="{ '--color-icon-bg': item.color }"
            >
              <u-icon
                :icon="item.icon!"
              />
            </div>
            <span>{{ item.label }}</span>
          </div>
        </div>

        <div
          v-else
          class="u-select__empty"
        >
          Ничего не найдено
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.fade-down-enter-active,
.fade-down-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top center;
}

.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.u-select {
  width: 100%;
  position: relative;
  gap: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.is-open {
    z-index: 100;
  }

  &__value {
    flex: 1 1 0%;
  }

  &__required {
    margin-left: 3px;
    color: var(--red-color, #e5484d);
  }

  &__list {
    @include glass-panel(18px, 8px, false);
    position: absolute;

    left: calc(-1 * var(--u-select-offset));
    width: calc(100% + (var(--u-select-offset) * 2));
    top: calc(100% + 24px);

    z-index: 100;
    overflow: hidden;
    background: var(--popover-bg);

    &-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;

      max-height: 240px;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }

    &-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      border-radius: 10px;
      cursor: pointer;
      transition: 150ms;

      background: var(--surface-subtle);
      border: 0.5px solid var(--border-subtle);

      &.is-active {
        border: none;
        background: transparent;
      }
    }
  }

  &__search {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding: 0 10px;
    height: 38px;
    border-radius: 10px;
    background: var(--surface-subtle);
    border: 0.5px solid var(--border-subtle);

    &-icon {
      flex-shrink: 0;
      color: var(--text-secondary, currentColor);
      opacity: 0.6;
    }

    &-input {
      flex: 1 1 0%;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      color: inherit;

      &::placeholder {
        color: var(--text-secondary, currentColor);
        opacity: 0.6;
      }
    }

    &-clear {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 2px;
      border: none;
      background: transparent;
      color: var(--text-secondary, currentColor);
      opacity: 0.6;
      cursor: pointer;
      transition: 150ms;

      &:hover {
        opacity: 1;
      }
    }
  }

  &__empty {
    padding: 20px 10px;
    text-align: center;
    color: var(--text-secondary, currentColor);
    opacity: 0.7;
  }

  &__arrow {
    transform: rotate(-90deg);
    transition: 150ms;

    &.is-open {
      transform: rotate(0deg);
    }
  }

  &__icon {
    background-color: color-mix(in srgb, var(--color-icon-bg), black 40%);
    width: 24px;
    height: 24px;
    border-radius: 6px;
    /* Глиф на цветном квадрате всегда белый (в обеих темах) */
    color: #fff;

    border: 1px solid var(--color-icon-bg);
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      height: 12px;
      width: 12px;
      object-fit: cover;
    }
  }
}
</style>
