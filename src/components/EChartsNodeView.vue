<template>
  <NodeViewWrapper class="echarts-node-view" :class="{ 'is-selected': selected }">
    <div class="echarts-toolbar" v-if="selected">
      <button @click.stop="openEditor" class="echarts-edit-btn">编辑图表</button>
      <button @click.stop="deleteNode" class="echarts-delete-btn">删除</button>
    </div>
    <div ref="chartRef" class="echarts-chart-container"></div>
  </NodeViewWrapper>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import echarts from '../echarts'

const props = defineProps(nodeViewProps)

const chartRef = ref(null)
let chartInstance = null
let resizeObserver = null
let resizeTimer = null

onMounted(() => {
  // Suppress ECharts resize warning - it's harmless and resize still works
  const originalWarn = console.warn
  const originalError = console.error
  const suppressed = (msg) => typeof msg === 'string' && msg.includes('resize') && msg.includes('main process')
  const safeResize = () => {
    console.warn = (...args) => { if (!suppressed(args.join(' '))) originalWarn(...args) }
    console.error = (...args) => { if (!suppressed(args.join(' '))) originalError(...args) }
    try { chartInstance?.resize() } finally {
      console.warn = originalWarn
      console.error = originalError
    }
  }

  requestAnimationFrame(() => {
    chartInstance = echarts.init(chartRef.value)
    updateChart()
  })
  resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(safeResize, 250)
  })
  resizeObserver.observe(chartRef.value)
})

onBeforeUnmount(() => {
  chartInstance?.dispose()
  resizeObserver?.disconnect()
  clearTimeout(resizeTimer)
})

watch(() => props.node.attrs.chartData, () => {
  updateChart()
})

function updateChart() {
  try {
    const option = JSON.parse(props.node.attrs.chartData)
    chartInstance?.setOption(option, true)
  } catch {
    // Invalid JSON, skip
  }
}

function openEditor() {
  const onEdit = props.editor.extensionManager.extensions.find(e => e.name === 'echartsChart')?.options?.onEdit
  if (onEdit) {
    onEdit(props.node.attrs.chartData, props.getPos())
  }
}

function deleteNode() {
  props.deleteNode()
}

defineExpose({ openEditor })
</script>

<style scoped>
.echarts-node-view {
  position: relative;
  margin: 16px 0;
  border: 2px solid transparent;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.echarts-node-view.is-selected {
  border-color: #3b82f6;
}

.echarts-node-view:hover {
  border-color: #3b82f6;
}

.echarts-toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  z-index: 1;
}

.echarts-edit-btn,
.echarts-delete-btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.echarts-delete-btn {
  background: #e74c3c;
}

.echarts-chart-container {
  width: 100%;
  height: 400px;
}
</style>
