<script setup lang="ts">
import type { BugPrefill } from '../model'
import type { BugApp, BugDevice, BugTag } from '@/components/00.shared/services/bug/index.type'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { submitBug } from '../model'
import { collectBugContext } from '../model/context'

const props = defineProps<{
  prefill?: BugPrefill
}>()

const { close } = useDialogStore()

const TAGS: { value: BugTag, label: string }[] = [
  { value: 'feature', label: 'Функционал' },
  { value: 'ui', label: 'Интерфейс' },
  { value: 'logic', label: 'Логика' },
]

const title = ref(props.prefill?.title ?? '')
const desc = ref(props.prefill?.desc ?? '')
const tag = ref<BugTag>(props.prefill?.tag ?? 'ui')
const isSending = ref(false)

const device = ref<BugDevice | null>(null)
const app = ref<BugApp | null>(null)

const canSubmit = computed(() =>
  title.value.trim().length > 0 && desc.value.trim().length > 0 && !isSending.value,
)

async function loadContext() {
  const ctx = await collectBugContext()
  device.value = ctx.device
  app.value = ctx.app
}

async function onSubmit() {
  if (!canSubmit.value)
    return
  isSending.value = true
  await submitBug({
    title: title.value.trim(),
    desc: desc.value.trim(),
    tag: tag.value,
  })
  isSending.value = false
}

onMounted(loadContext)
</script>

<template>
  <div class="bug-report">
    <div class="bug-report__header">
      <button
        class="button-back"
        @click="close"
      >
        <u-icon icon="line-md:arrow-small-left" />
      </button>
      <h2>Сообщить о баге</h2>
    </div>

    <p class="bug-report__lead">
      Опишите, что пошло не так. Мы приложим данные устройства и последние логи.
    </p>

    <section class="bug-report__section">
      <h3 class="bug-report__section-title">
        Заголовок
      </h3>
      <div class="bug-report__panel">
        <u-input
          v-model="title"
          placeholder="Кратко: что случилось"
        />
      </div>
    </section>

    <section class="bug-report__section">
      <h3 class="bug-report__section-title">
        Описание
      </h3>
      <div class="bug-report__panel">
        <u-text-area
          v-model="desc"
          label=""
          placeholder="Что вы делали и что ожидали увидеть"
        />
      </div>
    </section>

    <section class="bug-report__section">
      <h3 class="bug-report__section-title">
        Категория
      </h3>
      <div class="bug-report__tags">
        <button
          v-for="t in TAGS"
          :key="t.value"
          class="bug-report__tag"
          :class="{ 'is-active': tag === t.value }"
          type="button"
          @click="tag = t.value"
        >
          {{ t.label }}
        </button>
      </div>
    </section>

    <section class="bug-report__section">
      <h3 class="bug-report__section-title">
        Что будет приложено
      </h3>
      <div class="bug-report__panel bug-report__context">
        <div
          v-if="device"
          class="bug-report__meta"
        >
          <span>Платформа: {{ device.platform }}</span>
          <span>ОС: {{ device.os }}</span>
          <span>Экран: {{ device.resolution }}</span>
          <span>Заряд: {{ device.battery }}%</span>
          <span>Сборка: {{ app?.build }}</span>
        </div>
        <pre
          v-if="app?.logs.length"
          class="bug-report__logs"
        >{{ app.logs.join('\n') }}</pre>
        <p
          v-else
          class="bug-report__logs-empty"
        >
          Логи пусты.
        </p>
      </div>
    </section>

    <button
      class="button-submit"
      :disabled="!canSubmit"
      type="button"
      @click="onSubmit"
    >
      {{ isSending ? 'Отправка…' : 'Отправить' }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.bug-report {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding-bottom: 20px;

  &__header {
    display: flex;
    gap: 12px;
    align-items: center;
    width: 100%;

    .button-back {
      @include glass-panel(12px, 10px, false);
    }

    h2 {
      @include value-text(24px, var(--text-color), 700);
    }
  }

  &__lead {
    @include label-text(13px, none);
    line-height: 1.5;
    margin: -8px 0 0;
    text-transform: none;
  }

  &__section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;

    &-title {
      @include label-text(12px, uppercase);
    }
  }

  &__panel {
    @include glass-panel(16px, 14px, false);

    // textarea сама по себе .u-block (glass-panel) — сбрасываем её подложку,
    // чтобы не было вложенной коробки, оставляем только внешнюю панель
    :deep(.u-textarea.u-block) {
      padding: 0;
      background: none;
      border: none;
      border-radius: 0;
      box-shadow: none;
      backdrop-filter: none;

      &::before {
        display: none;
      }
    }

    // свой заголовок секции — прячем встроенный лейбл textarea
    :deep(.u-textarea__label) {
      display: none;
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__tag {
    padding: 10px 14px;
    border: none;
    border-radius: 12px;
    background: var(--bg-color-block);
    @include value-text(14px, var(--text-color), 600);
    cursor: pointer;
    transition: all 0.15s ease;

    &.is-active {
      @include gradient();
      color: #fff;
    }
  }

  &__context {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    @include label-text(12px, none);
    text-transform: none;
    font-variant-numeric: tabular-nums;
  }

  &__logs {
    margin: 0;
    max-height: 160px;
    overflow: auto;
    padding: 10px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--text-color) 5%, transparent);
    font-family: 'SF Mono', ui-monospace, monospace;
    font-size: 11px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text-color-secondary, var(--text-color));
  }

  &__logs-empty {
    margin: 0;
    @include label-text(12px, none);
    text-transform: none;
  }
}

.button-back {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  font-size: 22px;
  cursor: pointer;
}

.button-submit {
  width: 100%;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 16px;
  padding: 16px;
  @include gradient();
  @include value-text(16px, #fff, 600);
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
