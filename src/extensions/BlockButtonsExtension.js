import { Extension } from '@tiptap/core'

let handleContainer = null
let handleEl = null
let hotspotEl = null
let currentEditor = null
let currentBlockEl = null // Track the block the button is currently positioned at

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
        gap: 6px;
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
        width: 32px;
        height: 32px;
        border-radius: 6px;
        font-size: 22px;
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
        pointer-events: none;
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
  currentBlockEl = null
}

function showHandleForBlock(blockEl) {
  if (!blockEl || !handleContainer) return

  currentBlockEl = blockEl
  const rect = blockEl.getBoundingClientRect()
  const isListItem = blockEl.tagName.toLowerCase() === 'li'
  // 列表项需要更大的间距，因为前面有项目符号/序号
  const handleOffset = isListItem ? 60 : 44
  const handleLeft = rect.left - handleOffset
  handleContainer.style.left = handleLeft + 'px'
  handleContainer.style.top = (rect.top + (rect.height - 32) / 2) + 'px'
  hotspotEl.style.left = '32px'
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
  if (!editor || !editor.view) {
    hideHandle()
    return
  }

  if (!editor.isFocused) {
    return
  }

  const { state, view } = editor
  const { $from } = state.selection

  let pos
  try {
    pos = $from.before($from.depth)
  } catch {
    hideHandle()
    return
  }
  const node = view.nodeDOM(pos)

  // Get the actual element to check (text nodes need parentElement)
  const el = node && node.nodeType === 1 ? node : node?.parentElement
  if (!el) {
    hideHandle()
    return
  }

  // If cursor is inside a list, let hover mechanism control the button
  if (el.closest('li, ul, ol')) {
    return
  }

  // Find the block-level ancestor for non-list elements
  let blockEl = el
  while (blockEl && blockEl !== view.dom) {
    const tag = blockEl.tagName?.toLowerCase()
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'].includes(tag) ||
        (tag === 'div' && blockEl.hasAttribute('data-node-view'))) {
      showHandleForBlock(blockEl)
      return
    }
    blockEl = blockEl.parentElement
  }

  hideHandle()
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
  if (storage._listMove) {
    pmDom.removeEventListener('mousemove', storage._listMove)
  }
  if (storage._editorOut) {
    pmDom.removeEventListener('mouseleave', storage._editorOut)
  }

  // Set up mousedown handler on handle
  const existingMousedown = handleEl._mousedownHandler
  if (existingMousedown) handleEl.removeEventListener('mousedown', existingMousedown)
  handleEl._mousedownHandler = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Focus the editor at the currently hovered block before opening menu
    if (currentBlockEl && currentEditor) {
      const view = currentEditor.view
      const pos = view.posAtDOM(currentBlockEl, 0)
      if (pos !== undefined && pos >= 0) {
        currentEditor.commands.focus(pos, { scrollIntoView: false })
      }
    }

    storage.onPlusClick?.(handleEl)
  }
  handleEl.addEventListener('mousedown', handleEl._mousedownHandler)

  // Get all block elements (non-list)
  const blockEls = []

  for (const child of pmDom.children) {
    if (child.nodeType !== 1) continue
    const tag = child.tagName.toLowerCase()
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'hr'].includes(tag) ||
        (tag === 'div' && child.hasAttribute('data-node-view'))) {
      blockEls.push(child)
    }
  }

  // Attach hover listeners to non-list blocks
  blockEls.forEach(blockEl => {
    if (blockEl._btnShow) blockEl.removeEventListener('mouseenter', blockEl._btnShow)
    if (blockEl._btnHide) blockEl.removeEventListener('mouseleave', blockEl._btnHide)

    const showFn = () => {
      showHandleForBlock(blockEl)
    }

    const hideFn = () => {
      if (editor.isFocused) {
        try {
          const { $from } = editor.state.selection
          const pos = $from.before($from.depth)
          const node = editor.view.nodeDOM(pos)
          if (node && blockEl.contains(node)) {
            return
          }
        } catch { /* ignore */ }
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

  // Single mousemove on editor container for list items
  // This works regardless of ProseMirror DOM updates since we check from elementFromPoint
  const mouseMoveFn = (e) => {
    const target = document.elementFromPoint(e.clientX, e.clientY)
    if (!target || !pmDom.contains(target)) return
    const li = target.closest('li')
    if (li && pmDom.contains(li)) {
      showHandleForBlock(li)
    }
  }

  const editorOutFn = () => {
    setTimeout(() => {
      if (!handleContainer.matches(':hover')) {
        handleContainer.classList.remove('visible')
      }
    }, 50)
  }

  pmDom.addEventListener('mousemove', mouseMoveFn)
  pmDom.addEventListener('mouseleave', editorOutFn)
  storage._listMove = mouseMoveFn
  storage._editorOut = editorOutFn

  storage._blockEls = blockEls
}

export function updateBlockButtons(editor) {
  const storage = editor.extensionStorage?.blockButtons
  if (!storage?.initialized) return
  setupBlockListeners(editor, storage)
}
