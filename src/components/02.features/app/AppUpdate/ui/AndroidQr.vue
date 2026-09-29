<script setup lang="ts">
import { renderSVG } from 'uqr'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { ANDROID_APK_URL } from '../model/links'

const qr = renderSVG(ANDROID_APK_URL, { border: 1 })
const { close } = useDialogStore()
</script>

<template>
  <div class="android-qr">
    <h2 class="android-qr__title">
      Установить на Android
    </h2>
    <p class="android-qr__hint">
      Наведите камеру телефона на код — скачается последняя версия приложения
    </p>

    <div
      class="android-qr__code"
      role="img"
      aria-label="QR-код для скачивания приложения"
      v-html="qr"
    />

    <p class="android-qr__note">
      Если телефон спросит — разрешите установку из этого источника
    </p>

    <a
      class="android-qr__link"
      :href="ANDROID_APK_URL"
      target="_blank"
      rel="noopener noreferrer"
      @click="close"
    >
      Скачать .apk на этот компьютер
    </a>
  </div>
</template>

<style scoped lang="scss">
.android-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: center;

  &__title {
    margin: 0;
    @include value-text(20px, var(--text-color), 700);
  }

  &__hint,
  &__note {
    margin: 0;
    max-width: 300px;
    @include label-text(13px, none);
    line-height: 1.4;
  }

  &__code {
    width: 220px;
    height: 220px;
    padding: 10px;
    border-radius: 16px;
    background: #fff;

    :deep(svg) {
      display: block;
      width: 100%;
      height: 100%;
    }
  }

  &__note {
    @include label-text(11px, none);
  }

  &__link {
    @include value-text(13px, var(--primary-color), 600);
    text-decoration: none;
  }
}
</style>
