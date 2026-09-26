<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { Mark } from '@/components/00.shared/services/mark/index.type'
import type { MapPoint } from '@/types/shared/map'
import { distanceMeters, formatDistance } from '@/components/00.shared/lib/geo'
import { hapticMedium } from '@/components/00.shared/lib/haptics'
import { markApi } from '@/components/00.shared/services/mark'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useMarksViewStore } from '@/components/02.features/map/GetMarks'
import { excludeParam, pickCluster, pickMark, remember } from '../model/pick'
import { listenShake } from '../model/shake'
import { useSurpriseStore } from '../model/store'

// «Удиви меня»: встряхнул телефон или нажал кнопку — карта перелетает к случайной метке со всего мира
// и открывает её. Метку выбирает сервер; если он не ответил — берём из загруженных в кадре

/** Сколько ждать после посадки, пока подгрузятся метки. */
const WAIT_MS = 6000
/** Предел перелёта. Длиннее MapLibre не укорачивает, а прыгает мгновенно — поэтому с запасом. */
const MAX_FLIGHT_MS = 9000
const LANDING_ZOOM = 16
/** Ближе — метка почти в кадре, к ней хватает короткого сдвига; дальше — облёт глобуса. */
const NEAR_M = 5000
const HINT_KEY = 'surprise_shake_hint'

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const view = useMarksViewStore()
const surprise = useSurpriseStore()
const notifications = useNotificationStore()

function waitFor<T>(read: () => T | null | undefined, timeout: number): Promise<T | null> {
  return new Promise((resolve) => {
    const found = read()
    if (found) {
      resolve(found)
      return
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const stop = watch(read, (value) => {
      if (!value)
        return
      clearTimeout(timer)
      stop()
      resolve(value)
    })
    timer = setTimeout(() => {
      stop()
      resolve(null)
    }, timeout)
  })
}

async function fromServer(): Promise<Mark | null> {
  try {
    const mark = await markApi.getRandomMark({ exclude: excludeParam() })
    return mark && typeof mark.id === 'number' && mark.geom?.coordinates ? mark : null
  }
  catch {
    return null
  }
}

/**
 * Перелёт и его окончание. Смена угла обзора карты шлёт moveend посреди анимации — такой не считаем.
 * Ждать начинаем до команды: мгновенный прыжок присылает moveend ещё внутри flyTo.
 */
function flyAndLand(instance: maplibregl.Map, options: maplibregl.FlyToOptions): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (instance.isMoving())
        return
      instance.off('moveend', check)
      resolve()
    }
    instance.on('moveend', check)
    instance.flyTo(options)
    check()
  })
}

/**
 * Метка может быть на другом конце света: карта отдаляется, пролетает над глобусом и садится у метки.
 * Карточка открывается после посадки, когда метка подгрузится.
 */
async function show(instance: maplibregl.Map, mark: Mark) {
  remember(mark.id)
  const { lng, lat } = instance.getCenter()
  const near = distanceMeters([lng, lat], mark.geom.coordinates as MapPoint) < NEAR_M
  if (near && view.marks.some(item => item.id === mark.id)) {
    view.preview(mark.id, { fly: true })
    return
  }
  await flyAndLand(instance, {
    center: mark.geom.coordinates as MapPoint,
    zoom: LANDING_ZOOM,
    speed: 1.6,
    curve: 1.42,
    maxDuration: MAX_FLIGHT_MS,
    essential: true,
  })
  const loaded = await waitFor(() => view.marks.find(item => item.id === mark.id), WAIT_MS)
  if (loaded)
    view.preview(loaded.id, { fly: true })
}

/** Карта отдалена и меток по отдельности нет — летим к кластеру и выбираем среди его меток. */
async function fromCluster(instance: maplibregl.Map): Promise<boolean> {
  const cluster = pickCluster(view.clusters)
  if (!cluster)
    return false
  instance.flyTo({ center: cluster.center.coordinates as MapPoint, zoom: Math.max(instance.getZoom() + 3, 15), duration: 1200, essential: true })
  const marks = await waitFor(() => view.marks.length ? view.marks : null, WAIT_MS)
  const mark = marks && pickMark(marks, null)
  if (!mark)
    return false
  remember(mark.id)
  view.preview(mark.id, { fly: true })
  return true
}

/** После нажатия на кнопку один раз подсказываем жест — на телефоне он быстрее. */
function hintShake() {
  try {
    if (surprise.source !== 'button' || !matchMedia('(pointer: coarse)').matches || localStorage.getItem(HINT_KEY))
      return
    localStorage.setItem(HINT_KEY, '1')
  }
  catch {
    return
  }
  notifications.add({ type: 'info', title: 'В следующий раз просто встряхните телефон' })
}

// --- Что происходит: плашка под поиском ---
// Перелёт через полмира длится несколько секунд — без подсказки непонятно, куда и зачем летит карта.
// Отдельная плашка, а не уведомление: уведомления можно отключить в настройках, а статус нужен всегда
interface Status {
  kind: 'search' | 'fly'
  title: string
  hint?: string
}

/** Метка рядом открывается почти сразу — плашку оставляем ненадолго, чтобы её успели прочитать. */
const NEAR_STATUS_MS = 1500
const status = shallowRef<Status | null>(null)
let statusTimer: ReturnType<typeof setTimeout> | undefined

function setStatus(next: Status | null, hideAfter?: number) {
  clearTimeout(statusTimer)
  status.value = next
  if (next && hideAfter)
    statusTimer = setTimeout(() => status.value = null, hideAfter)
}

