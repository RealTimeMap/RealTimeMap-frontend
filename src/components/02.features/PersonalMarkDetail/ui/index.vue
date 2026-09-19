<script setup lang="ts">
import type { EntityId } from '@/components/00.shared/stores/places'
import { storeToRefs } from 'pinia'
import { useGeocoding } from '@/components/00.shared/composables/useGeocoding'
import { hapticSuccess } from '@/components/00.shared/lib/haptics'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useDeferredPending, usePlacesStore } from '@/components/00.shared/stores/places'
import { isLocalPhoto, localPhotoPath, photoDisplayUrl } from '@/components/00.shared/stores/places/photoStore'
import { openPersonalMarkEditForm } from '@/components/02.features/PersonalMarkForm'
import { useShareStore } from '@/components/02.features/Share/model'

const props = defineProps<{ markId: EntityId }>()

const store = usePlacesStore()
const shareStore = useShareStore()
const notify = useNotificationStore()
const router = useRouter()
const { marks, groups } = storeToRefs(store)
const { close, destroy } = useDialogStore()
const { address, fetchAddress } = useGeocoding()

const mark = computed(() => marks.value.find(m => String(m.id) === String(props.markId)) ?? null)
const confirmingDelete = ref(false)

/** Плашку «не синхронизировано» показываем с задержкой — быстрый sync её не мигает. */
const showPending = useDeferredPending(() => mark.value?.pending)

/** Резолвим отображаемые URL фото (локальные local:// читаем из Filesystem). */
const photoUrls = ref<string[]>([])
watch(mark, async (m) => {
  if (!m) {
    photoUrls.value = []
    return
  }
  photoUrls.value = await Promise.all(
    m.photos
      .filter((p): p is string => typeof p === 'string' && p.length > 0)
      .map(p => (isLocalPhoto(p) ? photoDisplayUrl(localPhotoPath(p)) : Promise.resolve(p))),
  )
}, { immediate: true })

const hasPhotos = computed(() => photoUrls.value.length > 0)

/** Группы, в которых состоит метка. */
const markGroups = computed(() => {
  if (!mark.value)
    return []
  const ids = mark.value.groupsIds ?? []

  return groups.value.filter(g => ids.includes(String(g.id)))
})

onMounted(() => {
  if (mark.value)
    fetchAddress(mark.value.coordinates)
})

// ── Описание: сворачивание с «Читать полностью» ──────────────────────────
const isExpanded = ref(false)
const canExpand = ref(false)
const descRef = ref<HTMLElement | null>(null)

function checkClamping() {
  if (descRef.value && !isExpanded.value) {
    const el = descRef.value
    canExpand.value = el.scrollHeight > el.clientHeight
  }
}

watch(() => mark.value?.description, () => {
  isExpanded.value = false
  canExpand.value = false
  nextTick(checkClamping)
}, { immediate: true })

onMounted(() => {
  setTimeout(checkClamping, 100)
  window.addEventListener('resize', checkClamping)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkClamping)
})

function toggleVisibility() {
  if (mark.value)
    store.updateMark(mark.value.id, { isVisible: !mark.value.isVisible })
}

/** Координаты для отображения: [lon, lat]. */
const coords = computed(() => mark.value?.coordinates ?? null)
const latText = computed(() => (coords.value ? coords.value[1].toFixed(5) : ''))
const lonText = computed(() => (coords.value ? coords.value[0].toFixed(5) : ''))

async function copyCoords() {
  if (!coords.value)
    return
  try {
    await navigator.clipboard.writeText(`${coords.value[1]}, ${coords.value[0]}`)
    hapticSuccess()
    notify.add({ title: 'Скопировано', description: 'Координаты в буфере обмена', type: 'success' })
  }
  catch {
    notify.add({ title: 'Не удалось', description: 'Копирование недоступно', type: 'warning' })
  }
}

function showOnMap() {
  if (!coords.value)
    return
  shareStore.requestMapFocus(coords.value)
  destroy()
  router.push({ name: 'home-map' })
}

function handleEdit() {
  if (mark.value)
    openPersonalMarkEditForm(mark.value.id)
}

async function remove() {
  if (!mark.value)
    return
  await store.deleteMark(mark.value.id)
  close()
}
</script>

