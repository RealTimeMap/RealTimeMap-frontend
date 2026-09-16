import type { MapPoint } from '@/types/shared/map'

export interface Landmark {
  id: string
  title: string
  coordinates: MapPoint
  // Путь к .glb модели. Если не задан — рисуется примитив-заглушка.
  modelUrl?: string
  // Масштаб модели (метры). Подбирается под конкретную модель.
  scale?: number
  // Поворот модели вокруг осей (радианы). rotationX выравнивает
  // модели, экспортированные в системе Z-up, по вертикали.
  rotationX?: number
  rotationY?: number
  // Цвет примитива-заглушки (hex), если модели нет.
  color?: number
  // Двусторонний рендер граней. Нужен ажурным конструкциям (решётка башни),
  // но у плотных моделей вызывает z-fighting — по умолчанию выключен.
  doubleSide?: boolean
}

// ! ПРОМТ для генерации 3д
// low-poly 3D model of {ОБЪЕКТ}, isometric game asset style,
// flat shading, soft ambient occlusion, muted blue-grey palette
// with orange accents, no textures just vertex colors,
// clean topology, single centered object on transparent background

export const DEMO_LANDMARKS: Landmark[] = [
  {
    id: 'eiffel-tower',
    title: 'Эйфелева башня',
    coordinates: [2.2945, 48.8584],
    modelUrl: '/models/tourEiffel.glb',
    scale: 0.008,
    rotationY: 1,
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
]
