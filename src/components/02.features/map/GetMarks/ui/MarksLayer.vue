<script setup lang="ts">
import type * as maplibregl from 'maplibre-gl'
import type { ShallowRef } from 'vue'
import type { Cluster, Mark } from '@/components/00.shared/services/mark/index.type'
import type { MapBounds, MapPoint } from '@/types/shared/map'
import { useDebounceFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { useSettingsStore } from '@/components/00.shared/stores/settings'
import { useRouteStore } from '@/components/02.features/map/RouteToMark'
import MarkDetailsSheet from '@/components/02.features/mark/MarkDetailSheet'
import { markLifespan } from '../model/markLifespan'
import { useMarksViewStore } from '../model/marksView'
import { fanOffsets, groupOverlapping } from '../model/overlapGroups'
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
const { marks, clusters, fetchMarks, recentlyCreated } = useMarksSocket()

const { pinnedMark } = storeToRefs(useRouteStore())
const { showHeatmap, markPreviewSwipe } = storeToRefs(useSettingsStore())

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

// --- Общее состояние меток в кадре (для панели «Что рядом» и карточки) ---
const view = useMarksViewStore()
const { previewId, flyToId } = storeToRefs(view)

watch(displayMarks, (list) => {
  view.marks = list
}, { immediate: true })
watch(clusters, (list) => {
  view.clusters = [...list] as Cluster[]
}, { immediate: true })

// --- Срок меток: кольцо вокруг пина обновляется раз в минуту ---
const now = ref(Date.now())
const clock = setInterval(() => {
  now.value = Date.now()
}, 60_000)
onUnmounted(() => clearInterval(clock))

// --- Наложенные метки: схлопнуты в одну со значком «+N», по нажатию раскрываются веером ---
const expandedKey = ref<string | null>(null)
/** Веер, который сейчас собирается обратно — метки ещё видны, пока идёт анимация. */
const collapsingKey = ref<string | null>(null)
const COLLAPSE_MS = 220

// Группы считаются в пикселях экрана — пересчитываем, когда меняется масштаб или ракурс
const projectionVersion = ref(0)
function bumpProjection() {
  projectionVersion.value++
}
watch(() => map?.value, (instance, previous) => {
  for (const event of ['zoomend', 'rotateend', 'pitchend'] as const) {
    previous?.off(event, bumpProjection)
    instance?.on(event, bumpProjection)
  }
  bumpProjection()
}, { immediate: true })

const groups = computed(() => {
  void projectionVersion.value
  const instance = map?.value
  if (!instance)
    return displayMarks.value.map(mark => ({ key: `g${mark.id}`, anchor: mark.geom.coordinates as [number, number], marks: [mark] }))
  return groupOverlapping(displayMarks.value, coordinates => instance.project(coordinates))
})

interface RenderedMark {
  mark: Mark
  groupKey: string
  collapsing: boolean
  collapseHide: boolean
  /** Где рисовать: у одиночной — своя точка, у группы — общая точка группы. */
  coordinates: MapPoint
  spread: [number, number] | null
  badge: number
}

const renderedMarks = computed<RenderedMark[]>(() => groups.value.flatMap((group): RenderedMark[] => {
  const [first] = group.marks
  const base = { groupKey: group.key, collapsing: false, collapseHide: false }
  if (group.marks.length === 1)
    return [{ ...base, mark: first!, coordinates: first!.geom.coordinates as MapPoint, spread: null, badge: 0 }]
  const collapsing = collapsingKey.value === group.key
  if (expandedKey.value === group.key || collapsing) {
    const offsets = fanOffsets(group.marks.length)
    return group.marks.map((mark, i) => ({
      ...base,
      mark,
      coordinates: group.anchor,
      spread: offsets[i]!,
      badge: 0,
      collapsing,
      // Представитель группы остаётся на месте, остальные втягиваются и исчезают
      collapseHide: collapsing && i > 0,
    }))
  }
  return [{ ...base, mark: first!, coordinates: group.anchor, spread: null, badge: group.marks.length - 1 }]
}))

function lifespanOf(mark: Mark) {
  return markLifespan(mark, now.value)
}

// --- Быстрый просмотр ---
// Первое нажатие показывает карточку над меткой, второе (или нажатие на карточку) — полную шторку
const previewMark = computed(() => displayMarks.value.find(m => m.id === previewId.value) ?? null)
const previewRendered = computed(() => renderedMarks.value.find(r => r.mark.id === previewId.value) ?? null)
const enterFrom = ref<'pop' | 'left' | 'right'>('pop')

/** Закрытая карточка ещё доигрывает анимацию исчезновения. */
const closingPreview = shallowRef<{ mark: Mark, coordinates: MapPoint, spread: [number, number] | null } | null>(null)
const PREVIEW_CLOSE_MS = 160
let closingTimer: ReturnType<typeof setTimeout> | undefined
let lastPreviewRendered: { mark: Mark, coordinates: MapPoint, spread: [number, number] | null } | null = null

watch(previewRendered, (rendered) => {
  if (rendered)
    lastPreviewRendered = { mark: rendered.mark, coordinates: rendered.coordinates, spread: rendered.spread }
}, { immediate: true })

watch(previewId, (id, previous) => {
  clearTimeout(closingTimer)
  if (id !== null || previous === null || !lastPreviewRendered || lastPreviewRendered.mark.id !== previous) {
    closingPreview.value = null
    return
  }
  closingPreview.value = lastPreviewRendered
  closingTimer = setTimeout(() => {
    closingPreview.value = null
  }, PREVIEW_CLOSE_MS)
})

/** Порядок листания — слева направо по экрану на момент открытия карточки. */
const swipeOrder = ref<number[]>([])

function snapshotSwipeOrder() {
  const instance = map?.value
  if (!instance)
    return
  swipeOrder.value = displayMarks.value
    .map(mark => ({ id: mark.id, point: instance.project(mark.geom.coordinates as MapPoint) }))
    .sort((a, b) => a.point.x - b.point.x || a.point.y - b.point.y)
    .map(item => item.id)
}

const swipePosition = computed(() => {
  const index = swipeOrder.value.indexOf(previewId.value ?? -1)
  return index >= 0 && swipeOrder.value.length > 1
    ? { index: index + 1, total: swipeOrder.value.length }
    : null
})

function closePreview() {
  view.closePreview()
}

let collapseTimer: ReturnType<typeof setTimeout> | undefined

function collapseFan() {
  if (!expandedKey.value)
    return
  collapsingKey.value = expandedKey.value
  expandedKey.value = null
  clearTimeout(collapseTimer)
  collapseTimer = setTimeout(() => {
    collapsingKey.value = null
  }, COLLAPSE_MS)
}

/** Если метка стоит в группе с другими — раскрываем группу, иначе карточке не к чему привязаться. */
function revealInGroup(markId: number) {
  const group = groups.value.find(g => g.marks.some(m => m.id === markId))
  expandedKey.value = group && group.marks.length > 1 ? group.key : null
}

function handleMarkTap(item: RenderedMark) {
  if (item.badge > 0) {
    expandedKey.value = item.groupKey
    closePreview()
    return
  }
  if (previewId.value === item.mark.id) {
    closePreview()
    handleMarkClick(item.mark.id)
    return
  }
  enterFrom.value = 'pop'
  view.preview(item.mark.id)
  snapshotSwipeOrder()
}

function swipeTo(step: 1 | -1) {
  const order = swipeOrder.value
  const index = order.indexOf(previewId.value ?? -1)
  const nextId = order[index + step]
  const next = displayMarks.value.find(m => m.id === nextId)
  if (!next)
    return
  enterFrom.value = step > 0 ? 'right' : 'left'
  revealInGroup(next.id)
  view.preview(next.id)
  map?.value?.easeTo({ center: next.geom.coordinates as MapPoint, duration: 450 })
}

function openPreviewed() {
  const mark = previewMark.value
  closePreview()
  if (mark)
    handleMarkClick(mark.id)
}

// Перелёт из списка «Что рядом»
watch(flyToId, (id) => {
  const instance = map?.value
  const mark = displayMarks.value.find(m => m.id === id)
  if (id === null || !instance || !mark)
    return
  flyToId.value = null
  enterFrom.value = 'pop'
  revealInGroup(mark.id)
  instance.easeTo({ center: mark.geom.coordinates as MapPoint, zoom: Math.max(instance.getZoom(), 16), duration: 700 })
  // После перелёта зум другой — группы пересчитаны, раскрываем группу метки заново
  instance.once('moveend', () => {
    revealInGroup(mark.id)
    snapshotSwipeOrder()
  })
})

// Начали менять масштаб или ракурс — веер собираем: иначе после пересчёта групп
// в него попадают новые метки и он «разъезжается»
function onCameraGestureStart() {
  collapseFan()
}
watch(() => map?.value, (instance, previous) => {
  for (const event of ['zoomstart', 'rotatestart', 'pitchstart'] as const) {
    previous?.off(event, onCameraGestureStart)
    instance?.on(event, onCameraGestureStart)
  }
}, { immediate: true })

// При смене зума состав групп меняется — раскрытый веер собираем
watch(projectionVersion, () => {
  if (expandedKey.value && !groups.value.some(g => g.key === expandedKey.value && g.marks.length > 1))
    collapseFan()
})

// Короткое касание пустой карты закрывает карточку и собирает веер. Ловим на canvas сами:
// click от MapLibre иногда не приходит (микросдвиг пальца, распознавание двойного касания).
// DOM-метки — не canvas, поэтому нажатия по ним сюда не попадают
let tapStart: { x: number, y: number, at: number } | null = null

function onCanvasPointerDown(event: PointerEvent) {
  tapStart = { x: event.clientX, y: event.clientY, at: performance.now() }
}

function onCanvasPointerUp(event: PointerEvent) {
  const start = tapStart
  tapStart = null
  if (!start || performance.now() - start.at > 500)
    return
  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 10) {
    closePreview()
    collapseFan()
  }
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
  closePreview()
})

