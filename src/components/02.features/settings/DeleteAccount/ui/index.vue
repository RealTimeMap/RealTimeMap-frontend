<script setup lang="ts">
import type { ApiError } from '@/components/00.shared/api/api.types'
import { useAuthStore } from '@/components/00.shared/stores/auth'
import { useDialogStore } from '@/components/00.shared/stores/dialog'

const authStore = useAuthStore()
const { close } = useDialogStore()

const password = ref('')
const loading = ref(false)
const error = ref('')

function errorText(e: ApiError): string {
  if (e.status === 400 || e.status === 401)
    return 'Неверный пароль'
  if (e.status === 403)
    return 'Пока действует блокировка, удалить аккаунт нельзя'
  return e.message || 'Не удалось удалить аккаунт, попробуйте ещё раз'
}

async function submit() {
  if (!password.value || loading.value)
    return
  loading.value = true
  error.value = ''
  try {
    await authStore.deleteAccount(password.value)
  }
  catch (e) {
    error.value = errorText(e as ApiError)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <form
    class="delete-account"
    @submit.prevent="submit"
  >
    <div class="delete-account__icon">
      <u-icon
        icon="app:trash"
        width="26"
      />
    </div>
    <h2 class="delete-account__title">
      Удалить аккаунт?
    </h2>
    <p class="delete-account__text">
      Это нельзя отменить. Профиль, друзья, метки, достижения и прогресс удалятся навсегда, а ваши сообщения и комментарии станут анонимными.
    </p>

    <div class="delete-account__input">
      <u-input
        v-model="password"
        type="password"
        icon="app:lock"
        placeholder="Пароль для подтверждения"
        autocomplete="current-password"
        :disabled="loading"
        :error="!!error"
        :error-message="error"
        @input="error = ''"
      />
    </div>

    <div class="delete-account__buttons">
      <button
        class="delete-account__button"
        type="button"
        :disabled="loading"
        @click="close"
      >
        Отмена
      </button>
      <button
        class="delete-account__button delete-account__button--danger"
        type="submit"
        :disabled="!password || loading"
      >
        {{ loading ? 'Удаляем…' : 'Удалить' }}
      </button>
    </div>
  </form>
</template>

<style scoped lang="scss">
.delete-account {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: center;

  &__icon {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 18px;
    background: rgb(229 72 77 / 0.12);
    color: var(--red-color);
  }

  &__title {
    margin: 4px 0 0;
    @include value-text(20px, var(--text-color), 700);
  }

  &__text {
    margin: 0 0 6px;
    max-width: 340px;
    @include label-text(14px, none);
    line-height: 1.45;
  }

  &__input {
    width: 100%;
    text-align: left;
    @include glass-panel(14px, 0px 12px);

    :deep(.u-input) {
      padding: 14px 2px;
    }
  }

  &__buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
    margin-top: 8px;
  }

  &__button {
    height: 50px;
    border: none;
    border-radius: 14px;
    background: var(--surface-subtle);
    @include value-text(15px, var(--text-color), 600);
    cursor: pointer;

    &:active:not(:disabled) {
      transform: scale(0.98);
    }

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }

    &--danger {
      background: var(--red-color);
      color: #fff;
    }
  }
}
</style>
