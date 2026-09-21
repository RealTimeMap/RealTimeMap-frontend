<script setup lang="ts">
import type { SplashStyle } from '@/components/00.shared/stores/settings/parts/useExperimental'
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'

const settings = useSettingsStore()
const { splashStyle } = storeToRefs(settings)
const { close } = useDialogStore()

const options: { id: SplashStyle, title: string, hint: string }[] = [
  { id: 'shield', title: 'Щит', hint: 'Метка падает в щит, из неё расходится сигнал' },
  { id: 'spin', title: 'Раскрытие', hint: 'Ромб раскрывается и въезжает вращением' },
  { id: 'off', title: 'Выключено', hint: 'Открывать приложение сразу, без заставки' },
]
</script>

<template>
  <div class="style-picker">
    <div class="style-picker__header">
      <button
        class="button-back"
        type="button"
        @click="close"
      >
        <u-icon icon="app:arrow-left" />
      </button>
      <h2>Анимация запуска</h2>
    </div>

    <p class="style-picker__hint">
      Заставка с логотипом при старте приложения. Изменения применяются со следующего запуска.
    </p>

    <div class="style-picker__list">
      <button
        v-for="opt in options"
        :key="opt.id"
        class="style-card"
        :class="{ 'style-card--active': splashStyle === opt.id }"
        type="button"
        @click="settings.setSplashStyle(opt.id)"
      >
        <div class="style-card__preview">
          <template v-if="opt.id === 'off'">
            <span class="pv-off">
              <u-icon
                icon="app:close-circle"
                height="22"
              />
            </span>
          </template>
          <!-- Щит с падающей меткой -->
          <template v-else-if="opt.id === 'shield'">
            <span class="pv-shield" />
            <span class="pv-pin" />
          </template>
          <!-- Ромб -->
          <template v-else>
            <span class="pv-star pv-star--spin" />
            <span class="pv-core" />
          </template>
        </div>

        <div class="style-card__text">
          <span class="style-card__title">{{ opt.title }}</span>
          <span class="style-card__hint">{{ opt.hint }}</span>
        </div>

        <u-icon
          v-if="splashStyle === opt.id"
          class="style-card__check"
          icon="app:check-circle"
          height="22"
        />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.style-picker {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  height: 100%;
}

.style-picker__header {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;

  .button-back {
    @include glass-panel(12px, 10px, false);
  }

  h2 {
    @include value-text(24px, var(--text-color), 700);
  }
}

.style-picker__hint {
  @include label-text(13px, none);
  line-height: 1.4;
}

.style-picker__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.style-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: var(--text-color);
  @include glass-panel(16px, 12px, false, false);
  border: 1.5px solid var(--border-subtle);
  transition:
    border-color 0.2s ease,
    transform 0.15s ease;

  &:active {
    transform: scale(0.99);
  }

  &--active {
    border-color: var(--primary-color);
  }

  &__preview {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 72px;
    height: 56px;
    border-radius: 12px;
    background: var(--bg-body);
    border: 1px solid var(--border-subtle);
    overflow: hidden;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    @include value-text(15px, var(--text-color), 600);
  }

  &__hint {
    @include label-text(11px, none);
    line-height: 1.35;
  }

  &__check {
    color: var(--primary-color);
    flex-shrink: 0;
  }
}

.pv-star {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 30px;
  height: 30px;
  border-radius: 5px;
  background: var(--bg-color-block);
  border: 2px solid var(--text-color-secondary);
  transform: translate(-50%, -50%) rotate(45deg);
}

.pv-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: var(--primary-color);
  box-shadow: 0 0 8px color-mix(in srgb, var(--primary-color) 60%, transparent);
}

.pv-star--spin {
  animation: pv-spin 2200ms ease-in-out infinite;
}

@keyframes pv-spin {
  0%,
  100% {
    transform: translate(-50%, -50%) rotate(-45deg) scale(0.6);
  }
  45%,
  75% {
    transform: translate(-50%, -50%) rotate(45deg) scale(1);
  }
}

.pv-shield {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 26px;
  height: 30px;
  transform: translate(-50%, -50%);
  background: var(--text-color-secondary);
  border-radius: 6px 6px 10px 10px;
  clip-path: polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%);
  opacity: 0.5;
}

.pv-pin {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: var(--primary-color);
  box-shadow: 0 0 6px color-mix(in srgb, var(--primary-color) 60%, transparent);
  animation: pv-drop 2000ms ease-in-out infinite;
}

@keyframes pv-drop {
  0%,
  100% {
    transform: translate(-50%, -180%);
    opacity: 0;
  }
  35%,
  70% {
    transform: translate(-50%, -75%);
    opacity: 1;
  }
}

.pv-off {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-muted);
}
</style>