// Метка ушла с экрана (например, стала кластером при отдалении)
watch(displayMarks, (list) => {
  if (previewId.value !== null && !list.some(m => m.id === previewId.value))
    closePreview()
  if (expandedKey.value && !groups.value.some(g => g.key === expandedKey.value))
    collapseFan()
})

onDeactivated(() => {
  closePreview()
  collapseFan()
})

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
      v-for="item in renderedMarks"
      :key="item.mark.id"
      v-memo="[
        item.coordinates,
        item.mark.photos?.[0],
        item.spread?.[0],
        item.spread?.[1],
        item.badge,
        item.collapsing,
        Math.round((lifespanOf(item.mark)?.remaining ?? -1) * 100),
        lifespanOf(item.mark)?.expiring,
        recentlyCreated.has(item.mark.id),
      ]"
      :coordinates="item.coordinates"
      :media="item.mark.photos ? item.mark.photos[0] : null"
      :spread="item.spread"
      :badge="item.badge"
      :collapsing="item.collapsing"
      :collapse-hide="item.collapseHide"
      :lifespan="lifespanOf(item.mark)?.remaining ?? null"
      :expiring="lifespanOf(item.mark)?.expiring ?? false"
      :appear="recentlyCreated.has(item.mark.id)"
      @click="handleMarkTap(item)"
    />

    <mark-preview
      v-if="previewMark && map"
      :key="previewMark.id"
      :map="map"
      :mark="previewMark"
      :user-coordinates="userCoordinates"
      :coordinates="previewRendered?.coordinates"
      :offset="previewRendered?.spread ?? null"
      :position="swipePosition"
      :swipeable="markPreviewSwipe"
      :enter-from="enterFrom"
      @open="openPreviewed"
      @next="swipeTo(1)"
      @prev="swipeTo(-1)"
    />

    <mark-preview
      v-if="closingPreview && map"
      :key="`closing-${closingPreview.mark.id}`"
      :map="map"
      :mark="closingPreview.mark"
      :user-coordinates="userCoordinates"
      :coordinates="closingPreview.coordinates"
      :offset="closingPreview.spread"
      closing
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
