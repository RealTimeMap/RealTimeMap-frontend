/**
 * Очередь запросов разрешений.
 */
let queue: Promise<unknown> = Promise.resolve()

export function requestPermissionInQueue<T>(request: () => Promise<T>): Promise<T> {
  const result = queue.then(request, request)

  queue = result.catch(() => undefined)

  return result
}
