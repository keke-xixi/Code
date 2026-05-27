<template>
  <view class="game-grid">
    <view v-for="row in visibleRows" :key="row" class="game-grid__row">
      <view
        v-for="col in visibleCols"
        :key="col"
        class="game-grid__cell"
        :class="cellClass(row, col)"
        :style="cellStyle(row, col)"
        @tap="onCellTap(row, col)"
      >
        <view v-if="isRock(row, col)" class="game-grid__rock">
          <view class="game-grid__rock-cracks" />
          <view
            v-if="showDetector(row, col)"
            class="game-grid__scan"
            :style="detectorStyle(row, col)"
          />
        </view>

        <view
          v-else-if="showOre(row, col)"
          class="game-grid__ore"
          :class="oreClass(row, col)"
          :style="oreStyle(row, col)"
        >
          <view class="game-grid__ore-shine" />
          <view class="game-grid__ore-core" />
        </view>

        <view v-else-if="isEmpty(row, col)" class="game-grid__empty" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { ORE_TYPES } from '@/config/game.js'
import { meetsRarity } from '@/config/shop.js'

const props = defineProps({
  worldOres: { type: Object, default: () => ({}) },
  visibleRows: { type: Array, default: () => [] },
  visibleCols: { type: Array, default: () => [] },
  worldBounds: { type: Object, required: true },
  state: { type: Object, required: true },
  cellSize: { type: Number, default: 50 },
  detectorRadius: { type: Number, default: 0 },
  detectorMinRarity: { type: String, default: 'legendary' },
})

const emit = defineEmits(['move'])

const toWorld = (row, col) => ({
  x: props.worldBounds.left + col - 1,
  y: props.worldBounds.top + row - 1,
})

const getOre = (x, y) => props.worldOres[`${x},${y}`]

const currentCell = computed(() => ({
  row: props.state.y - props.worldBounds.top + 1,
  col: props.state.x - props.worldBounds.left + 1,
}))

const manhattan = (x1, y1, x2, y2) =>
  Math.abs(x1 - x2) + Math.abs(y1 - y2)

const cellClass = (row, col) => ({
  'game-grid__cell--current':
    currentCell.value.row === row && currentCell.value.col === col,
  'game-grid__cell--adjacent': isAdjacent(row, col),
})

const isAdjacent = (row, col) => {
  const dx = Math.abs(col - currentCell.value.col)
  const dy = Math.abs(row - currentCell.value.row)
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
}

const isRock = (row, col) => {
  const { x, y } = toWorld(row, col)
  const ore = getOre(x, y)
  return ore && !ore.break
}

const showOre = (row, col) => {
  const { x, y } = toWorld(row, col)
  const ore = getOre(x, y)
  return ore?.break && !ore?.take
}

const isEmpty = (row, col) => {
  const { x, y } = toWorld(row, col)
  return getOre(x, y)?.take
}

const oreMeta = (row, col) => {
  const { x, y } = toWorld(row, col)
  const ore = getOre(x, y)
  return ORE_TYPES[ore?.type] || ORE_TYPES[1]
}

const oreClass = (row, col) => {
  const meta = oreMeta(row, col)
  return [`game-grid__ore--${meta.rarity || 'common'}`]
}

const oreStyle = (row, col) => {
  const meta = oreMeta(row, col)
  return {
    '--ore-color': meta.color,
    '--ore-glow': meta.glow || meta.color,
  }
}

const showDetector = (row, col) => {
  if (props.detectorRadius <= 0) return false
  const { x, y } = toWorld(row, col)
  const ore = getOre(x, y)
  if (!ore || ore.break) return false
  const meta = ORE_TYPES[ore.type] || ORE_TYPES[1]
  if (!meetsRarity(meta.rarity, props.detectorMinRarity)) return false
  return (
    manhattan(x, y, props.state.x, props.state.y) <= props.detectorRadius
  )
}

const detectorStyle = (row, col) => {
  const meta = oreMeta(row, col)
  return {
    backgroundColor: meta.color,
    boxShadow: `0 0 6px ${meta.glow || meta.color}`,
  }
}

const cellStyle = (row, col) => {
  const { x, y } = toWorld(row, col)
  const ore = getOre(x, y)
  let bg = '#141820'
  if (ore?.break && !ore?.take) bg = '#1e2430'
  else if (ore?.take) bg = '#12161c'
  else if (ore) bg = '#0d0a0c'

  return {
    width: props.cellSize + 'px',
    height: props.cellSize + 'px',
    left: (col - 1) * props.cellSize + 'px',
    top: (row - 1) * props.cellSize + 'px',
    backgroundColor: bg,
  }
}

const onCellTap = (row, col) => {
  const { x, y } = toWorld(row, col)
  emit('move', { x, y })
}
</script>

<style scoped lang="scss">
.game-grid {
  position: absolute;
  top: 0;
  left: 0;
}

.game-grid__cell {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-sizing: border-box;
  overflow: hidden;
}

.game-grid__cell--current {
  border-color: rgba(255, 215, 0, 0.55);
  box-shadow: inset 0 0 12px rgba(255, 215, 0, 0.15);
  z-index: 4;
}

.game-grid__cell--adjacent {
  border-color: rgba(255, 255, 255, 0.12);
}

.game-grid__rock {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1a1210 0%, #2a1f18 40%, #1a1412 100%);
  position: relative;
}

.game-grid__rock-cracks {
  position: absolute;
  inset: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.06);
  border-radius: 2px;
}

.game-grid__scan {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  animation: scan-pulse 1.2s ease-in-out infinite;
}

@keyframes scan-pulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

.game-grid__ore {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  border-radius: 6px;
  transform: rotate(45deg);
  background: var(--ore-color);
  box-shadow:
    0 0 12px var(--ore-glow),
    inset 2px 2px 6px rgba(255, 255, 255, 0.35),
    inset -2px -2px 6px rgba(0, 0, 0, 0.35);
}

.game-grid__ore-core {
  position: absolute;
  inset: 6px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.45), transparent);
  border-radius: 2px;
}

.game-grid__ore-shine {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  animation: ore-sparkle 2s ease-in-out infinite;
}

.game-grid__ore--rare,
.game-grid__ore--epic,
.game-grid__ore--legendary {
  animation: ore-pulse 1.2s ease-in-out infinite;
}

.game-grid__ore--legendary {
  animation-duration: 0.85s;
}

.game-grid__empty {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, #1a2028 0%, #12161c 70%);
}

@keyframes ore-sparkle {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes ore-pulse {
  0%,
  100% {
    transform: rotate(45deg) scale(1);
  }
  50% {
    transform: rotate(45deg) scale(1.08);
  }
}
</style>
