<template>
  <view class="grid">
    <view v-for="row in visibleRows" :key="row" class="grid-row">
      <view
        v-for="col in visibleCols"
        :key="col"
        class="grid-cell"
        :class="{
          'current-cell': currentCell.row === row && currentCell.col === col,
          'adjacent-cell': isAdjacentCell(row, col),
        }"
        :style="{
          width: cellSize + 'px',
          height: cellSize + 'px',
          left: (col - 1) * cellSize + 'px',
          top: (row - 1) * cellSize + 'px',
          backgroundColor: getCellColor(
            worldBounds.left + col - 1,
            worldBounds.top + row - 1,
          ),
        }"
        @tap="tryMoveTo(worldBounds.left + col - 1, worldBounds.top + row - 1)"
      >
        <!-- <text class="cell-coord"
          >{{ worldBounds.left + col - 1 }},{{
            worldBounds.top + row - 1
          }}</text> -->
        <view
          class="ore-indicator"
          :style="{
            backgroundColor: getCellColor(
              worldBounds.left + col - 1,
              worldBounds.top + row - 1,
            ),
          }"
        >
          <text
            class="ore-symbol"
            v-show="
              showCoal(worldBounds.left + col - 1, worldBounds.top + row - 1)
            "
            >{{
              getOreSymbol(
                worldBounds.left + col - 1,
                worldBounds.top + row - 1,
              )
            }}</text
          >
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import { type_map } from "../method.js";

const props = defineProps({
  worldOres: {
    type: Object,
    default: () => ({}),
  },
  visibleRows: {
    type: Array,
    default: () => [],
  },
  visibleCols: {
    type: Array,
    default: () => [],
  },
  worldBounds: {
    type: Object,
    default: () => ({}),
  },
  state: {
    type: Object,
    default: () => ({}),
  },
  cellSize: {
    type: Number,
    default: 0,
  },
});

const emits = defineEmits(["tryMoveTo"]);

// 是否显示矿石
const showCoal = (x, y) => {
  const key = `${x},${y}`;
  const row = props.worldOres[key];
  return row && row.break === true && row.take === false;
};

// 判断是否挖掘
const isBreak = (x, y) => {
  const key = `${x},${y}`;
  return props.worldOres[key]?.break;
};

// 获取矿石符号
const getOreSymbol = (x, y) => {
  const key = `${x},${y}`;
  const ore = props.worldOres[key];
  if (!ore) return "●";

  const symbols = {
    1: "🟫",
    2: "🪨",
    3: "⛓️",
    4: "🪙",
    5: "💎",
    6: "🔴",
    7: "🔮",
    8: "⚫",
  };
  return symbols[ore.type] || "●";
};

// 判断相邻格子
const isAdjacentCell = (row, col) => {
  const currentRow = currentCell.row;
  const currentCol = currentCell.col;
  const dx = Math.abs(col - currentCol);
  const dy = Math.abs(row - currentRow);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
};

// 获取格子颜色
const getCellColor = (x, y) => {
  const key = `${x},${y}`;
  const row = props.worldOres[key];
  if (!row) return type_map[1].color;
  if (row.break === false) {
    // 未挖掘
    return "#1f0a0c";
  } else if (row.break === true) {
    // 已挖掘
    return props.worldOres[key]?.color; // #B8B5A8 #6A5C4E
  }
};

// 当前格子位置
const currentCell = computed(() => ({
  row: props.state.y - props.worldBounds.top + 1,
  col: props.state.x - props.worldBounds.left + 1,
}));

const tryMoveTo = (x, y) => {
  emits("tryMoveTo", { x, y });
};
</script>

<style scoped lang="scss">
.grid {
  position: absolute;
  top: 0;
  left: 0;
}

.grid-cell {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.grid-cell.current-cell {
  border: 3px solid #ffd700;
  transform: scale(1.02);
  z-index: 5;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.grid-cell.adjacent-cell {
  border: 2px dashed rgba(255, 255, 255, 0.5);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.7;
  }
}

.ore-indicator {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-coord {
  font-size: 10px;
  color: #e9eaea;
}
</style>
