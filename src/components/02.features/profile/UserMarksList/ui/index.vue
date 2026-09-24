<script setup lang="ts">
import type { Mark } from '@/components/00.shared/services/mark/index.type'
import { markApi } from '@/components/00.shared/services/mark'
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import MarkDetailsSheet from '@/components/02.features/mark/MarkDetailSheet'

const props = defineProps<{
  userId: number
}>()

const PAGE_SIZE = 20
const { close, open } = useDialogStore()

const marks = ref<Mark[]>([])
const page = ref(1)
const total = ref(0)
const hasNext = ref(false)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const error = ref<string | null>(null)

async function load(next = false) {
  if (!props.userId)
    return
  if (next) {
    if (!hasNext.value || isLoadingMore.value)
      return
    isLoadingMore.value = true
  }
  else {
    isLoading.value = true
    error.value = null
  }
  try {
    const targetPage = next ? page.value + 1 : 1
    const data = await markApi.getAllMarks({
      userid: props.userId,
      page: targetPage,
      pageSize: PAGE_SIZE,
    })
    marks.value = next ? [...marks.value, ...data.items] : data.items
    page.value = data.page
    total.value = data.total
    hasNext.value = data.hasNext
  }
  catch (e) {
    console.error('[User Marks]', e)
    if (!next)
      error.value = 'Не удалось загрузить метки'
  }
  finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

function handleDeleted(markId: number) {
  marks.value = marks.value.filter(m => m.id !== markId)
  total.value = Math.max(0, total.value - 1)
}

function openMark(markId: number) {
  open(MarkDetailsSheet, { markId, fromProfile: true, onDeleted: handleDeleted }, {
    headerModal: false,
    position: 'end center',
  })
}

onMounted(() => load(false))
</script>

<template>
  <div class="user-marks">
    <div class="user-marks__header">
      <button
        class="button-back"
        @click="close"
      >
        <u-icon icon="app:arrow-left" />
      </button>
      <h2>Метки</h2>
      <span
        v-if="total"
        class="user-marks__count"
      >{{ total }}</span>
    </div>

    <div class="user-marks__body">
      <div
        v-if="isLoading"
        class="user-marks__grid"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="user-marks__skeleton"
        />
      </div>

      <div
        v-else-if="error"
        class="user-marks__state"
      >
        {{ error }}
      </div>

      <div
        v-else-if="!marks.length"
        class="user-marks__state"
      >
        Пока нет меток
      </div>

      <template v-else>
        <div class="user-marks__grid">
          <u-mark-card
            v-for="item in marks"
            :key="item.id"
            :mark="item"
            @click="openMark(item.id)"
          />
        </div>

        <button
          v-if="hasNext"
          class="user-marks__more"
          :disabled="isLoadingMore"
          @click="load(true)"
        >
          <u-icon
            v-if="isLoadingMore"
            icon="app:loading"
            height="20"
          />
          <template v-else>
            Показать ещё
          </template>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-marks {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--profile-bg, var(--bg-color));
  color: var(--text-color);
  gap: 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;

    .button-back {
      @include glass-panel(12px, 10px, false);
      display: flex;
      cursor: pointer;
    }

    h2 {
      margin: 0;
      @include value-text(22px, var(--text-color), 700);
    }
  }

  &__count {
    margin-left: auto;
    @include label-text(12px, none);
    padding: 4px 10px;
    border-radius: 10px;
    background: var(--bg-color-block);
    font-variant-numeric: tabular-nums;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  &__skeleton {
    aspect-ratio: 1.5 / 1;
    border-radius: 16px;
    background: linear-gradient(100deg, var(--surface-subtle) 30%, var(--surface-hover) 50%, var(--surface-subtle) 70%);
    background-size: 200% 100%;
    animation: user-marks-shimmer 1.4s ease-in-out infinite;
  }

  &__more {
    align-self: center;
    @include glass-panel(12px, 10px, false);
    @include value-text(13px, var(--text-color), 600);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    padding: 0 20px;
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  &__state {
    text-align: center;
    padding: 20px;
    @include label-text(13px, none);
    line-height: 1.4;
  }
}

@keyframes user-marks-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
