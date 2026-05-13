import MarkdownEditor from './components/MarkdownEditor/index.vue'
import ExportPdfBtn from './components/ExportPdfBtn.vue'
import ExportDocxBtn from './components/ExportDocxBtn.vue'
import { EChartsNode } from './EChartsNode'
import { CodeBlockWithCharts } from './extensions/CodeBlockWithCharts'
import { MarkdownInputRules } from './extensions/MarkdownInputRules'
import { SlashMenuExtension } from './extensions/SlashMenuExtension'
import { BlockButtonsExtension, initBlockButtons, updateBlockButtons } from './extensions/BlockButtonsExtension'
import { Table, TableRow, TableHeader, TableCell } from './extensions/Table'
import { menuItems } from './components/SlashMenu/menuItems.js'
import { FontFamily, TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-text-style/color'
import TextAlign from '@tiptap/extension-text-align'

const install = (app) => {
  app.component('MarkdownEditor', MarkdownEditor)
  app.component('ExportPdfBtn', ExportPdfBtn)
  app.component('ExportDocxBtn', ExportDocxBtn)
}

export {
  MarkdownEditor,
  ExportPdfBtn,
  ExportDocxBtn,
  EChartsNode,
  CodeBlockWithCharts,
  MarkdownInputRules,
  SlashMenuExtension,
  BlockButtonsExtension,
  initBlockButtons,
  updateBlockButtons,
  Table,
  TableRow,
  TableHeader,
  TableCell,
  FontFamily,
  TextStyle,
  Color,
  TextAlign,
  menuItems,
}

export default { install }
