# tiptap-markdown-editor

一个基于 Vue 3 + TipTap 的所见即所得 Markdown 编辑器，支持 ECharts 图表、表格、Slash 命令菜单等功能。

## 功能特性

- **Slash 命令菜单** - 输入 `/` 快速切换块类型（标题、列表、引用、代码块等）
- **块级添加按钮** - 鼠标悬停显示 `+` 按钮快速插入新块
- **富文本工具栏** - 选中文字后自动显示格式化工具栏（字体、颜色、对齐等）
- **表格编辑** - 支持插入表格、行列增删
- **ECharts 图表** - 支持代码块渲染图表和独立图表节点
- **Markdown 输入规则** - `#` 创建标题、`-` 创建列表、`>` 创建引用
- **导出 PDF / DOCX** - 一键导出文档
- **中文默认字体** - 正文默认仿宋、一级标题默认黑体

## 安装

```bash
npm install tiptap-markdown-editor
# 或
yarn add tiptap-markdown-editor
# 或
pnpm add tiptap-markdown-editor
```

## 快速开始

```vue
<template>
  <MarkdownEditor
    ref="editorRef"
    v-model="content"
    height="600px"
    placeholder="开始编辑..."
  />
</template>

<script setup>
import { ref } from 'vue'
import { MarkdownEditor } from 'tiptap-markdown-editor'
import 'tiptap-markdown-editor/style.css'

const content = ref('# 你好，世界')
const editorRef = ref(null)

// 获取 Markdown 内容
const getMd = () => editorRef.value?.getMarkdown()

// 获取 HTML 内容
const getHtml = () => editorRef.value?.getHtml()

// 获取 TipTap Editor 实例
const getEditor = () => editorRef.value?.editor()
</script>
```

## 组件 API

### MarkdownEditor

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `String` | `''` | Markdown 内容（v-model） |
| `height` | `String \| Number` | `'500px'` | 编辑器高度 |
| `placeholder` | `String` | `''` | 占位文字 |
| `previewOnly` | `Boolean` | `false` | 只读预览模式 |

#### 暴露的方法

通过 `ref` 调用：

| 方法名 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `getMarkdown()` | - | `String` | 获取 Markdown 内容 |
| `getHtml()` | - | `String` | 获取 HTML 内容 |
| `editor()` | - | `Editor` | 获取 TipTap Editor 实例 |
| `setEditable(editable)` | `editable: Boolean` | - | 动态设置编辑/只读状态 |
| `setContent(content)` | `content: String` | - | 设置编辑器内容 |
| `focus()` | - | - | 聚焦编辑器 |
| `clearContent()` | - | - | 清空编辑器内容 |

### ExportPdfBtn

```vue
<template>
  <ExportPdfBtn :editor="editorRef?.editor()" />
</template>
```

| 属性名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `editor` | `Object` | 是 | TipTap Editor 实例 |

### ExportDocxBtn

```vue
<template>
  <ExportDocxBtn :editor="editorRef?.editor()" />
</template>
```

| 属性名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `editor` | `Object` | 是 | TipTap Editor 实例 |

## 完整导出列表

```javascript
// 组件
import { MarkdownEditor, ExportPdfBtn, ExportDocxBtn } from 'tiptap-markdown-editor'

// 扩展组件
import {
  EChartsNode,
  CodeBlockWithCharts,
  MarkdownInputRules,
  SlashMenuExtension,
  BlockButtonsExtension,
  initBlockButtons,
  updateBlockButtons,
  Table,
  TableRow,
  TableHeader,
  TableCell,
  FontFamily,
  TextStyle,
  Color,
  TextAlign,
  BulletList,
  OrderedList,
  ListItem
} from 'tiptap-markdown-editor'

// 工具函数
import { menuItems, slashAction, plusAction, exportToPdf } from 'tiptap-markdown-editor'
```

## 自定义 Slash 菜单

```javascript
import { MarkdownEditor, menuItems, slashAction, plusAction } from 'tiptap-markdown-editor'

// menuItems 可自定义或扩展
// 每个菜单项格式：
// {
//   label: '标题 1',
//   desc: '大章节标题',
//   icon: 'h1',
//   keywords: '标题 headings h1',
//   command: (editor) => slashAction(editor, 'setHeading', { level: 1 }),
//   plusCommand: (editor) => plusAction(editor, 'setHeading', { level: 1 })
// }
```

## 导出工具

```javascript
import { exportToPdf } from 'tiptap-markdown-editor'

// 直接调用导出
exportToPdf(editorDomElement, 'document.pdf')
```

## 依赖要求

本组件需要以下 peer dependencies，请确保在项目中安装：

```json
{
  "@tiptap/core": "^3.22.4",
  "@tiptap/extension-text-style": "^3.22.4",
  "@tiptap/vue-3": "^3.22.4",
  "vue": "^3.5.0"
}
```

## License

MIT
