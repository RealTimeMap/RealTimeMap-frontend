<script setup lang="ts">
import type { User } from '@/components/00.shared/services/user/index.type'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useEditProfile } from '../model/useEditProfile'

const props = defineProps<{
  user: User
}>()

const { close } = useDialogStore()

const initialUser = props.user

const {
  username,
  tag,
  avatarSrc,
  isSaving,
  usernameError,
  tagError,
  selectAvatar,
  save,
  dispose,
} = useEditProfile(initialUser)

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file)
    selectAvatar(file)
  if (fileInput.value)
    fileInput.value.value = ''
}

onUnmounted(dispose)
</script>

<template>
  <div class="edit-profile">
    <div class="edit-profile__header">
      <button
        class="button-back"
        @click="close"
      >
        <u-icon icon="line-md:arrow-small-left" />
      </button>
      <h2>Профиль</h2>
      <button
        class="button-save"
        :disabled="isSaving"
        @click="save"
      >
        {{ isSaving ? 'Сохранение…' : 'Сохранить' }}
      </button>
    </div>

    <div class="edit-profile__avatar">
      <button
        class="avatar-button"
        type="button"
        @click="fileInput?.click()"
      >
        <u-avatar
          :size="100"
          rounded
          :alt-text="username"
          :src="avatarSrc"
        />
        <span class="avatar-button__edit">
          <u-icon
            icon="solar:pen-bold"
            height="16"
          />
        </span>
      </button>
      <button
        class="avatar-change"
        type="button"
        @click="fileInput?.click()"
      >
        Сменить фото
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        hidden
        @change="onFileChange"
      >
    </div>

    <div class="edit-profile__fields">
      <label class="field">
        <span class="field__label">Имя</span>
        <input
          v-model="username"
          class="field__input"
          type="text"
          maxlength="32"
          placeholder="Имя"
        >
        <span
          v-if="usernameError"
          class="field__error"
        >{{ usernameError }}</span>
      </label>

      <div class="field__divider" />

      <label class="field">
        <span class="field__label">Никнейм</span>
        <div class="field__prefixed">
          <span class="field__prefix">@</span>
          <input
            v-model="tag"
            class="field__input"
            type="text"
            placeholder="никнейм"
          >
        </div>
        <span
          v-if="tagError"
          class="field__error"
        >{{ tagError }}</span>
      </label>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.edit-profile {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  height: 100%;
  padding-bottom: 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;

    .button-back {
      @include glass-panel(12px, 10px, false);
    }

    h2 {
      @include value-text(24px, var(--text-color), 700);
    }
  }

  &__avatar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  &__fields {
    display: flex;
    flex-direction: column;
    width: 100%;
    @include glass-panel(18px, 0, false);
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  cursor: text;

  &__label {
    @include label-text(12px, uppercase);
  }

  &__prefixed {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__prefix {
    @include value-text(16px, var(--text-color-secondary), 500);
  }

  &__input {
    width: 100%;
    border: none;
    background: transparent;
    outline: none;
    padding: 0;
    @include value-text(16px, var(--text-color), 500);

    &::placeholder {
      color: var(--text-color-muted);
    }
  }

  &__error {
    @include label-text(12px, none, rgb(255, 113, 118));
  }

  &__divider {
    height: 1px;
    margin: 0 16px;
    background: var(--surface-subtle);
  }
}

.button-save {
  margin-left: auto;
  padding: 10px 18px;
  border-radius: 14px;
  @include gradient();
  @include value-text(15px, #fff, 700);
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.avatar-button {
  position: relative;
  border-radius: 50%;
  cursor: pointer;

  &__edit {
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: var(--text-color);
    background: var(--bg-color-block);
    border: 0.5px solid var(--border-subtle);
    backdrop-filter: blur(12px);
  }
}

.avatar-change {
  @include value-text(14px, var(--primary-color), 600);
  cursor: pointer;
}
</style>
