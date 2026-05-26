<template>
  <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
    <h2>只读预览模式</h2>
    <MarkdownEditor
      v-model="content"
      height="400px"
      :preview-only="true"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MarkdownEditor } from '../src/entry'

const content = ref(`# 只读模式示例

这是一个只读预览的编辑器。

## 二级标题

正文内容使用 **粗体**、*斜体* 和 ~~删除线~~。

- 列表项 1
- 列表项 2
- 列表项 3

> 这是一段引用文字
`)
</script>
