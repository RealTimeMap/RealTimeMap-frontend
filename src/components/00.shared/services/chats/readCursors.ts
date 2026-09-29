import type { ReadCursors } from './index.type'

export function peerReadFrom(cursors: ReadCursors | undefined, myId: number | undefined): number {
  if (!cursors)
    return 0
  const entries = Array.isArray(cursors)
    ? cursors.map(cursor => [cursor.userId, cursor.lastReadMessageId] as const)
    : Object.entries(cursors).map(([userId, id]) => [Number(userId), id] as const)
  return entries.reduce((max, [userId, id]) => userId !== myId && Number(id) > max ? Number(id) : max, 0)
}
