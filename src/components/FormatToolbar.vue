<template>
  <div v-if="visible" class="format-toolbar" :style="toolbarStyle">
    <!-- 块类型选择器 -->
    <div class="block-type-wrapper" ref="blockTypeWrapper">
      <button
        class="block-type-btn"
        title="转换为"
        @click.stop="toggleBlockTypeMenu"
        @mousedown.stop
      >
        <span class="block-type-label">{{ currentBlockTypeLabel }}</span>
        <span class="block-type-arrow">▼</span>
      </button>
      <div v-if="showBlockTypeMenu" class="block-type-dropdown" @mousedown.stop>
        <div
          v-for="item in blockTypeItems"
          :key="item.label"
          class="block-type-item"
          @click="applyBlockType(item)"
        >
          <span class="block-type-item-icon">{{ item.icon }}</span>
          <div class="block-type-item-content">
            <span class="block-type-item-label">{{ item.label }}</span>
            <span class="block-type-item-desc">{{ item.desc }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="toolbar-divider"></div>
    <select
      v-model="currentFont"
      class="font-select"
      title="字体"
      @change="setFont"
      @mousedown.stop
    >
      <option value="">默认</option>
      <option
        v-for="font in fonts"
        :key="font"
        :value="font"
        :style="{ fontFamily: font }"
      >
        {{ font }}
      </option>
    </select>
    <div class="toolbar-divider"></div>
    <div class="color-picker-wrapper" ref="colorPickerWrapper">
      <button
        class="toolbar-btn color-btn"
        title="字体颜色"
        @click.stop="toggleColorPicker"
        @mousedown.stop
      >
        <span class="toolbar-icon" :style="{ color: currentColor || '#000' }">A</span>
      </button>
      <div v-if="showColorPicker" class="color-picker-dropdown" @mousedown.stop>
        <div class="color-grid">
          <button
            v-for="color in presetColors"
            :key="color"
            class="color-swatch"
            :style="{ backgroundColor: color }"
            :title="color"
            @click="setColor(color)"
          />
        </div>
      </div>
    </div>
    <div class="toolbar-divider"></div>
    <button
      v-for="(btn, idx) in buttons"
      :key="idx"
      :class="['toolbar-btn', { active: isActive(btn.name) }]"
      :title="btn.label"
      @mousedown.stop
      @click="toggleFormat(btn.name)"
    >
      <span class="toolbar-icon">{{ btn.icon }}</span>
    </button>
    <div class="toolbar-divider"></div>
    <div class="alignment-buttons">
      <button
        v-for="align in alignments"
        :key="align.name"
        :class="['toolbar-btn', { active: isActive(align.name) }]"
        :title="align.label"
        @mousedown.stop
        @click="setTextAlign(align.name)"
      >
        <span class="toolbar-icon">{{ align.icon }}</span>
      </button>
    </div>
    <div class="toolbar-divider"></div>
    <input
      v-if="showLinkInput"
      ref="linkInputRef"
      v-model="linkUrl"
      class="link-input"
      placeholder="输入链接..."
      @keydown.enter="applyLink"
      @keydown.escape="cancelLink"
    />
    <button
      v-else
      class="toolbar-btn"
      :class="{ active: hasLink }"
      title="链接"
      @mousedown.stop
      @click="toggleLinkInput"
    >
      <span class="toolbar-icon">🔗</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  editor: { type: Object, required: true }
})

const visible = ref(false)
const toolbarStyle = ref({})
const showLinkInput = ref(false)
const linkUrl = ref('')
const linkInputRef = ref(null)
const currentFont = ref('')
const currentColor = ref('')
const showColorPicker = ref(false)
const colorPickerWrapper = ref(null)
const pendingSelection = ref(null) // 记录待处理的选区
const isSelecting = ref(false) // 是否正在选择中
const showBlockTypeMenu = ref(false)
const blockTypeWrapper = ref(null)

