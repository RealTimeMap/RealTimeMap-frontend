<script setup lang="ts">
import type { SubscriptionListType } from '../model/useSubscriptionList'
import SubscriptionList from './SubscriptionList.vue'

const { initialTab = 'subscriptions' } = defineProps<{
  initialTab?: SubscriptionListType
}>()

const tabs: { key: SubscriptionListType, label: string }[] = [
  { key: 'subscriptions', label: 'Подписки' },
  { key: 'subscribers', label: 'Подписчики' },
]

const activeTab = ref<SubscriptionListType>(initialTab)
const activeIndex = computed(() => tabs.findIndex(t => t.key === activeTab.value))
</script>

<template>
  <div class="subs-modal">
    <div
      class="subs-modal__filter"
      :style="{ '--tabs': tabs.length, '--active': activeIndex }"
    >
      <span class="subs-modal__pill" />
      <button
        v-for="t in tabs"
        :key="t.key"
        class="subs-modal__tab"
        :class="{ 'is-active': activeTab === t.key }"
        type="button"
        @click="activeTab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <div class="subs-modal__body">
      <keep-alive>
        <subscription-list
          :key="activeTab"
          :type="activeTab"
        />
      </keep-alive>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.subs-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  &__filter {
    position: relative;
    display: flex;
    padding: 4px;
    margin-bottom: 10px;
    border-radius: 14px;
    background: var(--bg-color-block);
    border: 0.5px solid var(--border-subtle);
  }

  &__pill {
    position: absolute;
    top: 4px;
    left: 4px;
    bottom: 4px;
    width: calc((100% - 8px) / var(--tabs));
    border-radius: 10px;
    background: var(--primary-color);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--primary-color) 40%, transparent);
    transform: translateX(calc(var(--active) * 100%));
    transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  &__tab {
    position: relative;
    z-index: 1;
    flex: 1;
    padding: 9px 0;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    background: transparent;
    color: var(--text-color-secondary);
    font-size: 13px;
    font-weight: 600;
    transition: color 0.25s ease;

    &.is-active {
      color: #fff;
    }
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
}
</style>
