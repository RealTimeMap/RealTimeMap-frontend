<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { Landmark } from '../model/landmarks'
import type { Shot, StoryChapter } from '../model/story'
import type { LandmarksLayer } from '../model/useThreeLandmarks'
import type { MapPoint } from '@/types/shared/map'
import { distanceMeters } from '@/components/00.shared/lib/geo'
import { hapticSuccess } from '@/components/00.shared/lib/haptics'
import { useMapStyleBase } from '@/components/00.shared/lib/mapStyleBase'
import { useMarksViewStore } from '@/components/02.features/map/GetMarks'
import { useRouteStore } from '@/components/02.features/map/RouteToMark'
import { BADGE_LAYER_ID, ensureBadges, hideLabel, LABEL_LAYER_ID, recolorBadges, removeBadges } from '../model/badges'
import { unlock, UNLOCK_RADIUS, unlockedAt } from '../model/collection'
import { DEMO_LANDMARKS, LAYER_ID } from '../model/landmarks'
import LandmarkCinema from './LandmarkCinema.vue'

const props = defineProps<{
  userPosition: MapPoint | null
}>()

// --- Кинорежим: камера облетает здание, интерфейс карты спрятан ---
const CINEMA_PITCH = 62
/** Градусов в секунду: камера медленно дрейфует вокруг здания, пока идёт глава. */
const ORBIT_SPEED = 4
/**
 * Облёт — цепочка длинных плавных поворотов, а не setBearing в каждом кадре:
 * тот шлёт moveend каждый кадр, и на нём срабатывало бы всё, что ждёт остановки карты.
 * Больше полукруга за раз нельзя — поворот идёт кратчайшим путём.
 */
const ORBIT_SEGMENT = 90
/** Перелёт между ракурсами глав. */
const SHOT_MS = 2200
/** Текст главы снизу — здание держим над ним; в «Сейчас рядом» внизу ещё и карточка. */
const PANEL_SPACE = { story: 200, now: 300 }
const NO_PADDING = { top: 0, bottom: 0, left: 0, right: 0 }
/** Карточка переворачивается, когда камера уже у здания. */
const REVEAL_DELAY_MS = 1600
const LEAVING_MS = 500

/** Только места с моделью: без неё кинорежиму нечего показывать. */
const LANDMARKS = DEMO_LANDMARKS.filter(landmark => landmark.modelUrl)

const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const styleBase = useMapStyleBase()
const view = useMarksViewStore()
const route = useRouteStore()

let disposed = false
let models: LandmarksLayer | null = null

const current = shallowRef<Landmark | null>(null)
const modelCenter = shallowRef<{ x: number, y: number } | null>(null)
const bearing = ref(0)
const revealing = ref(false)
/** Камера долетела до здания — главы можно показывать своими ракурсами. */
const ready = ref(false)
/** Вид при подлёте: ракурсы глав считаются от него. */
let base: { bearing: number, zoom: number } | null = null
let chapterNow: StoryChapter | null = null
/** Вид карты до входа — туда камера вернётся при выходе. */
let saved: { center: MapPoint, zoom: number, pitch: number, bearing: number } | null = null
let orbiting = false
let stopWaiting: (() => void) | null = null
let revealTimer: ReturnType<typeof setTimeout> | undefined
let leavingTimer: ReturnType<typeof setTimeout> | undefined

const number = computed(() => current.value ? LANDMARKS.indexOf(current.value) + 1 : 0)
const distance = computed(() => current.value && props.userPosition ? distanceMeters(props.userPosition, current.value.coordinates) : null)
const openedAt = computed(() => current.value ? unlockedAt(current.value.id) : null)

/** Крупное здание снимаем издалека, небольшое — ближе. Радиус расчистки ≈ половина здания. */
function cinemaZoom(landmark: Landmark): number {
  const radius = landmark.clearRadius ?? 40
  return Math.min(17.8, Math.max(15.4, 17.6 - Math.log2(radius / 20)))
}

const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2

/**
 * Камера закончила движение. Смена угла обзора (BaseMapView расширяет его при наклоне)
 * шлёт moveend посреди анимации — такой считать остановкой нельзя, иначе ракурс обрывается.
 */
function whenStill(instance: maplibregl.Map, done: () => void) {
  stopWaiting?.()
  const check = () => {
    if (instance.isMoving())
      return
    stopWaiting?.()
    done()
  }
  instance.on('moveend', check)
  stopWaiting = () => {
    instance.off('moveend', check)
    stopWaiting = null
  }
}

function stopOrbit() {
  orbiting = false
  stopWaiting?.()
}

