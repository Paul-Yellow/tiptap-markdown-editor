import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

// 创建代码块扩展，支持语法高亮
// 使用 codeBlockLowlight 名称避免与 CodeBlockWithCharts 冲突
export const CodeBlock = CodeBlockLowlight.configure({
  lowlight: createLowlight(common),
  defaultLanguage: null,
  HTMLAttributes: {
    class: 'code-block'
  }
})

export { CodeBlockLowlight }
