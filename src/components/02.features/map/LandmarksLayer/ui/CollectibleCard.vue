<script setup lang="ts">
import type { Landmark } from '../model/landmarks'
import { formatDistance } from '@/components/00.shared/lib/geo'
import { UNLOCK_RADIUS } from '../model/collection'

const props = defineProps<{
  landmark: Landmark
  number: number
  total: number
  /** До места, м; null — позиция неизвестна. */
  distance: number | null
  /** Когда открыта, мс; null — ещё закрыта. */
  openedAt: number | null
  /** Открылась только что — переворачиваем с анимацией. */
  revealing: boolean
}>()

const emit = defineEmits<{ route: [] }>()

const opened = computed(() => props.openedAt !== null)
const openedDate = computed(() => props.openedAt ? new Date(props.openedAt).toLocaleDateString('ru-RU') : '')
</script>

<template>
  <div
    class="collectible"
    :class="{ 'collectible--opened': opened, 'collectible--revealing': revealing }"
  >
    <div class="collectible__inner">
      <div class="collectible__face collectible__face--locked">
        <span class="collectible__seal">
          <u-icon
            icon="app:lock"
            width="20"
          />
        </span>
        <div class="collectible__text">
          <span class="collectible__number">№ {{ number }} / {{ total }}</span>
          <span class="collectible__title">{{ landmark.title }}</span>
          <span class="collectible__hint">
            Подойдите ближе {{ UNLOCK_RADIUS }} м, чтобы открыть<template v-if="distance !== null"> · вы в {{ formatDistance(distance) }}</template>
          </span>
        </div>
        <button
          class="collectible__route"
          type="button"
          aria-label="Маршрут сюда"
          @click="emit('route')"
        >
          <u-icon
            icon="app:route"
            width="18"
          />
        </button>
      </div>

      <div class="collectible__face collectible__face--opened">
        <span class="collectible__seal collectible__seal--gold">
          <u-icon
            icon="app:city"
            width="20"
          />
        </span>
        <div class="collectible__text">
          <span class="collectible__number">№ {{ number }} / {{ total }} · открыта {{ openedDate }}</span>
          <span class="collectible__title">{{ landmark.title }}</span>
          <span
            v-if="landmark.city"
            class="collectible__hint"
          >{{ landmark.city }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.collectible {
  width: min(360px, calc(100vw - 32px));
  height: 96px;
  perspective: 900px;

  &__inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
  }

  &--opened &__inner {
    transform: rotateY(180deg);
  }

  &--revealing &__inner {
    animation: collectible-flip 1s cubic-bezier(0.34, 1.3, 0.5, 1) both;
  }

  &__face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    border-radius: 18px;
    overflow: hidden;
    backface-visibility: hidden;

    &--locked {
      background: linear-gradient(135deg, #1d1d25, #111116);
      border: 1.5px dashed rgb(224 165 62 / 0.55);
      color: #f3e3b8;
    }

    // Золотая фольга: по ней изредка пробегает блик
    &--opened {
      transform: rotateY(180deg);
      background: linear-gradient(135deg, #8a5a12, #f6d77a 30%, #c78b25 55%, #fbe7a1 75%, #a9731b);
      border: 1.5px solid #fff3c4;
      color: #2b1d05;
      box-shadow: 0 10px 30px rgb(201 138 30 / 0.35);

      &::after {
        content: '';
        position: absolute;
        inset: -40% auto -40% -30%;
        width: 30%;
        background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.55), transparent);
        transform: translateX(-100%) rotate(18deg);
        animation: collectible-sheen 4.5s ease-in-out 1s infinite;
      }
    }
  }

  &__seal {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    color: #e0a53e;
    background: rgb(224 165 62 / 0.12);
    border: 1px solid rgb(224 165 62 / 0.35);

    &--gold {
      color: #fff;
      background: linear-gradient(180deg, #f9d56e, #e09b2d);
      border: 2px solid #fff;
    }
  }

  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__number {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    opacity: 0.75;
  }

  &__title {
    font-size: 17px;
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__hint {
    font-size: 12px;
    opacity: 0.8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__route {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    color: #1d1d25;
    background: #e0a53e;
    cursor: pointer;
  }
}

@keyframes collectible-flip {
  0% {
    transform: rotateY(0) scale(1);
  }
  45% {
    transform: rotateY(100deg) scale(1.08);
  }
  100% {
    transform: rotateY(180deg) scale(1);
  }
}

@keyframes collectible-sheen {
  0%,
  60% {
    transform: translateX(-100%) rotate(18deg);
  }
  100% {
    transform: translateX(500%) rotate(18deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .collectible__inner,
  .collectible__face--opened::after {
    animation: none !important;
  }
}
</style>