function startOrbit(instance: maplibregl.Map, landmark: Landmark) {
  stopOrbit()
  if (matchMedia('(prefers-reduced-motion: reduce)').matches)
    return
  orbiting = true
  const segment = () => {
    if (!orbiting || current.value !== landmark || disposed)
      return
    instance.easeTo({
      bearing: instance.getBearing() + ORBIT_SEGMENT,
      duration: ORBIT_SEGMENT / ORBIT_SPEED * 1000,
      easing: t => t,
      essential: true,
    })
    whenStill(instance, segment)
  }
  segment()
}

/** Факты вращаются вместе с камерой. */
function onRotate() {
  const instance = map?.value
  if (instance)
    bearing.value = instance.getBearing()
}

/** Середина модели на экране — вокруг неё вращаются факты. Центр при облёте не двигается, считаем один раз. */
function measureCenter(instance: maplibregl.Map, landmark: Landmark) {
  const point = instance.project(landmark.coordinates)
  modelCenter.value = { x: point.x, y: point.y - instance.getCanvas().clientHeight * 0.12 }
}

/** Рядом с местом карточка открывается — переворотом, пока камера у здания. */
function tryUnlock(landmark: Landmark) {
  clearTimeout(revealTimer)
  if (unlockedAt(landmark.id) || !props.userPosition || distanceMeters(props.userPosition, landmark.coordinates) > UNLOCK_RADIUS)
    return
  revealTimer = setTimeout(() => {
    if (current.value !== landmark)
      return
    unlock(landmark.id)
    revealing.value = true
    void hapticSuccess()
  }, REVEAL_DELAY_MS)
}

function enter(landmark: Landmark) {
  const instance = map?.value
  if (!instance)
    return
  view.closePreview()
  if (!current.value) {
    instance.on('rotate', onRotate)
    const center = instance.getCenter()
    saved = { center: [center.lng, center.lat], zoom: instance.getZoom(), pitch: instance.getPitch(), bearing: instance.getBearing() }
    clearTimeout(leavingTimer)
    document.documentElement.classList.remove('map-cinema-leaving')
    document.documentElement.classList.add('map-cinema')
  }
  current.value = landmark
  modelCenter.value = null
  revealing.value = false
  ready.value = false
  base = null
  bearing.value = instance.getBearing()
  hideLabel(instance, landmark.id)
  stopOrbit()
  instance.flyTo({
    center: landmark.coordinates,
    zoom: cinemaZoom(landmark),
    pitch: CINEMA_PITCH,
    padding: { ...NO_PADDING, bottom: PANEL_SPACE.story },
    speed: 1.1,
    curve: 1.5,
    maxDuration: 4000,
    essential: true,
  })
  whenStill(instance, () => {
    if (current.value !== landmark)
      return
    base = { bearing: instance.getBearing(), zoom: instance.getZoom() }
    ready.value = true
    // Пока летели, могли уже пролистать главы — показываем текущую
    if (chapterNow && chapterNow.kind !== 'intro') {
      shoot(instance, landmark, chapterNow)
      return
    }
    measureCenter(instance, landmark)
    startOrbit(instance, landmark)
  })
}

/** Ракурс главы: камера перелетает к нему и дальше медленно дрейфует вокруг здания. */
function shoot(instance: maplibregl.Map, landmark: Landmark, chapter: StoryChapter) {
  if (!base)
    return
  const shot: Shot = chapter.shot
  stopOrbit()
  modelCenter.value = null
  instance.easeTo({
    bearing: base.bearing + shot.bearing,
    pitch: shot.pitch,
    zoom: base.zoom + shot.zoom,
    padding: { ...NO_PADDING, bottom: chapter.kind === 'now' ? PANEL_SPACE.now : PANEL_SPACE.story },
    duration: SHOT_MS,
    easing: easeInOut,
    essential: true,
  })
  whenStill(instance, () => {
    if (current.value !== landmark || chapterNow !== chapter)
      return
    measureCenter(instance, landmark)
    startOrbit(instance, landmark)
  })
}

function onChapter(chapter: StoryChapter) {
  const instance = map?.value
  const landmark = current.value
  chapterNow = chapter
  if (!instance || !landmark)
    return
  // Карточка видна в «Сейчас рядом» — там она и открывается, если вы у места
  if (chapter.kind === 'now')
    tryUnlock(landmark)
  if (ready.value)
    shoot(instance, landmark, chapter)
}

function openMark(id: number) {
  exit(false)
  view.preview(id, { fly: true })
}

