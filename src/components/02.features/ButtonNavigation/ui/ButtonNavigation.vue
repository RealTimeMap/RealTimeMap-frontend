<script setup lang="ts">
import {
  Add,
  Close,
  ImageOutline as ImageIcon,
  Map,
  MapOutline,
  Person,
  PersonOutline,
  Settings,
  SettingsOutline,
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { useAddMarkStore } from '../../../../shared/stores/add-mark'
import { useAuthStore } from '../../Authentication/model/auth'
import { useGeolocation } from '../../Geolocation/composables/useGeolocation'

const { userPosition } = useGeolocation()
const addMarkStore = useAddMarkStore()

const activeItemId = defineModel<string>('activeItem', { default: 'Map' })
const authStore = useAuthStore()

interface ActionItem {
  id: string
  icon: Component
  action: () => void
}
interface NavItem {
  id: string
  icon: Component
  activeIcon: Component
}

const navItems: NavItem[] = ([
  { id: 'Person', icon: PersonOutline, activeIcon: Person },
  { id: 'Map', icon: MapOutline, activeIcon: Map },
  {
    id: 'Settings',
    icon: SettingsOutline,
    activeIcon: Settings,
  },
])

function handleAddClick() {
  if (userPosition.value)
    addMarkStore.startAddingMark(userPosition.value)
}

const actionItems = computed<ActionItem[]>(() => {
  const items: ActionItem[] = [
    { id: 'add', icon: Add, action: handleAddClick },
    // eslint-disable-next-line no-console
    { id: 'image', icon: ImageIcon, action: () => console.log('Image clicked') },
    // eslint-disable-next-line no-console
    { id: 'close', icon: Close, action: () => console.log('Close clicked') },
  ]

  if (!authStore.token)
    return items.filter(item => item.id !== 'add')

  return items
})

const isActionsVisible = ref(false)
let showActionsTimer: ReturnType<typeof setTimeout> | null = null

watch(activeItemId, (newItemId) => {
  if (showActionsTimer)
    clearTimeout(showActionsTimer)

  if (newItemId === 'Map') {
    showActionsTimer = setTimeout(() => {
      isActionsVisible.value = true
    }, 400)
  }
  else {
    isActionsVisible.value = false
  }
})

const itemRefs = shallowRef<HTMLElement[]>([])
const navList = ref<HTMLUListElement | null>(null)
const indicatorStyle = ref({})

function updateIndicatorPosition(activeIndex: number) {
  const activeItemEl = itemRefs.value[activeIndex]
  if (!activeItemEl || !navList.value)
    return
  const offsetLeft = activeItemEl.offsetLeft
  const clientWidth = activeItemEl.clientWidth
  const indicatorPosition = offsetLeft + clientWidth / 2
  indicatorStyle.value = {
    transform: `translateX(${indicatorPosition}px) translateX(-50%)`,
  }
}

function setActiveItem(id: string, index: number) {
  activeItemId.value = id
  updateIndicatorPosition(index)
}

const isReadyForAnimation = ref(false)
onMounted(() => {
  const initialActiveIndex = navItems.findIndex(item => item.id === activeItemId.value)
  if (initialActiveIndex !== -1)
    updateIndicatorPosition(initialActiveIndex)

  nextTick(() => {
    isReadyForAnimation.value = true
    if (activeItemId.value === 'Map') {
      showActionsTimer = setTimeout(() => {
        isActionsVisible.value = true
      }, 300)
    }
  })
})
</script>

<template>
  <u-glass-wrapper
    v-if="!addMarkStore.isAddingMark"
    :scale="40"
    :class="{ 'is-visible': isReadyForAnimation }"
    class="bottom-nav"
  >
    <div
      class="bottom-nav__indicator"
      :style="indicatorStyle"
    >
      <div class="bottom-nav__indicator-orb" />
    </div>
    <ul
      ref="navList"
      class="bottom-nav__list"
    >
      <li
        v-for="(item, index) in navItems"
        :key="item.id"
        :ref="el => { if (el) itemRefs[index] = el as HTMLElement }"
        class="bottom-nav__item"
        :class="{ 'bottom-nav__item--active': activeItemId === item.id }"
        @click="setActiveItem(item.id, index)"
      >
        <n-icon
          size="30"
          :component="activeItemId === item.id ? item.activeIcon : item.icon"
          class="bottom-nav__icon"
          :class="{ 'is-main-active': item.id === 'Map' && activeItemId === 'Map' }"
        />
      </li>
    </ul>

    <div
      class="bottom-nav__indicator"
      :style="indicatorStyle"
    >
      <div
        class="speed-dial"
        :class="{ 'is-visible': isActionsVisible }"
      >
        <button
          v-for="(action, index) in actionItems"
          :key="action.id"
          class="speed-dial__button"
          :style="{ '--i': index }"
          @click="action.action"
        >
          <n-icon
            :component="action.icon"
            size="24"
          />
        </button>
      </div>
    </div>
  </u-glass-wrapper>
</template>

<style lang="scss" scoped>
$orb-background: var(--orb-background);
$nav-icon-inactive: var(--nav-icon-inactive);
$nav-icon-active: var(--nav-icon-active);

@keyframes emerge-arc-left {
  0% {
    opacity: 0;
    transform: translate(-50%, calc(-50% + 30px)) scale(0);
  }
  70% {
    opacity: 1;
    transform: translate(calc(-50% - 70px), calc(-50% - 50px)) scale(1.1);
  }
  100% {
    opacity: 1;
    transform: translate(calc(-50% - 55px), calc(-50% - 45px)) scale(1);
  }
}

@keyframes emerge-arc-middle {
  0% {
    opacity: 0;
    transform: translate(-50%, calc(-50% + 30px)) scale(0);
  }
  70% {
    opacity: 1;
    transform: translate(-50%, calc(-50% - 85px)) scale(1.1);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, calc(-50% - 75px)) scale(1);
  }
}

