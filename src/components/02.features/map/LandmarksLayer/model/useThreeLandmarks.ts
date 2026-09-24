import type { CustomLayerInterface, CustomRenderMethodInput, Map } from 'maplibre-gl'
import type { Landmark } from './landmarks'
import { MercatorCoordinate } from 'maplibre-gl'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { LAYER_ID } from './landmarks'

const MIN_LOAD_ZOOM = 12.0
const MAX_CACHED_MODELS = 8

const RISE_DURATION = 650

type LoadingState = 'idle' | 'loading' | 'loaded' | 'error'

interface LandmarkItem {
  landmark: Landmark
  object: THREE.Object3D | null
  coord: MercatorCoordinate
  meterScale: number
  status: LoadingState
  baseScale: number
  rise: number
  height: number
  lastVisibleTime: number
}

interface SceneRefs {
  camera: THREE.Camera
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  items: LandmarkItem[]
  map: Map
  loader: GLTFLoader
}

const _localMatrix = new THREE.Matrix4()
const _rotationXMatrix = new THREE.Matrix4().makeRotationX(Math.PI / 2)
const _scaleVector = new THREE.Vector3()

const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

function disposeHierarchy(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.geometry?.dispose()

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of materials) {
        for (const key of Object.keys(mat)) {
          const value = (mat as any)[key]
          if (value && typeof value.dispose === 'function') {
            value.dispose()
          }
        }
        mat.dispose()
      }
    }
  })
}

