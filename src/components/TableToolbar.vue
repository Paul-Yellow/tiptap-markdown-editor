<template>
  <div
    v-if="visible"
    ref="toolbarRef"
    class="table-cell-toolbar"
    :style="toolbarStyle"
    @mousedown.prevent
  >
    <!-- 触发图标 -->
    <div class="toolbar-trigger" @mouseenter="onIconEnter" @mouseleave="onIconLeave">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="15" y1="3" x2="15" y2="21"/>
      </svg>
    </div>

    <!-- 功能菜单 -->
    <div v-if="showMenu" class="toolbar-menu" @mouseenter="onMenuEnter" @mouseleave="onMenuLeave">
      <div class="menu-section">
        <div class="menu-title">列</div>
        <button @click.stop="addColumnBefore" class="menu-item">＋ 左侧插入列</button>
        <button @click.stop="addColumnAfter" class="menu-item">＋ 右侧插入列</button>
        <button @click.stop="deleteColumn" class="menu-item" :disabled="!canDeleteColumn">删除列</button>
      </div>
      <div class="menu-section">
        <div class="menu-title">行</div>
        <button @click.stop="addRowBefore" class="menu-item">＋ 上方插入行</button>
        <button @click.stop="addRowAfter" class="menu-item">＋ 下方插入行</button>
        <button @click.stop="deleteRow" class="menu-item" :disabled="!canDeleteRow">删除行</button>
      </div>
      <div class="menu-section">
        <div class="menu-title">表格</div>
        <button @click.stop="toggleHeader" class="menu-item">{{ hasHeader ? '移除表头' : '添加表头' }}</button>
        <button @click.stop="deleteTable" class="menu-item delete">删除表格</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  editor: { type: Object, required: true }
})

const toolbarRef = ref(null)
const visible = ref(false)
const showMenu = ref(false)
const toolbarStyle = ref({})
const canDeleteColumn = ref(false)
const canDeleteRow = ref(false)
const hasHeader = ref(false)

let hideTimer = null

function onIconEnter() {
  clearTimeout(hideTimer)
  showMenu.value = true
}

function onIconLeave() {
  hideTimer = setTimeout(() => {
    showMenu.value = false
  }, 100)
}

function onMenuEnter() {
  clearTimeout(hideTimer)
}

function onMenuLeave() {
  showMenu.value = false
}

function isInTable() {
  if (!props.editor) return null
  const { state, view } = props.editor
  const { $from } = state.selection

  let tableNode = null
  let cellNode = null
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d)
    if (!node) continue
    const name = node.type.name
    if (name === 'tableCell' || name === 'tableHeader') cellNode = node
    if (name === 'table') { tableNode = node; break }
  }
  if (tableNode && cellNode) {
    return { tableNode, cellNode, pos: $from.pos }
  }

  // DOM fallback - 用于空单元格等边界情况
  try {
    const domAtPos = view.domAtPos($from.pos)
    if (domAtPos) {
      let domNode = domAtPos.nodeType === 3 ? domAtPos.parentNode : domAtPos
      while (domNode && domNode !== view.dom) {
        if (domNode.tagName === 'TD' || domNode.tagName === 'TH') {
          return { tableNode: null, cellNode: null, pos: $from.pos }
        }
        if (domNode.tagName === 'TABLE') break
        domNode = domNode.parentNode
      }
    }
  } catch (e) { /* ignore */ }

  return null
}

function updatePosition() {
  const tableInfo = isInTable()
  if (!tableInfo) {
    visible.value = false
    showMenu.value = false
    return
  }

  visible.value = true

  const { tableNode } = tableInfo

  if (tableNode) {
    canDeleteColumn.value = tableNode.childCount > 1
    const firstRow = tableNode.firstChild
    canDeleteRow.value = firstRow ? firstRow.childCount > 1 : true

    hasHeader.value = false
    tableNode.forEach(row => {
      row.forEach(cell => {
        if (cell.type.name === 'tableHeader') {
          hasHeader.value = true
        }
      })
    })
  } else {
    canDeleteColumn.value = true
    canDeleteRow.value = true
    hasHeader.value = false
  }

  const { view } = props.editor
  const coords = view.coordsAtPos(tableInfo.pos)

  toolbarStyle.value = {
    position: 'fixed',
    left: `${coords.left - 8}px`,
    top: `${coords.top + 4}px`,
    zIndex: 1000
  }
}

function addColumnBefore() {
  showMenu.value = false
  props.editor.chain().focus().addColumnBefore().run()
}

function addColumnAfter() {
  showMenu.value = false
  props.editor.chain().focus().addColumnAfter().run()
}

function deleteColumn() {
  if (canDeleteColumn.value) {
    showMenu.value = false
    props.editor.chain().focus().deleteColumn().run()
  }
}

function addRowBefore() {
  showMenu.value = false
  props.editor.chain().focus().addRowBefore().run()
}

function addRowAfter() {
  showMenu.value = false
  props.editor.chain().focus().addRowAfter().run()
}

function deleteRow() {
  if (canDeleteRow.value) {
    showMenu.value = false
    props.editor.chain().focus().deleteRow().run()
  }
}

function toggleHeader() {
  showMenu.value = false
  props.editor.chain().focus().toggleHeaderRow().run()
}

function deleteTable() {
  showMenu.value = false
  props.editor.chain().focus().deleteTable().run()
}

onMounted(() => {
  props.editor?.on('transaction', updatePosition)
  props.editor?.on('selectionUpdate', updatePosition)
})

onBeforeUnmount(() => {
  props.editor?.off('transaction', updatePosition)
  props.editor?.off('selectionUpdate', updatePosition)
  clearTimeout(hideTimer)
})
</script>

<style scoped>
.table-cell-toolbar {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.toolbar-trigger {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.15s;
  opacity: 0.7;
  flex-shrink: 0;
}

.toolbar-trigger:hover {
  background: #f3f4f6;
  color: #3b82f6;
  opacity: 1;
  border-color: #3b82f6;
}

.toolbar-menu {
  position: absolute;
  left: 28px;
  top: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 8px;
  z-index: 1001;
  min-width: 160px;
}

.menu-section {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
}

.menu-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.menu-title {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  text-align: left;
  transition: all 0.1s;
}

.menu-item:hover:not(:disabled) {
  background: #f3f4f6;
  color: #3b82f6;
}

.menu-item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: #9ca3af;
}

.menu-item.delete {
  color: #dc2626;
}

.menu-item.delete:hover {
  background: #fef2f2;
}
</style>
