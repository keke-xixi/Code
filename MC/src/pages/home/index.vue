<template>
  <view
    class="game-page"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    :style="{ height: screenHeight + 'px' }"
  >
    <GameHud
      :depth="depth"
      :layer-title="layerInfo.title"
      :layer-progress="layerProgress"
      :next-hint="nextHint"
      :money="allMoney"
      :diamonds="diamonds"
      :combo="comboCount"
      :max-depth="maxDepth"
      :total-collected="totalCollected"
      :current-ore="currentOre"
      @save="saveGame"
      @settings="openSettings"
      @gacha="openGacha"
      @shop="openShop"
    />

    <FloatingRewards :items="floatingItems" />

    <view class="game-page__world" :style="worldStyle">
      <GameGrid
        :world-ores="worldOres"
        :visible-rows="visibleRows"
        :visible-cols="visibleCols"
        :world-bounds="worldBounds"
        :state="state"
        :cell-size="cellSize"
        :detector-radius="upgradeEffects.detectorRadius"
        :detector-min-rarity="upgradeEffects.showRarity"
        @move="tryMoveTo"
      />

      <view class="game-page__player" :style="playerStyle">
        <MinerCharacter
          :mining="isMining"
          :walking="isMoving"
          :scale="scale"
          :pick-color="upgradeEffects.pickColor"
          :pick-glow="upgradeEffects.pickGlow"
        />
      </view>
    </view>

    <DirectionalPad @move="moveBox" />

    <GameShop
      ref="shopModalRef"
      :money="allMoney"
      :diamonds="diamonds"
      :owned="ownedUpgrades"
      @buy="buyUpgrade"
      @exchange="exchangeDiamond"
    />

    <GameSettingsModal
      ref="settingsModalRef"
      :scale="scale"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @game-reset="gameReset"
    />

    <ToastMessage ref="toastRef" :duration="1400" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import GameHud from '@/components/game/GameHud.vue'
import GameGrid from '@/components/game/GameGrid.vue'
import MinerCharacter from '@/components/game/MinerCharacter.vue'
import DirectionalPad from '@/components/game/DirectionalPad.vue'
import GameSettingsModal from '@/components/game/GameSettingsModal.vue'
import GameShop from '@/components/game/GameShop.vue'
import FloatingRewards from '@/components/game/FloatingRewards.vue'
import ToastMessage from '@/components/toast/toastMessage.vue'
import { useMiningGame } from '@/composables/useMiningGame.js'

const toastRef = ref(null)

const {
  screenHeight,
  cellSize,
  worldBounds,
  worldOres,
  scale,
  offsetX,
  offsetY,
  isAnimating,
  isMoving,
  isMining,
  allMoney,
  diamonds,
  reloadFromSave,
  state,
  currentOre,
  depth,
  layerInfo,
  layerProgress,
  nextHint,
  comboCount,
  maxDepth,
  totalCollected,
  floatingItems,
  ownedUpgrades,
  upgradeEffects,
  visibleRows,
  visibleCols,
  worldWidth,
  worldHeight,
  settingsModalRef,
  shopModalRef,
  tryMoveTo,
  moveBox,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  openSettings,
  openGacha,
  openShop,
  buyUpgrade,
  exchangeDiamond,
  saveGame,
  gameReset,
  zoomIn,
  zoomOut,
} = useMiningGame({ toastRef })

onShow(() => {
  reloadFromSave()
})

const worldStyle = computed(() => ({
  width: worldWidth.value + 'px',
  height: worldHeight.value + 'px',
  transform: `scale(${scale.value}) translate(${offsetX.value}px, ${offsetY.value}px)`,
  transition: isAnimating.value ? 'transform 0.3s ease' : 'none',
}))

const playerStyle = computed(() => ({
  width: cellSize + 'px',
  height: cellSize + 'px',
  left: (state.x - worldBounds.left) * cellSize + 'px',
  top: (state.y - worldBounds.top) * cellSize + 'px',
  transition: isMoving.value ? 'left 0.2s ease, top 0.2s ease' : 'none',
}))
</script>

<style scoped lang="scss">
.game-page {
  width: 100%;
  position: relative;
  overflow: hidden;
  background: #0a0e14;
  touch-action: none;
}

.game-page__world {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.game-page__player {
  position: absolute;
  z-index: 12;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
}
</style>
