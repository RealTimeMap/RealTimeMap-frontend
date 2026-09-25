/**
 * Воркер «только последний ответ»: карта двигается быстрее, чем считается геометрия, поэтому
 * устаревшие ответы отбрасываются, а в очередь не копятся запросы, которые уже никому не нужны.
 */
export function latestWorker<Req, Res>(create: () => Worker) {
  let worker: Worker | null = null
  let lastId = 0

  function request(payload: Req, onResult: (result: Res) => void) {
    worker ??= create()
    const id = ++lastId
    worker.onmessage = (event: MessageEvent<{ id: number, result: Res }>) => {
      if (event.data.id === lastId)
        onResult(event.data.result)
    }
    worker.postMessage({ id, payload })
  }

  function dispose() {
    worker?.terminate()
    worker = null
  }

  return { request, dispose }
}

/** Сторона воркера: считает и отвечает с номером запроса. */
export function serveLatest<Req, Res>(compute: (payload: Req) => Res) {
  globalThis.onmessage = (event: MessageEvent<{ id: number, payload: Req }>) => {
    const { id, payload } = event.data
    ;(globalThis as unknown as Worker).postMessage({ id, result: compute(payload) })
  }
}

/** Признаки и геометрия без методов — то, что можно передать в воркер. */
export function plainFeatures(features: GeoJSON.Feature[]): GeoJSON.Feature[] {
  return features.map(feature => ({
    type: 'Feature',
    id: feature.id,
    properties: { ...feature.properties },
    geometry: feature.geometry,
  }))
}
