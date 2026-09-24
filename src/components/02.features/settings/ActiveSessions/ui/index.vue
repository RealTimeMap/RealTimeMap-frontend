<script setup lang="ts">
import type { Session } from '@/components/00.shared/services/sessions/index.type'
import { pluralize } from '@/components/00.shared/lib/date/FormatDate'
import { hapticSuccess } from '@/components/00.shared/lib/haptics'
import { sessionApi } from '@/components/00.shared/services/sessions'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

const { close } = useDialogStore()
const notify = useNotificationStore()

const sessions = ref<Session[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const revokingId = ref<string | null>(null)
const revokingAll = ref(false)
const confirmingAll = ref(false)

// Текущее устройство — сверху, остальные по убыванию последней активности.
const sortedSessions = computed(() =>
  [...sessions.value].sort((a, b) => {
    if (a.is_current !== b.is_current)
      return a.is_current ? -1 : 1
    return new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime()
  }),
)
const otherCount = computed(() => sessions.value.filter(s => !s.is_current).length)

async function load() {
  isLoading.value = true
  error.value = null
  try {
    sessions.value = await sessionApi.getSessions()
  }
  catch (e) {
    console.error('[Active Sessions]', e)
    error.value = 'Не удалось загрузить сессии'
  }
  finally {
    isLoading.value = false
  }
}

async function revoke(session: Session) {
  if (session.is_current || revokingId.value)
    return
  revokingId.value = session.session_id
  try {
    await sessionApi.deleteSession(session.session_id)
    sessions.value = sessions.value.filter(s => s.session_id !== session.session_id)
    hapticSuccess()
    notify.add({ title: 'Сессия завершена', type: 'success' })
  }
  catch (e) {
    console.error('[Active Sessions] revoke', e)
    notify.add({ title: 'Не удалось завершить сессию', type: 'error' })
  }
  finally {
    revokingId.value = null
  }
}

async function revokeOthers() {
  if (revokingAll.value || otherCount.value === 0)
    return
  revokingAll.value = true
  try {
    const { revoked } = await sessionApi.deleteOtherSessions()
    sessions.value = sessions.value.filter(s => s.is_current)
    confirmingAll.value = false
    hapticSuccess()
    notify.add({
      title: 'Готово',
      description: `Завершено ${pluralize(revoked, ['сессия', 'сессии', 'сессий'])}`,
      type: 'success',
    })
  }
  catch (e) {
    console.error('[Active Sessions] revoke others', e)
    notify.add({ title: 'Не удалось завершить сессии', type: 'error' })
  }
  finally {
    revokingAll.value = false
  }
}

function deviceIcon(ua: string): string {
  const s = ua.toLowerCase()
  if (/ipad|tablet/.test(s))
    return 'app:tablet'
  if (/mobile|android|iphone/.test(s))
    return 'app:smartphone'
  return 'app:monitor'
}

function lastUsedLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime()))
    return ''
  const min = Math.floor((Date.now() - date.getTime()) / 60000)
  if (min < 1)
    return 'только что'
  if (min < 60)
    return `${pluralize(min, ['минуту', 'минуты', 'минут'])} назад`
  const hours = Math.floor(min / 60)
  if (hours < 24)
    return `${pluralize(hours, ['час', 'часа', 'часов'])} назад`
  const days = Math.floor(hours / 24)
  return `${pluralize(days, ['день', 'дня', 'дней'])} назад`
}

onMounted(load)
</script>

