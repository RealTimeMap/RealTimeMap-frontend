import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl'
import type { TreeLook, TreeSpot } from './trees'
import { MercatorCoordinate } from 'maplibre-gl'
import * as THREE from 'three'
import { crownPainter, isBare, MAX_TREE_COUNT, treeShape, trunkColor } from './trees'

// Деревья — настоящие гранёные формы: шар кроны, конусы ёлки, столбик ствола.
// Все кроны одной формы — один InstancedMesh: на все деревья три вызова отрисовки.
// Матрицы и цвета считаются при смене набора деревьев или сезона, в кадре — только камера

/** Раньше крона меньше пикселя. К FULL_ZOOM деревья дорастают до полной высоты. */
const MIN_ZOOM = 15
const FULL_ZOOM = 15.5
/** Голые ветки облетевшего дерева — узкая крона того же силуэта. */
const BARE_WIDTH = 0.5
const BARE_HEIGHT = 0.85
/** Новое дерево вырастает из земли за это время, с. Разброс старта — чтобы роща не вставала разом. */
const GROW_SECONDS = 0.6
const GROW_SCATTER = 0.35

/**
 * Рост в вершинном шейдере: доля роста — от времени рождения экземпляра, дерево растёт от своего основания.
 * В кадре на процессоре ничего не пересчитывается — меняется одно число uTime.
 */
function withGrowth(material: THREE.Material, time: { value: number }) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aBorn;\nuniform float uTime;')
      .replace('#include <project_vertex>', `
        float growT = clamp((uTime - aBorn) / ${GROW_SECONDS.toFixed(2)}, 0.0, 1.0);
        float grow = 1.0 - pow(1.0 - growT, 3.0);
        vec4 mvPosition = instanceMatrix * vec4(transformed, 1.0);
        mvPosition.xz = mix(instanceMatrix[3].xz, mvPosition.xz, grow);
        mvPosition.y *= grow;
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
      `)
  }
}

/** Высота солнца для света на гранях: настоящая ночью ушла бы под землю, а днём давала бы плоский свет. */
const LIGHT_ALTITUDE = 50 * Math.PI / 180

export interface TreesLayer extends CustomLayerInterface {
  setTrees: (trees: TreeSpot[]) => void
  setLook: (look: TreeLook, sunAzimuth: number) => void
}

/** Единичные формы: основание на земле (y = 0), высота и ширина 1 — размер задаёт матрица экземпляра. */
function unit(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  geometry.translate(0, 0.5, 0)
  return geometry
}

interface Placed {
  spot: TreeSpot
  x: number
  z: number
  /** Когда дерево начинает расти, с от начала работы слоя. */
  born: number
}

const treeKey = (spot: TreeSpot) => `${spot.lng.toFixed(6)},${spot.lat.toFixed(6)}`

interface Meshes {
  trunk: THREE.InstancedMesh
  blob: THREE.InstancedMesh
  cone: THREE.InstancedMesh
}

const _matrix = new THREE.Matrix4()
const _position = new THREE.Vector3()
const _rotation = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _color = new THREE.Color()
const _trunkColor = new THREE.Color()
const _localMatrix = new THREE.Matrix4()
const _growMatrix = new THREE.Matrix4()
const _mercatorScale = new THREE.Vector3()
const _rotationX = new THREE.Matrix4().makeRotationX(Math.PI / 2)

