import type { Marker } from 'maplibre-gl'

export function patchMarkerOpacity(marker: Marker): void {
  const patched = marker as unknown as {
    _map?: unknown
    _updateOpacity: (force?: boolean) => void
  }

  const original = patched._updateOpacity.bind(patched)
  patched._updateOpacity = (force?: boolean) => {
    if (!patched._map)
      return
    original(force)
  }
}