const blockTypeItems = [
  { label: '正文', desc: '普通文本段落', icon: '¶', command: 'setParagraph' },
  { label: '标题 1', desc: '大章节标题', icon: 'H1', command: 'setHeading', attrs: { level: 1 } },
  { label: '标题 2', desc: '中等章节标题', icon: 'H2', command: 'setHeading', attrs: { level: 2 } },
  { label: '标题 3', desc: '小章节标题', icon: 'H3', command: 'setHeading', attrs: { level: 3 } },
  { label: '引用', desc: '引用文本块', icon: '❝', command: 'toggleBlockquote' },
  { label: '无序列表', desc: '简单无序列表', icon: '•', command: 'toggleBulletList' },
  { label: '有序列表', desc: '带序号的列表', icon: '1.', command: 'toggleOrderedList' },
  { label: '代码块', desc: '代码片段', icon: '</>', command: 'toggleCodeBlock' },
]

const presetColors = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef',
  '#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0',
  '#ff00ff', '#963634', '#ed7d31', '#a5a5a5', '#7f7f7f', '#3f3f3f', '#262626', '#0d0d0d',
]

const fonts = [
  '楷体_GB2312',
  '方正公文小标宋',
  '方正小标宋简体',
  '黑体',
  '仿宋',
  '方正楷体_GBK',
  '楷体',
  '宋体',
]

const buttons = [
  { name: 'bold', icon: 'B', label: '粗体' },
  { name: 'italic', icon: 'I', label: '斜体' },
  { name: 'underline', icon: 'U', label: '下划线' },
  { name: 'strike', icon: 'S', label: '删除线' },
  { name: 'code', icon: '</>', label: '代码' }
]

const alignments = [
  { name: 'left', icon: '☰', label: '左对齐' },
  { name: 'center', icon: '≡', label: '居中对齐' },
  { name: 'right', icon: '☱', label: '右对齐' },
  { name: 'justify', icon: '≣', label: '两端对齐' }
]

function isActive(format) {
  if (format === 'left' || format === 'center' || format === 'right' || format === 'justify') {
    return props.editor?.isActive({ textAlign: format }) || false
  }
  return props.editor?.isActive(format) || false
}

// 获取当前块类型的标签
const currentBlockTypeLabel = computed(() => {
  if (!props.editor) return '正文'

  if (props.editor.isActive('heading', { level: 1 })) return '标题 1'
  if (props.editor.isActive('heading', { level: 2 })) return '标题 2'
  if (props.editor.isActive('heading', { level: 3 })) return '标题 3'
  if (props.editor.isActive('blockquote')) return '引用'
  if (props.editor.isActive('bulletList')) return '无序列表'
  if (props.editor.isActive('orderedList')) return '有序列表'
  if (props.editor.isActive('codeBlock')) return '代码块'

  return '正文'
})

function toggleBlockTypeMenu() {
  showBlockTypeMenu.value = !showBlockTypeMenu.value
}

function applyBlockType(item) {
  if (!props.editor) return
  showBlockTypeMenu.value = false

  const chain = props.editor.chain().focus()

  switch (item.command) {
    case 'setParagraph':
      chain.setParagraph().run()
      break
    case 'setHeading':
      chain.toggleHeading({ level: item.attrs.level }).run()
      break
    case 'toggleBlockquote':
      chain.toggleBlockquote().run()
      break
    case 'toggleBulletList':
      chain.toggleBulletList().run()
      break
    case 'toggleOrderedList':
      chain.toggleOrderedList().run()
      break
    case 'toggleCodeBlock':
      chain.toggleCodeBlock().run()
      break
  }
}

const hasLink = computed(() => props.editor?.isActive('link') || false)

function toggleFormat(format) {
  props.editor?.chain().focus().toggleMark(format).run()
}

function setTextAlign(alignment) {
  if (!props.editor) return
  // 如果已经是当前对齐方式，则取消对齐
  if (isActive(alignment)) {
    props.editor.chain().focus().unsetTextAlign().run()
  } else {
    props.editor.chain().focus().setTextAlign(alignment).run()
  }
}

function setFont() {
  if (!props.editor) return
  const font = currentFont.value
  if (font) {
    props.editor.chain().focus().setFontFamily(`"${font}"`).run()
  } else {
    props.editor.chain().focus().unsetFontFamily().run()
  }
}

