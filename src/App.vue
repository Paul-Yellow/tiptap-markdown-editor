<template>
  <div style="max-width:1200px;margin:24px auto;padding:0 16px;">
    <h2 style="margin-bottom:16px;">Markdown Editor (Tiptap) + ECharts</h2>
    <MarkdownEditor v-model="md" height="600px" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MarkdownEditor from './components/MarkdownEditor/index.vue'

const md = ref(`# Markdown Editor 演示

这是一个基于 **Vue 3** + **Tiptap** 的所见即所得 Markdown 编辑器。

## 基础功能

- 支持富文本编辑
- 工具栏快捷操作
- Markdown 输入输出

## ECharts 图表示例

选中图表节点后点击「编辑图表」按钮可修改配置。
`)
</script>
