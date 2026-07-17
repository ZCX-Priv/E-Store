<script setup lang="ts">
// 主内容容器 - 根据当前视图切换
import { defineAsyncComponent } from 'vue'
import { useUiStore } from '@/stores/ui'
import InventoryView from '@/components/inventory/InventoryView.vue'
import ItemFormModal from '@/components/inventory/ItemFormModal.vue'

// 设置页异步加载：其依赖的 xlsx（约 280KB gzip）随之拆为独立 chunk，
// 不进入首屏 entry，弱网下仅在进入设置页时才下载
const SettingsView = defineAsyncComponent(
  () => import('@/components/settings/SettingsView.vue'),
)

const uiStore = useUiStore()
</script>

<template>
  <main class="main-content">
    <!-- 库存视图 -->
    <InventoryView
      v-if="uiStore.currentView === 'inventory'"
      @add="uiStore.openItemForm()"
      @edit="uiStore.openItemForm($event)"
    />

    <!-- 设置视图 -->
    <SettingsView v-else-if="uiStore.currentView === 'settings'" />

    <!-- 库存项表单模态框 -->
    <ItemFormModal
      :show="uiStore.itemFormOpen"
      :edit-item="uiStore.editingItem"
      @close="uiStore.closeItemForm"
      @saved="uiStore.closeItemForm"
    />
  </main>
</template>

<style scoped>
.main-content {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}
</style>
