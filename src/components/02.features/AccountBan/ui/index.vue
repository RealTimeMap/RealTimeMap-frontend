<script setup lang="ts">
import { useAuthStore } from '@/components/02.features/Authentication/model/auth'

const authStore = useAuthStore()
const { banInfo } = storeToRefs(authStore)

const REASON_LABELS: Record<string, string> = {
  abuse: 'Нарушение правил',
  spam: 'Спам',
  other: 'Другое',
}

const reasonLabel = computed(() =>
  REASON_LABELS[banInfo.value?.reason ?? 'other'] ?? 'Нарушение правил',
)

const restrictionLabel = computed(() => {
  const until = banInfo.value?.bannedUntil
  if (!until || until === 'permanent')
    return 'Бессрочно'
  const d = new Date(until)
  if (Number.isNaN(d.getTime()))
    return until
  return `до ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`
})

function appeal() {
  window.open(
    'mailto:support@realtimemap.ru?subject=Обжалование блокировки аккаунта',
    '_blank',
  )
}

function logout() {
  authStore.logout()
}
</script>

<template>
  <div class="ban">
    <div class="ban__card">
      <div class="ban__icon">
        <u-icon
          icon="line-md:cancel"
          width="26"
          height="26"
        />
      </div>

      <span class="ban__eyebrow">Доступ закрыт</span>
      <h1 class="ban__title">
        Аккаунт заблокирован
      </h1>
      <p class="ban__lead">
        {{ banInfo?.details
          || `Публикации с этого аккаунта нарушали правила платформы.
          Создавать метки, писать в чаты и делиться списками больше нельзя.` }}
      </p>

      <div class="ban__rows">
        <div class="ban__row">
          <span class="ban__row-label">Причина</span>
          <span class="ban__row-value">{{ reasonLabel }}</span>
        </div>
        <div class="ban__row">
          <span class="ban__row-label">Ограничение</span>
          <span class="ban__row-value ban__row-value--accent">{{ restrictionLabel }}</span>
        </div>
      </div>

      <div class="ban__meaning">
        <span class="ban__meaning-title">Что это значит</span>
        <ul>
          <li>Личные метки и списки сохранены — они остаются приватными и не удалены.</li>
          <li>Метки, на которые поступили жалобы, скрыты с карты до решения модератора.</li>
          <li>Участники «Семьи» больше не видят ваши общие списки.</li>
        </ul>
      </div>

      <div class="ban__actions">
        <button
          type="button"
          class="ban__appeal"
          @click="appeal"
        >
          Оспорить решение
        </button>
        <button
          type="button"
          class="ban__logout"
          @click="logout"
        >
          Выйти из аккаунта
        </button>
      </div>

      <span class="ban__footer">Правила платформы · раздел «Метки и реклама»</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ban {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(16px + var(--safe-top)) 16px calc(16px + var(--safe-bottom));
  background: var(--bg-body);
  overflow-y: auto;

  &__card {
    width: 100%;
    max-width: 460px;
    display: flex;
    flex-direction: column;
    padding: 24px;
    border-radius: 24px;
    background: var(--bg-color-block);
    border: 0.5px solid var(--glass-border);
    box-shadow: var(--glass-shadow) 0px 20px 50px;
  }

  &__icon {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    color: var(--danger-color, #e5484d);
    background: color-mix(in srgb, var(--danger-color, #e5484d) 14%, transparent);
    margin-bottom: 20px;
  }

  &__eyebrow {
    @include label-text(12px, uppercase);
    margin-bottom: 8px;
  }

  &__title {
    margin: 0 0 12px;
    @include value-text(26px, var(--text-color), 800);
    letter-spacing: -0.4px;
  }

  &__lead {
    margin: 0 0 20px;
    font-size: 15px;
    line-height: 1.5;
    color: var(--text-color-secondary);
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    background: var(--surface-subtle);
  }

  &__row-label {
    @include label-text(13px, none);
  }

  &__row-value {
    @include value-text(14px, var(--text-color), 700);
    text-align: right;

    &--accent {
      color: var(--primary-color);
    }
  }

  &__meaning {
    margin-bottom: 24px;

    &-title {
      @include label-text(12px, uppercase);
      display: block;
      margin-bottom: 10px;
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    li {
      position: relative;
      padding-left: 18px;
      font-size: 14px;
      line-height: 1.45;
      color: var(--text-color-secondary);

      &::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 7px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--primary-color);
      }
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: auto;
  }

  &__appeal {
    height: 54px;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-color);
    background: var(--surface-subtle);
    border: 0.5px solid var(--glass-border);
    transition: transform 0.12s ease;

    &:active {
      transform: scale(0.98);
    }
  }

  &__logout {
    height: 48px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color-secondary);
  }

  &__footer {
    margin-top: 14px;
    text-align: center;
    @include label-text(12px, none);
  }
}
</style>
