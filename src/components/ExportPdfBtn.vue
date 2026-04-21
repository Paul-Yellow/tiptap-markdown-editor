<template>
  <button class="export-btn" @click="handleExport" :disabled="exporting">
    <span v-if="exporting">导出中...</span>
    <span v-else>导出 PDF</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { exportToPdf } from '../utils/exportPdf'

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

    // 生成文件名（基于时间）
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `markdown-export-${timestamp}.pdf`

    await exportToPdf(editorDom, filename)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.export-btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.export-btn:hover:not(:disabled) {
  background: #2563eb;
}

.export-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}
</style>