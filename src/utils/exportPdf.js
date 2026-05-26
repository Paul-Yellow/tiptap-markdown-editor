import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Apply print-friendly styles to a cloned document
 * @param {Document} clonedDoc - The cloned document from html2canvas
 */
function applyPrintStyles(clonedDoc) {
  const styles = clonedDoc.createElement('style')
  styles.textContent = `
    *, *::before, *::after {
      font-family: '仿宋', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
    h1, h2, h3, h4, h5, h6 {
      font-weight: bold !important;
    }
    h1 {
      font-size: 2em !important;
      margin: 1em 0 0.5em !important;
      line-height: 1.3 !important;
    }
    h2 {
      font-size: 1.5em !important;
      margin: 1em 0 0.5em !important;
      line-height: 1.3 !important;
    }
    h3 {
      font-size: 1.25em !important;
      margin: 1em 0 0.5em !important;
      line-height: 1.3 !important;
    }
    p {
      margin: 0.5em 0 !important;
      line-height: 1.6 !important;
    }
    ul, ol {
      padding-left: 2em !important;
      margin: 0.5em 0 !important;
    }
    blockquote {
      border-left: 3px solid #ddd !important;
      padding-left: 1em !important;
      margin: 1em 0 !important;
      color: #666 !important;
    }
    pre {
      background: #1e1e1e !important;
      border-radius: 8px !important;
      padding: 16px !important;
      overflow-x: auto !important;
      color: #d4d4d4 !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
    }
    pre code {
      background: transparent !important;
      padding: 0 !important;
      color: inherit !important;
      font-size: inherit !important;
    }
    code {
      background: #f6f8fa !important;
      padding: 2px 6px !important;
      border-radius: 3px !important;
      font-size: 0.9em !important;
    }
    hr {
      border: none !important;
      border-top: 1px solid #ddd !important;
      margin: 1.5em 0 !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 16px 0 !important;
    }
    table th, table td {
      border: 1px solid #e5e7eb !important;
      padding: 10px 14px !important;
      min-width: 80px !important;
    }
    table th {
      background: #f9fafb !important;
      font-weight: 600 !important;
      text-align: left !important;
    }
    .selectedCell {
      background: #fff !important;
      border-color: #e5e7eb !important;
    }
    .table-node-wrapper.selected {
      outline: none !important;
    }
    p.is-empty::before {
      display: none !important;
    }
    p.is-empty {
      min-height: 0 !important;
    }
    .block-handle-container,
    .format-toolbar,
    .table-toolbar,
    .slash-menu-popup,
    .block-menu-overlay {
      display: none !important;
    }
  `
  clonedDoc.head.appendChild(styles)
}

/**
 * 将编辑器内容导出为 PDF
 * @param {HTMLElement} element - 要导出的 DOM 元素
 * @param {string} filename - PDF 文件名
 */
export async function exportToPdf(element, filename = 'document.pdf') {
  if (!element) {
    console.error('导出元素不存在')
    return
  }

  // 导出前清除所有选择，避免 PDF 中出现蓝色选中框
  const savedSelection = window.getSelection()
  if (savedSelection.rangeCount > 0) {
    savedSelection.removeAllRanges()
  }
  // 同时清除 editor 内部的选中状态
  if (element.classList.contains('ProseMirror')) {
    element.blur()
  }

  // 显示加载提示
  const loadingTip = document.createElement('div')
  loadingTip.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.7);
    color: #fff;
    padding: 20px 40px;
    border-radius: 8px;
    z-index: 10000;
    font-size: 14px;
  `
  loadingTip.textContent = '正在生成 PDF...'
  document.body.appendChild(loadingTip)

  try {
    // 用 html2canvas 渲染编辑器内容
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, clonedElement) => {
        // 在克隆的文档中应用打印样式
        applyPrintStyles(clonedDoc)
      }
    })

    // 创建 PDF (A4 尺寸)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 10

    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const imgData = canvas.toDataURL('image/png')

    // 分页处理
    let position = margin
    const contentHeight = imgHeight

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)

    let renderedHeight = pageHeight - margin
    while (renderedHeight < contentHeight + margin) {
      pdf.addPage()
      position = margin - renderedHeight
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      renderedHeight += pageHeight - margin * 2
    }

    pdf.save(filename)

  } catch (error) {
    console.error('PDF 导出失败:', error)
    alert('PDF 导出失败，请重试')
  } finally {
    document.body.removeChild(loadingTip)
  }
}
