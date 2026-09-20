<script setup lang="ts">
import type { EntityId } from '@/components/00.shared/stores/places'
import type { MapPoint } from '@/types/shared/map'
import { storeToRefs } from 'pinia'
import { useGeocoding } from '@/components/00.shared/composables/useGeocoding'
import { hapticSuccess } from '@/components/00.shared/lib/haptics'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { usePlacesStore } from '@/components/00.shared/stores/places'
import MarkPhotoInput from '@/components/02.features/MarkForm/ui/MarkPhotoInput.vue'
import { openGroupForm } from '@/components/02.features/PersonalGroups'

const props = defineProps<{
  /** Координаты создаваемой метки (режим создания). */
  coords?: MapPoint
  /** Id редактируемой метки (режим правки). */
  markId?: EntityId
}>()

const store = usePlacesStore()
const { marks, groups } = storeToRefs(store)
const { close } = useDialogStore()
const notify = useNotificationStore()
const { address, fetchAddress } = useGeocoding()

/** Редактируемая метка (если открыты в режиме правки). */
const editingMark = computed(() =>
  props.markId != null ? marks.value.find(m => m.id === props.markId) ?? null : null,
)
const isEdit = computed(() => editingMark.value != null)

const markCoords = computed<MapPoint>(() =>
  editingMark.value?.coordinates ?? props.coords ?? [0, 0],
)

// временный uuid заменится на серверный при синхронизации (см. remapId).
const availableGroups = computed(() =>
  groups.value.map(g => ({
    id: String(g.id),
    name: g.name,
    color: g.color,
    icon: g.icon,
  })),
)
const selectedgroupsIds = ref<string[]>([])

function toggleGroup(id: string) {
  const i = selectedgroupsIds.value.indexOf(id)
  if (i === -1)
    selectedgroupsIds.value.push(id)
  else
    selectedgroupsIds.value.splice(i, 1)
}

const ICONS = [
  'solar:map-point-linear',
  'solar:home-2-linear',
  'solar:cup-hot-linear',
  'solar:star-linear',
  'solar:flag-linear',
  'solar:heart-linear',
  'solar:camera-linear',
  'solar:cart-large-2-linear',
]
const COLORS = ['#7c3aed', '#3399ff', '#16a34a', '#eab308', '#ff5a5f', '#ec4899']

const title = ref('')
const description = ref('')
const files = ref<File[]>([])
const isVisible = ref(true)
const selectedIcon = ref(ICONS[0])
const selectedColor = ref(COLORS[0])
const isSubmitting = ref(false)
const nameError = ref(false)

watch(title, () => {
  nameError.value = false
})

const photosToDelete = ref<string[]>([])

const existingPhotos = computed(() => {
  const all = editingMark.value?.photos ?? []
  return all.filter(p => !p.startsWith('local://') && !photosToDelete.value.includes(p))
})

function removeExistingPhoto(url: string) {
  if (!photosToDelete.value.includes(url))
    photosToDelete.value.push(url)
}

watch(editingMark, (mark) => {
  if (!mark)
    return
  title.value = mark.title
  description.value = mark.description ?? ''
  isVisible.value = mark.isVisible
  selectedIcon.value = mark.icon ?? ICONS[0]
  selectedColor.value = mark.color ?? COLORS[0]
  selectedgroupsIds.value = [...(mark.groupsIds ?? [])]
  photosToDelete.value = []
}, { immediate: true })

onMounted(() => fetchAddress(markCoords.value))

async function handleSubmit() {
  if (!title.value.trim()) {
    nameError.value = true
    notify.add({ title: 'Внимание', description: 'Введите название метки', type: 'warning' })
    return
  }
  if (selectedgroupsIds.value.length === 0) {
    notify.add({ title: 'Внимание', description: 'Выберите хотя бы одну группу', type: 'warning' })
    return
  }
  isSubmitting.value = true

  if (isEdit.value && editingMark.value) {
    await store.updateMark(
      editingMark.value.id,
      {
        title: title.value.trim(),
        description: description.value.trim() || undefined,
        icon: selectedIcon.value,
        color: selectedColor.value,
        isVisible: isVisible.value,
        groupsIds: [...selectedgroupsIds.value],
        photosToDelete: photosToDelete.value.length ? [...photosToDelete.value] : undefined,
      },
      files.value,
    )
    hapticSuccess()
    notify.add({
      title: 'Метка обновлена',
      description: 'Изменения сохранены.',
      type: 'success',
    })
  }
  else {
    await store.createMark(
      {
        title: title.value.trim(),
        longitude: markCoords.value[0],
        latitude: markCoords.value[1],
        description: description.value.trim() || undefined,
        category: 'undefinde',
        icon: selectedIcon.value,
        color: selectedColor.value,
        isVisible: isVisible.value,
        groupsIds: [...selectedgroupsIds.value],
      },
      files.value,
    )
    hapticSuccess()
    notify.add({
      title: 'Личная метка создана',
      description: 'Видна только вам. Сохранится даже без интернета.',
      type: 'success',
    })
  }

  isSubmitting.value = false
  close()
}
</script>