<template>
  <div class="sessions">
    <div class="sessions__header">
      <button
        class="button-back"
        @click="close"
      >
        <u-icon icon="app:arrow-left" />
      </button>
      <h2>Активные сессии</h2>
    </div>

    <p class="sessions__intro">
      Устройства, с которых выполнен вход в аккаунт. Завершите сессию, если не узнаёте устройство.
    </p>

    <div class="sessions__body">
      <div
        v-if="isLoading"
        class="sessions__list"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="sessions__skeleton"
        />
      </div>

      <div
        v-else-if="error"
        class="sessions__state"
      >
        {{ error }}
        <button
          class="sessions__retry"
          type="button"
          @click="load"
        >
          Повторить
        </button>
      </div>

      <div
        v-else-if="!sessions.length"
        class="sessions__state"
      >
        Активных сессий нет
      </div>

      <template v-else>
        <div class="sessions__list">
          <div
            v-for="session in sortedSessions"
            :key="session.session_id"
            class="session-card"
            :class="{ 'session-card--current': session.is_current }"
          >
            <span class="session-card__icon">
              <u-icon
                :icon="deviceIcon(session.user_agent)"
                height="22"
              />
            </span>

            <div class="session-card__info">
              <span class="session-card__name">
                {{ session.device_name }}
                <span
                  v-if="session.is_current"
                  class="session-card__badge"
                >это устройство</span>
              </span>
              <span class="session-card__meta">
                {{ session.ip_address }} · {{ lastUsedLabel(session.last_used_at) }}
              </span>
            </div>

            <button
              v-if="!session.is_current"
              class="session-card__revoke"
              type="button"
              :disabled="revokingId === session.session_id"
              title="Завершить сессию"
              @click="revoke(session)"
            >
              <u-icon
                :icon="revokingId === session.session_id
                  ? 'app:loading'
                  : 'app:trash'"
                height="18"
              />
            </button>
          </div>
        </div>

        <button
          v-if="otherCount > 0 && !confirmingAll"
          class="sessions__revoke-all"
          type="button"
          @click="confirmingAll = true"
        >
          <u-icon
            icon="app:logout"
            height="18"
          />
          Завершить все, кроме текущей
        </button>
        <button
          v-else-if="otherCount > 0"
          class="sessions__revoke-all sessions__revoke-all--confirm"
          type="button"
          :disabled="revokingAll"
          @click="revokeOthers"
        >
          <u-icon
            :icon="revokingAll ? 'app:loading' : 'app:warning'"
            height="18"
          />
          Точно завершить {{ otherCount }}?
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sessions {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  color: var(--text-color);
  background: var(--profile-bg, var(--bg-color));
}

.sessions__header {
  display: flex;
  align-items: center;
  gap: 12px;

  .button-back {
    @include glass-panel(12px, 10px, false);
    display: flex;
    cursor: pointer;
  }

  h2 {
    margin: 0;
    @include value-text(22px, var(--text-color), 700);
  }
}

.sessions__intro {
  @include label-text(13px, none);
  line-height: 1.4;
}

.sessions__body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sessions__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sessions__skeleton {
  height: 68px;
  border-radius: 16px;
  background: linear-gradient(100deg, var(--surface-subtle) 30%, var(--surface-hover) 50%, var(--surface-subtle) 70%);
  background-size: 200% 100%;
  animation: sessions-shimmer 1.4s ease-in-out infinite;
}

.session-card {
  display: flex;
  align-items: center;
  gap: 12px;
  @include glass-panel(16px, 0, false, false, false);
  padding: 14px;

  &--current {
    border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
  }
}

.session-card__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.session-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.session-card__name {
  display: flex;
  align-items: center;
  gap: 8px;
  @include value-text(15px, var(--text-color), 600);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-card__badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  @include label-text(10px, uppercase);
  font-weight: 700;
}

.session-card__meta {
  @include label-text(12px, none);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-card__revoke {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  cursor: pointer;
  border: none;
  border-radius: 10px;
  color: var(--red-color);
  background: color-mix(in srgb, var(--red-color) 10%, transparent);

  &:disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.sessions__revoke-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  padding: 14px;
  cursor: pointer;
  border-radius: 14px;
  color: var(--red-color);
  background: color-mix(in srgb, var(--red-color) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--red-color) 25%, transparent);
  @include value-text(15px, var(--red-color), 600);

  &--confirm {
    color: #fff;
    background: var(--red-color);
    border-color: var(--red-color);
  }

  &:disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.sessions__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 24px;
  @include label-text(13px, none);
  line-height: 1.4;
}

.sessions__retry {
  @include glass-panel(10px, 8px, false);
  @include value-text(13px, var(--text-color), 600);
  padding: 8px 18px;
  cursor: pointer;
}

@keyframes sessions-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
