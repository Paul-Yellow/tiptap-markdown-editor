import { Extension } from '@tiptap/core'

let handleContainer = null
let handleEl = null
let hotspotEl = null
let currentEditor = null

function getOrCreateHandle() {
  if (handleContainer) return { handleContainer, handleEl, hotspotEl }

  const styleId = 'block-buttons-style'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .block-handle-container {
        position: fixed;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 2px;
        opacity: 0;
        transition: opacity 0.15s;
        pointer-events: none;
      }
      .block-handle-container.visible {
        opacity: 1;
        pointer-events: auto;
      }
      .block-handle-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        font-size: 18px;
        line-height: 1;
        color: #999;
        cursor: pointer;
        user-select: none;
        background: transparent;
        border: none;
        transition: background 0.1s, color 0.1s;
        flex-shrink: 0;
      }
      .block-handle-btn:hover {
        color: #333;
        background: #e5e5e5;
      }
      .block-handle-hotspot {
        position: absolute;
        top: -8px;
        bottom: -8px;
        z-index: -1;
        pointer-events: auto;
      }
    `
    document.head.appendChild(style)
  }

  handleContainer = document.createElement('div')
  handleContainer.className = 'block-handle-container'
  document.body.appendChild(handleContainer)

  handleEl = document.createElement('button')
  handleEl.className = 'block-handle-btn'
  handleEl.innerHTML = '+'
  handleEl.contentEditable = 'false'

  hotspotEl = document.createElement('div')
  hotspotEl.className = 'block-handle-hotspot'

  handleContainer.appendChild(handleEl)
  handleContainer.appendChild(hotspotEl)

  return { handleContainer, handleEl, hotspotEl }
}

function hideHandle() {
  if (handleContainer) {
    handleContainer.classList.remove('visible')
  }
}

function showHandleForBlock(blockEl) {
  if (!blockEl || !handleContainer) return

  const rect = blockEl.getBoundingClientRect()
  const handleLeft = rect.left - 36
  handleContainer.style.left = handleLeft + 'px'
  handleContainer.style.top = (rect.top + (rect.height - 24) / 2) + 'px'
  hotspotEl.style.left = '24px'
  hotspotEl.style.width = '50px'
  handleContainer.classList.add('visible')
}

export const BlockButtonsExtension = Extension.create({
  name: 'blockButtons',

  addStorage() {
    return {
      onPlusClick: null,
      initialized: false
    }
  },

  onDestroy() {
    hideHandle()
  }
})

export function initBlockButtons(editor) {
  const storage = editor.extensionStorage?.blockButtons
  if (!storage || storage.initialized) return
  storage.initialized = true
  currentEditor = editor

  if (!editor.view?.dom) return

  setupBlockListeners(editor, storage)

  // 监听编辑器 transaction 来更新按钮位置（聚焦时显示）
  editor.on('transaction', () => {
    updateHandlePosition(editor)
  })
}

function updateHandlePosition(editor) {
  if (!editor || !editor.view || !editor.isFocused) {
    // 编辑器未聚焦时，只在鼠标悬停时显示
    return
  }

  const { state, view } = editor
  const { $from } = state.selection

  // 找到当前光标所在的块元素
  const pos = $from.before($from.depth)
  const node = view.nodeDOM(pos)

  if (node) {
    // 找到块级元素
    let blockEl = node
    while (blockEl && blockEl.nodeType === 1) {
      const tag = blockEl.tagName?.toLowerCase()
      if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'ul', 'ol'].includes(tag) ||
          (tag === 'div' && blockEl.hasAttribute('data-node-view'))) {
        showHandleForBlock(blockEl)
        return
      }
      blockEl = blockEl.parentElement
      if (blockEl === view.dom) break
    }
  }
}

function setupBlockListeners(editor, storage) {
  const pmDom = editor.view.dom
  if (!pmDom) return

  const { handleContainer, handleEl } = getOrCreateHandle()

  // Clean up old listeners
  if (storage._blockEls) {
    storage._blockEls.forEach(el => {
      el.removeEventListener('mouseenter', el._btnShow)
      el.removeEventListener('mouseleave', el._btnHide)
    })
  }

  // Set up mousedown handler on handle
  const existingMousedown = handleEl._mousedownHandler
  if (existingMousedown) handleEl.removeEventListener('mousedown', existingMousedown)
  handleEl._mousedownHandler = (e) => {
    e.preventDefault()
    e.stopPropagation()
    storage.onPlusClick?.(handleEl)
  }
  handleEl.addEventListener('mousedown', handleEl._mousedownHandler)

  // Get all block elements
  const blockEls = []
  for (const child of pmDom.children) {
    if (child.nodeType !== 1) continue
    const tag = child.tagName.toLowerCase()
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'hr', 'ul', 'ol'].includes(tag) ||
        (tag === 'div' && child.hasAttribute('data-node-view'))) {
      blockEls.push(child)
    }
  }

  // Attach hover listeners
  blockEls.forEach(blockEl => {
    if (blockEl._btnShow) blockEl.removeEventListener('mouseenter', blockEl._btnShow)
    if (blockEl._btnHide) blockEl.removeEventListener('mouseleave', blockEl._btnHide)

    const showFn = () => {
      showHandleForBlock(blockEl)
    }

    const hideFn = () => {
      // 如果编辑器聚焦且光标在此块内，不隐藏
      if (editor.isFocused) {
        const { $from } = editor.state.selection
        const pos = $from.before($from.depth)
        const node = editor.view.nodeDOM(pos)
        if (node && blockEl.contains(node)) {
          return
        }
      }

      setTimeout(() => {
        if (!handleContainer.matches(':hover') && !editor.isFocused) {
          handleContainer.classList.remove('visible')
        }
      }, 50)
    }

    blockEl.addEventListener('mouseenter', showFn)
    blockEl.addEventListener('mouseleave', hideFn)
    blockEl._btnShow = showFn
    blockEl._btnHide = hideFn
  })

  storage._blockEls = blockEls
}

export function updateBlockButtons(editor) {
  const storage = editor.extensionStorage?.blockButtons
  if (!storage?.initialized) return
  setupBlockListeners(editor, storage)
}
