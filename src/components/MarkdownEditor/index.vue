<template>
  <div class="markdown-editor" v-if="editor">
    <!-- Editor -->
    <div ref="editorContainerRef" class="editor-container">
      <EditorContent :editor="editor" />
    </div>

    <!-- Slash command menu (triggered by "/") -->
    <Teleport to="body">
      <div
        v-if="slashMenuVisible"
        ref="slashMenuRef"
        class="slash-menu-popup"
        :style="slashMenuStyle"
        @mousedown.prevent
      >
        <SlashMenu
          ref="slashMenuComponentRef"
          :editor="editor"
          :items="menuItems"
          :query="slashMenuQuery"
          @select="onSlashMenuSelect"
        />
      </div>
    </Teleport>

    <!-- Block "+" button overlay menu -->
    <BlockMenuOverlay
      ref="blockMenuOverlayRef"
      :editor="editor"
      :items="plusMenuItems"
    />

    <!-- Format toolbar (selection-based) -->
    <FormatToolbar :editor="editor" />

    <!-- Table toolbar (when table is selected) -->
    <TableToolbar :editor="editor" />

    <!-- Chart edit dialog -->
    <ChartEditDialog ref="chartDialog" @save="handleChartSave" />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, watch, onMounted, computed } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableRow, TableHeader, TableCell } from '../../extensions/Table'
import { FontFamily, TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-text-style/color'
import TextAlign from '@tiptap/extension-text-align'
import { BulletList, OrderedList, ListItem } from '@tiptap/extension-list'
import { EChartsNode } from '../../EChartsNode'
import ChartEditDialog from '../ChartEditDialog.vue'
import SlashMenu from '../SlashMenu/SlashMenu.vue'
import BlockMenuOverlay from '../BlockMenuOverlay.vue'
import FormatToolbar from '../FormatToolbar.vue'
import TableToolbar from '../TableToolbar.vue'
import { menuItems } from '../SlashMenu/menuItems.js'
import { SlashMenuExtension } from '../../extensions/SlashMenuExtension'
import { BlockButtonsExtension, initBlockButtons, updateBlockButtons } from '../../extensions/BlockButtonsExtension'
import { CodeBlockWithCharts } from '../../extensions/CodeBlockWithCharts'
import { MarkdownInputRules } from '../../extensions/MarkdownInputRules'

const props = defineProps({
  modelValue: { type: String, default: '' },
  height: { type: [String, Number], default: '500px' },
  placeholder: { type: String, default: '' },
  previewOnly: { type: Boolean, default: false },
  streaming: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const chartDialog = ref(null)
let editingNodePos = null
let isMounted = false
let lastEmittedValue = ''

// Track last external value to prevent feedback loop during streaming
let lastExternalValue = ''

const editorContainerRef = ref(null)
const slashMenuRef = ref(null)
const slashMenuComponentRef = ref(null)
const blockMenuOverlayRef = ref(null)

const slashMenuVisible = ref(false)
const slashMenuQuery = ref('')
const slashMenuStyle = ref({})

// Wrapped menu items for "+" button: insert NEW block AFTER current block
const plusMenuItems = computed(() =>
  menuItems.map(item => ({
    ...item,
    // Use plusCommand for "+" button (inserts new block)
    command: item.plusCommand || item.command
  }))
)

function onSlashMenuSelect() {
  slashMenuVisible.value = false
}

function handleChartEdit(chartData, nodePos) {
  editingNodePos = nodePos
  chartDialog.value?.open(chartData)
}

const editor = useEditor({
  contentType: 'markdown',
  content: props.modelValue,
  editable: true,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: false,
      link: false,
      underline: false,
      bulletList: false,
      orderedList: false,
      listItem: false
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { target: '_blank' }
    }),
    Underline,
    Placeholder.configure({
      placeholder: '输入文字或按 "/" 使用命令...',
      showOnlyCurrent: true,
      showOnlyWhenEditable: true
    }),
    CodeBlockWithCharts,
    Markdown,
    MarkdownInputRules,
    EChartsNode.configure({ onEdit: handleChartEdit }),
    SlashMenuExtension,
    BlockButtonsExtension,
    Table,
    TableRow,
    TableHeader,
    TableCell,
    TextStyle,
    FontFamily,
    Color,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify']
    }),
    BulletList,
    OrderedList,
    ListItem
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-editor-content',
      style: `min-height: ${props.height}; padding: 16px 16px 16px 48px; outline: none;`
    },
    editable: () => !props.previewOnly
  },
  onUpdate: ({ editor }) => {
    // Prevent feedback loop when updating from external source
    if (isUpdatingFromExternal) return

    const md = editor.storage.markdown?.getMarkdown?.() || ''
    lastEmittedValue = md
    emit('update:modelValue', md)
    emit('change', md)
  },
  onCreate: ({ editor }) => {
    const tryInit = (retry = 0) => {
      if (retry > 20) return
      if (!editor.view?.dom) {
        setTimeout(() => tryInit(retry + 1), 50)
        return
      }
      let container = editor.view.dom.closest('.markdown-editor')
      if (!container) {
        setTimeout(() => tryInit(retry + 1), 50)
        return
      }
      try {
        initBlockButtons(editor)
      } catch {
        setTimeout(() => tryInit(retry + 1), 50)
        return
      }
      const bbStorage = editor.extensionStorage?.blockButtons
      if (bbStorage) {
        bbStorage.onPlusClick = (btnEl) => {
          const rect = btnEl.getBoundingClientRect()
          blockMenuOverlayRef.value?.open(rect.right + 8, rect.top)
        }
      }
    }
    setTimeout(() => tryInit(), 50)
  }
})

let isUpdatingFromExternal = false

