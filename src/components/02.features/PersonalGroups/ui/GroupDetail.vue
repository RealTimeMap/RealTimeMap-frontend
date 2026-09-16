<script setup lang="ts">
import type { EntityId, LocalPersonalMark } from '@/components/00.shared/stores/places'
import { storeToRefs } from 'pinia'
import { hapticLight, hapticSuccess } from '@/components/00.shared/lib/haptics'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useDeferredPending, usePlacesStore } from '@/components/00.shared/stores/places'
import { openPersonalMarkDetail } from '@/components/02.features/PersonalMarkDetail'
import { openGroupForm } from '..'

const props = defineProps<{ groupId: EntityId }>()

const store = usePlacesStore()
const { groups } = storeToRefs(store)
const { close } = useDialogStore()

const group = computed(() => groups.value.find(g => String(g.id) === String(props.groupId)) ?? null)
const confirmingDelete = ref(false)

const showPending = useDeferredPending(() => group.value?.pending)

type SortMode = 'title' | 'recent'
const sortMode = ref<SortMode>('title')

const marks = computed<LocalPersonalMark[]>(() => {
  const list = store.marksInGroup(props.groupId)
  if (sortMode.value === 'title')
    return [...list].sort((a, b) => a.title.localeCompare(b.title, 'ru'))
  // 'recent' — свежие сверху: revision монотонно растёт при каждом изменении.
  return [...list].sort((a, b) =>
    (b.revision - a.revision)
    || (Number(b.id) || 0) - (Number(a.id) || 0),
  )
})

const canDelete = computed(() => marks.value.length === 0)

// Режим редактирования состава группы (открепление/прикрепление меток).
const isEditingMarks = ref(false)

// Прикреплять метки можно только к серверной группе (её id — number).
const canAttach = computed(() => typeof props.groupId === 'number')

// Кандидаты на прикрепление: серверные метки, ещё не входящие в эту группу.
const candidateMarks = computed<LocalPersonalMark[]>(() => {
  if (!canAttach.value)
    return []
  const gid = Number(props.groupId)
  return store.marks
    .filter(m => typeof m.id === 'number' && !m.groupsIds.includes(gid))
    .sort((a, b) => a.title.localeCompare(b.title, 'ru'))
})

function canDetach(mark: LocalPersonalMark) {
  return mark.groupsIds.length > 1
}

async function detachMark(mark: LocalPersonalMark) {
  if (!canDetach(mark))
    return
  const gid = Number(props.groupId)
  const rest = mark.groupsIds.filter(g => g !== gid)
  await store.updateMark(mark.id, { groupsIds: rest })
  hapticLight()
}

async function attachMark(mark: LocalPersonalMark) {
  await store.updateMark(mark.id, { groupsIds: [...mark.groupsIds, Number(props.groupId)] })
  hapticLight()
}

const anyVisible = computed(() => marks.value.some(m => m.isVisible))

async function toggleAllVisibility() {
  const next = !anyVisible.value
  for (const m of store.marksInGroup(props.groupId)) {
    if (m.isVisible !== next)
      await store.updateMark(m.id, { isVisible: next })
  }
  hapticSuccess()
}

function onMarkClick(mark: LocalPersonalMark) {
  if (isEditingMarks.value)
    return
  openPersonalMarkDetail(mark.id)
}

function edit() {
  if (group.value) {
    openGroupForm({
      id: group.value.id,
      name: group.value.name,
      description: group.value.description,
      color: group.value.color,
      icon: group.value.icon,
    })
  }
}

async function remove() {
  if (!group.value || !canDelete.value)
    return
  await store.deleteGroup(group.value.id)
  close()
}
</script>

