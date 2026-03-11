<template>
    <uni-popup ref="configPopupRef" type="center" :mask-click="false">
        <!-- 弹窗主体：透明卡通风格 (加高以容纳保存按钮) -->
        <view class="popup-card">
            <!-- 头部装饰区 + 关闭按钮 -->
            <view class="cartoon-header">
                <view class="header-pattern">
                    <view class="pattern-dot"></view>
                    <view class="pattern-dot"></view>
                    <view class="pattern-dot"></view>
                </view>
                <text class="cartoon-title">🗺️ 地图小窝</text>
                <view class="close-cartoon" @tap="close">
                    <text class="close-x">✕</text>
                </view>
            </view>

            <!-- 缩放控制区：糖果按钮 -->
            <view class="candy-controls">
                <button class="candy-btn zoom-out" @click="zoomOut" size="mini">－</button>
                <view class="scale-bubble">
                    <text class="bubble-text">{{ (scale * 100).toFixed(0) }}%</text>
                </view>
                <button class="candy-btn zoom-in" @click="zoomIn" size="mini">＋</button>
                <button class="candy-btn reset" @click="resetView" size="mini">🔄</button>
            </view>

            <!-- 信息卡片区域：气泡格子风格 -->
            <view class="info-bubbles">
                <!-- 当前位置卡片 -->
                <view class="bubble-item bubble-location">
                    <view class="bubble-icon">📍</view>
                    <view class="bubble-content">
                        <text class="bubble-label">我的位置</text>
                        <text class="bubble-value">({{ state.x }}, {{ state.y }})</text>
                    </view>
                </view>

                <!-- 世界大小卡片 -->
                <view class="bubble-item bubble-world">
                    <view class="bubble-icon">🌍</view>
                    <view class="bubble-content">
                        <text class="bubble-label">世界大小</text>
                        <text class="bubble-value">{{ worldWidth / cellSize }} x {{ worldHeight / cellSize }}</text>
                    </view>
                </view>

                <!-- 格子类型卡片 -->
                <view class="bubble-item bubble-type">
                    <view class="bubble-icon">🧩</view>
                    <view class="bubble-content">
                        <text class="bubble-label">格子类型</text>
                        <text class="bubble-value">{{ getCellType(state.x, state.y) }}</text>
                    </view>
                </view>

                <!-- 格子效果卡片 -->
                <view class="bubble-item bubble-effect">
                    <view class="bubble-icon">✨</view>
                    <view class="bubble-content">
                        <text class="bubble-label">格子效果</text>
                        <text class="bubble-value">{{ getCellEffect(state.x, state.y) }}</text>
                    </view>
                </view>
            </view>

            <!-- 新增：保存按钮区域 + 可爱装饰 (加高部分) -->
            <view class="save-section">
                <button class="candy-btn save-btn" @click="handleSave" size="mini">
                    <span class="save-icon"></span> 保存
                </button>
            </view>

            <!-- 底部可爱小装饰 -->
            <view class="cartoon-footer">
                <view class="footer-stars">✦ ✦ ✦</view>
            </view>
        </view>
    </uni-popup>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['zoomOut', 'zoomIn', 'resetView', 'close', 'save']);
const props = defineProps({
    scale: { type: Number, default: 1 },
    worldWidth: { type: Number, default: 0 },
    worldHeight: { type: Number, default: 0 },
    cellSize: { type: Number, default: 0 },
    state: { type: Object, default: () => ({ x: 0, y: 0 }) },
    cellTypes: { type: Object, default: () => ({}) }
})

const configPopupRef = ref(null)

const zoomOut = () => emit('zoomOut')
const zoomIn = () => emit('zoomIn')
const resetView = () => emit('resetView')
const handleSave = () => emit('save') // 保存事件

const close = () => {
    configPopupRef.value.close()
    emit('close')
}

const openDialog = () => {
    configPopupRef.value.open()
}

