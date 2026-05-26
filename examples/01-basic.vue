<template>
  <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
    <h2>基础用法</h2>
    <MarkdownEditor
      ref="editorRef"
      v-model="content"
      height="400px"
      placeholder="输入文字或按 / 使用命令..."
    />
    <div style="margin-top: 16px;">
      <button @click="showMarkdown">查看 Markdown</button>
      <button @click="showHtml">查看 HTML</button>
    </div>
    <pre v-if="output" style="background: #f5f5f5; padding: 16px; border-radius: 8px;">{{ output }}</pre>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MarkdownEditor } from '../src/entry'

const content = ref('# 你好，世界\n\n这是一个基于 Vue 3 + TipTap 的 Markdown 编辑器。')
const output = ref('')
const editorRef = ref(null)

function showMarkdown() {
  output.value = editorRef.value?.getMarkdown() || ''
}

function showHtml() {
  output.value = editorRef.value?.getHtml() || ''
}
</script>
