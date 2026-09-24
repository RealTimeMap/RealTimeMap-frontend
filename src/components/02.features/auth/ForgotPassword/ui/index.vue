<script setup lang="ts">
import { authApi } from '@/components/00.shared/services/auth'
import { useDialogStore } from '@/components/00.shared/stores/dialog'

const props = defineProps<{
  email?: string
}>()

const { close } = useDialogStore()

const email = ref(props.email ?? '')
const error = ref('')
const isLoading = ref(false)
const isSent = ref(false)

const EMAIL_RE = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

async function submit() {
  const value = email.value.trim()
  if (!value) {
    error.value = 'Укажите email'
    return
  }
  if (!EMAIL_RE.test(value)) {
    error.value = 'Некорректный email'
    return
  }

  isLoading.value = true
  error.value = ''
  try {
    await authApi.forgotPassword({ email: value })
    isSent.value = true
  }
  catch (e) {
    console.error('[Forgot Password]', e)
    error.value = 'Не удалось отправить письмо. Попробуйте позже'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="forgot">
    <template v-if="!isSent">
      <p class="forgot__hint">
        Укажите email аккаунта — вышлем ссылку для восстановления пароля.
      </p>

      <form
        class="forgot__form"
        @submit.prevent="submit"
      >
        <div class="forgot__field">
          <u-input
            v-model="email"
            placeholder="Email"
            type="email"
            icon="app:mail"
            :disabled="isLoading"
            :loading="isLoading"
            :error="!!error"
            :error-message="error"
            @input="error = ''"
          />
        </div>

        <button
          type="submit"
          class="button primary"
          :disabled="isLoading"
        >
          <span v-if="isLoading">...</span>
          <span v-else>Отправить</span>
        </button>
      </form>
    </template>

    <div
      v-else
      class="forgot__done"
    >
      <div class="forgot__done-icon">
        <u-icon
          icon="app:mail"
          height="40"
        />
      </div>
      <h3>Проверьте почту</h3>
      <p>
        Если аккаунт с адресом <b>{{ email }}</b> существует, на него отправлено письмо
        с инструкциями по восстановлению пароля.
      </p>
      <button
        type="button"
        class="button primary"
        @click="close"
      >
        Понятно
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.forgot {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;

  &__hint {
    margin: 0;
    @include label-text(14px, none);
    line-height: 1.4;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__field {
    @include glass-panel(14px, 0px 12px);

    :deep(.u-input) {
      padding: 14px 2px;
    }
  }

  .button.primary {
    height: 46px;
    border-radius: 14px;
    border: none;
    @include gradient();
    @include value-text(14px, #fff, 700);
    cursor: pointer;
    transition: opacity 0.2s ease;
    width: 100%;

    &:disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  &__done {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;

    &-icon {
      color: var(--primary-color);
    }

    h3 {
      margin: 0;
      @include value-text(18px, var(--text-color), 700);
    }

    p {
      margin: 0 0 6px;
      @include label-text(14px, none);
      line-height: 1.45;

      b {
        color: var(--text-color);
      }
    }
  }
}
</style>
