<template>
  <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
    <h2>导出功能</h2>
    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
      <ExportPdfBtn :editor="editorInstance" />
      <ExportDocxBtn :editor="editorInstance" />
    </div>
    <MarkdownEditor
      ref="editorRef"
      v-model="content"
      height="400px"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MarkdownEditor, ExportPdfBtn, ExportDocxBtn } from '../../src/entry'

const content = ref('# 文档标题\n\n这里是文档内容，可以导出为 PDF 或 Word 文档。')
const editorRef = ref(null)
const editorInstance = computed(() => editorRef.value?.editor())
</script>
