<template>
  <div style="max-width:1200px;margin:24px auto;padding:0 16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h2 style="margin:0;">Markdown Editor + ECharts</h2>
      <div>
        <ExportPdfBtn :editor="editorRef?.editor?.()" />
        <ExportDocxBtn :editor="editorRef?.editor?.()" />
      </div>
    </div>
    <MarkdownEditor ref="editorRef" v-model="md" height="600px" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MarkdownEditor from './components/MarkdownEditor/index.vue'
import ExportPdfBtn from './components/ExportPdfBtn.vue'
import ExportDocxBtn from './components/ExportDocxBtn.vue'

const editorRef = ref(null)

const md = ref(`# Markdown Editor 演示

这是一个基于 **Vue 3** + **Tiptap** 的所见即所得 Markdown 编辑器。

## 基础功能

- 支持富文本编辑
- 工具栏快捷操作
- Markdown 输入输出

## ECharts 图表示例

选中图表节点后点击「编辑图表」按钮可修改配置。

\`\`\`echarts
{
  "title": { "text": "周销量统计" },
  "tooltip": {},
  "xAxis": { "type": "category", "data": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] },
  "yAxis": {},
  "series": [{
    "name": "销量",
    "type": "bar",
    "data": [120, 200, 150, 80, 70, 110, 130],
    "itemStyle": { "color": "#5470c6" }
  }]
}
\`\`\`
\`\`\`echarts
{
  "title": { "text": "访问来源" },
  "tooltip": { "trigger": "item" },
  "legend": { "bottom": "5%", "left": "center" },
  "series": [{
    "type": "pie",
    "radius": ["40%", "70%"],
    "data": [
      { "value": 1048, "name": "搜索引擎" },
      { "value": 735, "name": "直接访问" },
      { "value": 580, "name": "邮件营销" },
      { "value": 484, "name": "联盟广告" }
    ]
  }]
}
\`\`\`
`)
</script>