<template>
  <div
    v-if="mark"
    class="mark-container"
  >
    <!-- FAB-кнопки: правка / удаление -->
    <div class="owner-fab">
      <template v-if="!confirmingDelete">
        <button
          class="owner-fab__btn"
          :aria-label="mark.isVisible ? 'Скрыть с карты' : 'Показать на карте'"
          @click="toggleVisibility()"
        >
          <u-icon
            :icon="mark.isVisible ? 'solar:eye-closed-linear' : 'solar:eye-linear'"
            width="17"
          />
        </button>
        <button
          class="owner-fab__btn"
          aria-label="Редактировать метку"
          @click="handleEdit()"
        >
          <u-icon
            icon="solar:pen-linear"
            width="17"
          />
        </button>
        <button
          class="owner-fab__btn owner-fab__btn--danger"
          aria-label="Удалить метку"
          @click="confirmingDelete = true"
        >
          <u-icon
            icon="solar:trash-bin-trash-linear"
            width="17"
          />
        </button>
      </template>
      <template v-else>
        <button
          class="owner-fab__btn owner-fab__btn--danger"
          aria-label="Подтвердить удаление"
          @click="remove()"
        >
          <u-icon
            icon="line-md:confirm"
            width="17"
          />
        </button>
        <button
          class="owner-fab__btn"
          aria-label="Отмена"
          @click="confirmingDelete = false"
        >
          <u-icon
            icon="line-md:close"
            width="15"
          />
        </button>
      </template>
    </div>

    <!-- Шапка с фото -->
    <div
      v-if="hasPhotos"
      class="header-block"
    >
      <div class="gallery-block">
        <img
          v-for="(src, i) in photoUrls"
          :key="i"
          :src="src"
          class="gallery-img"
          alt="Фото"
        >
      </div>
      <div class="header-block__text">
        <span class="header-block__title">{{ mark.title }}</span>
        <span class="header-block__address">{{ address || 'адрес не найден' }}</span>
      </div>
      <div class="header-block__badge">
        <u-icon
          icon="solar:lock-keyhole-minimalistic-bold"
          width="12"
          height="12"
        />
        Личная{{ !mark.isVisible ? ' · скрыта' : '' }}
      </div>
    </div>

    <!-- Шапка без фото -->
    <div
      v-else
      class="header-nophoto"
    >
      <div
        class="header-nophoto__icon"
        :style="{
          color: mark.color || 'var(--primary-color)',
          background: `color-mix(in srgb, ${mark.color || 'var(--primary-color)'} 12%, transparent)`,
        }"
      >
        <u-icon
          :icon="mark.icon || 'solar:map-point-bold-duotone'"
          width="26"
          height="26"
        />
      </div>
      <div class="header-nophoto__info">
        <span class="header-nophoto__title">{{ mark.title }}</span>
        <span class="header-nophoto__address">{{ address || 'адрес не найден' }}</span>
      </div>
    </div>

    <!-- Статус-блок -->
    <div class="pm-status">
      <div class="pm-status__row">
        <span
          class="pm-status__icon"
          :class="mark.isVisible ? 'pm-status__icon--on' : 'pm-status__icon--off'"
        >
          <u-icon
            :icon="mark.isVisible ? 'solar:eye-linear' : 'solar:eye-closed-linear'"
            height="16"
          />
        </span>
        <span class="pm-status__label">На карте</span>
        <span class="pm-status__value">{{ mark.isVisible ? 'Показана' : 'Скрыта' }}</span>
      </div>

      <div class="pm-status__row">
        <span class="pm-status__icon pm-status__icon--on">
          <u-icon
            icon="solar:lock-keyhole-minimalistic-linear"
            height="16"
          />
        </span>
        <span class="pm-status__label">Доступ</span>
        <span class="pm-status__value">Только вы</span>
      </div>

      <div
        v-if="markGroups.length"
        class="pm-status__row pm-status__row--groups"
      >
        <span class="pm-status__icon pm-status__icon--on">
          <u-icon
            icon="solar:folder-linear"
            height="16"
          />
        </span>
        <span class="pm-status__label">{{ markGroups.length > 1 ? 'Группы' : 'Группа' }}</span>
        <div class="pm-status__groups">
          <span
            v-for="g in markGroups"
            :key="String(g.id)"
            class="pm-status__chip"
            :style="{ borderColor: g.color || 'var(--primary-color)', color: g.color || 'var(--primary-color)' }"
          >
            <u-icon
              :icon="g.icon || 'solar:folder-linear'"
              height="12"
            />
            {{ g.name }}
          </span>
        </div>
      </div>

      <div class="pm-status__row">
        <span
          class="pm-status__icon"
          :class="showPending ? 'pm-status__icon--pending' : 'pm-status__icon--on'"
        >
          <u-icon
            :icon="showPending ? 'solar:cloud-upload-linear' : 'solar:cloud-check-linear'"
            height="16"
          />
        </span>
        <span class="pm-status__label">Синхронизация</span>
        <span class="pm-status__value">{{ showPending ? 'Ожидает' : 'Сохранено' }}</span>
      </div>
    </div>

    <!-- Описание -->
    <div
      v-if="mark.description"
      class="pm-desc"
    >
      <span class="pm-desc__label">
        <u-icon
          icon="solar:notes-linear"
          height="15"
        />
        Заметка
      </span>
      <p
        ref="descRef"
        class="desc-block"
        :class="{ 'is-expanded': isExpanded }"
      >
        {{ mark.description }}
      </p>

      <button
        v-if="canExpand"
        class="expand-btn"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? 'Скрыть' : 'Читать полностью' }}
      </button>
    </div>

    <!-- Координаты -->
    <div
      v-if="coords"
      class="pm-coords"
    >
      <div class="pm-coords__head">
        <u-icon
          class="pm-coords__pin"
          icon="solar:map-point-linear"
          height="18"
        />
        <div class="pm-coords__values">
          <span class="pm-coords__label">Координаты</span>
          <span class="pm-coords__value">{{ latText }}, {{ lonText }}</span>
        </div>
        <button
          class="pm-coords__copy"
          type="button"
          aria-label="Скопировать координаты"
          @click="copyCoords()"
        >
          <u-icon
            icon="solar:copy-linear"
            height="16"
          />
        </button>
      </div>

      <button
        class="pm-coords__map-btn"
        type="button"
        @click="showOnMap()"
      >
        <u-icon
          icon="solar:map-point-wave-bold"
          height="18"
        />
        Показать на карте
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/components/02.features/MarkDetailSheet/ui/MarkDetailSheet.scss" />