// 获取格子类型
const getCellType = (x, y) => {
  const key = `${x},${y}`
  return props.cellTypes[key]?.type || '普通格子'
}

// 获取格子效果
const getCellEffect = (x, y) => {
  const key = `${x},${y}`
  return props.cellTypes[key]?.effect || '无特殊效果'
}

defineExpose({ openDialog })
</script>

<style scoped lang="scss">
// 透明卡通风格变量
$popup-bg: rgba(255, 241, 220, 0.75); // 奶油半透明底色
$border-color: rgba(255, 255, 255, 0.7);
$shadow-color: rgba(233, 196, 106, 0.4); // 暖色阴影
$bubble-colors: (#FFB347, #6B8EFF, #FF8A80, #A5D6A5); // 四种柔和的颜色

.popup-card {
  width: 90vw;
  max-width: 420px;
  background: $popup-bg;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 48px 48px 36px 36px; // 夸张的圆角，更卡通
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 15px 0 rgba(200, 160, 110, 0.3), 0 20px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  transition: transform 0.2s ease;
  margin: 0 auto;
  font-family: 'Comic Sans MS', 'Chalkboard SE', '幼圆', Yuanti SC, cursive, sans-serif; // 卡通字体
}

// 卡通头部波浪装饰
.cartoon-header {
  background: rgba(255, 215, 160, 0.6);
  padding: 16px 20px 12px 20px;
  border-bottom: 4px dashed rgba(255, 255, 255, 0.8);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-pattern {
    display: flex;
    gap: 6px;
    .pattern-dot {
      width: 10px;
      height: 10px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      box-shadow: 0 2px 0 rgba(0,0,0,0.05);
    }
  }

  .cartoon-title {
    font-size: 20px;
    font-weight: bold;
    color: #7B3F00; // 深棕色
    text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.8);
    letter-spacing: 1px;
    background: rgba(255, 255, 255, 0.4);
    padding: 4px 15px;
    border-radius: 40px;
    border: 2px solid white;
  }

  .close-cartoon {
    background: #FF9AA2; // 浅粉色
    width: 36px;
    height: 36px;
    border-radius: 30px;
    border: 3px solid white;
    box-shadow: 0 4px 0 #B06666;
    display: flex;
    align-items: center;
    justify-content: center;
    .close-x {
      color: white;
      font-size: 22px;
      font-weight: bold;
      line-height: 1;
      transform: translateY(-2px); // 视觉微调
    }
    &:active {
      transform: translateY(3px);
      box-shadow: 0 1px 0 #B06666;
    }
  }
}

// 糖果按钮区域
.candy-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 15px 10px 15px;
  background: rgba(255, 250, 240, 0.5);
  margin: 10px 15px;
  border-radius: 60px;
  border: 2px solid white;
  box-shadow: inset 0 2px 5px rgba(255,255,255,0.8), 0 6px 0 #E0B080;

  .candy-btn {
    width: 48px;
    height: 48px;
    line-height: 48px;
    text-align: center;
    background: #FFD966;
    border-radius: 40px 40px 20px 20px; // 不规则圆角，更像糖果
    border: 3px solid white;
    box-shadow: 0 5px 0 #C49B3F;
    color: #5D3A1A;
    font-size: 30px;
    font-weight: bold;
    padding: 0;
    margin: 0;
    transition: all 0.05s linear;
    &::after {
      border: none;
    }
    &:active {
      transform: translateY(4px);
      box-shadow: 0 1px 0 #C49B3F;
    }

    // 不同颜色区分
    &.zoom-out, &.zoom-in {
      background: #FBC4C4;
      box-shadow: 0 5px 0 #D28B8B;
    }
    &.reset {
      width: auto;
      padding: 0 18px;
      background: #B0E0E6; // 粉蓝色
      box-shadow: 0 5px 0 #7FA6B0;
      font-size: 18px;
      line-height: 42px;
      border-radius: 30px 30px 20px 20px;
    }
  }

  .scale-bubble {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50px;
    padding: 6px 15px;
    border: 3px solid white;
    box-shadow: 0 5px 0 #C0A070;
    .bubble-text {
      font-size: 20px;
      font-weight: bold;
      color: #7B4B2A;
      text-shadow: 1px 1px 0 white;
    }
  }
}

