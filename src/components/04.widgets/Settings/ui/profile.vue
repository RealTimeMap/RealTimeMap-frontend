<script setup lang="ts">
import type { User } from '@/components/00.shared/services/user/index.type'

defineProps<{
  user: User | null
}>()
</script>

<template>
  <div
    class="profile"
  >
    <u-avatar
      :size="46"
      rounded
      :alt-text="user?.username"
      :src="user?.avatar"
    />
    <div class="profile-name">
      <span class="name">{{ user?.username }}</span>
      <span class="tag">{{ user?.tag }} · аккаунт</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile {
  display: flex;
  gap: 12px;
  width: 100%;
  @include glass-panel(18px, 14px, false, false);
}

.profile-name {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 2px;

  .name {
    @include value-text(16px, var(--text-color), 600);
  }

  .tag {
    @include label-text(12px, none);
  }
}
</style>
