<script setup lang="ts">
import { NButton, NResult } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push({ name: 'home-map' })
}
</script>

<template>
  <div class="not-found-page">
    <n-result
      status="404"
      title="404 Страница не найдена"
      description="Кажется, вы заблудились. Той страницы, которую вы ищете, не существует."
    >
      <template #footer>
        <n-button
          type="primary"
          @click="goHome"
        >
          Вернуться на карту
        </n-button>
      </template>
    </n-result>
  </div>
</template>

<style lang="scss" scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
}
</style>
