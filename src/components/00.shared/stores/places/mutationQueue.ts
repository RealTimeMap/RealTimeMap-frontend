import type { Mutation, PendingPhoto } from './types'
import type { ApiError } from '@/components/00.shared/api/api.types'
import { groupApi } from '@/components/00.shared/services/group'
import { personalMarkApi } from '@/components/00.shared/services/personal-mark'
import { readPendingPhoto, removePendingPhoto } from './photoStore'

/** Результат успешного проигрывания мутации создания — для ремапа localId → серверный id. */
export interface CreateResult {
  localId: string
  serverId: number
  revision: number
}

function isValidationError(error: unknown): boolean {
  const status = (error as ApiError)?.status
  return typeof status === 'number' && status >= 400 && status < 500 && status !== 429
}

/** Ошибка мутации, непригодной к ретраю (валидация 4xx) — её выбрасываем из очереди. */
export class PermanentMutationError extends Error {}

async function buildMarkFormData(
  payload: Record<string, unknown>,
  photos: PendingPhoto[],
): Promise<FormData | Record<string, unknown>> {
  if (photos.length === 0)
    return payload

  const form = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (value == null)
      continue
    // Массивы разворачиваем в повторяющиеся поля (groupsIds=8&groupsIds=9),
    // иначе бэк получит строку "[8]" и падает на ParseUint.
    if (Array.isArray(value)) {
      for (const item of value)
        form.append(key, String(item))
    }
    else {
      form.append(key, String(value))
    }
  }
  for (const photo of photos) {
    const blob = await readPendingPhoto(photo)
    form.append('photos', blob)
  }
  return form
}

/**
 * Проигрывает одну мутацию против API.
 * Возвращает CreateResult для create-операций (нужно для ремапа id), иначе null.
 * Бросает PermanentMutationError на 4xx — такую мутацию нужно выбросить из очереди.
 */
export async function playMutation(m: Mutation): Promise<CreateResult | null> {
  try {
    switch (m.kind) {
      case 'mark.create': {
        const body = await buildMarkFormData(m.payload as unknown as Record<string, unknown>, m.photos)
        const res = await personalMarkApi.createMark(body as never)
        await Promise.all(m.photos.map(removePendingPhoto))
        return { localId: m.localId, serverId: res.id, revision: res.revision }
      }
      case 'mark.update': {
        const body = await buildMarkFormData(m.payload as unknown as Record<string, unknown>, m.photos)
        await personalMarkApi.updateMark(m.target as number, body as never)
        await Promise.all(m.photos.map(removePendingPhoto))
        return null
      }
      case 'mark.delete':
        await personalMarkApi.deleteMark(m.target as number)
        return null
      case 'group.create': {
        const res = await groupApi.postGroupCreate(m.payload)
        return { localId: m.localId, serverId: res.id, revision: 0 }
      }
      case 'group.update':
        await groupApi.patchGroupUpdate(m.target as number, m.payload)
        return null
      case 'group.delete':
        await groupApi.deleteGroup(m.target as number)
        return null
    }
  }
  catch (error) {
    if (isValidationError(error))
      throw new PermanentMutationError((error as ApiError)?.message)
    throw error
  }
}
