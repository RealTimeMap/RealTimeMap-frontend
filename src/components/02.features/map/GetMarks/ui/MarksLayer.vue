<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { Mark } from '@/components/00.shared/services/mark/index.type'
import type { MapBounds, MapPoint } from '@/types/shared/map'
import { useDebounceFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { useRouteStore } from '@/components/02.features/map/RouteToMark'
import MarkDetailsSheet from '@/components/02.features/mark/MarkDetailSheet'
import { useMarksHeatmap } from '../model/useMarksHeatmap'
import { useMarksSocket } from '../model/useMarksSocket'
import MarkPreview from './MarkPreview.vue'

const props = defineProps<{
  userCoordinates: MapPoint
  screenBounds: MapBounds | null
  zoomLevel: number
}>()

const emit = defineEmits<{
  (e: 'update:markCount', count: number): void
  (e: 'update:clusterCount', count: number): void
}>()

const CLUSTER_ZOOM_STEP = 2
const CLUSTER_MAX_ZOOM = 18

const dialogStore = useDialogStore()
const map = inject<ShallowRef<maplibregl.Map | null>>('map')
const { marks, clusters, fetchMarks } = useMarksSocket()

const { pinnedMark } = storeToRefs(useRouteStore())
const { showHeatmap } = storeToRefs(useSettingsStore())

const displayMarks = computed<Mark[]>(() => {
  const base = [...marks.value] as Mark[]
  const pin = pinnedMark.value
  if (!pin || base.some(m => m.id === pin.id))
    return base
  return [...base, pin]
})

useMarksHeatmap(
  map,
  () => ({ marks: displayMarks.value, clusters: clusters.value }),
  () => showHeatmap.value,
)

// Что сейчас на экране — для контекстных подсказок (метки и кластеры взаимоисключающи)
watch(
  () => displayMarks.value.length,
  count => emit('update:markCount', count),
  { immediate: true },
)
watch(
  () => clusters.value.length,
  count => emit('update:clusterCount', count),
  { immediate: true },
)
const router = useRouter()
const route = useRoute()

let lastFetchKey = ''
const isActive = ref(true)
onActivated(() => {
  isActive.value = true
})
onDeactivated(() => {
  isActive.value = false
})

const debounceFetchMark = useDebounceFn((
  userCoordinates: MapPoint,
  screenBounds: MapBounds | null,
  zoomLevel: number,
) => {
  if (!screenBounds || !userCoordinates)
    return

  const fetchKey = [
    userCoordinates[0].toFixed(4),
    userCoordinates[1].toFixed(4),
    screenBounds[0][0].toFixed(4),
    screenBounds[0][1].toFixed(4),
    screenBounds[1][0].toFixed(4),
    screenBounds[1][1].toFixed(4),
    zoomLevel.toFixed(2),
  ].join('_')

  if (fetchKey === lastFetchKey)
    return
  lastFetchKey = fetchKey

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const [longitude, latitude] = userCoordinates

  fetchMarks({
    startAt: new Date().toISOString(),
    // endAt: new Date().toISOString(),
    zoomLevel,
    screen: {
      leftTop: {
        lat: screenBounds[0][1],
        lon: screenBounds[0][0],
      },
      rightBottom: {
        lat: screenBounds[1][1],
        lon: screenBounds[1][0],
      },
      center: {
        lat: latitude,
        lon: longitude,
      },
    },
    // show_ended: false,
    // longitude,
    // latitude,
    // radius: 100000,
  })
}, 500)

watch(
  [() => props.userCoordinates, () => props.screenBounds, () => props.zoomLevel],
  ([newCord, newBounds, newZoomLevel]) => {
    if (!isActive.value)
      return
    if (newCord && newBounds && newZoomLevel)
      debounceFetchMark(newCord, newBounds, newZoomLevel)
  },
  { immediate: true },
)

function openMarkModal(markId: number) {
  dialogStore.open(
    MarkDetailsSheet,
    { markId },
    {
      headerModal: false,
      position: 'end center',
      onClose: () => {
        const currentQuery = { ...route.query }
        delete currentQuery.id
        router.replace({ query: currentQuery })
      },
    },
  )
}

function handleClusterClick(coordinates: MapPoint) {
  const instance = map?.value
  if (!instance)
    return

  instance.easeTo({
    center: coordinates,
    zoom: Math.min(instance.getZoom() + CLUSTER_ZOOM_STEP, CLUSTER_MAX_ZOOM),
    duration: 500,
  })
}

// --- Быстрый просмотр ---
// Первое нажатие показывает карточку над меткой, второе (или нажатие на карточку) — полную шторку
const previewMark = shallowRef<Mark | null>(null)

function closePreview() {
  previewMark.value = null
}

function handleMarkTap(markId: number) {
  if (previewMark.value?.id === markId) {
    closePreview()
    handleMarkClick(markId)
    return
  }
  previewMark.value = displayMarks.value.find(m => m.id === markId) ?? null
}

function openPreviewed() {
  const mark = previewMark.value
  closePreview()
  if (mark)
    handleMarkClick(mark.id)
}

// Короткое касание пустой карты закрывает карточку. Ловим на canvas сами: click от MapLibre
// иногда не приходит (микросдвиг пальца, распознавание двойного касания). DOM-метки — не canvas,
// поэтому нажатия по ним сюда не попадают
let tapStart: { x: number, y: number, at: number } | null = null

function onCanvasPointerDown(event: PointerEvent) {
  tapStart = { x: event.clientX, y: event.clientY, at: performance.now() }
}

function onCanvasPointerUp(event: PointerEvent) {
  const start = tapStart
  tapStart = null
  if (!start || performance.now() - start.at > 500)
    return
  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 10)
    closePreview()
}

