<script setup lang="ts">
import type { NotificationType } from '@/components/00.shared/stores/notification'
import { useNotificationStore } from '@/components/00.shared/stores/notification'

const notify = useNotificationStore()

interface TestNotificationItem {
  readonly title: string
  readonly description: string
  readonly type: NotificationType
  readonly icon?: string
}

const testNotifications: TestNotificationItem[] = [
  {
    title: 'Версия 0.4.2',
    description: 'Добавили категории и улучшили работу карты',
    type: 'default',
    icon: 'solar:settings-bold',
  },
  {
    title: 'Новый комментарий',
    description: '@anna_v ответила на вашу метку «Двор на Патриарших»',
    type: 'info',
  },
  {
    title: 'Метка опубликована',
    description: 'Ваша история о Никольской теперь видна на карте',
    type: 'success',
  },
  {
    title: 'Не удалось загрузить фото',
    description: 'Проверьте интернет-соединение и попробуйте снова',
    type: 'error',
  },
  {
    title: 'Близко к лимиту',
    description: 'Осталось 2 публикации в этом часе',
    type: 'warning',
  },
] as const

function runTest(index: number) {
  const data = testNotifications[index]
  notify.add({
    title: data.title,
    description: data.description,
    type: data.type,
    ...(data.icon && { icon: data.icon }),
  })
}
</script>

<template>
  <div class="test-page container">
    <div
      class="test-content"
    >
      <h1>В процессе разработки :)</h1>
      <p class="subtitle">
        Панель тестирования уведомлений
      </p>

      <div class="buttons-grid">
        <button
          v-for="(btn, idx) in testNotifications"
          :key="idx"
          class="test-btn"
          :class="`is-${btn.type}`"
          @click="runTest(idx)"
        >
          Вызвать {{ btn.type }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.test-page {
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.test-content {
  text-align: center;
  max-width: 500px;
  width: 100%;
  @include glass-panel(24px, 32px);

  h1 {
    margin-bottom: 8px;
    font-weight: 800;
  }
  .subtitle {
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 24px;
  }
}

.buttons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.test-btn {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  &:active {
    transform: scale(0.95);
  }

  &.is-success {
    border-color: #82f00d;
    color: #82f00d;
  }
  &.is-error {
    border-color: #ff5a5f;
    color: #ff5a5f;
  }
  &.is-info {
    border-color: #00a3ff;
    color: #00a3ff;
  }
  &.is-warning {
    border-color: #ffab00;
    color: #ffab00;
  }
}
</style>
