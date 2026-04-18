<template>
  <div v-if="visible" class="format-toolbar" :style="toolbarStyle" @mousedown.prevent>
    <button
      v-for="(btn, idx) in buttons"
      :key="idx"
      :class="['toolbar-btn', { active: isActive(btn.name) }]"
      :title="btn.label"
      @click="toggleFormat(btn.name)"
    >
      <span class="toolbar-icon">{{ btn.icon }}</span>
    </button>
    <div class="toolbar-divider"></div>
    <input
      v-if="showLinkInput"
      ref="linkInputRef"
      v-model="linkUrl"
      class="link-input"
      placeholder="输入链接..."
      @keydown.enter="applyLink"
      @keydown.escape="cancelLink"
    />
    <button
      v-else
      class="toolbar-btn"
      :class="{ active: hasLink }"
      title="链接"
      @click="toggleLinkInput"
    >
      <span class="toolbar-icon">🔗</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  editor: { type: Object, required: true }
})

const visible = ref(false)
const toolbarStyle = ref({})
const showLinkInput = ref(false)
const linkUrl = ref('')
const linkInputRef = ref(null)

const buttons = [
  { name: 'bold', icon: 'B', label: '粗体' },
  { name: 'italic', icon: 'I', label: '斜体' },
  { name: 'underline', icon: 'U', label: '下划线' },
  { name: 'strike', icon: 'S', label: '删除线' },
  { name: 'code', icon: '</>', label: '代码' }
]

function isActive(format) {
  return props.editor?.isActive(format) || false
}

const hasLink = computed(() => props.editor?.isActive('link') || false)

function toggleFormat(format) {
  props.editor?.chain().focus().toggleMark(format).run()
}

function toggleLinkInput() {
  if (hasLink.value) {
    // 移除链接
    props.editor?.chain().focus().unsetLink().run()
  } else {
    showLinkInput.value = true
    linkUrl.value = ''
    setTimeout(() => linkInputRef.value?.focus(), 50)
  }
}

function applyLink() {
  if (linkUrl.value.trim()) {
    props.editor?.chain().focus().setLink({ href: linkUrl.value.trim() }).run()
  }
  showLinkInput.value = false
  linkUrl.value = ''
}

function cancelLink() {
  showLinkInput.value = false
  linkUrl.value = ''
}

function updatePosition() {
  if (!props.editor) return

  const { from, to } = props.editor.state.selection
  if (from === to) {
    // 无选中，隐藏工具栏
    visible.value = false
    showLinkInput.value = false
    return
  }

  // 检查是否在代码块内
  const { $from } = props.editor.state.selection
  if ($from.parent.type.name === 'codeBlock') {
    visible.value = false
    return
  }

  visible.value = true

  const { view } = props.editor
  const start = view.coordsAtPos(from)
  const end = view.coordsAtPos(to)

  // 计算工具栏位置（选区上方居中）
  const toolbarWidth = 200
  let left = (start.left + end.left) / 2 - toolbarWidth / 2
  let top = start.top - 45

  // 确保不超出视口边界
  const viewportWidth = window.innerWidth
  if (left < 10) left = 10
  if (left + toolbarWidth > viewportWidth - 10) left = viewportWidth - toolbarWidth - 10

  // 如果上方空间不足，放在下方
  if (top < 10) {
    top = end.bottom + 10
  }

  toolbarStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 1000
  }
}

onMounted(() => {
  props.editor?.on('transaction', updatePosition)
})

onBeforeUnmount(() => {
  props.editor?.off('transaction', updatePosition)
})

watch(() => props.editor, (newEditor, oldEditor) => {
  if (oldEditor) {
    oldEditor.off('transaction', updatePosition)
  }
  if (newEditor) {
    newEditor.on('transaction', updatePosition)
  }
})
</script>

<style scoped>
.format-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 4px 8px;
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.toolbar-btn:hover {
  background: #f0f0f0;
}

.toolbar-btn.active {
  background: #e0e0e0;
  color: #3b82f6;
}

.toolbar-icon {
  font-weight: 600;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e0e0e0;
  margin: 0 4px;
}

.link-input {
  width: 150px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 13px;
  outline: none;
}

.link-input:focus {
  border-color: #3b82f6;
}
</style>