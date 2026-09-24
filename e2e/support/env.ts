export const APP_PORT = 4173
export const IMAGE_PORT = 4181

/** Несуществующий домен: тестовая сборка ходит сюда, а все запросы перехватываются моками. */
export const API_ORIGIN = 'https://api.e2e.test'
export const API_BASE = `${API_ORIGIN}/api`

/** Отдельный origin с CORS-заголовками, как у хоста аватаров на проде. */
export const IMAGE_ORIGIN = `http://localhost:${IMAGE_PORT}`