<template>
  <div
    v-if="group"
    class="group-detail"
  >
    <header class="group-detail__header">
      <span
        class="group-detail__icon"
        :style="{
          borderColor: group.color || 'var(--primary-color)',
          color: group.color || 'var(--primary-color)',
        }"
      >
        <u-icon
          :icon="group.icon || 'solar:folder-linear'"
          height="26"
        />
      </span>
      <div class="group-detail__heading">
        <h2 class="group-detail__title">
          {{ group.name }}
        </h2>
        <span
          v-if="group.description"
          class="group-detail__desc"
        >{{ group.description }}</span>
        <span class="group-detail__meta">
          {{ marks.length }} меток
          <template v-if="showPending"> · не синхронизировано</template>
        </span>
      </div>
    </header>

    <div class="group-detail__actions">
      <button
        class="group-detail__act"
        type="button"
        @click="edit"
      >
        <u-icon
          icon="solar:pen-linear"
          height="18"
        />
        Изменить
      </button>
      <button
        v-if="marks.length"
        class="group-detail__act"
        type="button"
        @click="toggleAllVisibility"
      >
        <u-icon
          :icon="anyVisible ? 'solar:eye-closed-linear' : 'solar:eye-linear'"
          height="18"
        />
        {{ anyVisible ? 'Скрыть все' : 'Показать все' }}
      </button>
      <button
        class="group-detail__act group-detail__act--wide"
        :class="{ 'group-detail__act--active': isEditingMarks }"
        type="button"
        @click="isEditingMarks = !isEditingMarks"
      >
        <u-icon
          :icon="isEditingMarks ? 'line-md:confirm' : 'solar:list-check-linear'"
          height="18"
        />
        {{ isEditingMarks ? 'Готово' : 'Редактировать метки' }}
      </button>
      <button
        v-if="!canDelete"
        class="group-detail__act group-detail__act--danger group-detail__act--wide"
        type="button"
        disabled
        title="Сначала удалите или перенесите метки группы"
      >
        <u-icon
          icon="solar:lock-keyhole-minimalistic-linear"
          height="18"
        />
        Удалить
      </button>
      <button
        v-else-if="!confirmingDelete"
        class="group-detail__act group-detail__act--danger group-detail__act--wide"
        type="button"
        @click="confirmingDelete = true"
      >
        <u-icon
          icon="solar:trash-bin-trash-linear"
          height="18"
        />
        Удалить
      </button>
      <button
        v-else
        class="group-detail__act group-detail__act--danger group-detail__act--wide"
        type="button"
        @click="remove"
      >
        <u-icon
          icon="solar:trash-bin-trash-bold"
          height="18"
        />
        Точно?
      </button>
    </div>

    <p
      v-if="!canDelete"
      class="group-detail__delete-hint"
    >
      Чтобы удалить группу, сначала уберите из неё все метки.
    </p>

    <div
      v-if="marks.length"
      class="group-detail__sort"
    >
      <button
        class="group-detail__sort-btn"
        :class="{ 'group-detail__sort-btn--active': sortMode === 'title' }"
        type="button"
        @click="sortMode = 'title'"
      >
        По названию
      </button>
      <button
        class="group-detail__sort-btn"
        :class="{ 'group-detail__sort-btn--active': sortMode === 'recent' }"
        type="button"
        @click="sortMode = 'recent'"
      >
        Сначала новые
      </button>
    </div>

    <div class="group-detail__marks">
      <div
        v-for="mark in marks"
        :key="String(mark.id)"
        class="gd-mark"
        :class="{ 'gd-mark--static': isEditingMarks }"
        role="button"
        tabindex="0"
        @click="onMarkClick(mark)"
        @keydown.enter="onMarkClick(mark)"
      >
        <span
          class="gd-mark__icon"
          :style="{
            borderColor: mark.color || 'var(--primary-color)',
            color: mark.color || 'var(--primary-color)',
          }"
        >
          <u-icon
            :icon="mark.icon || 'solar:map-point-linear'"
            height="18"
          />
        </span>
        <span class="gd-mark__title">{{ mark.title }}</span>
        <button
          v-if="isEditingMarks"
          class="gd-mark__action gd-mark__action--danger"
          type="button"
          :disabled="!canDetach(mark)"
          :title="canDetach(mark)
            ? 'Открепить от группы'
            : 'Метка должна оставаться хотя бы в одной группе'"
          @click.stop="detachMark(mark)"
        >
          <u-icon
            icon="solar:link-broken-linear"
            height="18"
          />
        </button>
        <u-icon
          v-else
          class="gd-mark__chevron"
          icon="line-md:chevron-right"
          height="18"
        />
      </div>

      <p
        v-if="!marks.length"
        class="group-detail__empty"
      >
        В этой группе пока нет меток.
      </p>
    </div>

    <div
      v-if="isEditingMarks"
      class="group-detail__attach"
    >
      <span class="group-detail__attach-title">Добавить метки</span>

      <p
        v-if="!canAttach"
        class="group-detail__attach-hint"
      >
        {{ showPending
          ? 'Группа ещё не синхронизирована — добавить метки можно после синхронизации.'
          : 'Добавлять метки можно только в синхронизированную группу.' }}
      </p>

      <template v-else>
        <div
          v-for="mark in candidateMarks"
          :key="String(mark.id)"
          class="gd-mark"
        >
          <span
            class="gd-mark__icon"
            :style="{
              borderColor: mark.color || 'var(--primary-color)',
              color: mark.color || 'var(--primary-color)',
            }"
          >
            <u-icon
              :icon="mark.icon || 'solar:map-point-linear'"
              height="18"
            />
          </span>
          <span class="gd-mark__title">{{ mark.title }}</span>
          <button
            class="gd-mark__action gd-mark__action--primary"
            type="button"
            title="Прикрепить к группе"
            @click="attachMark(mark)"
          >
            <u-icon
              icon="solar:add-circle-linear"
              height="18"
            />
          </button>
        </div>

        <p
          v-if="!candidateMarks.length"
          class="group-detail__empty"
        >
          Нет меток для добавления.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.group-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 500px;
}

