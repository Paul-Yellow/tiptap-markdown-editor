import { Document, Packer, Paragraph, ImageRun, TextRun, AlignmentType } from 'docx'
import html2canvas from 'html2canvas'

/**
 * 将编辑器内容导出为 DOCX（保持文本格式，图表转图片）
 * @param {HTMLElement} element - 编辑器 DOM 元素
 * @param {string} filename - 文件名
 */
export async function exportToDocX(element, filename = 'document.docx') {
  if (!element) {
    console.error('导出元素不存在')
    return
  }

  // 导出前清除所有选择，避免 DOCX 中出现蓝色选中框
  const savedSelection = window.getSelection()
  if (savedSelection.rangeCount > 0) {
    savedSelection.removeAllRanges()
  }
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
  loadingTip.textContent = '正在生成 DOCX...'
  document.body.appendChild(loadingTip)

  try {
    // 步骤 1: 在原始元素上找到所有图表并捕获为图片
    const chartImages = []
    const chartElements = []
    const chartDimensions = [] // 保存每个图表的实际尺寸

    // 查找所有 echarts 图表容器（在原始元素上）
    const originalChartBlocks = element.querySelectorAll('.echarts-code-block')
    for (const chartBlock of originalChartBlocks) {
      const chartContainer = chartBlock.querySelector('.echarts-code-chart-container')
      if (chartContainer) {
        chartElements.push(chartContainer)
      }
    }

    // 捕获每个图表
    for (const chartEl of chartElements) {
      try {
        // 确保图表容器可见且有尺寸
        if (chartEl.offsetWidth === 0 || chartEl.offsetHeight === 0) {
          chartImages.push(null)
          chartDimensions.push({ width: 0, height: 0 })
          continue
        }

        const chartCanvas = await html2canvas(chartEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        })
        const imgData = chartCanvas.toDataURL('image/png')
        const response = await fetch(imgData)
        const arrayBuffer = await response.arrayBuffer()
        chartImages.push(arrayBuffer)
        // 保存实际尺寸（像素）
        chartDimensions.push({ width: chartCanvas.width, height: chartCanvas.height })
      } catch (e) {
        console.error('图表捕获失败:', e)
        chartImages.push(null)
        chartDimensions.push({ width: 0, height: 0 })
      }
    }

    // 步骤 2: 克隆编辑器内容用于解析文本
    const clone = element.cloneNode(true)

    // 移除按钮、工具栏等不需要导出的元素
    const removeSelectors = [
      '.plus-button',
      '.block-button',
      '.slash-menu',
      '.format-toolbar',
      '.chart-edit-overlay'
    ]
    removeSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove())
    })

    // 步骤 3: 解析 HTML 并转换为 docx 元素（同时处理图表占位符）
    const children = parseHtmlToDocxElements(clone, chartImages, chartDimensions)

    // 创建 docx 文档
    // docx 库使用 twips (1/1440 英寸) 单位
    // A4: 210mm x 297mm = 11906 x 16838 twips
    // 标准 Word 边距：2.54cm (1 英寸) = 1440 twips
    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'default-numbering',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: 'left',
                style: {
                  paragraph: {
                    indent: { left: 720, hanging: 360 }
                  }
                }
              }
            ]
          },
          {
            reference: 'default-bullet',
            levels: [
              {
                level: 0,
                format: 'bullet',
                text: '•',
                alignment: 'left',
                style: {
                  paragraph: {
                    indent: { left: 720, hanging: 360 }
                  }
                }
              }
            ]
          }
        ]
      },
      sections: [{
        properties: {
          page: {
            size: {
              orientation: 'portrait',
              width: 11906,
              height: 16838
            },
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children
      }]
    })

    // 生成并下载
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

  } catch (error) {
    console.error('DOCX 导出失败:', error)
    alert('DOCX 导出失败，请重试')
  } finally {
    if (loadingTip.parentNode) {
      document.body.removeChild(loadingTip)
    }
  }
}

