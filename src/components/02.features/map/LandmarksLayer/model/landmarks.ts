import type { MapPoint } from '@/types/shared/map'

export const LAYER_ID = '3d-landmarks'

// Координаты — центр контура здания в OpenStreetMap: модель встаёт ровно на своё место на карте.
export interface LandmarkFact {
  value: string
  label: string
}

/** Глава истории о месте. Ракурс камеры выбирается по порядку главы. */
export interface LandmarkChapter {
  title: string
  text: string
}

export interface Landmark {
  id: string
  title: string
  city?: string
  // Пара строк для карточки: чем место известно.
  description?: string
  // Цифры для кинорежима: всплывают вокруг модели.
  facts?: LandmarkFact[]
  // Главы между «Знакомством» и «Сейчас рядом»: история, архитектура, интересное.
  chapters?: LandmarkChapter[]
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
    city: 'Париж',
    description: 'Кованая башня 1889 года, построенная к Всемирной выставке. Высота — 330 метров, долгое время была самым высоким сооружением мира.',
    coordinates: [2.2945006, 48.8582599],
    facts: [{ value: '330 м', label: 'высота' }, { value: '1889', label: 'открыта' }, { value: '2 года', label: 'строили' }],
    chapters: [
      { title: 'История', text: 'Башню построила компания Гюстава Эйфеля к Всемирной выставке 1889 года. Её собирались разобрать через 20 лет, но спасли — башня пригодилась как радиоантенна.' },
      { title: 'Архитектура', text: 'Около 18 тысяч металлических деталей соединены 2,5 миллиона заклёпок. Башню перекрашивают примерно раз в семь лет — уходит около 60 тонн краски.' },
      { title: 'Интересное', text: 'В жару металл расширяется, и вершина становится выше до 15 сантиметров. А при строительстве парижские художники и писатели подписывали протест против «бесполезной башни».' },
    ],
    modelUrl: '/models/eiffelTower.glb',
    scale: 3.15,
    rotationY: 2.4,
    doubleSide: false,
    clearRadius: 90,
  },
  {
    id: 'pisa-tower',
    title: 'Пизанская башня',
    city: 'Пиза',
    description: 'Колокольня собора, наклонившаяся ещё во время строительства в XII веке из-за мягкого грунта.',
    coordinates: [10.3966322, 43.7230159],
    facts: [{ value: '56 м', label: 'высота' }, { value: '≈4°', label: 'наклон' }, { value: '1173', label: 'начало стройки' }],
    chapters: [
      { title: 'История', text: 'Строительство началось в 1173 году и растянулось почти на двести лет. Башня начала крениться ещё на третьем этаже — грунт под ней оказался слишком мягким.' },
      { title: 'Архитектура', text: 'Колокольня из белого мрамора: восемь ярусов с аркадами и почти триста ступеней наверх. На вершине висят семь колоколов.' },
      { title: 'Интересное', text: 'В 1990 году башню закрыли на 11 лет и выпрямили больше чем на 40 сантиметров. Теперь она стабильна на столетия — но наклон оставили, иначе это была бы просто башня.' },
    ],
    modelUrl: '/models/pisaTower.glb',
    scale: 0.9,
    rotationY: 0,
    doubleSide: false,
    clearRadius: 18,
  },
  {
    id: 'isaac-cathedral',
    title: 'Исаакиевский собор',
    city: 'Санкт-Петербург',
    description: 'Крупнейший православный собор города, строился 40 лет. С колоннады открывается вид на весь центр.',
    coordinates: [30.306142, 59.9340785],
    facts: [{ value: '101,5 м', label: 'высота' }, { value: '1858', label: 'освящён' }, { value: '40 лет', label: 'строили' }],
    chapters: [
      { title: 'История', text: 'Нынешний собор — четвёртый Исаакиевский храм. Его строили с 1818 по 1858 год по проекту Огюста Монферрана.' },
      { title: 'Архитектура', text: '112 монолитных гранитных колонн, самые большие весят больше 110 тонн. На позолоту купола ушло около 100 килограммов золота.' },
      { title: 'Интересное', text: 'Монферран работал над собором почти всю жизнь и умер вскоре после освящения. С колоннады на высоте 43 метров виден весь центр Петербурга.' },
    ],
    modelUrl: '/models/isaacCathedral.glb',
    scale: 2,
    rotationY: 10,
    doubleSide: false,
    clearRadius: 80,
  },
  {
    id: 'clock-tower',
    title: 'Биг-Бен',
    city: 'Сургут',
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
    city: 'Сургут',
    description: 'Главная концертная площадка города: симфонические вечера, джаз и гастроли.',
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
    city: 'Рим',
    description: 'Амфитеатр I века на 50 тысяч зрителей — символ Древнего Рима.',
    coordinates: [12.491903, 41.8909421],
    facts: [{ value: '80 г.', label: 'открыт' }, { value: '50 000', label: 'зрителей' }, { value: '48 м', label: 'высота' }],
    chapters: [
      { title: 'История', text: 'Амфитеатр Флавиев начал строить император Веспасиан, а открыл в 80 году его сын Тит — праздничные игры шли сто дней.' },
      { title: 'Архитектура', text: 'Четыре яруса арок с колоннами трёх ордеров: дорического, ионического и коринфского. Над ареной натягивали огромный тент — веларий.' },
      { title: 'Интересное', text: 'Под ареной был лабиринт коридоров и подъёмников, откуда появлялись звери и гладиаторы. В Средние века амфитеатр разбирали на камень для новых построек.' },
    ],
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
