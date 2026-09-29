import { expect, openApp, test } from './support/fixtures'
import { ME } from './support/mockApi'

const PEER = { id: 7, username: 'Other' }

function message(id: number, fromMe: boolean, minutesAgo: number) {
  return {
    id,
    type: 'text',
    content: `Сообщение ${id}`,
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    chatId: 5,
    sender: fromMe ? { id: ME.userId, username: ME.username } : PEER,
  }
}

test('галочки прочтения берутся из readCursors, открытие чата отмечает его прочитанным', async ({ page, api }) => {
  api.respond(/^\/chats\/?$/, [{
    chatId: 5,
    type: 'direct',
    title: PEER.username,
    unreadCount: 1,
    updatedAt: new Date().toISOString(),
    peerId: PEER.id,
    isAdmin: false,
    lastMessage: { messageId: 12, username: ME.username, content: 'Сообщение 12' },
    readCursors: [{ userId: ME.userId, lastReadMessageId: 12 }, { userId: PEER.id, lastReadMessageId: 11 }],
  }])
  api.respond(/^\/chats\/5\/history$/, {
    messages: [message(10, false, 5), message(11, true, 4), message(12, true, 3)],
    lastMessageId: 12,
    readCursors: [{ userId: ME.userId, lastReadMessageId: 12 }, { userId: PEER.id, lastReadMessageId: 11 }],
  })

  await openApp(page, '/chats')
  await page.getByText(PEER.username).click()

  const own = page.locator('.bubble-row--own')
  await expect(own).toHaveCount(2)
  // Собеседник дочитал до 11: оно прочитано, 12 — только отправлено
  await expect(own.nth(0).locator('.status')).toHaveClass(/status--read/)
  await expect(own.nth(1).locator('.status')).toHaveClass(/status--sent/)
  await expect.poll(() => api.requests.filter(r => r === 'POST /chats/5/read').length).toBeGreaterThan(0)
})
