<template>
  <div class="markdown-editor" v-if="editor">
    <!-- Editor -->
    <div ref="editorContainerRef" class="editor-container">
      <EditorContent :editor="editor" />
    </div>

    <!-- Slash command menu (triggered by "/") -->
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

    <!-- Block "+" button overlay menu -->
    <BlockMenuOverlay
      ref="blockMenuOverlayRef"
      :editor="editor"
      :items="plusMenuItems"
    />

    <!-- Format toolbar (selection-based) -->
    <FormatToolbar :editor="editor" />

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
import { EChartsNode } from '../../EChartsNode'
import ChartEditDialog from '../ChartEditDialog.vue'
import SlashMenu from '../SlashMenu/SlashMenu.vue'
import BlockMenuOverlay from '../BlockMenuOverlay.vue'
import FormatToolbar from '../FormatToolbar.vue'
import { menuItems } from '../SlashMenu/menuItems.js'
import { SlashMenuExtension } from '../../extensions/SlashMenuExtension'
import { BlockButtonsExtension, initBlockButtons, updateBlockButtons } from '../../extensions/BlockButtonsExtension'
import { CodeBlockWithCharts } from '../../extensions/CodeBlockWithCharts'
import { MarkdownInputRules } from '../../extensions/MarkdownInputRules'

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
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: false,
      link: false,
      underline: false
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
    BlockButtonsExtension
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-editor-content',
      style: `min-height: ${props.height}; padding: 16px 16px 16px 48px; outline: none;`
    }
  },
  onUpdate: ({ editor }) => {
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

watch(
  () => props.modelValue,
  (val) => {
    if (val === lastEmittedValue) return
    if (!isMounted) return
    if (editor.value) {
      editor.value.commands.setContent(val)
    }
  }
)

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
        const containerRect = editorContainerRef.value?.getBoundingClientRect()
        if (containerRect) {
          slashMenuStyle.value = {
            position: 'absolute',
            top: (coords.top - containerRect.top + coords.height + 4) + 'px',
            left: Math.max(0, coords.left - containerRect.left) + 'px',
            zIndex: 100
          }
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
  editor: () => editor.value
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
  position: absolute;
  z-index: 100;
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

</style>