/** restore = false, когда следом строится маршрут: он сам покажет нужный участок. */
function exit(restore = true) {
  const instance = map?.value
  stopOrbit()
  clearTimeout(revealTimer)
  current.value = null
  modelCenter.value = null
  ready.value = false
  chapterNow = null
  const root = document.documentElement
  root.classList.remove('map-cinema')
  root.classList.add('map-cinema-leaving')
  leavingTimer = setTimeout(() => root.classList.remove('map-cinema-leaving'), LEAVING_MS)
  if (!instance)
    return
  instance.off('rotate', onRotate)
  hideLabel(instance, null)
  if (restore && saved)
    instance.flyTo({ ...saved, padding: NO_PADDING, speed: 1.4, maxDuration: 2500, essential: true })
  else
    instance.setPadding(NO_PADDING)
  saved = null
}

function step(delta: 1 | -1) {
  if (!current.value)
    return
  const index = LANDMARKS.indexOf(current.value)
  enter(LANDMARKS[(index + delta + LANDMARKS.length) % LANDMARKS.length]!)
}

function routeHere() {
  const landmark = current.value
  if (!landmark)
    return
  exit(false)
  void route.buildRouteToPoint(landmark.coordinates)
}

// Подошли к месту, пока смотрите на карточку, — она откроется
watch(() => props.userPosition, () => {
  if (current.value && !openedAt.value && chapterNow?.kind === 'now')
    tryUnlock(current.value)
})

// --- Нажатие: сначала сама модель (луч в сцену), издалека — жетон ---
function onClick(event: maplibregl.MapMouseEvent) {
  const instance = map?.value
  if (!instance || current.value)
    return
  const layers = [BADGE_LAYER_ID, LABEL_LAYER_ID].filter(id => instance.getLayer(id))
  const badge = layers.length ? instance.queryRenderedFeatures(event.point, { layers })[0] : undefined
  const landmark = models?.pick(event.point.x, event.point.y)
    ?? LANDMARKS.find(item => item.id === badge?.properties.id)
  if (landmark)
    enter(landmark)
}

// --- Слои: модели (three.js) и жетоны; жетоны живут в стиле и возвращаются после смены темы ---
async function addModels(instance: maplibregl.Map) {
  if (instance.getLayer(LAYER_ID))
    return
  const { createLandmarksLayer } = await import('../model/useThreeLandmarks')
  if (disposed || instance.getLayer(LAYER_ID))
    return
  models = createLandmarksLayer(DEMO_LANDMARKS)
  instance.addLayer(models)
  instance.triggerRepaint()
}

let waitingForIdle = false

function syncBadges() {
  const instance = map?.value
  if (!instance || disposed)
    return
  // isStyleLoaded() ложно и пока грузятся тайлы — дожидаемся idle, а не теряем вызов
  if (!instance.isStyleLoaded()) {
    if (!waitingForIdle) {
      waitingForIdle = true
      instance.once('idle', () => {
        waitingForIdle = false
        syncBadges()
      })
    }
    return
  }
  ensureBadges(instance, DEMO_LANDMARKS, styleBase.value)
}

watch(styleBase, (base) => {
  const instance = map?.value
  if (instance)
    recolorBadges(instance, base)
})

watch(
  () => map?.value,
  (instance, previous) => {
    previous?.off('click', onClick)
    previous?.off('styledata', syncBadges)
    if (!instance)
      return
    instance.on('click', onClick)
    instance.on('styledata', syncBadges)
    syncBadges()
    if (instance.loaded())
      void addModels(instance)
    else
      instance.once('idle', () => void addModels(instance))
  },
  { immediate: true },
)

// Ушли со страницы карты посреди кинорежима — интерфейс не должен остаться спрятанным
onDeactivated(() => {
  if (current.value)
    exit(false)
})

onUnmounted(() => {
  disposed = true
  if (current.value)
    exit(false)
  clearTimeout(leavingTimer)
  document.documentElement.classList.remove('map-cinema-leaving')
  const instance = map?.value
  if (!instance)
    return
  instance.off('click', onClick)
  instance.off('styledata', syncBadges)
  if (instance.getLayer(LAYER_ID))
    instance.removeLayer(LAYER_ID)
  removeBadges(instance)
})
</script>

<template>
  <slot />
  <landmark-cinema
    v-if="current"
    :landmark="current"
    :number="number"
    :total="LANDMARKS.length"
    :distance="distance"
    :opened-at="openedAt"
    :revealing="revealing"
    :center="modelCenter"
    :bearing="bearing"
    :ready="ready"
    @exit="exit()"
    @chapter="onChapter"
    @open-mark="openMark"
    @next="step(1)"
    @prev="step(-1)"
    @route="routeHere"
  />
</template>
