import { Document, Packer, Paragraph, ImageRun, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx'
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
      '.slash-menu',
      '.format-toolbar',
      '.chart-edit-overlay',
      '.table-controls'
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

  // 解析表格为真正的 docx Table
  function parseTable(tableNode) {
    const rows = Array.from(tableNode.querySelectorAll('tr'))
    if (rows.length === 0) return null

    const docxRows = []

    rows.forEach((row) => {
      const cells = Array.from(row.children)
      const tableCells = cells.map(cell => {
        const tagName = cell.tagName?.toUpperCase()
        const isHeader = tagName === 'TH'
        const cellBlocks = processChildren(cell, { bold: isHeader, size: 20 })

        // 展平 Paragraph 嵌套：TableCell 接受 Paragraph 作为 children，
        // 所以直接把 processChildren 返回的 Paragraph 对象作为 TableCell children
        const tableCellChildren = cellBlocks.length > 0 ? cellBlocks : [
          new Paragraph({
            children: [new TextRun({ text: '', size: 20 })],
            spacing: { before: 20, after: 20 }
          })
        ]

        return new TableCell({
          width: cells.length > 0 ? { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE } : undefined,
          shading: isHeader ? { fill: 'F3F4F6', type: 'clear' } : undefined,
          children: tableCellChildren
        })
      })

      docxRows.push(new TableRow({ children: tableCells }))
    })

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: docxRows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }
      }
    })
  }

  function processNode(node, parentStyle = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent
      if (text.length > 0) {
        const runProps = {
          text,
          bold: parentStyle.bold || undefined,
          italics: parentStyle.italics || undefined,
        }
        if (parentStyle.underline) {
          runProps.underline = {}
        }
        if (parentStyle.strike) {
          runProps.strikeThrough = true
        }
        if (parentStyle.color) {
          runProps.color = parentStyle.color
        }
        if (parentStyle.size) {
          runProps.size = parentStyle.size
        }
        if (parentStyle.font) {
          runProps.font = parentStyle.font
        }
        if (parentStyle.link) {
          runProps.link = parentStyle.link
        }
        return new TextRun(runProps)
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
        if (parentStyle._noBlock) {
          // 在列表/表格内，<p> 不创建新 Paragraph，直接返回子 TextRuns
          return processChildren(node, parentStyle)
        }
        const pChildren = processChildren(node)
        if (pChildren.length > 0) {
          return new Paragraph({ children: pChildren })
        }
        // 空段落但有内容（可能是格式文本）
        const innerText = node.textContent.trim()
        if (innerText) {
          return new Paragraph({ children: [new TextRun({ text: innerText })] })
        }
        // 空白段落保留但不设置多余内容
        const innerWhitespace = node.textContent
        if (innerWhitespace.length > 0) {
          return new Paragraph({ children: [new TextRun({ text: innerWhitespace })] })
        }
        return null
      case 'STRONG':
      case 'B':
        return processChildren(node, { ...parentStyle, bold: true })
      case 'EM':
      case 'I':
        return processChildren(node, { ...parentStyle, italics: true })
      case 'U':
        return processChildren(node, { ...parentStyle, underline: true })
      case 'S':
      case 'STRIKE':
      case 'DEL':
        return processChildren(node, { ...parentStyle, strike: true })
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
        // 将代码按换行符分割成多行
        const lines = codeText.split('\n')
        return new Paragraph({
          children: lines.map((line, index) => [
            new TextRun({
              text: line + (index < lines.length - 1 ? '\n' : ''),
              font: 'Consolas',
              size: 20,
              color: 'D4D4D4'
            })
          ]).flat(),
          shading: {
            fill: '1E1E1E',
            color: 'D4D4D4'
          },
          spacing: { after: 100, before: 100 }
        })
      case 'UL':
        const ulItems = []
        Array.from(node.children).filter(el => el.tagName?.toUpperCase() === 'LI').forEach(li => {
          // _noBlock: true 让 li 内的 <p> 不创建新 Paragraph，直接返回 TextRuns
          ulItems.push(new Paragraph({
            children: processChildren(li, { ...parentStyle, _noBlock: true }).filter(Boolean),
            bullet: { level: 0 }
          }))
        })
        return ulItems
      case 'OL':
        const olItems = []
        Array.from(node.children).filter(el => el.tagName?.toUpperCase() === 'LI').forEach((li) => {
          olItems.push(new Paragraph({
            children: processChildren(li, { ...parentStyle, _noBlock: true }).filter(Boolean),
            numbering: { reference: 'default-numbering', level: 0 }
          }))
        })
        return olItems
      case 'BLOCKQUOTE':
        return new Paragraph({
          children: processChildren(node, { italics: true }),
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
        // 处理链接内的子节点，每个TextRun都带上link和underline
        return processChildren(node, { ...parentStyle, link: node.getAttribute('href'), underline: true, color: '0066CC' })
      case 'TABLE':
        // 处理表格为真正的 docx Table
        return parseTable(node)
      case 'TR':
      case 'TH':
      case 'TD':
        // 表格行和单元格由 parseTable 统一处理，这里跳过
        return null
      case 'LI':
        // 列表项由其父级 UL/OL 处理，这里跳过
        return null
      case 'DIV':
      case 'SPAN':
        // 提取内联样式并传递给子节点
        const style = { ...parentStyle }
        const inlineStyle = node.getAttribute('style')
        if (inlineStyle) {
          const declarations = inlineStyle.split(';')
          declarations.forEach(d => {
            const [prop, ...valParts] = d.split(':')
            const val = valParts.join(':').trim().toLowerCase()
            if (prop.trim().toLowerCase() === 'font-weight' && (val === 'bold' || parseInt(val) >= 700)) {
              style.bold = true
            } else if (prop.trim().toLowerCase() === 'font-style' && val === 'italic') {
              style.italics = true
            } else if (prop.trim().toLowerCase() === 'font-family') {
              // 移除引号
              style.font = val.replace(/['"]/g, '')
            } else if (prop.trim().toLowerCase() === 'text-decoration') {
              if (val.includes('underline')) style.underline = true
              if (val.includes('line-through')) style.strike = true
            }
          })
        }
        return processChildren(node, style)
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
