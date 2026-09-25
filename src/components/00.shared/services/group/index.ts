import type {
  CreateGroupPayload,
  GetGroupListParams,
  Group,
  GroupListResponse,
  UpdateGroupPayload,
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

  getGroupDetail: (groupId: string) =>
    apiService.get<Group>(`/group/${groupId}`, authConfig()),

  patchGroupUpdate: (groupId: string, payload: UpdateGroupPayload) =>
    apiService.patch<Group>(`/group/${groupId}`, payload, authConfig()),

  deleteGroup: (groupId: string) =>
    apiService.delete<void>(`/group/${groupId}`, authConfig()),
}
