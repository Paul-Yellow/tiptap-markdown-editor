<template>
  <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
    <h2>基础用法</h2>
    <MarkdownEditor
      ref="editorRef"
      v-model="content"
      height="400px"
      placeholder="输入文字或按 / 使用命令..."
    />
    <div style="margin-top: 16px; display: flex; gap: 12px;">
      <button @click="showMarkdown">查看 Markdown</button>
      <button @click="showHtml">查看 HTML</button>
      <ExportPdfBtn :editor="editorInstance" />
      <ExportDocxBtn :editor="editorInstance" />
    </div>
    <pre v-if="output" style="background: #f5f5f5; padding: 16px; border-radius: 8px;">{{ output }}</pre>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MarkdownEditor, ExportPdfBtn, ExportDocxBtn } from '@paulyellow/tiptap-markdown-editor'

const content = ref(`# 你好，世界

这是一个基于 Vue 3 + TipTap 的 Markdown 编辑器。

## 图表示例

\`\`\`echarts
{
  "title": { "text": "销售趋势" },
  "tooltip": { "trigger": "axis" },
  "xAxis": {
    "type": "category",
    "data": ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月"]
  },
  "yAxis": {
    "type": "value"
  },
  "series": [{
    "data": [820, 932, 901, 934, 1290, 1330],
    "type": "line",
    "smooth": true
  }]
}
\`\`\`

## 饼图示例

\`\`\`echarts
{
  "title": { "text": "产品分类占比" },
  "tooltip": { "trigger": "item" },
  "series": [{
    "type": "pie",
    "radius": "70%",
    "data": [
      { "value": 1048, "name": "电子产品" },
      { "value": 735, "name": "服装" },
      { "value": 580, "name": "食品" },
      { "value": 484, "name": "家居" }
    ]
  }]
}
\`\`\`

## 功能说明

- 支持 Markdown 语法
- 支持 ECharts 图表
- 支持表格、列表等富文本功能
`)
const output = ref('')
const editorRef = ref(null)

// 获取编辑器实例
const editorInstance = computed(() => editorRef.value?.editor() || null)

function showMarkdown() {
  output.value = editorRef.value?.getMarkdown() || ''
}

function showHtml() {
  output.value = editorRef.value?.getHtml() || ''
}
</script>
