export type SurpriseSource = 'button' | 'shake'

/** Запрос «удиви меня»: кнопка живёт вне карты, а перелётом занимается компонент внутри неё. */
export const useSurpriseStore = defineStore('surprise', () => {
  const tick = ref(0)
  const source = ref<SurpriseSource>('button')

  function request(from: SurpriseSource) {
    source.value = from
    tick.value++
  }

  return { tick, source, request }
})
