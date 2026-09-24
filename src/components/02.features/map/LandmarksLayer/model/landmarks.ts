import type { MapPoint } from '@/types/shared/map'

export const LAYER_ID = '3d-landmarks'

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
    coordinates: [2.2945, 48.85835],
    modelUrl: '/models/eiffelTower.glb',
    scale: 3.15,
    rotationY: 2.4,
    doubleSide: false,
  },
  {
    id: 'pisa-tower',
    title: 'Пизанская башня',
    coordinates: [10.396584, 43.723013],
    modelUrl: '/models/pisaTower.glb',
    scale: 0.9,
    rotationY: 0,
    doubleSide: false,
  },
  {
    id: 'isaac-cathedral',
    title: 'Исаакиевский собор',
    coordinates: [30.3061, 59.9343],
    modelUrl: '/models/isaacCathedral.glb',
    scale: 2,
    rotationY: 10,
    doubleSide: false,
  },
  {
    id: 'clock-tower',
    title: 'Биг-Бен',
    coordinates: [73.3986, 61.2565],
    modelUrl: '/models/clockTower.glb',
    scale: 2.4,
    rotationY: 30,
    doubleSide: false,
  },
  {
    id: 'philharmonic',
    title: 'Сургутская Филармония',
    coordinates: [73.3909, 61.2412],
    modelUrl: '/models/philharmonic.glb',
    scale: 1.9,
    rotationY: 2.1,
    doubleSide: false,
  },
  {
    id: 'colosseum',
    title: 'Колизей',
    coordinates: [12.492338, 41.890197],
    modelUrl: '/models/colosseum.glb',
    scale: 2.2,
    rotationY: 2.1,
    doubleSide: false,
  },
]
