<script setup lang="ts">
import { registerPlugin } from '@capacitor/core'

const LiveCapsule = registerPlugin<{
  showStatus: (options: {
    text: string
    progress: number
    shortText: string
  }) => Promise<void>
  hideStatus: () => Promise<void>
}>('LiveCapsule')

const currentProgress = ref(0)
let timer: any = null

async function startTrack() {
  if (timer)
    clearInterval(timer)
  currentProgress.value = 0

  timer = setInterval(async () => {
    if (currentProgress.value >= 100) {
      clearInterval(timer)
      await LiveCapsule.showStatus({
        text: 'Обновление скачено!',
        shortText: 'Готово',
        progress: 100,
      })
      return
    }

    currentProgress.value += 10

    await LiveCapsule.showStatus({
      text: `${currentProgress.value}%`,
      progress: currentProgress.value,
      shortText: 'Обнова',
    })
  }, 1000)
}

function stopTrack() {
  if (timer)
    clearInterval(timer)
  LiveCapsule.hideStatus()
}
</script>

<template>
  <div style="padding: 20px; display: flex; gap: 10px; z-index: 9999; position: fixed; top: 50px; left: 10px;">
    <button
      style="background: green; color: white; padding: 10px; border-radius: 8px;"
      @click="startTrack"
    >
      Включить статус
    </button>
    <button
      style="background: red; color: white; padding: 10px; border-radius: 8px;"
      @click="stopTrack"
    >
      Убрать
    </button>
  </div>
</template>
