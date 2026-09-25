import type { Map as MapLibreMap } from 'maplibre-gl'

type Task = () => void

interface Queue {
  tasks: Set<Task>
  pending: Task[]
  handle: number | null
}

const queues = new WeakMap<MapLibreMap, Queue>()

const idle: (cb: () => void) => number = typeof requestIdleCallback === 'function'
  ? cb => requestIdleCallback(cb, { timeout: 500 })
  : cb => window.setTimeout(cb, 16)

const cancelIdle: (handle: number) => void = typeof cancelIdleCallback === 'function'
  ? cancelIdleCallback
  : window.clearTimeout

function runNext(queue: Queue) {
  queue.handle = null
  const task = queue.pending.shift()
  if (!task)
    return
  task()
  // Одна задача на свободный слот — пересчёты расходятся по кадрам, а не идут пачкой
  if (queue.pending.length)
    queue.handle = idle(() => runNext(queue))
}

function queueFor(map: MapLibreMap): Queue {
  let queue = queues.get(map)
  if (queue)
    return queue
  const created: Queue = { tasks: new Set(), pending: [], handle: null }
  queue = created
  map.on('idle', () => {
    created.pending = [...created.tasks]
    if (created.handle === null)
      created.handle = idle(() => runNext(created))
  })
  // Карту снова сдвинули — недоделанный пересчёт устарел
  map.on('movestart', () => {
    created.pending = []
    if (created.handle !== null)
      cancelIdle(created.handle)
    created.handle = null
  })
  queues.set(map, created)
  return created
}

/**
 * Задача после остановки карты. Все такие задачи (тени, деревья, вода) выполняются по очереди
 * в свободное время браузера — так момент «карта остановилась» не превращается в микрофриз.
 */
export function onMapSettled(map: MapLibreMap, task: Task): () => void {
  const queue = queueFor(map)
  queue.tasks.add(task)
  return () => {
    queue.tasks.delete(task)
    queue.pending = queue.pending.filter(item => item !== task)
  }
}