@keyframes emerge-arc-right {
  0% {
    opacity: 0;
    transform: translate(-50%, calc(-50% + 30px)) scale(0);
  }
  70% {
    opacity: 1;
    transform: translate(calc(-50% + 70px), calc(-50% - 50px)) scale(1.1);
  }
  100% {
    opacity: 1;
    transform: translate(calc(-50% + 55px), calc(-50% - 45px)) scale(1);
  }
}

.bottom-nav {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  height: 60px;
  border-radius: 20px;
  box-shadow:
    0 6px 6px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(0, 0, 0, 0.1);
  transform: translateX(-50%) translateY(250%);
  opacity: 0;
  transition:
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.5s,
    opacity 0.6s ease-out 0.5s;

  &.is-visible {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.bottom-nav__list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.bottom-nav__item {
  cursor: pointer;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.bottom-nav__icon {
  color: $nav-icon-inactive;
  transition:
    transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55),
    color 0.4s ease,
    opacity 0.3s ease;
  z-index: 3;
  position: relative;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.bottom-nav__item--active .bottom-nav__icon {
  color: $nav-icon-active;
  transform: translateY(-30px);
}

.bottom-nav__indicator {
  position: absolute;
  top: -25px;
  height: 50px;
  width: 50px;
  z-index: 0;
  transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  overflow: visible;
}

.bottom-nav__indicator-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background-color: $orb-background;
  border-radius: 50%;
  z-index: 2;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.speed-dial {
  position: absolute;
  top: 75%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
}

.speed-dial__button {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: $orb-background;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  color: var(--primary-color);
  opacity: 0;
  transform: translate(-50%, calc(-50% + 30px)) scale(0);
  transition:
    transform 0.3s ease-in-out,
    opacity 0.3s ease-in-out;
}

.speed-dial.is-visible {
  pointer-events: auto;
}

.speed-dial.is-visible .speed-dial__button {
  transition: none;
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  animation-fill-mode: forwards;
  animation-delay: calc(0.1s * var(--i));
}

.speed-dial.is-visible .speed-dial__button:nth-child(1) {
  animation-name: emerge-arc-left;
}
.speed-dial.is-visible .speed-dial__button:nth-child(2) {
  animation-name: emerge-arc-middle;
}
.speed-dial.is-visible .speed-dial__button:nth-child(3) {
  animation-name: emerge-arc-right;
}
</style>