function distanceHint(instance: maplibregl.Map, mark: Mark): string {
  const { lng, lat } = instance.getCenter()
  const meters = distanceMeters([lng, lat], mark.geom.coordinates as MapPoint)
  if (meters < NEAR_M)
    return 'рядом'
  // Через полмира десятые доли километра не нужны: «2 167 км», а не «2166.8 км»
  return meters >= 100_000 ? `${Math.round(meters / 1000).toLocaleString('ru-RU')} км` : formatDistance(meters)
}

/** Встряхнули телефон — карта качается в ответ, будто её правда встряхнули. Класс снимается по концу анимации. */
function shakeMap(instance: maplibregl.Map) {
  const container = instance.getContainer()
  container.classList.remove('map-shaken')
  // Перерасчёт стилей перезапускает анимацию, если встряхнули снова раньше, чем она закончилась
  void container.offsetWidth
  container.classList.add('map-shaken')
  // animationend всплывает и от анимаций меток внутри карты — ждём именно свою
  const done = (event: AnimationEvent) => {
    if (event.target !== container || event.animationName !== 'map-shake')
      return
    container.classList.remove('map-shaken')
    container.removeEventListener('animationend', done)
  }
  container.addEventListener('animationend', done)
}

let busy = false

async function run() {
  const instance = map?.value
  if (!instance || busy)
    return
  busy = true
  void hapticMedium()
  if (surprise.source === 'shake')
    shakeMap(instance)
  setStatus({ kind: 'search', title: 'Ищем что-нибудь интересное…' })
  try {
    const remote = await fromServer()
    if (remote) {
      setStatus({ kind: 'fly', title: `Летим к «${remote.markName}»`, hint: distanceHint(instance, remote) })
      await show(instance, remote)
      setStatus(null)
    }
    else {
      const local = pickMark(view.marks, view.previewId)
      if (local) {
        remember(local.id)
        setStatus({ kind: 'fly', title: `Смотрите: «${local.markName}»`, hint: 'рядом' }, NEAR_STATUS_MS)
        view.preview(local.id, { fly: true })
      }
      else {
        setStatus({ kind: 'search', title: 'Ищем среди меток на карте…' })
        if (!await fromCluster(instance)) {
          setStatus(null)
          notifications.add({ type: 'info', title: 'Не получилось найти метку', description: 'Проверьте интернет и попробуйте ещё раз' })
          return
        }
        setStatus(null)
      }
    }
    hintShake()
  }
  finally {
    busy = false
  }
}

watch(() => surprise.tick, run)

// --- Встряхивание: слушаем, только пока открыта карта ---
let stopShake: (() => void) | null = null

function startShake() {
  stopShake ??= listenShake(() => surprise.request('shake'))
}

function endShake() {
  stopShake?.()
  stopShake = null
}

onMounted(startShake)
onActivated(startShake)
onDeactivated(() => {
  endShake()
  setStatus(null)
})
onUnmounted(() => {
  endShake()
  clearTimeout(statusTimer)
})
</script>

<template>
  <slot />
  <teleport to="body">
    <transition name="surprise-status">
      <div
        v-if="status"
        class="surprise-status"
        role="status"
        aria-live="polite"
      >
        <span
          class="surprise-status__icon"
          :class="`surprise-status__icon--${status.kind}`"
        >
          <u-icon
            icon="app:magic"
            :loop="false"
            width="12"
          />
        </span>
        <span class="surprise-status__title">{{ status.title }}</span>
        <span
          v-if="status.hint"
          class="surprise-status__hint"
        >· {{ status.hint }}</span>
      </div>
    </transition>
  </teleport>
</template>

<style lang="scss">
// Затухающие рывки влево-вправо с лёгким поворотом. Карта чуть увеличена — по краям не видно фона
.map-shaken {
  animation: map-shake 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes map-shake {
  0%,
  100% {
    transform: none;
  }
  15% {
    transform: scale(1.03) translateX(-9px) rotate(-1.2deg);
  }
  30% {
    transform: scale(1.03) translateX(8px) rotate(1deg);
  }
  45% {
    transform: scale(1.03) translateX(-6px) rotate(-0.7deg);
  }
  60% {
    transform: scale(1.02) translateX(4px) rotate(0.4deg);
  }
  75% {
    transform: scale(1.01) translateX(-2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-shaken {
    animation: none;
  }
}
</style>

<style scoped lang="scss">
.surprise-status {
  position: fixed;
  left: 50%;
  // Под поиском и чипом погоды
  top: calc(var(--safe-top, 0px) + 124px);
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100vw - 48px);
  padding: 4px 12px 4px 4px;
  border: 0.5px solid var(--glass-border);
  border-radius: 999px;
  background: var(--bg-block-solid, var(--bg-color-block));
  box-shadow: var(--glass-shadow) 0 6px 16px;
  transform: translateX(-50%);
  pointer-events: none;

  &__icon {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: #fff;
    background: var(--primary-color);

    // Пока ищем — палочка колдует, в полёте — мерцает
    &--search {
      animation: surprise-wand 0.9s ease-in-out infinite;
    }

    &--fly {
      animation: surprise-glow 1.6s ease-in-out infinite;
    }
  }

  &__title {
    min-width: 0;
    @include value-text(12px, var(--text-color), 700);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__hint {
    flex: 0 0 auto;
    @include label-text(12px, none);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}

.surprise-status-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.surprise-status-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.surprise-status-enter-from,
.surprise-status-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px) scale(0.92);
}

@keyframes surprise-wand {
  0%,
  100% {
    transform: rotate(-14deg);
  }
  50% {
    transform: rotate(14deg) scale(1.08);
  }
}

@keyframes surprise-glow {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary-color) 45%, transparent);
  }
  50% {
    box-shadow: 0 0 0 5px color-mix(in srgb, var(--primary-color) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .surprise-status__icon {
    animation: none;
  }
}
</style>