function toggleColorPicker() {
  showColorPicker.value = !showColorPicker.value
}

function setColor(color) {
  if (!props.editor) return
  if (color === '#000000' || color === 'transparent') {
    props.editor.chain().focus().unsetColor().run()
    currentColor.value = ''
  } else {
    props.editor.chain().focus().setColor(color).run()
    currentColor.value = color
  }
  showColorPicker.value = false
}

function closeColorPicker() {
  showColorPicker.value = false
}

function toggleLinkInput() {
  if (hasLink.value) {
    // 移除链接
    props.editor?.chain().focus().unsetLink().run()
  } else {
    showLinkInput.value = true
    linkUrl.value = ''
    setTimeout(() => linkInputRef.value?.focus(), 50)
  }
}

function applyLink() {
  if (linkUrl.value.trim()) {
    props.editor?.chain().focus().setLink({ href: linkUrl.value.trim() }).run()
  }
  showLinkInput.value = false
  linkUrl.value = ''
}

function cancelLink() {
  showLinkInput.value = false
  linkUrl.value = ''
}

function updatePosition() {
  if (!props.editor) return

  const { from, to } = props.editor.state.selection
  if (from === to) {
    // 无选中，隐藏工具栏
    visible.value = false
    showLinkInput.value = false
    pendingSelection.value = null
    return
  }

  // 检查是否在代码块内
  const { $from } = props.editor.state.selection
  if ($from.parent.type.name === 'codeBlock') {
    visible.value = false
    pendingSelection.value = null
    return
  }

  // 如果正在选择中，只记录选区，不立即显示
  if (isSelecting.value) {
    pendingSelection.value = { from, to }
    return
  }

  // 选区确定后，显示工具栏
  showToolbar(from, to)
}

function showToolbar(from, to) {
  if (!props.editor) return

  // 更新当前字体选中状态 - 先检查 textStyle mark，如果没有则从 DOM 获取实际渲染的字体
  let fontFamily = ''
  props.editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.isText && node.marks.length > 0) {
      for (const mark of node.marks) {
        if (mark.type.name === 'textStyle' && mark.attrs.fontFamily) {
          fontFamily = mark.attrs.fontFamily
          return false // 停止遍历
        }
      }
    }
    return !fontFamily // 如果已找到则停止
  })

  // 如果 mark 中没有字体信息，从 DOM 获取实际渲染的字体
  if (!fontFamily) {
    const { view } = props.editor
    const domAtPos = view.domAtPos(from)
    if (domAtPos && domAtPos.node) {
      const container = domAtPos.node.nodeType === Node.ELEMENT_NODE
        ? domAtPos.node
        : domAtPos.node.parentElement
      if (container) {
        const computedStyle = window.getComputedStyle(container)
        fontFamily = computedStyle.fontFamily
      }
    }
  }

  // 每次都将下拉框设置为当前选区的实际字体，没找到则恢复为默认
  currentFont.value = fontFamily
    ? fontFamily.replace(/['"]/g, '').trim().split(',')[0].trim()
    : ''

  // 更新当前选中文字的颜色
  let color = ''
  props.editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.isText && node.marks.length > 0) {
      for (const mark of node.marks) {
        if (mark.type.name === 'textStyle' && mark.attrs.color) {
          color = mark.attrs.color
          return false
        }
      }
    }
    return !color
  })
  currentColor.value = color || ''

  visible.value = true
  pendingSelection.value = null

  const { view } = props.editor
  const start = view.coordsAtPos(from)
  const end = view.coordsAtPos(to)

  // 计算工具栏位置（选区上方居中）
  const toolbarWidth = 350
  let left = (start.left + end.left) / 2 - toolbarWidth / 2
  let top = start.top - 45

  // 确保不超出视口边界
  const viewportWidth = window.innerWidth
  if (left < 10) left = 10
  if (left + toolbarWidth > viewportWidth - 10) left = viewportWidth - toolbarWidth - 10

  // 如果上方空间不足，放在下方
  if (top < 10) {
    top = end.bottom + 10
  }

  toolbarStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 1000
  }
}

// 鼠标按下时标记正在选择
function handleMouseDown() {
  isSelecting.value = true
  visible.value = false // 隐藏工具栏
}