<style scoped lang="scss">
.header-block__badge {
  gap: 5px;
}

// Три FAB-кнопки (глаз/правка/удаление) требуют больше места под заголовком.
.header-nophoto {
  padding-right: 130px;
}

.pm-status {
  @include glass-panel(16px, 14px, false, false);
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;

    &--groups {
      align-items: flex-start;
    }
  }

  &__groups {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
    flex: 1;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 9px;
    border-radius: 999px;
    border: 1.5px solid currentColor;
    @include value-text(12px, inherit, 600);
  }

  &__icon {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 9px;
    flex-shrink: 0;

    &--on {
      color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    }

    &--off {
      color: var(--text-color-secondary);
      background: var(--surface-subtle);
    }

    &--pending {
      color: var(--yellow-color, #eab308);
      background: color-mix(in srgb, var(--yellow-color, #eab308) 14%, transparent);
    }
  }

  &__label {
    @include label-text(13px, none);
    flex: 1;
  }

  &__row--groups &__label {
    flex: none;
    padding-top: 6px;
  }

  &__value {
    @include value-text(13px, var(--text-color), 600);
  }
}

.pm-coords {
  @include glass-panel(16px, 14px, false, false);
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__pin {
    color: var(--primary-color);
    flex-shrink: 0;
  }

  &__values {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__label {
    @include label-text(11px, none);
  }

  &__value {
    @include value-text(14px, var(--text-color), 600);
    font-variant-numeric: tabular-nums;
  }

  &__copy {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    flex-shrink: 0;
    cursor: pointer;
    color: var(--text-color-secondary);
    background: var(--surface-subtle);
    border: 1px solid var(--border-subtle);
  }

  &__map-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    border-radius: 12px;
    cursor: pointer;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
    @include value-text(14px, var(--primary-color), 600);

    &:active {
      transform: scale(0.98);
    }
  }
}

.pm-desc {
  @include glass-panel(16px, 14px, false, false);
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
    @include label-text(12px, none);
    color: var(--primary-color);
    font-weight: 600;
  }
}
</style>
