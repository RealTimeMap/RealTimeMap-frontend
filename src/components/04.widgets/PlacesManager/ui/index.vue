<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useIsOnline } from '@/components/00.shared/composables/useNetworkWatch'
import { useDeferredPending, usePlacesStore } from '@/components/00.shared/stores/places'
import GroupsTab from './tabs/GroupsTab.vue'
import MarksTab from './tabs/MarksTab.vue'

type TabId = 'marks' | 'groups'

const store = usePlacesStore()
const { marks, groups, isSyncing, lastSyncAt, lastSyncError, pendingCount } = storeToRefs(store)
const isOnline = useIsOnline()

const showPending = useDeferredPending(() => pendingCount.value > 0)

const activeTab = ref<TabId>('marks')

const tabs = computed(() => [
  { id: 'marks' as const, label: 'Метки', count: marks.value.length },
  { id: 'groups' as const, label: 'Группы', count: groups.value.length },
])

const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | null = null

const syncStatus = computed(() => {
  if (isSyncing.value)
    return { text: 'Синхронизация…', tone: 'sync' as const }
  if (!isOnline.value)
    return { text: 'Офлайн · изменения сохранены', tone: 'offline' as const }
  if (showPending.value && pendingCount.value > 0)
    return { text: `Не синхронизировано: ${pendingCount.value}`, tone: 'pending' as const }
  if (lastSyncError.value)
    return { text: 'Не удалось обновить', tone: 'error' as const }
  if (lastSyncAt.value) {
    const mins = Math.floor((now.value - lastSyncAt.value) / 60000)
    const when = mins < 1 ? 'только что' : `${mins} мин назад`
    return { text: `Обновлено ${when}`, tone: 'ok' as const }
  }
  return { text: 'Ожидание синхронизации', tone: 'sync' as const }
})

function refresh() {
  store.trySync()
}

onMounted(() => {
  store.hydrate()
  ticker = setInterval(() => (now.value = Date.now()), 30_000)
})
onUnmounted(() => {
  if (ticker)
    clearInterval(ticker)
})
</script>

<template>
  <div class="places">
    <header class="places__header">
      <h1 class="places__title">
        Мои места
      </h1>
      <p class="places__subtitle">
        <u-icon
          icon="solar:lock-keyhole-minimalistic-linear"
          height="13"
        />
        Всё приватно, пока вы не поделитесь списком
      </p>
    </header>

    <div
      class="sync-bar"
      :class="`sync-bar--${syncStatus.tone}`"
    >
      <span class="sync-bar__status">
        <u-icon
          :icon="isSyncing ? 'line-md:loading-twotone-loop' : 'solar:refresh-linear'"
          height="15"
        />
        {{ syncStatus.text }}
      </span>
      <button
        class="sync-bar__refresh"
        type="button"
        :disabled="isSyncing || !isOnline"
        @click="refresh"
      >
        Обновить
      </button>
    </div>

    <div class="places__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="places__tab"
        :class="{ 'places__tab--active': activeTab === tab.id }"
        type="button"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span class="places__tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <div class="places__body">
      <marks-tab v-if="activeTab === 'marks'" />
      <groups-tab v-else />
    </div>
  </div>
</template>

<style scoped lang="scss">
.places {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 90%;
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: calc(110px + var(--safe-bottom));
}

.places__header {
  padding: calc(16px + var(--safe-top)) 0 16px;
}

.places__subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  @include label-text(12px, none);
}

.sync-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);

  &__status {
    display: flex;
    align-items: center;
    gap: 6px;
    @include label-text(12px, none);
    color: var(--text-color-secondary);
  }

  &__refresh {
    flex-shrink: 0;
    padding: 6px 12px;
    cursor: pointer;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    border: none;
    border-radius: 999px;
    @include value-text(12px, var(--primary-color), 600);

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }

  &--pending &__status,
  &--error &__status {
    color: var(--red-color);
  }

  &--offline &__status {
    color: var(--text-color-muted);
  }
}

.places__tabs {
  display: flex;
  gap: 8px;
}

.places__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  @include glass-panel(14px, 12px, false, false, false);
  @include value-text(14px, var(--text-color-secondary), 600);
  transition:
    border-color 0.2s ease,
    color 0.2s ease;

  &--active {
    color: var(--text-color);
    border-color: var(--primary-color);
  }
}

.places__tab-count {
  @include label-text(12px, none);
  opacity: 0.7;
  line-height: 1.4;
}

.places__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
