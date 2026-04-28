import { Table as TiptapTable } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'

export const Table = TiptapTable.configure({
  resizable: true,
})

export { TableRow, TableHeader, TableCell }