watch(() => map?.value, (instance, previous) => {
  const prevCanvas = previous?.getCanvas()
  prevCanvas?.removeEventListener('pointerdown', onCanvasPointerDown)
  prevCanvas?.removeEventListener('pointerup', onCanvasPointerUp)
  const canvas = instance?.getCanvas()
  canvas?.addEventListener('pointerdown', onCanvasPointerDown)
  canvas?.addEventListener('pointerup', onCanvasPointerUp)
}, { immediate: true })

onUnmounted(() => {
  const canvas = map?.value?.getCanvas()
  canvas?.removeEventListener('pointerdown', onCanvasPointerDown)
  canvas?.removeEventListener('pointerup', onCanvasPointerUp)
})

// Метка ушла с экрана (например, стала кластером при отдалении)
watch(displayMarks, (list) => {
  if (previewMark.value && !list.some(m => m.id === previewMark.value!.id))
    closePreview()
})

onDeactivated(closePreview)

function handleMarkClick(markId: number) {
  router.replace({
    query: {
      ...route.query,
      id: markId,
    },
  })

  openMarkModal(markId)
}

onMounted(() => {
  const queryId = route.query.id
  const idString = Array.isArray(queryId) ? queryId[0] : queryId

  if (idString) {
    const markId = Number(idString)

    if (!Number.isNaN(markId)) {
      openMarkModal(markId)
    }
  }
})
</script>

<template>
  <div class="markers-overlay">
    <u-marker
      v-for="mark in displayMarks"
      :key="mark.id"
      v-memo="[mark.geom.coordinates, mark.photos?.[0]]"
      :coordinates="mark.geom.coordinates as MapPoint"
      :media="mark.photos ? mark.photos[0] : null"
      @click="handleMarkTap(mark.id)"
    />

    <mark-preview
      v-if="previewMark && map"
      :key="previewMark.id"
      :map="map"
      :mark="previewMark"
      :user-coordinates="userCoordinates"
      @open="openPreviewed"
    />

    <u-cluster
      v-for="cluster in (showHeatmap ? [] : clusters)"
      :key="`cluster-${cluster.center.coordinates.join('-')}`"
      v-memo="[cluster.center.coordinates, cluster.count]"
      :coordinates="cluster.center.coordinates as MapPoint"
      :count="cluster.count"
      @click="handleClusterClick(cluster.center.coordinates as MapPoint)"
    />
  </div>
</template>
