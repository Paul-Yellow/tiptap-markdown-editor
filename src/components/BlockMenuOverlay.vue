<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="overlayRef"
      class="block-menu-overlay"
      :style="{ top: pos.y + 'px', left: pos.x + 'px' }"
      @mousedown.prevent
    >
      <SlashMenu
        ref="menuRef"
        :editor="editor"
        :items="items"
        :query="query"
        @select="close"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import SlashMenu from './SlashMenu/SlashMenu.vue'

const props = defineProps({
  editor: { type: Object, required: true },
  items: { type: Array, required: true }
})

const visible = ref(false)
const pos = ref({ x: 0, y: 0 })
const query = ref('')
const menuRef = ref(null)
const overlayRef = ref(null)

function open(x, y, q = '') {
  query.value = q
  visible.value = true

  // 确保菜单不超出视口边界
  const menuWidth = 300
  const menuHeight = 420
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = x
  let top = y

  if (left + menuWidth > viewportWidth - 10) {
    left = viewportWidth - menuWidth - 10
  }
  if (top + menuHeight > viewportHeight - 10) {
    top = viewportHeight - menuHeight - 10
  }

  pos.value = { x: left, y: top }
}

function close() {
  visible.value = false
}

defineExpose({ open, close })

watch(visible, (v) => {
  if (v) {
    setTimeout(() => {
      document.addEventListener('mousedown', onOutsideClick)
    }, 0)
  } else {
    document.removeEventListener('mousedown', onOutsideClick)
  }
})

function onOutsideClick(e) {
  if (overlayRef.value && !overlayRef.value.contains(e.target)) {
    close()
  }
}
</script>

<style>
.block-menu-overlay {
  position: fixed;
  z-index: 9999;
}
</style>
