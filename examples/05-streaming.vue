<template>
  <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
    <h2>流式输出示例</h2>
    <div style="margin-bottom: 16px;">
      <button @click="startStream" :disabled="isStreaming">
        {{ isStreaming ? '流式输出中...' : '开始流式输出' }}
      </button>
      <button @click="stopStream" :disabled="!isStreaming">停止</button>
    </div>
    <MarkdownEditor
      ref="editorRef"
      v-model="content"
      :streaming="true"
      height="400px"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MarkdownEditor } from '../../src/entry'

const content = ref('')
const editorRef = ref(null)
const isStreaming = ref(false)

const demoText = `# AI 流式输出示例

这是一个模拟 AI 流式输出的示例。

## 什么是流式输出？

流式输出是指内容逐步生成的过程，就像 AI 模型逐字生成回答一样。

## 特点

- 启用 \`streaming\` 属性后，编辑器会增量更新而非全量替换
- 避免了频繁全量替换导致的性能问题
- 支持打字机效果
`

let streamIndex = 0
let streamTimer = null

function startStream() {
  isStreaming.value = true
  content.value = ''
  streamIndex = 0

  // 模拟逐字符输出
  const chars = demoText.split('')

  streamTimer = setInterval(() => {
    if (streamIndex >= chars.length) {
      stopStream()
      return
    }
    // 每次追加 1-3 个字符模拟流式输出
    const chunk = chars.slice(streamIndex, streamIndex + Math.floor(Math.random() * 3) + 1).join('')
    content.value += chunk
    streamIndex += chunk.length
  }, 30)
}

function stopStream() {
  isStreaming.value = false
  if (streamTimer) {
    clearInterval(streamTimer)
    streamTimer = null
  }
}
</script>
