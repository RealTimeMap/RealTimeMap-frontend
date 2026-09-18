import type { Landmark } from './landmarks'
import { MapLibreOverlay } from '@deck.gl/maplibre'
import { ScenegraphLayer } from '@deck.gl/mesh-layers'
import { load } from '@loaders.gl/core'
import { DracoLoader } from '@loaders.gl/draco'
import { GLTFLoader } from '@loaders.gl/gltf'

const SIZE_SCALE = 2

const RAD_TO_DEG = 180 / Math.PI

const LOAD_OPTIONS = {
  worker: true,
  DracoLoader,
  decompress: true,
  gltf: {
    decompressMeshes: true,
    postProcess: false,
  },
} as const

function buildLayers(landmarks: Landmark[]): ScenegraphLayer[] {
  const groups = new Map<string, Landmark[]>()

  for (const landmark of landmarks) {
    if (!landmark.modelUrl)
      continue
    const bucket = groups.get(landmark.modelUrl)
    if (bucket)
      bucket.push(landmark)
    else
      groups.set(landmark.modelUrl, [landmark])
  }

  const layers: ScenegraphLayer[] = []

  for (const [modelUrl, items] of groups) {
    const modelKey = modelUrl.split('/').pop()?.replace(/\.glb$/i, '') ?? modelUrl
    const scenegraph = load(modelUrl, GLTFLoader, LOAD_OPTIONS)

    layers.push(
      new ScenegraphLayer<Landmark>({
        id: `deck-landmark-${modelKey}`,
        data: items,
        scenegraph,

        getPosition: (d: Landmark) => d.coordinates,

        getOrientation: (d: Landmark) => [
          (d.rotationX ?? 0) * RAD_TO_DEG,
          (d.rotationY ?? 0) * RAD_TO_DEG,
          0,
        ],

        sizeScale: SIZE_SCALE,
        _lighting: 'flat',
        pickable: false,
      }),
    )
  }

  return layers
}

export function createDeckOverlay(landmarks: Landmark[]): MapLibreOverlay {
  return new MapLibreOverlay({
    interleaved: false,
    layers: buildLayers(landmarks),
  })
}
