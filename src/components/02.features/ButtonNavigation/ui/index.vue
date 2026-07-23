<script setup lang="ts">
import { useChatsStore } from '@/components/00.shared/stores/chats'
import { useAuthStore } from '../../Authentication/model/auth'

interface NavItem {
  id: string
  icon: string
  label: string
  routeName: string[]
}

const auth = useAuthStore()
const chatsStore = useChatsStore()
const { unreadTotal } = storeToRefs(chatsStore)
const activeItemId = ref<string>('')
const itemRefs = shallowRef<HTMLElement[]>([])
const navList = ref<HTMLUListElement | null>(null)
const indicatorStyle = ref({})
const route = useRoute()
const router = useRouter()

const navItems: NavItem[] = ([
  {
    id: 'Map',
    icon: 'line-md:map-marker-alt-loop',
    label: 'Карта',
    routeName: ['home-map'],
  },
  {
    id: 'Chatbox',
    icon: 'line-md:chat-bubble',
    label: 'Чаты',
    routeName: ['chats', 'chat-room'],
  },
  {
    id: 'Person',
    icon: 'line-md:account',
    label: 'Профиль',
    routeName: ['login', 'profile'],
  },
])

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

function handleNavClick(item: NavItem) {
  if (item.id === 'Person') {
    const targetRoute = auth.isAuthenticated ? 'profile' : 'login'
    router.push({ name: targetRoute })
  }
  else {
    router.push({ name: item.routeName[0] })
  }
}

watch(
  () => route.name,
  (newName) => {
    const index = navItems.findIndex(item => item.routeName.includes(newName as string))
    if (index !== -1) {
      activeItemId.value = navItems[index].id
      nextTick(() => updateIndicatorPosition(index))
    }
  },
  { immediate: true },
)

function handleResize() {
  const index = navItems.findIndex(item => item.id === activeItemId.value)
  if (index !== -1)
    updateIndicatorPosition(index)
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<template>
  <u-glass-wrapper
    :scale="40"
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
        @click="handleNavClick(item)"
      >
        <span class="bottom-nav__icon-wrap">
          <u-icon
            :icon="item.icon"
            height="24"
            width="24"
            class="bottom-nav__icon"
          />
          <u-badge
            v-if="item.id === 'Chatbox'"
            :count="unreadTotal"
            class="bottom-nav__badge"
          />
        </span>
        <span class="bottom-nav__label">{{ item.label }}</span>
      </li>
    </ul>
  </u-glass-wrapper>
</template>

<style lang="scss" scoped>
$orb-background: var(--orb-background);
$nav-icon-inactive: var(--nav-icon-inactive);
$nav-icon-active: var(--nav-icon-active);

.bottom-nav {
  position: fixed;
  bottom: calc(40px + var(--safe-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  height: 70px;
  border-radius: 28px;
  box-shadow:
    rgba(255, 255, 255, 0.06) 0px 1px 0px inset,
    rgba(0, 0, 0, 0.35) 0px 10px 30px;

  /* transform: translateX(-50%) translateY(250%);
   opacity: 0; */
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
  flex-direction: column;
  align-items: center;
}

.bottom-nav__icon-wrap {
  position: relative;
  display: inline-flex;
}

.bottom-nav__badge {
  position: absolute;
  top: -4px;
  left: 14px;
}

.bottom-nav__icon,
.bottom-nav__label {
  color: $nav-icon-inactive;
  transition:
    transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55),
    color 0.4s ease,
    opacity 0.3s ease;
}

.bottom-nav__label {
  font-size: 10px;
  font-weight: 600;
}

.bottom-nav__item--active {
  .bottom-nav__icon,
  .bottom-nav__label {
    color: $nav-icon-active;
  }
}

.bottom-nav__indicator {
  position: absolute;
  z-index: 0;
  transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  overflow: visible;
}

.bottom-nav__indicator-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 3px;
  border-radius: 2px;
  background-color: $orb-background;
  z-index: 2;
}
</style>
