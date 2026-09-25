import type { MapPoint } from '@/types/shared/map'

export const LAYER_ID = '3d-landmarks'

// Координаты — центр контура здания в OpenStreetMap: модель встаёт ровно на своё место на карте.
export interface Landmark {
  id: string
  title: string
  coordinates: MapPoint
  // Путь к .glb модели. Без него достопримечательность не отрисовывается.
  modelUrl?: string
  // Масштаб модели (метры). Подбирается под конкретную модель.
  scale?: number
  // Поворот модели вокруг осей (радианы). rotationX выравнивает
  // модели, экспортированные в системе Z-up, по вертикали.
  rotationX?: number
  rotationY?: number
  // Двусторонний рендер граней. Нужен ажурным конструкциям (решётка башни),
  // но у плотных моделей вызывает z-fighting — по умолчанию выключен.
  doubleSide?: boolean
  // Радиус расчистки (метры): 3D-здания ближе к точке не рисуются, чтобы не прорастали сквозь модель.
  // Примерно половина большей стороны модели с учётом scale.
  clearRadius?: number
}

// ! ПРОМТ для генерации 3д
//
// Стиль:
//   low-poly 3D model of {ОБЪЕКТ}, isometric game asset style,
//   flat shading, soft ambient occlusion, muted blue-grey palette
//   with orange accents, no textures just vertex colors
//
// Геометрия (важно для FPS на карте — модель рендерится каждый кадр):
//   single merged watertight mesh (not separate parts), low triangle count
//   5k-15k faces, minimal number of materials, clean topology,
//   flat closed bottom base (стоит на земле, низ замкнут),
//   single centered object on transparent background
//
// НЕ добавлять «highly detailed / intricate» — конфликтует с low-poly и
// даёт кашу из тысяч мелких мешей, которую потом не спасти.
//
// После генерации всё равно прогнать через `bun run models:optimize`:
// LLM/генератор часто отдаёт модель раздробленной на сотни-тысячи мешей
// (каждый = отдельный draw call), скрипт схлопывает их в один по материалу.

export const DEMO_LANDMARKS: Landmark[] = [
  {
    id: 'eiffel-tower',
    title: 'Эйфелева башня',
    coordinates: [2.2945006, 48.8582599],
    modelUrl: '/models/eiffelTower.glb',
    scale: 3.15,
    rotationY: 2.4,
    doubleSide: false,
    clearRadius: 90,
  },
  {
    id: 'pisa-tower',
    title: 'Пизанская башня',
    coordinates: [10.3966322, 43.7230159],
    modelUrl: '/models/pisaTower.glb',
    scale: 0.9,
    rotationY: 0,
    doubleSide: false,
    clearRadius: 18,
  },
  {
    id: 'isaac-cathedral',
    title: 'Исаакиевский собор',
    coordinates: [30.306142, 59.9340785],
    modelUrl: '/models/isaacCathedral.glb',
    scale: 2,
    rotationY: 10,
    doubleSide: false,
    clearRadius: 80,
  },
  {
    id: 'clock-tower',
    title: 'Биг-Бен',
    coordinates: [73.3986, 61.2565],
    modelUrl: '/models/clockTower.glb',
    scale: 2.4,
    rotationY: 30,
    doubleSide: false,
    clearRadius: 35,
  },
  {
    id: 'philharmonic',
    title: 'Сургутская Филармония',
    coordinates: [73.390811, 61.241188],
    modelUrl: '/models/philharmonic.glb',
    scale: 1.9,
    rotationY: 2.1,
    doubleSide: false,
    clearRadius: 50,
  },
  {
    id: 'colosseum',
    title: 'Колизей',
    coordinates: [12.491903, 41.8909421],
    modelUrl: '/models/colosseum.glb',
    scale: 2.2,
    rotationY: 2.1,
    doubleSide: false,
    clearRadius: 85,
  },
]

/** Места под моделями, где не должно быть 3D-зданий. */
export const LANDMARK_CLEARINGS = DEMO_LANDMARKS
  .filter(landmark => landmark.modelUrl && landmark.clearRadius)
  .map(landmark => ({ coordinates: landmark.coordinates, radius: landmark.clearRadius! }))