export function createLandmarksLayer(landmarks: Landmark[]): CustomLayerInterface {
  const refs: Partial<SceneRefs> = {}

  const loadedQueue: LandmarkItem[] = []

  function anchorModel(obj: THREE.Object3D): number {
    obj.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(obj)
    const center = box.getCenter(new THREE.Vector3())
    obj.position.x = -center.x
    obj.position.z = -center.z
    obj.position.y = -box.min.y
    return box.max.y - box.min.y
  }

  function enableGroundClip(obj: THREE.Object3D) {
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh)
        return
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of materials) {
        mat.clippingPlanes = [_groundPlane]
        mat.clipShadows = true
      }
    })
  }

  function animateRise(item: LandmarkItem, map: Map) {
    const startTime = performance.now()

    function step(now: number) {
      const progress = Math.min((now - startTime) / RISE_DURATION, 1.0)
      item.rise = 1 - (1 - progress) ** 3
      map.triggerRepaint()

      if (progress < 1.0) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }

  function evictOldestModel(scene: THREE.Scene) {
    if (loadedQueue.length <= MAX_CACHED_MODELS)
      return

    let oldestIndex = -1
    let oldestTime = Infinity

    for (let i = 0; i < loadedQueue.length; i++) {
      if (loadedQueue[i].lastVisibleTime < oldestTime) {
        oldestTime = loadedQueue[i].lastVisibleTime
        oldestIndex = i
      }
    }

    if (oldestIndex !== -1) {
      const item = loadedQueue.splice(oldestIndex, 1)[0]
      if (item.object) {
        scene.remove(item.object)
        disposeHierarchy(item.object)
      }
      item.object = null
      item.status = 'idle'
      item.rise = 0
    }
  }

  function loadModel(item: LandmarkItem, scene: THREE.Scene, map: Map, loader: GLTFLoader) {
    if (!item.landmark.modelUrl || item.status !== 'idle')
      return
    item.status = 'loading'

    loader.load(
      item.landmark.modelUrl,
      (gltf) => {
        const model = gltf.scene

        if (item.landmark.doubleSide) {
          model.traverse((node) => {
            const mesh = node as THREE.Mesh
            if (mesh.isMesh) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
              for (const mat of materials) mat.side = THREE.DoubleSide
            }
          })
        }

        if (item.landmark.rotationX)
          model.rotation.x = item.landmark.rotationX
        if (item.landmark.rotationY)
          model.rotation.y = item.landmark.rotationY

        item.height = anchorModel(model)
        enableGroundClip(model)

        if (item.object) {
          scene.remove(item.object)
          disposeHierarchy(item.object)
        }
        scene.add(model)

        item.object = model
        item.status = 'loaded'
        item.rise = 0.0

        loadedQueue.push(item)
        evictOldestModel(scene)

        animateRise(item, map)
      },
      undefined,
      () => {
        item.status = 'error'
      },
    )
  }

  function checkVisibleModels() {
    const { map, items, scene, loader } = refs
    if (!map || !items || !scene || !loader)
      return

    const currentZoom = map.getZoom()
    if (currentZoom < MIN_LOAD_ZOOM)
      return

    const bounds = map.getBounds()

    for (const item of items) {
      const [lng, lat] = item.landmark.coordinates
      if (bounds.contains([lng, lat])) {
        item.lastVisibleTime = performance.now()
        if (item.status === 'idle') {
          loadModel(item, scene, map, loader)
        }
      }
    }
  }

  return {
    id: LAYER_ID,
    type: 'custom',
    renderingMode: '3d',

    onAdd(map: Map, gl: WebGLRenderingContext | WebGL2RenderingContext) {
      const camera = new THREE.Camera()
      const scene = new THREE.Scene()
      const items: LandmarkItem[] = []

      const loader = new GLTFLoader()

      const ambient = new THREE.AmbientLight(0xFFFFFF, 1.5)
      scene.add(ambient)

      const directional = new THREE.DirectionalLight(0xFFFFFF, 1.8)
      directional.position.set(50, 70, 100).normalize()
      scene.add(directional)

      for (const landmark of landmarks) {
        const coord = MercatorCoordinate.fromLngLat(landmark.coordinates, 0)
        const meterScale = coord.meterInMercatorCoordinateUnits()

        items.push({
          landmark,
          object: null,
          coord,
          meterScale,
          status: 'idle',
          baseScale: landmark.scale ?? 1,
          rise: 0,
          height: 0,
          lastVisibleTime: 0,
        })
      }

      const renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      })
      renderer.autoClear = false
      // Нужно, чтобы clippingPlanes на материалах учитывались.
      renderer.localClippingEnabled = true

      refs.camera = camera
      refs.scene = scene
      refs.renderer = renderer
      refs.items = items
      refs.map = map
      refs.loader = loader

      map.on('moveend', checkVisibleModels)
      checkVisibleModels()
    },

    render(_gl, args: CustomRenderMethodInput) {
      const { camera, scene, renderer, items, map } = refs
      if (!camera || !scene || !renderer || !items || !map)
        return

      const rawMatrix = args.defaultProjectionData?.mainMatrix ?? (args as any).matrix
      const bounds = map.getBounds()

      const center = map.getCenter()
      const originCoord = MercatorCoordinate.fromLngLat([center.lng, center.lat], 0)
      const originScale = originCoord.meterInMercatorCoordinateUnits()

      let hasVisibleObjects = false

      for (const item of items) {
        if (!item.object)
          continue

        const [lng, lat] = item.landmark.coordinates

        if (!bounds.contains([lng, lat])) {
          item.object.visible = false
          continue
        }

        item.lastVisibleTime = performance.now()
        item.object.visible = true
        hasVisibleObjects = true

        const dxMeters = (item.coord.x - originCoord.x) / originScale
        const dzMeters = (item.coord.y - originCoord.y) / originScale

        const riseOffset = -item.height * item.baseScale * (1 - item.rise)
        item.object.position.set(dxMeters, riseOffset, dzMeters)

        const finalScale = item.baseScale * item.rise
        item.object.scale.set(finalScale, finalScale, finalScale)
      }

      if (!hasVisibleObjects)
        return

      _scaleVector.set(originScale, -originScale, originScale)
      _localMatrix
        .makeTranslation(originCoord.x, originCoord.y, originCoord.z)
        .scale(_scaleVector)
        .multiply(_rotationXMatrix)

      camera.projectionMatrix.fromArray(rawMatrix).multiply(_localMatrix)
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()

      renderer.resetState()
      renderer.clearDepth()
      renderer.render(scene, camera)
    },
  }
}

export { LAYER_ID }