/**
 * 解析 HTML 并转换为 docx 元素
 */
function parseHtmlToDocxElements(element, chartImages, chartDimensions) {
  const children = []
  let chartImageIndex = 0

  // docx 使用 half-points (1/1440 英寸) 单位
  // A4 页面可用宽度：11906 - 1440*2 = 9026 half-points
  // 设置为 4500 以确保图片不会超出 (约 8cm 宽度，留出余量)
  const maxImageWidth = 4500

  function getEffectiveText(node) {
    // 获取节点的纯文本，跳过子元素
    let text = ''
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent
      }
    }
    return text
  }

  function processNode(node, parentStyle = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim()
      if (text) {
        return new TextRun({
          text,
          bold: parentStyle.bold,
          italics: parentStyle.italics,
          color: parentStyle.color,
          size: parentStyle.size,
          font: parentStyle.font
        })
      }
      return null
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null
    }

    const tagName = node.tagName?.toUpperCase()

    // 检查是否是图表容器
    if (tagName === 'DIV' && node.classList.contains('echarts-code-block')) {
      const chartContainer = node.querySelector('.echarts-code-chart-container')
      if (chartContainer) {
        // 这是一个图表节点
        const imgData = chartImages[chartImageIndex]
        const dimensions = chartDimensions[chartImageIndex]
        chartImageIndex++
        if (imgData && dimensions && dimensions.width > 0) {
          // docx 库的 ImageRun transformation 使用 pixels(像素) 单位
          // 限制最大宽度为 500 像素，适配 A4 文档宽度
          const maxImageWidth = 500
          // 根据实际图片宽高比计算高度
          const aspectRatio = dimensions.height / dimensions.width
          let imageHeight = Math.floor(maxImageWidth * aspectRatio)

          return new Paragraph({
            children: [
              new ImageRun({
                data: imgData,
                transformation: {
                  width: maxImageWidth,
                  height: imageHeight
                }
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 }
          })
        }
        return null
      }
    }

    // 跳过工具栏按钮等
    if (node.classList?.contains('echarts-code-edit-btn') ||
        node.classList?.contains('echarts-code-toggle-btn') ||
        node.classList?.contains('echarts-code-delete-btn')) {
      return null
    }

    // 跳过图表工具栏
    if (node.classList?.contains('echarts-code-block-toolbar')) {
      return null
    }

    // 跳过代码编辑区域（如果显示的是代码而不是图表）
    if (node.classList?.contains('echarts-code-editable')) {
      return null
    }

    switch (tagName) {
      case 'H1':
        return new Paragraph({
          children: processChildren(node, { bold: true, size: 48, font: 'Calibri', color: '000000' }),
          spacing: { after: 200, before: 200 }
        })
      case 'H2':
        return new Paragraph({
          children: processChildren(node, { bold: true, size: 36, font: 'Calibri', color: '000000' }),
          spacing: { after: 160, before: 160 }
        })
      case 'H3':
        return new Paragraph({
          children: processChildren(node, { bold: true, size: 28, font: 'Calibri', color: '000000' }),
          spacing: { after: 120, before: 120 }
        })
      case 'H4':
        return new Paragraph({
          children: processChildren(node, { bold: true, size: 24, font: 'Calibri', color: '000000' }),
          spacing: { after: 100, before: 100 }
        })
      case 'H5':
        return new Paragraph({
          children: processChildren(node, { bold: true, size: 22, font: 'Calibri', color: '000000' }),
          spacing: { after: 80, before: 80 }
        })
      case 'H6':
        return new Paragraph({
          children: processChildren(node, { bold: true, size: 20, font: 'Calibri', color: '000000' }),
          spacing: { after: 60, before: 60 }
        })
      case 'P':
        const pChildren = processChildren(node)
        if (pChildren.length > 0) {
          return new Paragraph({ children: pChildren })
        }
        // 空段落但有内容（可能是格式文本）
        const innerText = node.textContent.trim()
        if (innerText) {
          return new Paragraph({ children: [new TextRun({ text: innerText })] })
        }
        return null
      case 'STRONG':
      case 'B':
        return new TextRun({
          text: node.textContent.trim() || getEffectiveText(node),
          bold: true,
          color: parentStyle.color,
          size: parentStyle.size,
          font: parentStyle.font
        })
      case 'EM':
      case 'I':
        return new TextRun({
          text: node.textContent.trim() || getEffectiveText(node),
          italics: true,
          bold: parentStyle.bold,
          color: parentStyle.color,
          size: parentStyle.size,
          font: parentStyle.font
        })
      case 'U':
        return new TextRun({
          text: node.textContent.trim() || getEffectiveText(node),
          underline: {},
          bold: parentStyle.bold,
          color: parentStyle.color,
          size: parentStyle.size,
          font: parentStyle.font
        })
      case 'CODE':
        if (node.parentElement?.tagName?.toUpperCase() === 'PRE') {
          return null
        }
        return new TextRun({
          text: node.textContent,
          font: 'Consolas',
          size: 20
        })
      case 'PRE':
        const codeEl = node.querySelector('code')
        const codeText = codeEl?.textContent || node.textContent
        return new Paragraph({
          children: [new TextRun({
            text: codeText,
            font: 'Consolas',
            size: 20,
            break: 1
          })],
          shading: {
            fill: 'F6F8FA',
            color: '000000'
          },
          spacing: { after: 100, before: 100 }
        })
      case 'UL':
        const ulItems = []
        Array.from(node.children).filter(el => el.tagName?.toUpperCase() === 'LI').forEach(li => {
          ulItems.push(new Paragraph({
            children: [new TextRun({ text: li.textContent.trim() })],
            bullet: { level: 0 }
          }))
        })
        return ulItems
      case 'OL':
        const olItems = []
        Array.from(node.children).filter(el => el.tagName?.toUpperCase() === 'LI').forEach((li) => {
          olItems.push(new Paragraph({
            children: [new TextRun({ text: li.textContent.trim() })],
            numbering: { reference: 'default-numbering', level: 0 }
          }))
        })
        return olItems
      case 'BLOCKQUOTE':
        return new Paragraph({
          children: [new TextRun({
            text: node.textContent.trim(),
            italics: true
          })],
          spacing: { left: 400 },
          border: {
            left: { color: 'CCCCCC', space: 1, value: 'single', size: 3 }
          }
        })
      case 'HR':
        return new Paragraph({
          border: {
            bottom: { color: 'CCCCCC', space: 1, value: 'single', size: 3 }
          }
        })
      case 'A':
        return new TextRun({
          text: node.textContent,
          link: node.getAttribute('href'),
          color: '0066CC',
          underline: {}
        })
      case 'LI':
        // 列表项由其父级 UL/OL 处理，这里跳过
        return null
      case 'DIV':
      case 'SPAN':
        // 通用容器，递归处理，传递父级样式
        return processChildren(node, parentStyle)
      default:
        // 其他节点类型，递归处理子节点
        const results = []
        Array.from(node.childNodes).forEach(child => {
          const result = processNode(child, parentStyle)
          if (result) {
            if (Array.isArray(result)) {
              results.push(...result)
            } else {
              results.push(result)
            }
          }
        })
        return results.length > 0 ? results : null
    }
  }

  function processChildren(node, parentStyle = {}) {
    const results = []
    Array.from(node.childNodes).forEach(child => {
      const result = processNode(child, parentStyle)
      if (result) {
        if (Array.isArray(result)) {
          results.push(...result)
        } else {
          results.push(result)
        }
      }
    })
    return results
  }

  // 处理顶级子节点
  const body = element.querySelector('.ProseMirror') || element
  Array.from(body.children).forEach(child => {
    const result = processNode(child)
    if (result) {
      if (Array.isArray(result)) {
        children.push(...result)
      } else {
        children.push(result)
      }
    }
  })

  return children
}
