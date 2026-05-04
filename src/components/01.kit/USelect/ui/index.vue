<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

interface UOption {
  label: string
  value: number
  color?: string
  icon?: string
}

const props = defineProps<{
  label: string
  options: UOption[]
}>()

const modal = defineModel<number | null>()
const selectRef = ref<HTMLElement | null>(null)
const dropDown = ref(false)
const activeOption = computed<UOption | undefined>(() => {
  return props.options.find(
    option => option.value === modal.value,
  )
})

const value = computed(() => {
  return props.options.find(
    option => option.value === modal.value,
  )?.label ?? 'Выберите категорию'
})

function selectOption(value: UOption) {
  modal.value = value.value
  dropDown.value = false
}

function visibleSelect() {
  dropDown.value = !dropDown.value
}

onClickOutside(selectRef, () => {
  dropDown.value = false
})
</script>

<template>
  <div
    ref="selectRef"
    class="u-select"
    :class="{ 'is-open': dropDown }"
    @click="visibleSelect"
  >
    <div
      v-if="activeOption?.icon"
    >
      <div
        class="u-select__icon"
        :style="{ '--color-icon-bg': activeOption.color }"
      >
        <img
          :alt="activeOption.label"
          :src="activeOption.icon"
        >
      </div>
    </div>

    <div class="u-select__value">
      <span class="label-text">{{ label }}</span>
      <div
        class="value-text"
      >
        {{ value }}
      </div>
    </div>

    <u-icon
      class="u-select__arrow"
      :class="{ 'is-open': dropDown }"
      icon="fe:arrow-left"
      width="16"
      height="16"
    />

    <transition name="fade-down">
      <div
        v-show="dropDown"
        class="u-select__list"
        @click.stop
      >
        <div class="u-select__list-wrapper">
          <div
            v-for="item in options"
            :key="item.value"
            class="u-select__list-item"
            :class="{ 'is-active': item.value === modal }"
            @click="selectOption(item)"
          >
            <div
              class="u-select__icon"
              :style="{ '--color-icon-bg': item.color }"
            >
              <img
                :alt="item.label"
                :src="item.icon"
              >
            </div>
            <span>{{ item.label }}</span>
          </div>
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

  &__list {
    position: absolute;
    top: calc(100% + 24px);
    width: 107%;
    z-index: 100;
    border-radius: 18px;
    overflow: hidden;
    backdrop-filter: blur(41.28px) saturate(180%);
    background: oklch(0.16 0.04 220 / 0.95);
    border: 0.5px solid rgba(255, 255, 255, 0.15);
    box-shadow:
      rgba(255, 255, 255, 0.06) 0px 1px 0px inset,
      rgba(0, 0, 0, 0.35) 0px 10px 30px;
    padding: 8px;
    left: -16px;

    &-wrapper {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }

    &-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      border-radius: 10px;
      cursor: pointer;
      transition: 150ms;

      background: rgba(255, 255, 255, 0.04);
      border: 0.5px solid rgba(255, 255, 255, 0.08);

      &.is-active {
        border: none;
        background: transparent;
      }
    }
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
