import type { SearchProfileItem } from '@/components/00.shared/services/user/index.type'
import { useDebounceFn } from '@vueuse/core'
import { userApi } from '@/components/00.shared/services/user'

const PAGE_SIZE = 20
const DEBOUNCE_MS = 300

function normalizeQuery(raw: string): string {
  return raw.replace(/^@+/, '').trim()
}

export function useUserSearch() {
  const query = ref('')
  const results = ref<SearchProfileItem[]>([])
  const total = ref(0)
  const isLoading = ref(false)
  const hasSearched = ref(false)

  const hasQuery = computed(() => normalizeQuery(query.value).length > 0)

  let requestId = 0

  function reset() {
    results.value = []
    total.value = 0
    hasSearched.value = false
    isLoading.value = false
    requestId++
  }

  const runSearch = useDebounceFn(async (raw: string) => {
    const q = normalizeQuery(raw)
    if (!q) {
      reset()
      return
    }

    const current = ++requestId
    isLoading.value = true

    try {
      const response = await userApi.searchProfiles({ q, pageSize: PAGE_SIZE })
      if (current !== requestId)
        return
      results.value = response.items
      total.value = response.total
      hasSearched.value = true
    }
    catch {
      if (current !== requestId)
        return
      results.value = []
      total.value = 0
      hasSearched.value = true
    }
    finally {
      if (current === requestId)
        isLoading.value = false
    }
  }, DEBOUNCE_MS)

  watch(query, (value) => {
    if (!normalizeQuery(value)) {
      reset()
      return
    }
    isLoading.value = true
    runSearch(value)
  })

  function clear() {
    query.value = ''
  }

  return {
    query,
    results,
    total,
    isLoading,
    hasSearched,
    hasQuery,
    clear,
  }
}
