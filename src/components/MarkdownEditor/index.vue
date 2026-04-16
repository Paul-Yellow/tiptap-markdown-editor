<template>
  <div class="markdown-editor" v-if="editor">
    <!-- Toolbar -->
    <div class="editor-toolbar" v-if="!previewOnly">
      <button
        v-for="btn in toolbarButtons"
        :key="btn.action"
        :class="{ 'is-active': btn.isActive?.() }"
        @click="btn.action"
        :title="btn.title"
      >
        {{ btn.label }}
      </button>
      <div class="toolbar-divider"></div>
      <button @click="insertECharts" title="插入图表">图表</button>
    </div>

    <!-- Editor -->
    <EditorContent :editor="editor" />

    <!-- Chart edit dialog -->
    <ChartEditDialog ref="chartDialog" @save="handleChartSave" />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, watch, onMounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { EChartsNode } from '../../EChartsNode'
import ChartEditDialog from '../ChartEditDialog.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  height: { type: [String, Number], default: '500px' },
  placeholder: { type: String, default: '' },
  previewOnly: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const chartDialog = ref(null)
let editingNodePos = null
let isMounted = false
let lastEmittedValue = ''

function handleChartEdit(chartData, nodePos) {
  editingNodePos = nodePos
  chartDialog.value?.open(chartData)
}

const editor = useEditor({
  contentType: 'markdown',
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] }
    }),
    Markdown,
    EChartsNode.configure({ onEdit: handleChartEdit })
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-editor-content',
      style: `min-height: ${props.height}; padding: 16px; outline: none;`
    }
  },
  onUpdate: ({ editor }) => {
    const md = editor.storage.markdown?.getMarkdown?.() || ''
    lastEmittedValue = md
    emit('update:modelValue', md)
    emit('change', md)
  }
})

watch(
  () => props.modelValue,
  (val) => {
    // Skip if this update came from our own editor
    if (val === lastEmittedValue) return
    if (!isMounted) return
    if (editor.value) {
      editor.value.commands.setContent(val)
    }
  }
)

onMounted(() => {
  isMounted = true
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const toolbarButtons = [
  {
    label: 'B',
    title: '加粗',
    action: () => editor.value.chain().focus().toggleBold().run(),
    isActive: () => editor.value.isActive('bold')
  },
  {
    label: 'I',
    title: '斜体',
    action: () => editor.value.chain().focus().toggleItalic().run(),
    isActive: () => editor.value.isActive('italic')
  },
  {
    label: 'S',
    title: '删除线',
    action: () => editor.value.chain().focus().toggleStrike().run(),
    isActive: () => editor.value.isActive('strike')
  },
  {
    label: 'H1',
    title: '标题1',
    action: () => editor.value.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: () => editor.value.isActive('heading', { level: 1 })
  },
  {
    label: 'H2',
    title: '标题2',
    action: () => editor.value.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: () => editor.value.isActive('heading', { level: 2 })
  },
  {
    label: 'H3',
    title: '标题3',
    action: () => editor.value.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: () => editor.value.isActive('heading', { level: 3 })
  },
  {
    label: '• List',
    title: '无序列表',
    action: () => editor.value.chain().focus().toggleBulletList().run(),
    isActive: () => editor.value.isActive('bulletList')
  },
  {
    label: '1. List',
    title: '有序列表',
    action: () => editor.value.chain().focus().toggleOrderedList().run(),
    isActive: () => editor.value.isActive('orderedList')
  },
  {
    label: '> Quote',
    title: '引用',
    action: () => editor.value.chain().focus().toggleBlockquote().run(),
    isActive: () => editor.value.isActive('blockquote')
  },
  {
    label: '</>',
    title: '代码块',
    action: () => editor.value.chain().focus().toggleCodeBlock().run(),
    isActive: () => editor.value.isActive('codeBlock')
  },
  {
    label: '---',
    title: '分隔线',
    action: () => editor.value.chain().focus().setHorizontalRule().run()
  }
]

function insertECharts() {
  const defaultOption = {
    title: { text: '示例图表' },
    xAxis: { type: 'category', data: ['A', 'B', 'C'] },
    yAxis: {},
    series: [{ type: 'bar', data: [10, 20, 30] }]
  }
  editor.value.chain().focus().setEChartsChart(defaultOption).run()
}

function handleChartSave(newJson) {
  if (editingNodePos !== null && editor.value) {
    editor.value
      .chain()
      .focus()
      .setNodeSelection(editingNodePos)
      .updateAttributes('echartsChart', { chartData: newJson })
      .run()
  }
}

// When a chart node is selected, store its position for editing
watch(
  () => editor.value?.state.selection,
  (selection) => {
    if (selection?.node && selection.node.type.name === 'echartsChart') {
      editingNodePos = selection.from
    }
  }
)

// Expose methods
defineExpose({
  getMarkdown: () => editor.value?.storage.markdown?.getMarkdown?.() || '',
  getHtml: () => editor.value?.getHTML() || '',
  editor: () => editor.value
})
</script>

<style scoped>
.markdown-editor {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px;
  border-bottom: 1px solid #ddd;
  background: #f8f9fa;
}

.editor-toolbar button {
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}

.editor-toolbar button:hover {
  background: #e9ecef;
}

.editor-toolbar button.is-active {
  background: #3b82f6;
  color: #fff;
}

.toolbar-divider {
  width: 1px;
  background: #ddd;
  margin: 4px 6px;
}

:deep(.tiptap-editor-content) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

:deep(.tiptap-editor-content p) {
  margin: 0.5em 0;
}

:deep(.tiptap-editor-content h1),
:deep(.tiptap-editor-content h2),
:deep(.tiptap-editor-content h3) {
  margin: 1em 0 0.5em;
  line-height: 1.3;
}

:deep(.tiptap-editor-content blockquote) {
  border-left: 3px solid #ddd;
  padding-left: 1em;
  margin: 1em 0;
  color: #666;
}

:deep(.tiptap-editor-content pre) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
}

:deep(.tiptap-editor-content code) {
  background: #f6f8fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

:deep(.tiptap-editor-content ul),
:deep(.tiptap-editor-content ol) {
  padding-left: 2em;
  margin: 0.5em 0;
}

:deep(.tiptap-editor-content hr) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 1.5em 0;
}

:deep(.tiptap-editor-content:focus) {
  outline: none;
}
</style>