// 鼠标松开时检查是否有待显示的选区
function handleMouseUp() {
  isSelecting.value = false
  if (pendingSelection.value) {
    showToolbar(pendingSelection.value.from, pendingSelection.value.to)
  }
}

function updateFontState() {
  // textStyle 包含 fontFamily 属性
  const textStyleAttrs = props.editor.getAttributes('textStyle')
  // 移除引号，与 fonts 数组中的值匹配
  let fontFamily = textStyleAttrs?.fontFamily || ''
  if (fontFamily) {
    // 浏览器可能返回带引号的值如 "楷体" 或 '楷体_GB2312'
    fontFamily = fontFamily.replace(/['"]/g, '').trim()
    // 如果返回多个字体（如 "楷体, Microsoft YaHei"），取第一个
    fontFamily = fontFamily.split(',')[0].trim()
  }
  currentFont.value = fontFamily
}

onMounted(() => {
  props.editor?.on('transaction', updatePosition)
  // 监听编辑器内的鼠标事件
  const editorDom = props.editor?.view.dom
  if (editorDom) {
    editorDom.addEventListener('mousedown', handleMouseDown)
    editorDom.addEventListener('mouseup', handleMouseUp)
  }
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  props.editor?.off('transaction', updatePosition)
  const editorDom = props.editor?.view.dom
  if (editorDom) {
    editorDom.removeEventListener('mousedown', handleMouseDown)
    editorDom.removeEventListener('mouseup', handleMouseUp)
  }
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(event) {
  if (colorPickerWrapper.value && !colorPickerWrapper.value.contains(event.target)) {
    showColorPicker.value = false
  }
  if (blockTypeWrapper.value && !blockTypeWrapper.value.contains(event.target)) {
    showBlockTypeMenu.value = false
  }
}

watch(() => props.editor, (newEditor, oldEditor) => {
  if (oldEditor) {
    oldEditor.off('transaction', updatePosition)
    const oldDom = oldEditor.view.dom
    oldDom.removeEventListener('mousedown', handleMouseDown)
    oldDom.removeEventListener('mouseup', handleMouseUp)
  }
  if (newEditor) {
    newEditor.on('transaction', updatePosition)
    const newDom = newEditor.view.dom
    newDom.addEventListener('mousedown', handleMouseDown)
    newDom.addEventListener('mouseup', handleMouseUp)
  }
})
</script>

<style scoped>
.format-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 4px 8px;
  user-select: none;
  pointer-events: auto;
}

.font-select {
  width: 140px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 6px;
  font-size: 13px;
  color: #333;
  background: #fff;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}

.font-select:focus {
  border-color: #3b82f6;
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.toolbar-btn:hover {
  background: #f0f0f0;
}

.toolbar-btn.active {
  background: #e0e0e0;
  color: #3b82f6;
}

.toolbar-icon {
  font-weight: 600;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e0e0e0;
  margin: 0 4px;
}

.link-input {
  width: 150px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 13px;
  outline: none;
}

.link-input:focus {
  border-color: #3b82f6;
}

.color-picker-wrapper {
  position: relative;
}

.color-btn {
  padding: 0 6px;
}

.color-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1001;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 8px;
  margin-top: 4px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border: 1px solid #ddd;
  border-radius: 2px;
  cursor: pointer;
  padding: 0;
}

.color-swatch:hover {
  border-color: #3b82f6;
  transform: scale(1.1);
}

.alignment-buttons {
  display: flex;
  gap: 2px;
}

.block-type-wrapper {
  position: relative;
}

.block-type-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}

.block-type-btn:hover {
  background: #f0f0f0;
}

.block-type-label {
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-type-arrow {
  font-size: 10px;
  color: #999;
}

.block-type-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1001;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 4px;
  margin-top: 4px;
  min-width: 160px;
}

.block-type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
}

.block-type-item:hover {
  background: #f0f0f0;
}

.block-type-item-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.block-type-item-content {
  display: flex;
  flex-direction: column;
}

.block-type-item-label {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.block-type-item-desc {
  font-size: 11px;
  color: #999;
}
</style>