.group-detail__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.group-detail__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  border: 2px solid currentColor;
}

.group-detail__heading {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-detail__title {
  @include value-text(20px, var(--text-color), 700);
}

.group-detail__desc {
  @include label-text(13px, none);
}

.group-detail__meta {
  @include label-text(12px, none);
  opacity: 0.8;
}

.group-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.group-detail__act {
  flex: 1 1 calc(50% - 5px);
  min-width: 0;
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

  &--danger {
    color: var(--red-color);
    background: color-mix(in srgb, var(--red-color) 10%, transparent);
    border-color: color-mix(in srgb, var(--red-color) 25%, transparent);
  }

  &--active {
    color: var(--primary-color);
    border-color: var(--primary-color);
  }

  // &--wide {
  //   flex-basis: 100%;
  // }

  &:disabled {
    cursor: default;
    color: var(--text-color-secondary);
    background: var(--surface-subtle);
    border-color: var(--border-subtle);
  }
}

.group-detail__delete-hint {
  @include label-text(12px, none);
  margin-top: -8px;
}

.group-detail__sort {
  display: flex;
  gap: 8px;
}

.group-detail__sort-btn {
  padding: 8px 14px;
  cursor: pointer;
  color: var(--text-color-secondary);
  background: var(--surface-subtle);
  border: 1px solid transparent;
  border-radius: 999px;
  @include label-text(12px, none);
  font-weight: 600;

  &--active {
    color: var(--text-color);
    border-color: var(--primary-color);
  }
}

.group-detail__marks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gd-mark {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-subtle);
  border: none;

  &--static {
    cursor: default;
  }
}

.gd-mark__action {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  border-radius: 8px;
  border: none;
  background: transparent;

  &--danger {
    color: var(--red-color);
  }

  &--primary {
    color: var(--primary-color);
  }
}

.gd-mark__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1.5px dashed currentColor;
}

.gd-mark__title {
  flex: 1;
  min-width: 0;
  @include value-text(15px, var(--text-color), 600);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gd-mark__chevron {
  flex-shrink: 0;
  color: var(--text-color-secondary);
}

.group-detail__empty {
  @include label-text(13px, none);
  text-align: center;
  padding: 20px 12px;
}

.group-detail__attach {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.group-detail__attach-title {
  @include label-text(12px, none);
  font-weight: 600;
}

.group-detail__attach-hint {
  @include label-text(12px, none);
  opacity: 0.8;
}
</style>
