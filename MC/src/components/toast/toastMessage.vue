<!-- components/ToastMessage.vue -->
<template>
  <uni-popup ref="popupRef" type="center" :mask-click="false">
    <view 
      class="toast-container" 
      :class="[`toast-${toastType}`]"
      :style="customStyle"
    >
      <!-- 卡通头部装饰 -->
      <view class="cartoon-header">
        <view class="header-pattern">
          <view class="pattern-dot"></view>
          <view class="pattern-dot"></view>
          <view class="pattern-dot"></view>
        </view>
      </view>
      
      <!-- 图标区域 - 更卡通的样式 -->
      <view class="toast-icon-wrapper">
        <view class="icon-bg" :class="`icon-bg-${toastType}`">
          <view class="icon-shine"></view>
          <view class="toast-icon" v-if="showIcon && !toastEmoji">
            <uni-icons 
              :type="iconType" 
              :size="iconSize" 
              :color="iconColor"
            ></uni-icons>
          </view>
          
          <!-- 自定义图标（支持emoji）- 放大更可爱 -->
          <view class="toast-emoji" v-else-if="toastEmoji">
            <text class="emoji-text">{{ toastEmoji }}</text>
          </view>
        </view>
        <!-- 卡通小装饰 -->
        <view class="icon-star-1">✨</view>
        <view class="icon-star-2">⭐</view>
      </view>
      
      <!-- 标题 - 卡通字体 -->
      <text class="toast-title" v-if="toastTitle">{{ toastTitle }}</text>
      
      <!-- 内容 - 气泡对话框风格 -->
      <view class="message-bubble">
        <text class="toast-message">{{ toastMessage }}</text>
        <view class="bubble-tail"></view>
      </view>
      
      <!-- 进度条（可选）- 卡通化 -->
      <view class="toast-progress" v-if="showProgress">
        <view class="progress-track">
          <view class="progress-bar" :style="{ width: progress + '%' }">
            <view class="progress-star" v-if="progress > 0">⭐</view>
          </view>
        </view>
        <text class="progress-text">{{ progress }}%</text>
      </view>
      
      <!-- 按钮区域 - 糖果按钮风格 -->
      <view class="toast-buttons" v-if="toastShowConfirm || toastShowCancel">
        <button 
          v-if="toastShowCancel" 
          class="toast-btn cancel-btn" 
          @tap="handleCancel"
          :style="cancelStyle"
        >
          <text class="btn-text">{{ cancelText }}</text>
        </button>
        <button 
          v-if="toastShowConfirm" 
          class="toast-btn confirm-btn" 
          @tap="handleConfirm"
          :style="confirmStyle"
        >
          <text class="btn-text">{{ confirmText }}</text>
          <text class="btn-emoji" v-if="toastType === 'success'">✨</text>
          <text class="btn-emoji" v-else-if="toastType === 'error'">😢</text>
          <text class="btn-emoji" v-else>👍</text>
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
import { ref, computed, reactive, watch } from 'vue';

const props = defineProps({
  type: { type: String, default: 'info' },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  emoji: { type: String, default: '' },
  showIcon: { type: Boolean, default: true },
  iconSize: { type: Number, default: 60 },
  duration: { type: Number, default: 2000 },
  showConfirm: { type: Boolean, default: false },
  confirmText: { type: String, default: '确定' },
  confirmStyle: { type: Object, default: () => ({}) },
  showCancel: { type: Boolean, default: false },
  cancelText: { type: String, default: '取消' },
  cancelStyle: { type: Object, default: () => ({}) },
  showProgress: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  customStyle: { type: Object, default: () => ({}) },
  maskClosable: { type: Boolean, default: false }
});

const emit = defineEmits(['confirm', 'cancel', 'close']);

const popupRef = ref(null);
let timer = null;

// 响应式数据
const toastType = ref(props.type);
const toastTitle = ref(props.title);
const toastMessage = ref(props.message);
const toastEmoji = ref(props.emoji);
const toastShowConfirm = ref(props.showConfirm);
const toastShowCancel = ref(props.showCancel);
const toastDuration = ref(props.duration);

// 根据类型获取图标和颜色
const iconType = computed(() => {
  const map = {
    success: 'checkmark-filled',
    error: 'close-filled',
    warning: 'info-filled',
    info: 'information-filled',
    loading: 'spinner'
  };
  return map[toastType.value] || 'information-filled';
});

