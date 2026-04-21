<template>
  <button class="export-btn" @click="handleExport" :disabled="exporting">
    <span v-if="exporting">导出中...</span>
    <span v-else>导出 DOCX</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { exportToDocX } from '../utils/exportDocx'

const props = defineProps({
  editor: { type: Object, required: true }
})

const exporting = ref(false)

async function handleExport() {
  if (!props.editor) return

  exporting.value = true

  try {
    // 获取编辑器的 DOM 元素
    const editorDom = props.editor.view?.dom
    if (!editorDom) {
      alert('编辑器未准备好')
      return
    }

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `markdown-export-${timestamp}.docx`

    await exportToDocX(editorDom, filename)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.export-btn {
  background: #10b981;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
  margin-left: 8px;
}

.export-btn:hover:not(:disabled) {
  background: #059669;
}

.export-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}
</style>
