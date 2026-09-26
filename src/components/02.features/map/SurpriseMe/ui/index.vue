<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { Mark } from '@/components/00.shared/services/mark/index.type'
import type { MapPoint } from '@/types/shared/map'
import { hapticMedium } from '@/components/00.shared/lib/haptics'
import { markApi } from '@/components/00.shared/services/mark'
import { useNotificationStore } from '@/components/00.shared/stores/notification'
import { useMarksViewStore } from '@/components/02.features/map/GetMarks'
import { excludeParam, pickCluster, pickMark, remember } from '../model/pick'
import { listenShake } from '../model/shake'
import { useSurpriseStore } from '../model/store'

// «Удиви меня»: встряхнул телефон или нажал кнопку — карта перелетает к случайной метке и открывает её.
// Сначала спрашиваем сервер (метка в радиусе от центра карты), без ответа — выбираем из загруженных

const RADIUS_M = 3000
/** Сколько ждать, пока после перелёта подгрузятся метки. */
const WAIT_MS = 6000
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

async function fromServer(instance: maplibregl.Map): Promise<Mark | null> {
  const { lng, lat } = instance.getCenter()
  try {
    const mark = await markApi.getRandomMark({ lat, lon: lng, radius: RADIUS_M, exclude: excludeParam() })
    return mark && typeof mark.id === 'number' && mark.geom?.coordinates ? mark : null
  }
  catch {
    return null
  }
}

/** Метка может быть за кадром: сначала перелёт, потом карточка — когда метка подгрузится. */
async function show(instance: maplibregl.Map, mark: Mark) {
  remember(mark.id)
  if (view.marks.some(item => item.id === mark.id)) {
    view.preview(mark.id, { fly: true })
    return
  }
  instance.flyTo({ center: mark.geom.coordinates as MapPoint, zoom: Math.max(instance.getZoom(), 16), duration: 1400, essential: true })
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

let busy = false

async function run() {
  const instance = map?.value
  if (!instance || busy)
    return
  busy = true
  void hapticMedium()
  try {
    const remote = await fromServer(instance)
    if (remote) {
      await show(instance, remote)
    }
    else {
      const local = pickMark(view.marks, view.previewId)
      if (local) {
        remember(local.id)
        view.preview(local.id, { fly: true })
      }
      else if (!await fromCluster(instance)) {
        notifications.add({ type: 'info', title: 'Рядом пока пусто', description: 'Отдалите карту — поищем подальше' })
        return
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
onDeactivated(endShake)
onUnmounted(endShake)
</script>

<template>
  <slot />
</template>