const iconColor = computed(() => {
  const map = {
    success: '#FFD700', // 金色
    error: '#FF6B6B',   // 珊瑚红
    warning: '#FFB347',  // 橙色
    info: '#6B8EFF',     // 淡蓝
    loading: '#A5D6A5'   // 草绿
  };
  return map[toastType.value] || '#6B8EFF';
});

// 清除定时器
const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

// 打开弹窗
const open = (options = {}) => {
  if (options.type) toastType.value = options.type;
  if (options.title) toastTitle.value = options.title;
  if (options.message) toastMessage.value = options.message;
  if (options.emoji) toastEmoji.value = options.emoji;
  if (options.showConfirm !== undefined) toastShowConfirm.value = options.showConfirm;
  if (options.showCancel !== undefined) toastShowCancel.value = options.showCancel;
  if (options.duration !== undefined) toastDuration.value = options.duration;
  
  popupRef.value?.open();
  
  clearTimer();
  if (toastDuration.value > 0 && !toastShowConfirm.value && !toastShowCancel.value) {
    timer = setTimeout(() => {
      close();
    }, toastDuration.value);
  }
};

// 关闭弹窗
const close = () => {
  clearTimer();
  popupRef.value?.close();
  emit('close');
  
  setTimeout(() => {
    toastType.value = props.type;
    toastTitle.value = props.title;
    toastMessage.value = props.message;
    toastEmoji.value = props.emoji;
    toastShowConfirm.value = props.showConfirm;
    toastShowCancel.value = props.showCancel;
    toastDuration.value = props.duration;
  }, 300);
};

// 按钮处理
const handleConfirm = () => {
  emit('confirm');
  close();
};

const handleCancel = () => {
  emit('cancel');
  close();
};

// 快捷方法
const showSuccess = (msg, options = {}) => {
  open({
    type: 'success',
    message: msg,
    emoji: '🎉',
    ...options
  });
};

const showError = (msg, options = {}) => {
  open({
    type: 'error',
    message: msg,
    emoji: '😢',
    ...options
  });
};

const showWarning = (msg, options = {}) => {
  open({
    type: 'warning',
    message: msg,
    emoji: '⚠️',
    ...options
  });
};

const showLoading = (msg = '加载中...', options = {}) => {
  open({
    type: 'loading',
    message: msg,
    emoji: '🔄',
    duration: 0,
    ...options
  });
};

defineExpose({
  open, close, showSuccess, showError, showWarning, showLoading
});
</script>

