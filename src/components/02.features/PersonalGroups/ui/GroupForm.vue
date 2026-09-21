<script setup lang="ts">
import type { EntityId } from '@/components/00.shared/stores/places'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { usePlacesStore } from '@/components/00.shared/stores/places'

const props = defineProps<{
  /** Если передан — режим редактирования существующей группы. */
  groupId?: EntityId
  initialName?: string
  initialDescription?: string
  initialColor?: string
  initialIcon?: string
}>()

const ICONS = [
  'app:folder',
  'app:home',
  'app:cup',
  'app:star',
  'app:pin',
  'app:heart',
  'app:suitcase',
  'app:city',
]
const COLORS = ['#7c3aed', '#3399ff', '#16a34a', '#eab308', '#ff5a5f', '#ec4899']

const store = usePlacesStore()
const { close } = useDialogStore()
const notify = useNotificationStore()

const name = ref(props.initialName ?? '')
const description = ref(props.initialDescription ?? '')
const color = ref(props.initialColor ?? COLORS[0])
const icon = ref(props.initialIcon ?? ICONS[0])
const saving = ref(false)
const nameError = ref(false)

const isEdit = computed(() => props.groupId != null)
const canSave = computed(() => !saving.value)

watch(name, () => {
  nameError.value = false
})

async function submit() {
  if (saving.value)
    return
  if (!name.value.trim()) {
    nameError.value = true
    notify.add({ title: 'Введите название группы', type: 'warning' })
    return
  }
  saving.value = true
  const payload = {
    name: name.value.trim(),
    description: description.value.trim() || undefined,
    color: color.value,
    icon: icon.value,
  }
  try {
    if (isEdit.value && props.groupId != null)
      await store.updateGroup(props.groupId, payload)
    else
      await store.createGroup(payload)
    notify.add({
      title: isEdit.value ? 'Группа обновлена' : 'Группа создана',
      type: 'success',
    })
    close()
  }
  catch (e) {
    console.error('[GroupForm] submit', e)
    notify.add({
      title: isEdit.value ? 'Не удалось сохранить группу' : 'Не удалось создать группу',
      description: 'Попробуйте ещё раз',
      type: 'error',
    })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="group-form">
    <header class="group-form__header">
      <button
        class="group-form__header-btn"
        @click="close"
      >
        Отменить
      </button>
      <h2>{{ isEdit ? 'Изменить группу' : 'Новая группа' }}</h2>
      <button
        :disabled="!canSave"
        class="group-form__header-btn submit"
        @click="submit"
      >
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>
    </header>

    <u-input
      v-model="name"
      label="Название"
      required
      placeholder="Например, Питер"
      :error="nameError"
    />

    <u-text-area
      v-model="description"
      label="Описание"
      placeholder="Что объединяет эти места"
    />

    <div class="u-block group-form__appearance">
      <div class="group-form__group">
        <span class="label-text">Иконка</span>
        <div class="group-form__icons">
          <button
            v-for="ic in ICONS"
            :key="ic"
            type="button"
            class="group-form__icon"
            :class="{ 'group-form__icon--active': icon === ic }"
            :style="icon === ic ? { borderColor: color, color } : {}"
            @click="icon = ic"
          >
            <u-icon
              :icon="ic"
              height="22"
            />
          </button>
        </div>
      </div>

      <u-drawer />

      <div class="group-form__group">
        <span class="label-text">Цвет</span>
        <div class="group-form__colors">
          <button
            v-for="c in COLORS"
            :key="c"
            type="button"
            class="group-form__color"
            :class="{ 'group-form__color--active': color === c }"
            :style="{ background: c }"
            @click="color = c"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.group-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

:deep(.u-input-container) {
  @include glass-panel(18px, 12px, false, false);
}

.group-form__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;

  h2 {
    @include value-text(17px, var(--text-color), 700);
  }
}

.group-form__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-form__header-btn {
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
  color: var(--text-color-muted);

  &:hover {
    opacity: 0.8;
  }

  &.submit {
    color: var(--primary-color);
  }
}

.group-form__appearance {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-form__icons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.group-form__icon {
  display: grid;
  place-items: center;
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

.group-form__colors {
  display: flex;
  gap: 10px;
}

.group-form__color {
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

.group-form__submit {
  padding: 15px;
  cursor: pointer;
  color: #fff;
  background: var(--primary-color);
  border: none;
  border-radius: 14px;
  @include value-text(15px, #fff, 700);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
