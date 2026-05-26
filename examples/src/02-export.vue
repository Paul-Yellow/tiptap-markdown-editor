<template>
  <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
    <h2>导出功能</h2>
    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
      <ExportPdfBtn v-if="editorInstance" :editor="editorInstance" />
      <ExportDocxBtn v-if="editorInstance" :editor="editorInstance" />
      <span v-else style="color: #999;">编辑器加载中...</span>
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
import { MarkdownEditor, ExportPdfBtn, ExportDocxBtn } from '@paulyellow/tiptap-markdown-editor'

const content = ref('# 文档标题\n\n这里是文档内容，可以导出为 PDF 或 Word 文档。')
const editorRef = ref(null)
const editorInstance = computed(() => editorRef.value?.editor() || null)
</script>