<style scoped lang="scss">
// 卡通风格变量
$candy-colors: (
  success: (#FFD700, #FFB347), // 金色到橙色
  error: (#FF6B6B, #EE5253),   // 红色系
  warning: (#FFB347, #FF8A80),  // 橙粉色
  info: (#6B8EFF, #A5D6A5),     // 蓝绿色
  loading: (#A5D6A5, #6B8EFF)   // 绿蓝色
);

.toast-container {
  min-width: 260px;
  max-width: 320px;
  background: rgba(255, 248, 235, 0.95); // 奶油底色
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 50px 50px 40px 40px;
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 0 rgba(200, 160, 110, 0.3), 0 15px 25px rgba(0, 0, 0, 0.2);
  padding: 20px 20px 25px 20px;
  position: relative;
  font-family: 'Comic Sans MS', 'Chalkboard SE', '幼圆', Yuanti SC, cursive, sans-serif;
  
  // 不同类型背景色
  &.toast-success { background: rgba(255, 241, 220, 0.95); }
  &.toast-error { background: rgba(255, 235, 235, 0.95); }
  &.toast-warning { background: rgba(255, 245, 225, 0.95); }
  &.toast-info { background: rgba(235, 245, 255, 0.95); }
  &.toast-loading { background: rgba(240, 255, 240, 0.95); }
}

// 卡通头部
.cartoon-header {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  
  .header-pattern {
    display: flex;
    gap: 8px;
    
    .pattern-dot {
      width: 8px;
      height: 8px;
      background: rgba(255, 215, 160, 0.6);
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 0 #C0A070;
      
      &:nth-child(2) { width: 12px; }
    }
  }
}

// 图标区域
.toast-icon-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 15px 0 10px 0;
  
  .icon-bg {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 5px solid white;
    box-shadow: 0 8px 0 rgba(0, 0, 0, 0.1);
    
    // 不同类型背景
    &-success { background: linear-gradient(135deg, #FFD700, #FFB347); }
    &-error { background: linear-gradient(135deg, #FF6B6B, #EE5253); }
    &-warning { background: linear-gradient(135deg, #FFB347, #FF8A80); }
    &-info { background: linear-gradient(135deg, #6B8EFF, #A5D6A5); }
    &-loading { background: linear-gradient(135deg, #A5D6A5, #6B8EFF); }
    
    .icon-shine {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 20px;
      height: 20px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      transform: rotate(45deg);
    }
  }
  
  .icon-star-1, .icon-star-2 {
    position: absolute;
    font-size: 24px;
    animation: twinkle 1.5s infinite alternate;
  }
  
  .icon-star-1 {
    top: -5px;
    right: 15px;
    transform: rotate(15deg);
  }
  
  .icon-star-2 {
    bottom: -5px;
    left: 15px;
    transform: rotate(-15deg);
    animation-delay: 0.5s;
  }
}

.toast-icon, .toast-emoji {
  position: relative;
  z-index: 2;
  
  :deep(.uni-icons) {
    font-size: 50px !important;
  }
}

.emoji-text {
  font-size: 60px;
  line-height: 1;
  filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.2));
}

// 标题
.toast-title {
  font-size: 24px;
  font-weight: bold;
  color: #7B3F00;
  text-align: center;
  margin: 5px 0 8px 0;
  text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.8);
  letter-spacing: 1px;
}

// 消息气泡
.message-bubble {
  background: white;
  border-radius: 30px 30px 30px 10px;
  padding: 15px 20px;
  margin: 5px 5px 15px 5px;
  position: relative;
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 5px 0 #E0B080;
  
  .toast-message {
    font-size: 16px;
    color: #5D3A1A;
    text-align: center;
    line-height: 1.5;
    word-break: break-word;
    font-weight: 500;
  }
  
  .bubble-tail {
    position: absolute;
    bottom: -12px;
    left: 30px;
    width: 0;
    height: 0;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-top: 15px solid white;
    filter: drop-shadow(0 3px 0 #E0B080);
  }
}

// 进度条
.toast-progress {
  margin: 10px 0 15px 0;
  
  .progress-track {
    height: 20px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 30px;
    border: 3px solid white;
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
    overflow: hidden;
    position: relative;
  }
  
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #FFD700, #FFB347);
    border-radius: 30px;
    transition: width 0.3s ease;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    
    .progress-star {
      position: absolute;
      right: 5px;
      top: -8px;
      font-size: 18px;
      animation: bounce 0.5s infinite alternate;
    }
  }
  
  .progress-text {
    display: block;
    text-align: center;
    margin-top: 5px;
    font-size: 14px;
    color: #7B4B2A;
    font-weight: bold;
  }
}

// 按钮区域
.toast-buttons {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  padding: 0 10px;
  
  .toast-btn {
    flex: 1;
    height: 50px;
    line-height: 50px;
    border-radius: 30px 30px 20px 20px;
    font-size: 18px;
    font-weight: bold;
    border: 3px solid white;
    margin: 0;
    padding: 0 10px;
    transition: all 0.1s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    
    &::after {
      border: none;
    }
    
    .btn-text {
      color: inherit;
    }
    
    .btn-emoji {
      font-size: 20px;
    }
    
    &.confirm-btn {
      background: #FFD966;
      color: #5D3A1A;
      box-shadow: 0 6px 0 #C49B3F;
      
      &:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 #C49B3F;
      }
    }
    
    &.cancel-btn {
      background: #FBC4C4;
      color: #8B5A5A;
      box-shadow: 0 6px 0 #D28B8B;
      
      &:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 #D28B8B;
      }
    }
  }
}

// 底部装饰
.cartoon-footer {
  margin-top: 15px;
  text-align: center;
  
  .footer-stars {
    font-size: 20px;
    color: #FFD700;
    text-shadow: 2px 2px 0 #B8860B;
    letter-spacing: 8px;
    background: rgba(255, 255, 240, 0.5);
    display: inline-block;
    padding: 5px 20px;
    border-radius: 30px;
    border: 2px dashed white;
  }
}

// 动画
@keyframes twinkle {
  0% { opacity: 0.5; transform: scale(1) rotate(0deg); }
  100% { opacity: 1; transform: scale(1.2) rotate(10deg); }
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-3px); }
}

:deep(.uni-icons) {
  &.spinner {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>