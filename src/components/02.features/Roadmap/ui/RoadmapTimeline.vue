<script setup lang="ts">
import { ROADMAP, roadmapCounts, roadmapProgress, STATUS_LABEL } from '../model/roadmap'

withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})

const items = ROADMAP
const targetProgress = roadmapProgress(items)
const counts = roadmapCounts(items)

// Кольцевой индикатор прогресса
const RADIUS = 34
const CIRC = 2 * Math.PI * RADIUS

// Прогресс досчитывается от нуля при появлении — кольцо «прорисовывается»
const progress = ref(0)
const dashOffset = computed(() => CIRC * (1 - progress.value / 100))

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    progress.value = targetProgress
    return
  }

  const duration = 1100
  const start = performance.now()

  const tick = (now: number) => {
    const t = Math.min((now - start) / duration, 1)
    const eased = 1 - (1 - t) ** 3
    progress.value = Math.round(targetProgress * eased)
    if (t < 1)
      requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
})
</script>

<template>
  <div
    class="roadmap"
    :class="{ 'roadmap--compact': compact }"
  >
    <div class="hero">
      <div class="ring">
        <svg
          class="ring__svg"
          viewBox="0 0 80 80"
        >
          <defs>
            <linearGradient
              id="rmGrad"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                class="ring__grad-a"
                offset="0"
              />
              <stop
                class="ring__grad-b"
                offset="1"
              />
            </linearGradient>
          </defs>
          <circle
            class="ring__track"
            cx="40"
            cy="40"
            :r="RADIUS"
          />
          <circle
            class="ring__fill"
            cx="40"
            cy="40"
            :r="RADIUS"
            :stroke-dasharray="CIRC"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="ring__center">
          <span class="ring__value">{{ progress }}%</span>
          <span class="ring__cap">готово</span>
        </div>
      </div>

      <div class="hero__side">
        <span class="hero__title">Развитие приложения</span>
        <div class="chips">
          <span class="chip chip--done">
            <i class="chip__dot" />{{ counts.done }} готово
          </span>
          <span class="chip chip--active">
            <i class="chip__dot" />{{ counts.active }} в работе
          </span>
          <span class="chip chip--planned">
            <i class="chip__dot" />{{ counts.planned }} в планах
          </span>
        </div>
      </div>
    </div>

    <ul class="route">
      <li
        v-for="(item, idx) in items"
        :key="item.id"
        class="stop"
        :class="`stop--${item.status}`"
        :style="{ '--c': item.color, '--i': idx }"
      >
        <span class="stop__icon">
          <u-icon
            :icon="item.icon"
            height="20"
          />
        </span>
        <div class="stop__text">
          <div class="stop__head">
            <span class="stop__title">{{ item.title }}</span>
            <span class="stop__badge">{{ STATUS_LABEL[item.status] }}</span>
          </div>
          <p
            v-if="!compact"
            class="stop__desc"
          >
            {{ item.desc }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.roadmap {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
}

/* Шапка: кольцо прогресса + сводка */
.hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px;
  border-radius: 20px;
  background:
    radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--primary-color) 16%, transparent), transparent 60%),
    var(--surface-subtle);
  border: 0.5px solid var(--border-subtle);
}

.ring {
  position: relative;
  width: 92px;
  height: 92px;
  flex-shrink: 0;

  &__svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  &__track {
    fill: none;
    stroke: var(--border-subtle);
    stroke-width: 7;
  }

  &__grad-a {
    stop-color: #4c9a5f;
  }

  &__grad-b {
    stop-color: var(--primary-color);
  }

  &__fill {
    fill: none;
    stroke: url(#rmGrad);
    stroke-width: 7;
    stroke-linecap: round;
    filter: drop-shadow(0 0 5px color-mix(in srgb, var(--primary-color) 70%, transparent));
  }

  &__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
  }

  &__value {
    @include value-text(24px, var(--text-color), 800);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.5px;
  }

  &__cap {
    @include label-text(10px, uppercase);
  }
}

.hero__side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.hero__title {
  @include value-text(17px, var(--text-color), 700);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--bg-color-block);
  border: 0.5px solid var(--border-subtle);
  @include label-text(11px, none);
  color: var(--text-color);
  font-variant-numeric: tabular-nums;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &--done .chip__dot {
    background: #4c9a5f;
  }

  &--active .chip__dot {
    background: var(--primary-color);
    box-shadow: 0 0 6px var(--primary-color);
  }

  &--planned .chip__dot {
    background: var(--text-color-muted);
  }
}

/* Маршрут */
.route {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Карточка-пункт: сплошной фон, цветная полоса-акцент слева */
.stop {
  position: relative;
  display: flex;
  gap: 13px;
  align-items: flex-start;
  padding: 14px 14px 14px 18px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-color-block);
  border: 0.5px solid var(--glass-border);
  box-shadow: var(--glass-shadow) 0 4px 14px;
  animation: stop-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i) * 0.06s);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--c);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 26px color-mix(in srgb, var(--c) 22%, transparent);
  }

  &__icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    flex-shrink: 0;
    color: #fff;
    background: var(--c);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--c) 45%, transparent);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
    padding-top: 2px;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__title {
    @include value-text(15px, var(--text-color), 700);
    line-height: 1.3;
  }

  &__desc {
    @include label-text(13px, none);
    line-height: 1.5;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px 3px 8px;
    border-radius: 999px;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;

    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
  }
}

/* Статус читается по бейджу: цвет = состояние, а не тема пункта */
.stop--done .stop__badge {
  color: #3f8f54;
  background: rgba(63, 143, 84, 0.14);
}

.stop--active .stop__badge {
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
}

.stop--active .stop__badge::before {
  animation: badge-blink 1.6s ease-in-out infinite;
}

.stop--planned {
  .stop__badge {
    color: var(--text-color-muted);
    background: var(--surface-subtle);
  }

  .stop__icon {
    background: color-mix(in srgb, var(--c) 22%, var(--surface-subtle));
    color: var(--c);
    box-shadow: none;
  }
}

.roadmap--compact {
  gap: 16px;

  .hero {
    padding: 14px;
  }

  .route {
    gap: 8px;
  }
}

@keyframes badge-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@keyframes stop-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stop {
    animation: none;
    opacity: 1;
  }

  .stop--active .stop__badge::before {
    animation: none;
  }
}
</style>
