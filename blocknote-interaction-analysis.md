# BlockNote 编辑器交互分析（详细版）

> 分析来源：https://www.blocknotejs.org/demo#nv81l
> 生成时间：2026-04-16

---

## 目录

1. [产品概述](#一产品概述)
2. [核心概念](#二核心概念)
3. [块级交互](#三块级交互)
4. [内联内容交互](#四内联内容交互)
5. [光标与选择交互](#五光标与选择交互)
6. [事件系统](#六事件系统)
7. [UI 组件交互](#七ui-组件交互)
8. [快捷键完整列表](#八快捷键完整列表)
9. [实时协作交互](#九实时协作交互)
10. [AI 集成交互](#十ai-集成交互)

---

## 一、产品概述

**BlockNote** 是一个基于 React 的块级富文本编辑器，提供类似 Notion 的编辑体验。

### 核心特点

| 特性 | 描述 |
|------|------|
| **块级架构** | 文档由可拖拽的块组成 |
| **实时协作** | 基于 Yjs 的多人实时编辑 |
| **AI 原生** | 内置 AI SDK |
| **本地优先** | 支持离线编辑和无缝同步 |
| **高度可定制** | 支持自定义块类型、UI 组件和主题 |

---

## 二、核心概念

### 2.1 块（Block）结构

```typescript
type Block = {
  id: string;                    // 唯一标识符
  type: string;                  // 块类型
  props: Record<string, boolean | number | string>;  // 块属性
  content: InlineContent[] | TableContent | undefined;  // 内容
  children: Block[];             // 嵌套子块
};
```

### 2.2 默认块属性

```typescript
type DefaultBlockProps = {
  backgroundColor: string;       // 默认: "default"
  textColor: string;             // 默认: "default"
  textAlignment: "left" | "center" | "right" | "justify";  // 默认: "left"
};
```

### 2.3 PartialBlock（创建/更新用）

```typescript
type PartialBlock = {
  id?: string;                   // 自动生成
  type?: string;                 // 块类型
  props?: Partial<Record<string, any>>;  // 块属性
  content?: string | InlineContent[] | TableContent;  // 内容
  children?: PartialBlock[];     // 嵌套子块
};
```

### 2.4 内联内容类型

```typescript
// 样式文本
type StyledText = {
  type: "text";
  text: string;
  styles: Styles;
};

// 链接
type Link = {
  type: "link";
  content: StyledText[];
  href: string;
};

// 默认样式
type Styles = {
  bold?: boolean;        // 粗体
  italic?: boolean;      // 斜体
  underline?: boolean;   // 下划线
  strike?: boolean;      // 删除线
  code?: boolean;        // 代码
  textColor?: string;    // 文本颜色
  backgroundColor?: string;  // 背景色
};
```

---

## 三、块级交互

### 3.1 读取块

#### 获取整个文档
```typescript
const blocks = editor.document;  // 获取所有顶级块
```

#### 获取特定块
```typescript
// 获取单个块
const block = editor.getBlock("block-123");

// 获取前一个块
const prevBlock = editor.getPrevBlock("block-123");

// 获取后一个块
const nextBlock = editor.getNextBlock("block-123");

// 获取父块（用于嵌套块）
const parentBlock = editor.getParentBlock("nested-block-123");
```

#### 遍历所有块
```typescript
editor.forEachBlock((block) => {
  console.log(`Block ${block.id}: ${block.type}`);
  return true;  // 返回 true 继续遍历，false 停止
}, false);  // false = 正序遍历，true = 倒序遍历
```

### 3.2 创建块

```typescript
editor.insertBlocks(
  blocksToInsert: PartialBlock[],
  referenceBlock: BlockIdentifier,  // 参考块ID
  placement: "before" | "after" = "before"
);
```

**示例：**
```typescript
// 在现有块之前插入段落
editor.insertBlocks(
  [{ type: "paragraph", content: "新段落" }],
  "existing-block-id",
  "before"
);

// 在现有块之后插入多个块
editor.insertBlocks(
  [
    { type: "heading", content: "新章节", props: { level: 2 } },
    { type: "paragraph", content: "章节内容" },
  ],
  "existing-block-id",
  "after"
);

// 插入带嵌套子块的块
editor.insertBlocks(
  [{
    type: "heading",
    content: "父标题",
    children: [
      { type: "paragraph", content: "子段落 1" },
      { type: "paragraph", content: "子段落 2" }
    ]
  }],
  "reference-block-id",
  "after"
);
```

### 3.3 更新块

```typescript
editor.updateBlock(
  blockToUpdate: BlockIdentifier,
  update: PartialBlock
);
```

**示例：**
```typescript
// 将段落改为标题
editor.updateBlock("block-123", {
  type: "heading",
  props: { level: 2 },
});

// 只更新内容
editor.updateBlock("block-123", {
  content: "更新后的内容",
});

// 更新多个属性
editor.updateBlock("block-123", {
  type: "heading",
  content: "新标题文本",
  props: { level: 1, backgroundColor: "yellow" },
});
```

### 3.4 删除块

```typescript
// 删除单个块
editor.removeBlocks(["block-123"]);

// 删除多个块
editor.removeBlocks(["block-123", "block-456", "block-789"]);
```

### 3.5 替换块

```typescript
editor.replaceBlocks(
  blocksToRemove: BlockIdentifier[],
  blocksToInsert: PartialBlock[]
);
```

**示例：**
```typescript
// 将段落替换为标题
editor.replaceBlocks(
  ["paragraph-block"],
  [{ type: "heading", content: "新标题", props: { level: 2 } }]
);

// 替换多个块
editor.replaceBlocks(
  ["block-1", "block-2"],
  [
    { type: "paragraph", content: "替换内容" },
    { type: "bulletListItem", content: "列表项" },
  ]
);
```

### 3.6 移动块

```typescript
// 将选中的块向上移动
editor.moveBlocksUp();

// 将选中的块向下移动
editor.moveBlocksDown();
```

### 3.7 嵌套块（缩进/取消缩进）

```typescript
// 检查是否可以嵌套
if (editor.canNestBlock()) {
  editor.nestBlock();  // 缩进（成为前一个块的子块）
}

// 检查是否可以取消嵌套
if (editor.canUnnestBlock()) {
  editor.unnestBlock();  // 取消缩进
}
```

**用户交互方式：**
- `Tab` 键：缩进（创建子块）
- `Shift + Tab` 键：取消缩进

### 3.8 块拖拽交互

**用户操作：**
1. 鼠标悬停在块左侧，出现拖拽手柄（6个点或拖拽图标）
2. 按住手柄拖动块
3. 拖动时显示放置位置指示器（蓝色线条）
4. 释放鼠标放置块

**放置位置：**
- 放在块之前
- 放在块之后
- 嵌套为子块（拖到块右侧）

---

## 四、内联内容交互

### 4.1 插入内联内容

```typescript
editor.insertInlineContent(
  content: PartialInlineContent,
  options?: { updateSelection?: boolean }
);
```

**PartialInlineContent 类型：**
```typescript
type PartialInlineContent = string | (string | PartialLink | StyledText)[];
```

**示例：**
```typescript
// 插入纯文本
editor.insertInlineContent("Hello, world!");

// 插入带样式的文本
editor.insertInlineContent([
  {
    type: "text",
    text: "粗体和斜体",
    styles: { bold: true, italic: true }
  }
]);

// 插入混合内容
editor.insertInlineContent([
  "普通文本 ",
  { type: "text", text: "粗体", styles: { bold: true } },
  " 和 ",
  { type: "link", content: "链接", href: "https://example.com" }
]);

// 插入带样式的链接
editor.insertInlineContent([
  {
    type: "link",
    content: [
      { type: "text", text: "访问 ", styles: {} },
      { type: "text", text: "BlockNote", styles: { bold: true } }
    ],
    href: "https://blocknotejs.org"
  }
]);

// 插入带颜色样式的文本
editor.insertInlineContent([
  "这是",
  { type: "text", text: "重要", styles: { bold: true, textColor: "red" } },
  "内容"
]);
```

### 4.2 读取内联内容

```typescript
// 获取选中的纯文本
const selectedText = editor.getSelectedText();

// 获取当前光标位置的激活样式
const activeStyles = editor.getActiveStyles();
console.log("激活样式:", activeStyles);
// 输出: { bold: true, italic: false, textColor: "red", ... }

// 获取选中的链接
const selectedLink = editor.getSelectedLink();
```

### 4.3 文本样式操作

**添加/切换样式：**
```typescript
// 切换粗体
editor.toggleStyles({ bold: true });

// 添加斜体
editor.addStyles({ italic: true });

// 移除下划线
editor.removeStyles({ underline: true });

// 设置文本颜色
editor.addStyles({ textColor: "blue" });

// 设置背景色
editor.addStyles({ backgroundColor: "yellow" });
```

**样式快捷命令：**
- `/bold` - 粗体
- `/italic` - 斜体
- `/underline` - 下划线
- `/strike` - 删除线
- `/code` - 内联代码

### 4.4 链接操作

```typescript
// 创建链接
editor.createLink("https://example.com", "链接文本");

// 获取当前选中的链接
const link = editor.getSelectedLink();
if (link) {
  console.log("链接地址:", link.href);
  console.log("链接文本:", link.content);
}
```

---

## 五、光标与选择交互

### 5.1 文本光标位置

```typescript
type TextCursorPosition = {
  block: Block;                    // 光标所在块
  prevBlock: Block | undefined;    // 同级前一个块
  nextBlock: Block | undefined;    // 同级后一个块
  parentBlock: Block | undefined;  // 父块（如果是嵌套块）
};
```

**获取光标位置：**
```typescript
const cursorPos = editor.getTextCursorPosition();
console.log("光标所在块:", cursorPos.block.id);
console.log("前一个块:", cursorPos.prevBlock?.id);
console.log("后一个块:", cursorPos.nextBlock?.id);
console.log("父块:", cursorPos.parentBlock?.id);
```

**设置光标位置：**
```typescript
// 将光标设置到块的开头
editor.setTextCursorPosition(blockId, "start");

// 将光标设置到块的末尾
editor.setTextCursorPosition(blockId, "end");
```

### 5.2 选择操作

```typescript
type Selection = {
  blocks: Block[];  // 选中的所有块（包括嵌套块）
};
```

**获取当前选择：**
```typescript
const selection = editor.getSelection();
if (selection) {
  console.log("选中的块数:", selection.blocks.length);
  selection.blocks.forEach(block => {
    console.log("选中块:", block.id, block.type);
  });
}
```

**设置选择：**
```typescript
// 选择从 startBlock 到 endBlock 之间的所有块
editor.setSelection(startBlockId, endBlockId);
```

**注意：**
- 两个块都必须包含内容
- 选择范围从第一个块的开头到最后一个块的末尾
- 如果块不存在或没有内容会抛出错误

---

## 六、事件系统

### 6.1 编辑器生命周期事件

```typescript
// 编辑器挂载完成
const cleanupMount = editor.onMount(() => {
  console.log("编辑器已挂载");
});

// 编辑器卸载
const cleanupUnmount = editor.onUnmount(() => {
  console.log("编辑器已卸载");
});
```

### 6.2 内容变化事件

```typescript
const cleanupChange = editor.onChange((editor, { getChanges }) => {
  console.log("编辑器内容已变化");
  
  // 获取详细的变化信息
  const changes = getChanges();
  console.log("变化详情:", changes);
  
  // 保存内容、更新 UI 等
});
```

### 6.3 选择变化事件

```typescript
const cleanupSelection = editor.onSelectionChange((editor) => {
  console.log("选择已变化");
  
  // 获取当前选择信息
  const selection = editor.getSelection();
  const textCursorPosition = editor.getTextCursorPosition();
  
  console.log("当前选择:", selection);
  console.log("光标位置:", textCursorPosition);
});
```

### 6.4 变化前拦截事件

```typescript
const cleanupBeforeChange = editor.onBeforeChange(({ getChanges, tr }) => {
  const changes = getChanges();
  
  // 如果包含插入操作，取消变化
  if (changes.some((change) => change.type === "insert")) {
    // 返回 false 取消变化
    return false;
  }
  
  // 返回 true 或 undefined 允许变化
  return true;
});
```

### 6.5 变化类型详解

```typescript
type BlocksChanged = Array<
  | {
      type: "insert" | "delete";
      block: Block;
      source: BlockChangeSource;
      prevBlock: undefined;
    }
  | {
      type: "update";
      block: Block;
      source: BlockChangeSource;
      prevBlock: Block;  // 更新前的块状态
    }
  | {
      type: "move";
      source: BlockChangeSource;
      block: Block;
      prevBlock: Block;
      prevParent?: Block;     // 移动前的父块
      currentParent?: Block;  // 移动后的父块
    }
>;
```

### 6.6 变化来源

```typescript
type BlockChangeSource = {
  type:
    | "local"        // 本地用户触发（默认）
    | "paste"        // 粘贴操作
    | "drop"         // 拖拽放置
    | "undo"         // 撤销（仅本地）
    | "redo"         // 重做（仅本地）
    | "undo-redo"    // 撤销/重做（协作模式）
    | "yjs-remote";  // 远程用户（协作模式）
};
```

### 6.7 清理事件监听

```typescript
// 所有事件回调都返回清理函数
const cleanup = editor.onChange(() => { /* ... */ });

// 稍后清理事件监听
cleanup();
```

---

## 七、UI 组件交互

### 7.1 命令菜单（Slash Menu）

**触发方式：**
- 在空行输入 `/`
- 或使用快捷键

**菜单内容：**

| 命令 | 功能 |
|------|------|
| `/heading` | 转换为标题 |
| `/paragraph` | 转换为段落 |
| `/bullet` | 无序列表 |
| `/numbered` | 有序列表 |
| `/todo` | 待办列表 |
| `/quote` | 引用块 |
| `/code` | 代码块 |
| `/divider` | 分割线 |
| `/image` | 插入图片 |
| `/table` | 插入表格 |
| `/link` | 插入链接 |

**交互流程：**
1. 用户输入 `/`
2. 显示命令菜单（浮动面板）
3. 用户输入过滤文本或选择命令
4. 执行对应操作

### 7.2 格式化工具栏

**显示时机：**
- 选中文本时自动显示
- 浮动在选区上方

**工具栏内容：**

| 按钮 | 功能 | 快捷键 |
|------|------|--------|
| **B** | 粗体 | `Cmd/Ctrl + B` |
| *I* | 斜体 | `Cmd/Ctrl + I` |
| U | 下划线 | `Cmd/Ctrl + U` |
| S | 删除线 | - |
| `</>` | 内联代码 | `Cmd/Ctrl + E` |
| 🔗 | 链接 | `Cmd/Ctrl + K` |
| 🎨 | 文本颜色 | - |
| 🖍️ | 高亮颜色 | - |
| ↔️ | 对齐方式 | - |

### 7.3 侧边菜单（Side Menu）

**显示位置：** 块左侧

**内容：**
- **拖拽手柄**（6个点）：拖拽移动块
- **添加按钮**（+）：快速添加块
- **块类型图标**：显示当前块类型

**交互：**
- 悬停显示
- 点击 + 打开块类型选择器
- 拖动手柄移动块

### 7.4 链接工具栏

**触发：** 点击链接或 `Cmd/Ctrl + K`

**功能：**
- 编辑链接地址
- 编辑链接文本
- 打开链接
- 移除链接

### 7.5 图片工具栏

**触发：** 点击图片

**功能：**
- 替换图片
- 调整大小
- 对齐方式
- 添加说明
- 删除图片

### 7.6 表格工具栏

**触发：** 点击表格

**功能：**
- 添加/删除行
- 添加/删除列
- 合并单元格
- 拆分单元格
- 表头设置

---

## 八、快捷键完整列表

### 8.1 文本格式化

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + B` | 粗体 |
| `Cmd/Ctrl + I` | 斜体 |
| `Cmd/Ctrl + U` | 下划线 |
| `Cmd/Ctrl + E` | 内联代码 |
| `Cmd/Ctrl + K` | 插入/编辑链接 |
| `Cmd/Ctrl + A` | 全选 |
| `Cmd/Ctrl + C` | 复制 |
| `Cmd/Ctrl + V` | 粘贴 |
| `Cmd/Ctrl + X` | 剪切 |
| `Cmd/Ctrl + Z` | 撤销 |
| `Cmd/Ctrl + Shift + Z` | 重做 |

### 8.2 块操作

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + Shift + ↑` | 上移块 |
| `Cmd/Ctrl + Shift + ↓` | 下移块 |
| `Tab` | 缩进（创建子块） |
| `Shift + Tab` | 取消缩进 |
| `Enter` | 创建新块 |
| `Shift + Enter` | 块内换行（软回车） |
| `Backspace` | 删除块（在块开头） |
| `Delete` | 删除选中内容 |
| `/` | 打开命令菜单 |
| `Escape` | 关闭菜单/取消选择 |

### 8.3 块类型快捷输入

| 输入 | 结果 |
|------|------|
| `#` + 空格 | 标题 1 |
| `##` + 空格 | 标题 2 |
| `###` + 空格 | 标题 3 |
| `-` + 空格 | 无序列表 |
| `*` + 空格 | 无序列表 |
| `1.` + 空格 | 有序列表 |
| `[]` + 空格 | 待办列表 |
| `>` + 空格 | 引用块 |
| `---` | 分割线 |
| ` ``` ` | 代码块 |

### 8.4 选择操作

| 快捷键 | 功能 |
|--------|------|
| `Shift + ↑/↓` | 向上/向下选择块 |
| `Shift + ←/→` | 向左/向右选择字符 |
| `Shift + Cmd/Ctrl + ←/→` | 选择到行首/行尾 |
| `Shift + Click` | 多选块 |

---

## 九、实时协作交互

### 9.1 协作光标

**视觉表现：**
- 其他用户的光标显示为彩色竖线
- 光标旁显示用户名标签
- 标签显示模式：
  - `activity`：光标移动时显示（默认）
  - `always`：始终显示

**配置：**
```typescript
collaboration: {
  provider: YjsProvider,
  fragment: doc.getXmlFragment("document-store"),
  user: {
    name: "用户名",
    color: "#ff0000",  // 用户标识颜色
  },
  showCursorLabels: "activity" | "always",
}
```

### 9.2 用户交互

**多人同时编辑：**
- 实时看到其他用户的输入
- 实时看到其他用户的选择
- 冲突自动解决（基于 CRDT）

**离线支持：**
- 离线时自动保存到本地
- 恢复连接后自动同步
- 支持冲突解决

### 9.3 协作提供商

| 提供商 | 类型 | 适用场景 |
|--------|------|----------|
| **Liveblocks** | 托管 | 生产环境 |
| **PartyKit** | 无服务器 | Cloudflare 部署 |
| **Y-Sweet** | 开源/托管 | 灵活部署 |
| **Hocuspocus** | Node.js | 自托管 |
| **y-webrtc** | P2P | 开发测试 |
| **y-websocket** | WebSocket | 自定义服务器 |
| **y-indexeddb** | 本地 | 离线存储 |

---

## 十、AI 集成交互（XL 包）

### 10.1 AI 功能命令

| 命令 | 功能 |
|------|------|
| `/ai` | 打开 AI 助手 |
| AI 续写 | 基于上下文生成内容 |
| AI 润色 | 改写和优化文本 |
| AI 总结 | 生成文档摘要 |
| AI 问答 | 基于文档内容问答 |

### 10.2 AI 集成配置

```typescript
import { BlockNoteEditor } from "@blocknote/core";
import { AIExtension } from "@blocknote/xl-ai";

const editor = BlockNoteEditor.create({
  extensions: [
    AIExtension.configure({
      // 配置 AI 模型
      model: openai("gpt-4"),
      // 配置 RAG
      rag: {
        vectorStore: /* ... */,
      },
    }),
  ],
});
```

### 10.3 AI 交互流程

1. **触发 AI**：输入 `/ai` 或点击 AI 按钮
2. **输入提示**：描述需要的操作
3. **AI 处理**：调用配置的 AI 模型
4. **应用结果**：将 AI 生成内容插入编辑器

---

## 十一、数据导入导出

### 11.1 导出格式

| 格式 | 包 | 说明 |
|------|-----|------|
| **JSON** | Core | 默认文档格式 |
| **HTML** | Core | 网页格式 |
| **Markdown** | Core | Markdown 格式 |
| **PDF** | XL | PDF 文档 |
| **Word (.docx)** | XL | Microsoft Word |
| **ODT** | XL | OpenDocument |

### 11.2 导入格式

| 格式 | 支持 |
|------|------|
| **JSON** | ✓ |
| **HTML** | ✓ |
| **Markdown** | ✓ |
| **Word** | XL 包 |

---

## 十二、参考资源

- **官网**: https://www.blocknotejs.org
- **文档**: https://www.blocknotejs.org/docs
- **GitHub**: https://github.com/TypeCellOS/BlockNote
- **Demo**: https://www.blocknotejs.org/demo
- **Discord**: https://discord.gg/Qc2QTTH5dF
- **NPM**: https://www.npmjs.com/package/@blocknote/core

---

*文档生成时间: 2026-04-16*
*分析工具: OpenClaw*
