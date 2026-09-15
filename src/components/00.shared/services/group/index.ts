import type {
  CreateGroupPayload,
  GetGroupListParams,
  Group,
  GroupListResponse,
  UpdateGroupPayload,
} from './index.type'
import { getCookie } from '@/components/00.shared/lib/cookie'

function authConfig() {
  const token = getCookie('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getCookie('token')}`,
  }
}

export const groupApi = {
  postGroupCreate: (payload: CreateGroupPayload) =>
    apiService.post<Group>(`/group/create`, payload, authConfig()),

  getGroupList: (payload: GetGroupListParams) =>
    apiService.get<GroupListResponse>(`/group/list`, {
      params: {
        page: payload?.page ?? 1,
        pageSize: payload?.pageSize ?? 10,
      },
      headers: authHeaders(),
    }),

  getGroupDetail: (groupId: number) =>
    apiService.get<Group>(`/group/${groupId}`, authConfig()),

  patchGroupUpdate: (groupId: number, payload: UpdateGroupPayload) =>
    apiService.patch<Group>(`/group/${groupId}`, payload, authConfig()),

  deleteGroup: (groupId: number) =>
    apiService.delete<void>(`/group/${groupId}`, authConfig()),
}