<template>
  <div class="mark-form">
    <header class="mark-form__header">
      <button
        type="button"
        class="mark-form__header-btn mark-form__header-btn--cancel"
        @click="close"
      >
        Отмена
      </button>
      <h2 class="mark-form__header-title">
        {{ isEdit ? 'Редактирование' : 'Личная метка' }}
      </h2>
      <button
        type="button"
        class="mark-form__header-btn mark-form__header-btn--submit"
        :disabled="isSubmitting"
        @click="handleSubmit"
      >
        {{ isEdit ? 'Сохранить' : 'Готово' }}
      </button>
    </header>

    <div class="mark-form__body">
      <div class="u-block mark-form__coords">
        <u-icon
          class="mark-form__coords-icon"
          icon="line-md:my-location-loop"
          width="22"
          height="22"
        />
        <div class="mark-form__coords-info">
          <span class="mark-form__coords-label">Точка на карте</span>
          <span class="mark-form__coords-value">
            {{ markCoords[0].toFixed(4) }}° N, {{ markCoords[1].toFixed(4) }}° E
          </span>
        </div>
      </div>

      <mark-photo-input
        v-model:files="files"
        :existing="existingPhotos"
        :max="3"
        :max-size-mb="20"
        @remove-existing="removeExistingPhoto"
      />

      <div class="u-block mark-form__fields">
        <u-input
          v-model="title"
          label="Название"
          required
          :error="nameError"
          placeholder="Напр. «Любимая кофейня»"
        />
        <u-drawer />
        <div class="mark-form__field">
          <span class="label-text">Адрес</span>
          <div class="value-text mark-form__value--address">
            {{ address || 'Определяем адрес…' }}
          </div>
        </div>
      </div>

      <div class="u-block pm-appearance">
        <div class="pm-appearance__group">
          <span class="label-text">Иконка</span>
          <div class="pm-appearance__icons">
            <button
              v-for="icon in ICONS"
              :key="icon"
              type="button"
              class="pm-appearance__icon"
              :class="{ 'pm-appearance__icon--active': selectedIcon === icon }"
              :style="selectedIcon === icon ? { borderColor: selectedColor, color: selectedColor } : {}"
              @click="selectedIcon = icon"
            >
              <u-icon
                :icon="icon"
                height="22"
              />
            </button>
          </div>
        </div>

        <u-drawer />

        <div class="pm-appearance__group">
          <span class="label-text">Цвет</span>
          <div class="pm-appearance__colors">
            <button
              v-for="color in COLORS"
              :key="color"
              type="button"
              class="pm-appearance__color"
              :class="{ 'pm-appearance__color--active': selectedColor === color }"
              :style="{ background: color }"
              @click="selectedColor = color"
            />
          </div>
        </div>
      </div>

      <div class="u-block pm-groups">
        <span class="label-text">Группа
          <span class="pm-groups__required">*</span>
        </span>

        <div
          v-if="availableGroups.length"
          class="pm-groups__list"
        >
          <button
            v-for="group in availableGroups"
            :key="group.id"
            type="button"
            class="pm-groups__chip"
            :class="{ 'pm-groups__chip--active': selectedgroupsIds.includes(group.id) }"
            :style="selectedgroupsIds.includes(group.id)
              ? { borderColor: group.color || 'var(--primary-color)', color: group.color || 'var(--primary-color)' }
              : {}"
            @click="toggleGroup(group.id)"
          >
            <u-icon
              :icon="group.icon || 'solar:folder-linear'"
              height="16"
            />
            {{ group.name }}
          </button>
        </div>

        <div
          v-else
          class="pm-groups__empty"
        >
          <span class="pm-groups__empty-hint">
            Сначала создайте группу — метка обязательно относится к группе.</span>
          <button
            type="button"
            class="pm-groups__create"
            @click="openGroupForm()"
          >
            <u-icon
              icon="solar:add-circle-linear"
              height="18"
            />
            Создать группу
          </button>
        </div>
      </div>

      <u-text-area
        v-model="description"
        label="Описание"
        placeholder="Заметка только для вас"
      />

      <label class="u-block pm-toggle">
        <div class="pm-toggle__text">
          <span class="pm-toggle__title">Показывать на карте</span>
          <span class="pm-toggle__hint">Метка видна пунктиром только вам</span>
        </div>
        <u-switch v-model="isVisible" />
      </label>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/components/02.features/MarkForm/ui/MarkForm.scss" />

<style scoped lang="scss">
.mark-form__value--address {
  color: var(--text-color-secondary);
}

.pm-appearance {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__icons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    cursor: pointer;
    color: var(--text-color-secondary);
    background: var(--surface-subtle);
    border: 1.5px solid transparent;
    transition:
      border-color 0.2s ease,
      color 0.2s ease;
  }

  &__colors {
    display: flex;
    gap: 10px;
  }

  &__color {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: transform 0.15s ease;

    &--active {
      border-color: var(--text-color);
      transform: scale(1.1);
    }
  }
}

.pm-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;

  &__text {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__title {
    @include value-text(15px, var(--text-color), 600);
  }

  &__hint {
    @include label-text(12px, none);
  }
}

.pm-groups {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__required {
    color: var(--red-color);
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    cursor: pointer;
    color: var(--text-color-secondary);
    background: var(--surface-subtle);
    border: 1.5px solid transparent;
    border-radius: 999px;
    @include value-text(13px, var(--text-color-secondary), 600);
    transition:
      border-color 0.2s ease,
      color 0.2s ease;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__empty-hint {
    @include label-text(12px, none);
  }

  &__create {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 12px;
    cursor: pointer;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
    border-radius: 12px;
    @include value-text(13px, var(--primary-color), 600);
  }
}
</style>
