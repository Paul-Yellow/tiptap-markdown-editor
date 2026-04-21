import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
      scale: 2,  // 提高清晰度
      useCORS: true,  // 支持跨域图片
      logging: false,
      backgroundColor: '#ffffff'
    })

    // 创建 PDF (A4 尺寸)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = 210  // A4 宽度 mm
    const pageHeight = 297  // A4 高度 mm
    const margin = 10  // 边距 mm

    // 计算图片尺寸
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 将 canvas 转为图片数据
    const imgData = canvas.toDataURL('image/png')

    // 分页处理
    let position = margin
    const contentHeight = imgHeight

    // 第一页
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)

    // 如果内容超过一页，添加更多页
    let renderedHeight = pageHeight - margin
    while (renderedHeight < contentHeight + margin) {
      pdf.addPage()
      position = margin - renderedHeight
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      renderedHeight += pageHeight - margin * 2
    }

    // 下载 PDF
    pdf.save(filename)

  } catch (error) {
    console.error('PDF 导出失败:', error)
    alert('PDF 导出失败，请重试')
  } finally {
    // 移除加载提示
    document.body.removeChild(loadingTip)
  }
}