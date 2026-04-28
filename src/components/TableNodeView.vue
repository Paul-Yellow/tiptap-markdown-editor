<template>
  <NodeViewWrapper class="table-node-wrapper" :class="{ 'selected': selected }">
    <div class="table-controls" v-if="selected || hovered">
      <div class="control-group">
        <button @click.stop="addColumnBefore" title="左侧插入列">＋ 左</button>
        <button @click.stop="addColumnAfter" title="右侧插入列">＋ 右</button>
        <button @click.stop="deleteColumn" title="删除列" :disabled="canDeleteColumn">删除列</button>
      </div>
      <div class="control-group">
        <button @click.stop="addRowBefore" title="上方插入行">＋ 上</button>
        <button @click.stop="addRowAfter" title="下方插入行">＋ 下</button>
        <button @click.stop="deleteRow" title="删除行" :disabled="canDeleteRow">删除行</button>
      </div>
      <div class="control-group">
        <button @click.stop="deleteTable" title="删除表格" class="delete-btn">删除表格</button>
      </div>
    </div>
    <table :contentEditable="false">
      <NodeViewContent as="tbody" />
    </table>
  </NodeViewWrapper>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const selected = ref(false)
const hovered = ref(false)
const canDeleteColumn = ref(false)
const canDeleteRow = ref(false)

function updateDeleteState() {
  const { state } = props.editor
  const table = state.selection.$head.node(-3)
  if (table) {
    canDeleteColumn.value = table.childCount <= 1
    const firstRow = table.firstChild
    canDeleteRow.value = firstRow ? firstRow.childCount <= 1 : true
  }
}

function addColumnBefore() {
  props.editor.chain().focus().addColumnBefore(props.getPos()).run()
}

function addColumnAfter() {
  props.editor.chain().focus().addColumnAfter(props.getPos()).run()
}

function deleteColumn() {
  if (!canDeleteColumn.value) {
    props.editor.chain().focus().deleteColumn(props.getPos()).run()
  }
}

function addRowBefore() {
  props.editor.chain().focus().addRowBefore(props.getPos()).run()
}

function addRowAfter() {
  props.editor.chain().focus().addRowAfter(props.getPos()).run()
}

function deleteRow() {
  if (!canDeleteRow.value) {
    props.editor.chain().focus().deleteRow(props.getPos()).run()
  }
}

function deleteTable() {
  props.editor.chain().focus().deleteTable(props.getPos()).run()
}

onMounted(() => {
  props.editor.on('selectionUpdate', updateDeleteState)
  updateDeleteState()
})

onBeforeUnmount(() => {
  props.editor.off('selectionUpdate', updateDeleteState)
})
</script>

<style scoped>
.table-node-wrapper {
  position: relative;
  margin: 16px 0;
}

.table-node-wrapper.selected {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

.table-controls {
  position: absolute;
  top: -50px;
  left: 0;
  display: flex;
  gap: 8px;
  background: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.control-group {
  display: flex;
  gap: 4px;
  padding-right: 8px;
  border-right: 1px solid #e5e7eb;
}

.control-group:last-child {
  border-right: none;
  padding-right: 0;
}

.control-group button {
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.control-group button:hover:not(:disabled) {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.control-group button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-group .delete-btn:hover:not(:disabled) {
  background: #ef4444;
  border-color: #ef4444;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

table td, table th {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  min-width: 80px;
}

table th {
  background: #f9fafb;
  font-weight: 600;
}

table td:focus, table th:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}
</style>
