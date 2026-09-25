import type {
  CreatePersonalMarkPayload,
  PersonalMark,
  PersonalMarkMutationResult,
  PersonalSyncParams,
  PersonalSyncResponse,
  UpdatePersonalMarkPayload,
} from './index.type'
import { getAuthToken } from '@/components/00.shared/lib/authToken'

function authConfig() {
  const token = getAuthToken()
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getAuthToken()}`,
  }
}

export const personalMarkApi = {
  createMark: (payload: CreatePersonalMarkPayload | FormData) =>
    apiService.post<PersonalMarkMutationResult>(`/personal/create`, payload, authConfig()),

  getMarkDetail: (markId: number) =>
    apiService.get<PersonalMark>(`/personal/${markId}`, authConfig()),

  updateMark: (markId: number, payload: UpdatePersonalMarkPayload | FormData) =>
    apiService.patch<PersonalMarkMutationResult>(`/personal/${markId}`, payload, authConfig()),

  deleteMark: (markId: number) =>
    apiService.delete<void>(`/personal/${markId}`, authConfig()),

  syncPersonalData: (params?: PersonalSyncParams) =>
    apiService.get<PersonalSyncResponse>(`/personal/sync`, {
      params,
      headers: authHeaders(),
    }),
}
