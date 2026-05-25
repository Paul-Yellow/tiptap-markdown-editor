<template>
  <div ref="menuRef" class="slash-menu">
    <div
      v-for="(item, idx) in filtered"
      :key="idx"
      :class="['slash-menu-item', { active: idx === selectedIndex }]"
      @click="selectItem(idx)"
    >
      <div class="slash-menu-item-icon">
        <Icon :name="item.icon" />
      </div>
      <div class="slash-menu-item-text">
        <div class="slash-menu-item-label">{{ item.label }}</div>
        <div class="slash-menu-item-desc">{{ item.desc }}</div>
      </div>
    </div>
    <div v-if="filtered.length === 0" class="slash-menu-empty">No results</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  editor: { type: Object, required: true },
  items: { type: Array, required: true },
  query: { type: String, default: '' }
})

const emit = defineEmits(['select'])

const menuRef = ref(null)
const selectedIndex = ref(0)

const filtered = computed(() => {
  const q = props.query.toLowerCase().trim()
  if (!q) return props.items
  return props.items.filter(item =>
    (item.label + ' ' + item.desc + ' ' + item.keywords).toLowerCase().includes(q)
  )
})

watch(filtered, () => { selectedIndex.value = 0 })

function selectItem(idx) {
  const item = filtered.value[idx]
  if (!item) return
  item.command(props.editor)
  emit('select')
}

function moveUp() {
  if (filtered.value.length === 0) return
  selectedIndex.value = (selectedIndex.value - 1 + filtered.value.length) % filtered.value.length
}

function moveDown() {
  if (filtered.value.length === 0) return
  selectedIndex.value = (selectedIndex.value + 1) % filtered.value.length
}

defineExpose({
  moveUp,
  moveDown,
  selectCurrent: () => selectItem(selectedIndex.value)
})
</script>

<style scoped>
.slash-menu {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  padding: 8px;
  max-height: 420px;
  overflow-y: auto;
  min-width: 300px;
}

.slash-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
}

.slash-menu-item:hover,
.slash-menu-item.active {
  background: #f0f0f0;
}

.slash-menu-item-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.slash-menu-item-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.slash-menu-item-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.slash-menu-empty {
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
</style>
