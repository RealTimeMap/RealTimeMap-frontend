<script setup lang="ts">
import type { MarkMenuStyle } from '@/components/00.shared/stores/settings/parts/useExperimental'
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'

const settings = useSettingsStore()
const { markMenuStyle } = storeToRefs(settings)
const { close } = useDialogStore()

const options: { id: MarkMenuStyle, title: string, hint: string }[] = [
  { id: 'popover', title: 'Карточка', hint: 'Всплывающая карточка над точкой' },
  { id: 'orbit', title: 'Орбита', hint: 'Два круга на пунктирном кольце' },
  { id: 'bar', title: 'Панель', hint: 'Горизонтальная панель кнопок' },
  { id: 'off', title: 'Выключено', hint: 'Сразу открывать форму метки' },
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
        <u-icon icon="line-md:arrow-small-left" />
      </button>
      <h2>Меню метки</h2>
    </div>

    <p class="style-picker__hint">
      Что показывать при двойном тапе по карте. Изменения применяются сразу.
    </p>

    <div class="style-picker__list">
      <button
        v-for="opt in options"
        :key="opt.id"
        class="style-card"
        :class="{ 'style-card--active': markMenuStyle === opt.id }"
        type="button"
        @click="settings.setMarkMenuStyle(opt.id)"
      >
        <div class="style-card__preview">
          <!-- Карточка -->
          <template v-if="opt.id === 'popover'">
            <span class="pv-card" />
            <span class="pv-dot" />
          </template>
          <!-- Орбита -->
          <template v-else-if="opt.id === 'orbit'">
            <span class="pv-ring" />
            <span class="pv-orb pv-orb--l" />
            <span class="pv-orb pv-orb--r" />
            <span class="pv-dot pv-dot--center" />
          </template>
          <template v-else-if="opt.id === 'bar'">
            <span class="pv-bar" />
            <span class="pv-dot" />
          </template>
          <template v-else>
            <span class="pv-off">
              <u-icon
                icon="solar:close-circle-linear"
                height="22"
              />
            </span>
          </template>
        </div>

        <div class="style-card__text">
          <span class="style-card__title">{{ opt.title }}</span>
          <span class="style-card__hint">{{ opt.hint }}</span>
        </div>

        <u-icon
          v-if="markMenuStyle === opt.id"
          class="style-card__check"
          icon="solar:check-circle-bold"
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

.pv-dot {
  position: absolute;
  left: 50%;
  bottom: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: var(--primary-color);
  box-shadow: 0 0 6px color-mix(in srgb, var(--primary-color) 60%, transparent);

  &--center {
    left: 50%;
    top: 50%;
    bottom: auto;
    transform: translate(-50%, -50%);
  }
}

.pv-card {
  position: absolute;
  left: 50%;
  top: 10px;
  width: 40px;
  height: 22px;
  transform: translateX(-50%);
  border-radius: 6px;
  background: var(--bg-color-block);
  border: 1px solid var(--border-subtle);
}

.pv-bar {
  position: absolute;
  left: 50%;
  top: 12px;
  width: 46px;
  height: 16px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: var(--bg-color-block);
  border: 1px solid var(--border-subtle);
}

.pv-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1.5px dashed color-mix(in srgb, var(--primary-color) 50%, transparent);
}

.pv-orb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-color-block);
  border: 1px dashed color-mix(in srgb, var(--primary-color) 55%, transparent);

  &--l {
    left: 50%;
    transform: translate(calc(-50% - 20px), -50%);
  }

  &--r {
    left: 50%;
    transform: translate(calc(-50% + 20px), -50%);
  }
}

.pv-off {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-muted);
}
</style>
