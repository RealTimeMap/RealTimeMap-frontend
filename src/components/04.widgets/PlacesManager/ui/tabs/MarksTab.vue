<script setup lang="ts">
import type { EntityId, LocalPersonalMark } from '@/components/00.shared/stores/places'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useDeferredPendingSet, usePlacesStore } from '@/components/00.shared/stores/places'
import { openPersonalMarkDetail } from '@/components/02.features/PersonalMarkDetail'

const store = usePlacesStore()
const { marks } = storeToRefs(store)
const router = useRouter()
const notify = useNotificationStore()

/** id меток, чья несинхронизированность держится дольше грейс-периода. */
const pendingMarks = useDeferredPendingSet(() => marks.value)

function toggleVisibility(id: EntityId, current: boolean) {
  store.updateMark(id, { isVisible: !current })
}

function startCreate() {
  notify.add({
    title: 'Поставьте метку на карте',
    description: 'Нажмите на карту и выберите «Только для себя»',
    type: 'info',
  })
  router.push({ name: 'home-map' })
}

function getGroupIds(mark: LocalPersonalMark): string[] {
  return mark.groupsIds ?? []
}

function badge(mark: LocalPersonalMark): { label: string, tone: 'shared' | 'private' | 'hidden' } {
  if (!mark.isVisible)
    return { label: 'скрыта', tone: 'hidden' }

  const groupCount = getGroupIds(mark).length
  if (groupCount > 0)
    return { label: 'в группе', tone: 'shared' }

  return { label: 'только вы', tone: 'private' }
}

function subtitle(mark: LocalPersonalMark): string {
  const parts: string[] = []
  const groupCount = getGroupIds(mark).length

  if (groupCount > 0)
    parts.push(`${groupCount} гр.`)

  const photoCount = mark.photos?.length ?? 0
  parts.push(photoCount ? `${photoCount} фото` : 'без фото')

  return parts.join(' · ')
}
</script>

<template>
  <div class="marks-tab">
    <button
      class="add-btn"
      type="button"
      @click="startCreate"
    >
      <u-icon
        icon="solar:add-circle-linear"
        height="20"
      />
      Новая личная метка
    </button>

    <button
      v-for="mark in marks"
      :key="String(mark.id)"
      class="mark-card"
      type="button"
      @click="openPersonalMarkDetail(mark.id)"
    >
      <span
        class="mark-card__icon"
        :style="{ borderColor: mark.color || 'var(--primary-color)' }"
      >
        <u-icon
          :icon="mark.icon || 'solar:map-point-linear'"
          height="22"
        />
      </span>

      <div class="mark-card__text">
        <div class="mark-card__title-row">
          <span class="mark-card__title">{{ mark.title }}</span>
          <span
            class="mark-card__badge"
            :class="`mark-card__badge--${badge(mark).tone}`"
          >
            {{ badge(mark).label }}
          </span>
          <span
            v-if="pendingMarks.has(mark.id)"
            class="mark-card__pending"
            title="Не синхронизировано"
          >
            <u-icon
              icon="solar:cloud-upload-linear"
              height="14"
            />
          </span>
        </div>
        <span class="mark-card__subtitle">{{ subtitle(mark) }}</span>
      </div>

      <div
        class="mark-card__visibility"
        type="button"
        :title="mark.isVisible ? 'Скрыть с карты' : 'Показать на карте'"
        @click.stop="toggleVisibility(mark.id, mark.isVisible)"
      >
        <u-icon
          :icon="mark.isVisible ? 'solar:eye-linear' : 'solar:eye-closed-linear'"
          height="18"
        />
      </div>
    </button>

    <p
      v-if="!marks.length"
      class="empty"
    >
      Пока нет личных меток. Создайте первую — она сохранится даже без интернета.
    </p>
  </div>
</template>

<style scoped lang="scss">
.marks-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-btn {
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

.mark-card {
  display: flex;
  align-items: center;
  gap: 12px;
  @include glass-panel(14px, 12px, false, false);
}

.mark-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1.5px dashed var(--primary-color);
  color: var(--text-color);
}

.mark-card__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-start;
}

.mark-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.mark-card__title {
  @include value-text(15px, var(--text-color), 600);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mark-card__badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  @include label-text(11px, none);
  font-weight: 600;

  &--shared {
    color: var(--access-color);
    background: color-mix(in srgb, var(--access-color) 15%, transparent);
  }
  &--private {
    color: var(--text-color-secondary);
    background: var(--surface-subtle);
  }
  &--hidden {
    color: var(--text-color-muted);
    background: var(--surface-subtle);
  }
}

.mark-card__pending {
  flex-shrink: 0;
  display: flex;
  color: var(--primary-color);
}

.mark-card__subtitle {
  @include label-text(12px, none);
}

.mark-card__visibility {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-color-secondary);
  background: var(--surface-subtle);
  border: none;
}

.empty {
  @include label-text(13px, none);
  text-align: center;
  padding: 24px 12px;
  line-height: 1.5;
}
</style>