export function createTreesLayer(id: string): TreesLayer {
  let placed: Placed[] = []
  let look: TreeLook | null = null
  let origin = new MercatorCoordinate(0, 0, 0)
  let originScale = 1
  let dirty = false
  const epoch = performance.now()
  const seconds = () => (performance.now() - epoch) / 1000
  const time = { value: 0 }
  /** Пока кто-то растёт, карта перерисовывается каждый кадр; потом — только когда двигается. */
  let growUntil = 0
  let lastAzimuth = 180

  let map: MapLibreMap | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let scene: THREE.Scene | null = null
  let camera: THREE.Camera | null = null
  let sun: THREE.DirectionalLight | null = null
  let meshes: Meshes | null = null

  function instanced(geometry: THREE.BufferGeometry, material: THREE.Material, perTree = 1): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geometry, material, MAX_TREE_COUNT * perTree)
    mesh.count = 0
    mesh.geometry.setAttribute('aBorn', new THREE.InstancedBufferAttribute(new Float32Array(MAX_TREE_COUNT * perTree), 1))
    // Экземпляры разбросаны по всему участку — границы единичной формы для отсечения не годятся
    mesh.frustumCulled = false
    mesh.setColorAt(0, _color)
    return mesh
  }

  function put(mesh: THREE.InstancedMesh, x: number, z: number, base: number, height: number, width: number, turn: number, color: THREE.Color, born: number) {
    const index = mesh.count++
    ;(mesh.geometry.getAttribute('aBorn') as THREE.InstancedBufferAttribute).setX(index, born)
    _position.set(x, base, z)
    _rotation.setFromAxisAngle(_up, turn)
    _scale.set(width, height, width)
    mesh.setMatrixAt(index, _matrix.compose(_position, _rotation, _scale))
    mesh.setColorAt(index, color)
  }

  function build() {
    if (!meshes || !look)
      return
    const paint = crownPainter(look)
    _trunkColor.set(trunkColor(look.base))
    for (const mesh of Object.values(meshes))
      mesh.count = 0

    for (const { spot, x, z, born } of placed) {
      const shape = treeShape(spot)
      const bare = isBare(spot, look.foliage)
      put(meshes.trunk, x, z, 0, shape.trunk.height, shape.trunk.diameter, spot.turn, _trunkColor, born)
      _color.set(paint(spot))
      for (const crown of shape.crowns) {
        const width = crown.diameter * (bare ? BARE_WIDTH : 1)
        const height = crown.height * (bare ? BARE_HEIGHT : 1)
        put(crown.cone ? meshes.cone : meshes.blob, x, z, crown.base, height, width, spot.turn, _color, born)
      }
    }

    for (const mesh of Object.values(meshes)) {
      mesh.geometry.getAttribute('aBorn').needsUpdate = true
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor)
        mesh.instanceColor.needsUpdate = true
    }
  }

  function setTrees(trees: TreeSpot[]) {
    if (trees.length) {
      // Начало координат — в центре участка: метры от него точны во float32 видеокарты
      const lng = trees.reduce((sum, tree) => sum + tree.lng, 0) / trees.length
      const lat = trees.reduce((sum, tree) => sum + tree.lat, 0) / trees.length
      origin = MercatorCoordinate.fromLngLat([lng, lat], 0)
      originScale = origin.meterInMercatorCoordinateUnits()
    }
    // Деревья, которые уже стояли, не растут заново — только новые
    const now = seconds()
    const previous = new Map(placed.map(item => [treeKey(item.spot), item.born]))
    placed = trees.map((spot) => {
      const point = MercatorCoordinate.fromLngLat([spot.lng, spot.lat], 0)
      const born = previous.get(treeKey(spot)) ?? now + spot.phase * GROW_SCATTER
      return { spot, x: (point.x - origin.x) / originScale, z: (point.y - origin.y) / originScale, born }
    })
    growUntil = Math.max(growUntil, now + GROW_SCATTER + GROW_SECONDS)
    dirty = true
    map?.triggerRepaint()
  }

  function setLook(next: TreeLook, sunAzimuth: number) {
    look = next
    const azimuth = sunAzimuth * Math.PI / 180
    // Оси слоя: x — восток, y — вверх, z — юг
    sun?.position.set(
      Math.sin(azimuth) * Math.cos(LIGHT_ALTITUDE),
      Math.sin(LIGHT_ALTITUDE),
      -Math.cos(azimuth) * Math.cos(LIGHT_ALTITUDE),
    )
    lastAzimuth = sunAzimuth
    dirty = true
    map?.triggerRepaint()
  }

  return {
    id,
    type: 'custom',
    renderingMode: '3d',
    setTrees,
    setLook,

    onAdd(instance: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext) {
      map = instance
      scene = new THREE.Scene()
      camera = new THREE.Camera()
      scene.add(new THREE.AmbientLight(0xFFFFFF, 1.6))
      sun = new THREE.DirectionalLight(0xFFFFFF, 1.9)
      scene.add(sun)

      // Плоские грани — узнаваемый low-poly: каждая грань своего оттенка от света.
      // Формы минимальные: додекаэдр — 36 треугольников, у ствола и конусов нет невидимых донышек
      const material = new THREE.MeshLambertMaterial({ flatShading: true })
      withGrowth(material, time)
      meshes = {
        trunk: instanced(unit(new THREE.CylinderGeometry(0.4, 0.5, 1, 5, 1, true)), material),
        blob: instanced(unit(new THREE.DodecahedronGeometry(0.5)), material),
        cone: instanced(unit(new THREE.ConeGeometry(0.5, 1, 7, 1, true)), material, 2),
      }
      scene.add(meshes.trunk, meshes.blob, meshes.cone)

      renderer = new THREE.WebGLRenderer({ canvas: instance.getCanvas(), context: gl, antialias: true })
      renderer.autoClear = false

      if (look)
        setLook(look, lastAzimuth)
      dirty = true
    },

    onRemove() {
      for (const mesh of Object.values(meshes ?? {}) as THREE.InstancedMesh[]) {
        mesh.geometry.dispose()
        mesh.dispose()
      }
      ;(meshes?.blob.material as THREE.Material | undefined)?.dispose()
      // Контекст WebGL принадлежит MapLibre: освобождаем только ресурсы three.js
      renderer?.dispose()
      map = renderer = scene = camera = sun = meshes = null
    },

    render(_gl, args: CustomRenderMethodInput) {
      if (!map || !renderer || !scene || !camera || !look || !placed.length)
        return
      const grow = Math.min(1, (map.getZoom() - MIN_ZOOM) / (FULL_ZOOM - MIN_ZOOM))
      if (grow <= 0)
        return
      if (dirty) {
        build()
        dirty = false
      }

      // Деревья вырастают вместе с приближением, как и здания: растягиваем только высоту
      _mercatorScale.set(originScale, -originScale, originScale)
      _localMatrix
        .makeTranslation(origin.x, origin.y, origin.z)
        .scale(_mercatorScale)
        .multiply(_rotationX)
        .multiply(_growMatrix.makeScale(1, grow, 1))

      const matrix = args.defaultProjectionData?.mainMatrix ?? (args as unknown as { matrix: number[] }).matrix
      camera.projectionMatrix.fromArray(matrix).multiply(_localMatrix)
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()

      // Глубину не чистим: здания и деревья закрывают друг друга честно
      time.value = seconds()
      renderer.resetState()
      renderer.render(scene, camera)
      if (time.value < growUntil)
        map.triggerRepaint()
    },
  }
}
