import type { CustomLayerInterface, CustomRenderMethodInput, Map } from 'maplibre-gl'
import type { Landmark } from './landmarks'
import { MercatorCoordinate } from 'maplibre-gl'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const LAYER_ID = '3d-landmarks'

const MARKER_HEIGHT = 60
const MARKER_RADIUS = 18
const FALLBACK_COLOR = 0xE8543F

interface LandmarkItem {
  landmark: Landmark
  object: THREE.Object3D
  coord: MercatorCoordinate
  meterScale: number
}

interface SceneRefs {
  camera: THREE.Camera
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  items: LandmarkItem[]
  map: Map
}

function getZoomScale(zoom: number): number {
  const BASE_ZOOM = 16

  if (zoom >= BASE_ZOOM)
    return 1.0

  const growth = 2 ** ((BASE_ZOOM - zoom) * 0.65)

  return Math.min(growth, 10.0)
}

function buildMarkerMesh(color: number): THREE.Group {
  const group = new THREE.Group()

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.1,
  })

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(MARKER_RADIUS, MARKER_HEIGHT * 0.7, 24),
    bodyMaterial,
  )
  cone.rotation.x = Math.PI
  cone.position.y = MARKER_HEIGHT * 0.35
  group.add(cone)

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(MARKER_RADIUS, 24, 24),
    bodyMaterial,
  )
  head.position.y = MARKER_HEIGHT * 0.7
  group.add(head)

  return group
}

export function createLandmarksLayer(landmarks: Landmark[]): CustomLayerInterface {
  const refs: Partial<SceneRefs> = {}

  function anchorModel(obj: THREE.Object3D) {
    obj.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(obj)
    const center = box.getCenter(new THREE.Vector3())
    obj.position.x = -center.x
    obj.position.z = -center.z
    obj.position.y = -box.min.y
  }

  return {
    id: LAYER_ID,
    type: 'custom',
    renderingMode: '3d',

    onAdd(map: Map, gl: WebGLRenderingContext | WebGL2RenderingContext) {
      const camera = new THREE.Camera()
      const scene = new THREE.Scene()
      const items: LandmarkItem[] = []

      const ambient = new THREE.AmbientLight(0xFFFFFF, 1.5)
      scene.add(ambient)

      const directional = new THREE.DirectionalLight(0xFFFFFF, 1.8)
      directional.position.set(50, 70, 100).normalize()
      scene.add(directional)

      const loader = new GLTFLoader()

      function registerObject(object: THREE.Object3D, landmark: Landmark) {
        const coord = MercatorCoordinate.fromLngLat(landmark.coordinates, 0)
        const meterScale = coord.meterInMercatorCoordinateUnits()

        object.visible = false
        scene.add(object)

        items.push({
          landmark,
          object,
          coord,
          meterScale,
        })
      }

      for (const landmark of landmarks) {
        if (landmark.modelUrl) {
          loader.load(
            landmark.modelUrl,
            (gltf) => {
              const model = gltf.scene

              if (landmark.doubleSide) {
                model.traverse((node) => {
                  const mesh = node as THREE.Mesh
                  if (mesh.isMesh) {
                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                    for (const mat of materials)
                      mat.side = THREE.DoubleSide
                  }
                })
              }

              const s = landmark.scale ?? 1
              model.scale.set(s, s, s)

              if (landmark.rotationX)
                model.rotation.x = landmark.rotationX
              if (landmark.rotationY)
                model.rotation.y = landmark.rotationY

              anchorModel(model)
              registerObject(model, landmark)
              map.triggerRepaint()
            },
            undefined,
            () => {
              const marker = buildMarkerMesh(landmark.color ?? FALLBACK_COLOR)
              registerObject(marker, landmark)
              map.triggerRepaint()
            },
          )
        }
        else {
          const marker = buildMarkerMesh(landmark.color ?? FALLBACK_COLOR)
          registerObject(marker, landmark)
        }
      }

      const renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      })
      renderer.autoClear = false

      refs.camera = camera
      refs.scene = scene
      refs.renderer = renderer
      refs.items = items
      refs.map = map
    },

    render(_gl, args: CustomRenderMethodInput) {
      const { camera, scene, renderer, items, map } = refs
      if (!camera || !scene || !renderer || !items || !map)
        return

      const rawMatrix = args.defaultProjectionData?.mainMatrix ?? (args as any).matrix
      const mapProjMatrix = new THREE.Matrix4().fromArray(rawMatrix)

      const currentZoom = map.getZoom()
      const zoomFactor = getZoomScale(currentZoom)

      renderer.resetState()

      for (const item of items) {
        const { coord, meterScale, object } = item

        const effectiveScale = meterScale * zoomFactor

        const modelMatrix = new THREE.Matrix4()
          .makeTranslation(coord.x, coord.y, coord.z)
          .scale(new THREE.Vector3(effectiveScale, -effectiveScale, effectiveScale))
          .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))

        camera.projectionMatrix = mapProjMatrix.clone().multiply(modelMatrix)
        camera.projectionMatrixInverse = camera.projectionMatrix.clone().invert()

        object.visible = true
        renderer.render(scene, camera)
        object.visible = false
      }
    },
  }
}

export { LAYER_ID }
