<script setup lang="ts">
import type { EntityId } from '@/components/00.shared/stores/places'
import { storeToRefs } from 'pinia'
import { useDeferredPendingSet, usePlacesStore } from '@/components/00.shared/stores/places'
import { openGroupDetail, openGroupForm } from '@/components/02.features/PersonalGroups'

const store = usePlacesStore()
const { groups } = storeToRefs(store)

/** id групп, чья несинхронизированность держится дольше грейс-периода. */
const pendingGroups = useDeferredPendingSet(() => groups.value)

function marksOf(groupId: EntityId) {
  return store.marksInGroup(groupId)
}

function previewMarks(groupId: EntityId) {
  return marksOf(groupId).slice(0, 3)
}
</script>

<template>
  <div class="groups-tab">
    <button
      class="new-list"
      type="button"
      @click="openGroupForm()"
    >
      <u-icon
        icon="solar:add-circle-linear"
        height="20"
      />
      Новый список
    </button>

    <div
      v-for="group in groups"
      :key="String(group.id)"
      class="list-card"
    >
      <button
        class="list-card__main"
        type="button"
        @click="openGroupDetail(group.id)"
      >
        <div class="list-card__info">
          <div class="list-card__title-row">
            <span class="list-card__title">{{ group.name }}</span>
            <span class="list-card__badge">только вы</span>
            <span
              v-if="pendingGroups.has(group.id)"
              class="list-card__pending"
              title="Не синхронизировано"
            >
              <u-icon
                icon="solar:cloud-upload-linear"
                height="13"
              />
            </span>
          </div>
          <span class="list-card__count">
            {{ marksOf(group.id).length }} меток
          </span>
        </div>

        <div class="list-card__preview">
          <span
            v-for="(item, i) in previewMarks(group.id)"
            :key="i"
            class="list-card__chip"
            :style="{ borderColor: item.color }"
          >
            <u-icon
              v-if="item.icon"
              :icon="item.icon"
            />
          </span>
          <span
            v-for="i in Math.max(0, 3 - previewMarks(group.id).length)"
            :key="`empty-${i}`"
            class="list-card__chip list-card__chip--empty"
          />
        </div>

        <u-icon
          class="list-card__chevron"
          icon="line-md:chevron-right"
          height="20"
        />
      </button>

      <button
        class="list-card__share"
        type="button"
      >
        <u-icon
          icon="solar:upload-linear"
          height="16"
        />
        Поделиться списком
      </button>
    </div>

    <p
      v-if="!groups.length"
      class="empty"
    >
      Списков пока нет. Создайте — метки можно объединять в списки.
    </p>
  </div>
</template>

<style scoped lang="scss">
.groups-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.new-list {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  cursor: pointer;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
  border-radius: 14px;
  @include value-text(15px, var(--primary-color), 600);
}

.list-card {
  @include glass-panel(16px, 14px, false, false);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.list-card__main {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

.list-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.list-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.list-card__title {
  @include value-text(17px, var(--text-color), 700);
}

.list-card__badge {
  padding: 3px 9px;
  border-radius: 999px;
  color: var(--text-color-secondary);
  background: var(--surface-subtle);
  @include label-text(11px, none);
  font-weight: 600;
}

.list-card__pending {
  display: flex;
  color: var(--primary-color);
}

.list-card__count {
  @include label-text(13px, none);
}

.list-card__preview {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.list-card__chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 1.5px dashed var(--primary-color);

  &--empty {
    border-color: var(--border-subtle);
  }
}

.list-card__chevron {
  flex-shrink: 0;
  color: var(--text-color-secondary);
}

.list-card__share {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  cursor: pointer;
  color: var(--text-color);
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  @include value-text(14px, var(--text-color), 600);
}

.empty {
  @include label-text(13px, none);
  text-align: center;
  padding: 24px 12px;
  line-height: 1.5;
}
</style>
