<script setup lang="ts">
import { authApi } from '@/components/00.shared/services/auth'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

const route = useRoute()
const router = useRouter()
const notify = useNotificationStore()

const token = computed(() => {
  const t = route.query.token
  return Array.isArray(t) ? t[0] ?? '' : t ?? ''
})

const password = ref('')
const confirm = ref('')
const error = ref('')
const isLoading = ref(false)

async function submit() {
  if (!token.value) {
    error.value = 'Ссылка недействительна'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Пароль должен быть не короче 6 символов'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Пароли не совпадают'
    return
  }

  isLoading.value = true
  error.value = ''
  try {
    await authApi.resetPassword({ token: token.value, password: password.value })
    notify.add({ title: 'Пароль изменён', description: 'Войдите с новым паролем', type: 'success' })
    router.replace('/login')
  }
  catch (e) {
    console.error('[Reset Password]', e)
    // 400/409 — токен просрочен или уже использован.
    const status = (e as { status?: number })?.status
    error.value = status === 400 || status === 409
      ? 'Ссылка устарела или уже использована. Запросите восстановление заново'
      : 'Не удалось изменить пароль. Попробуйте позже'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="reset">
    <div class="reset__card">
      <div class="reset__icon">
        <u-icon
          icon="solar:lock-password-bold-duotone"
          height="40"
        />
      </div>
      <h1>Новый пароль</h1>

      <template v-if="token">
        <p class="reset__hint">
          Придумайте новый пароль для входа в аккаунт.
        </p>

        <form
          class="reset__form"
          @submit.prevent="submit"
        >
          <div class="reset__fields">
            <u-input
              v-model="password"
              placeholder="Новый пароль"
              type="password"
              icon="solar:lock-outline"
              :disabled="isLoading"
              :error="!!error"
              @input="error = ''"
            />
            <u-input
              v-model="confirm"
              placeholder="Повторите пароль"
              type="password"
              icon="solar:lock-outline"
              :disabled="isLoading"
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
            <span v-else>Сохранить пароль</span>
          </button>
        </form>
      </template>

      <template v-else>
        <p class="reset__hint">
          Ссылка недействительна. Запросите восстановление пароля заново.
        </p>
        <button
          type="button"
          class="button primary"
          @click="router.replace('/login')"
        >
          На страницу входа
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reset {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100dvh - var(--safe-top));
  padding: calc(16px + var(--safe-top)) 16px calc(16px + var(--safe-bottom));
  background: var(--auth-bg, var(--bg-body));
  color: var(--text-color);
}

.reset__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  width: 100%;
  max-width: 420px;

  h1 {
    margin: 0;
    @include value-text(24px, var(--text-color), 700);
  }
}

.reset__icon {
  color: var(--primary-color);
}

.reset__hint {
  margin: 0;
  @include label-text(14px, none);
  line-height: 1.45;
}

.reset__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  margin-top: 6px;
}

.reset__fields {
  @include glass-panel(18px, 6px 14px);

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
</style>