watch(
  () => props.modelValue,
  (val) => {
    if (val === lastEmittedValue) return
    if (!isMounted || !editor.value) return

    if (props.streaming) {
      // Streaming mode: only update if external value changed
      if (val === lastExternalValue) return
      lastExternalValue = val

      const currentMd = editor.value.storage.markdown?.getMarkdown?.() || ''
      if (val === currentMd) return

      // If new value is an append of current content, only insert the diff
      if (val.startsWith(currentMd)) {
        const diff = val.slice(currentMd.length)
        if (diff) {
          // Check if diff contains newline or markdown markers
          const needsFullReparse = diff.includes('\n') ||
            /^[\s]*[#*\-`>]+|^[\s]*\d+\./.test(diff) ||
            /`[^`]*`/.test(diff)

          if (needsFullReparse) {
            // Full replace for markdown structure changes
            // Use markdown extension's parse method to convert markdown to JSON
            const parsedContent = editor.value.storage.markdown?.parse?.(val)
            if (parsedContent) {
              isUpdatingFromExternal = true
              editor.value.commands.setContent(parsedContent)
              isUpdatingFromExternal = false
            }
          } else {
            // Simple text append (no markdown structure)
            editor.value.commands.insertContentAt(editor.value.state.doc.content.size, diff)
          }
        }
        return
      }
    }

    // Non-streaming or content changed significantly: replace entirely
    // Use markdown extension's parse method
    const parsedContent = editor.value.storage.markdown?.parse?.(val)
    if (parsedContent) {
      isUpdatingFromExternal = true
      editor.value.commands.setContent(parsedContent)
      isUpdatingFromExternal = false
    }
  }
)

// Prevent feedback loop during streaming

onMounted(() => {
  isMounted = true

  // Update button positions and slash menu state on content changes
  editor.value?.on('transaction', () => {
    requestAnimationFrame(() => updateBlockButtons(editor.value))

    // Update slash menu state from extension storage
    const smStorage = editor.value?.extensionStorage?.slashMenu
    if (smStorage) {
      slashMenuVisible.value = smStorage.visible
      slashMenuQuery.value = smStorage.query || ''

      if (smStorage.visible && editor.value) {
        const { view, state } = editor.value
        const { $from } = state.selection
        const coords = view.coordsAtPos($from.pos)
        const menuHeight = 438
        const menuWidth = 300
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth

        let left = coords.left
        let top = coords.top + coords.height + 4

        // If menu would overflow viewport bottom, position above cursor
        if (top + menuHeight > viewportHeight - 10) {
          top = coords.top - menuHeight - 4
        }

        // Ensure left doesn't overflow viewport right
        if (left + menuWidth > viewportWidth - 10) {
          left = Math.max(10, viewportWidth - menuWidth - 10)
        }

        // Ensure top doesn't go above viewport
        if (top < 10) {
          top = 10
        }

        slashMenuStyle.value = {
          position: 'fixed',
          top: top + 'px',
          left: left + 'px',
          zIndex: 100
        }
      }
    }
  })

  // Connect slash menu keyboard callbacks
  const smStorage = editor.value?.extensionStorage?.slashMenu
  if (smStorage) {
    smStorage._moveUp = () => slashMenuComponentRef.value?.moveUp()
    smStorage._moveDown = () => slashMenuComponentRef.value?.moveDown()
    smStorage._selectCurrent = () => slashMenuComponentRef.value?.selectCurrent()
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// When a chart node is selected, store its position for editing
watch(
  () => editor.value?.state.selection,
  (selection) => {
    if (selection?.node && selection.node.type.name === 'echartsChart') {
      editingNodePos = selection.from
    }
  }
)

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

defineExpose({
  getMarkdown: () => editor.value?.storage.markdown?.getMarkdown?.() || '',
  getHtml: () => editor.value?.getHTML() || '',
  editor: () => editor.value,
  // 动态设置只读状态
  setEditable: (editable) => editor.value?.setEditable?.(editable),
  // 设置内容
  setContent: (content) => editor.value?.commands.setContent?.(content),
  // 聚焦编辑器
  focus: () => editor.value?.commands.focus?.(),
  // 清除内容
  clearContent: () => editor.value?.commands.clearContent?.(),
})
</script>

<style scoped>
.markdown-editor {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.editor-container {
  position: relative;
}

.slash-menu-popup {
  position: fixed;
  z-index: 100;
}

:deep(.tiptap-editor-content) {
  font-family: '仿宋', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

:deep(.tiptap-editor-content p) {
  margin: 0.5em 0;
}

:deep(.tiptap-editor-content h1) {
  font-family: '黑体', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 1em 0 0.5em;
  line-height: 1.3;
}

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
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

:deep(.tiptap-editor-content pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
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

/* Placeholder 样式 */
:deep(.tiptap-editor-content p.is-empty::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
  font-size: 14px;
}

:deep(.tiptap-editor-content p.is-empty) {
  min-height: 1.5em;
}

/* 表格样式 */
:deep(.tiptap-editor-content table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

:deep(.tiptap-editor-content table th),
:deep(.tiptap-editor-content table td) {
  border: 1px solid #e5e7eb;
  padding: 10px 14px;
  min-width: 80px;
}

:deep(.tiptap-editor-content table th) {
  background: #f9fafb;
  font-weight: 600;
  text-align: left;
}

:deep(.tiptap-editor-content table tr:hover) {
  background: #f9fafb;
}

:deep(.tiptap-editor-content table .selectedCell) {
  background: #dbeafe;
  border-color: #3b82f6;
}

/* 表格选中时的样式 */
:deep(.tiptap-editor-content .table-node-wrapper) {
  position: relative;
}

:deep(.tiptap-editor-content .table-node-wrapper.selected) {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

</style>