// 信息气泡网格
.info-bubbles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 5px 18px 18px 18px;

  .bubble-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(4px);
    border-radius: 30px 30px 30px 10px; // 不规则的可爱圆角
    border: 3px solid white;
    padding: 8px 12px 8px 8px;
    box-shadow: 0 6px 0 rgba(170, 140, 100, 0.4);
    transition: transform 0.1s;
    min-height: 70px;

    &:nth-child(1) { background: rgba($color: #FFB347, $alpha: 0.7); } // 橙色
    &:nth-child(2) { background: rgba($color: #6B8EFF, $alpha: 0.7); } // 淡蓝
    &:nth-child(3) { background: rgba($color: #FF8A80, $alpha: 0.7); } // 珊瑚
    &:nth-child(4) { background: rgba($color: #A5D6A5, $alpha: 0.7); } // 草绿

    .bubble-icon {
      font-size: 28px;
      background: white;
      width: 48px;
      height: 48px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255,255,240,0.9);
      box-shadow: 0 4px 0 #B0A090;
      transform: rotate(2deg); // 轻微倾斜，更俏皮
    }

    .bubble-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      .bubble-label {
        font-size: 14px;
        color: #4A3720;
        opacity: 0.8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .bubble-value {
        font-size: 15px;
        font-weight: bold;
        color: #2C1E0F;
        word-break: break-word;
        line-height: 1.3;
        text-shadow: 1px 1px 0 rgba(255,255,200,0.5);
      }
    }

    &:active {
      transform: translateY(3px);
      box-shadow: 0 2px 0 rgba(140, 110, 70, 0.5);
    }
  }
}

// 新增：保存按钮区域样式 (加高部分)
.save-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 18px 18px 18px; // 增加上下内边距
  margin: 5px 0 5px 0;
  background: rgba(255, 241, 220, 0.3); // 极浅背景，区分层次
  border-top: 2px dashed rgba(255, 255, 255, 0.8); // 与头部呼应的虚线
  border-bottom: 2px dashed rgba(255, 255, 255, 0.8);

  // 保存按钮 - 继承糖果按钮风格并适当调整
  .save-btn {
    width: auto;
    min-width: 160px;
    height: 54px; // 稍微高一点，更突出
    line-height: 48px;
    background: #C1E1C1; // 柔和草绿色，与第四个气泡呼应
    box-shadow: 0 7px 0 #8CAF8C; // 稍深的阴影，增加立体感
    border-radius: 40px 40px 25px 25px;
    font-size: 22px;
    font-weight: bold;
    color: #3D5E3D;
    padding: 0 20px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    .save-icon {
      font-size: 26px;
      line-height: 1;
    }

    &:active {
      transform: translateY(5px);
      box-shadow: 0 2px 0 #6F8F6F;
    }
  }

  // 小装饰，让保存区域更生动
  .save-decoration {
    display: flex;
    gap: 15px;
    .decoration-char {
      font-size: 20px;
      color: #D9B382;
      text-shadow: 2px 2px 0 white;
      animation: twinkle 1.5s infinite alternate;
    }
  }
}

// 简单的闪烁动画
@keyframes twinkle {
  0% { opacity: 0.5; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.1); }
}

// 底部小星星装饰 (保持不变)
.cartoon-footer {
  text-align: center;
  padding: 8px 0 12px 0;
  .footer-stars {
    font-size: 18px;
    color: #F0E68C;
    text-shadow: 2px 2px 0 #B8860B;
    letter-spacing: 6px;
    background: rgba(255, 255, 240, 0.3);
    display: inline-block;
    padding: 4px 20px;
    border-radius: 30px;
    border: 2px dashed white;
  }
}
</style>