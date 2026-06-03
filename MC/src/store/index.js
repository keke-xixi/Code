import { createStore } from 'vuex'
import { getSystemMetrics } from '@/utils/system.js'

export default createStore({
  state: {
    statusBarHeight: 0,
    navigationBarHeight: 44,  // 默认导航栏高度
    safeAreaHeight: 0,       // 修正后的安全区域高度
    screenHeight: 0          // 屏幕高度（rpx）
  },
  mutations: {
    UPDATE_HEIGHT(state, payload) {
      state.statusBarHeight = payload.statusBarHeight
      state.navigationBarHeight = payload.navigationBarHeight
      state.safeAreaHeight = payload.safeAreaHeight
      state.screenHeight = payload.screenHeight
    }
  },
  actions: {
    calculateHeights({ commit }) {
      const systemInfo = getSystemMetrics()
      let navHeight = 44

      // #ifdef MP-WEIXIN
      try {
        if (typeof wx !== 'undefined' && wx.getMenuButtonBoundingClientRect) {
          const menu = wx.getMenuButtonBoundingClientRect()
          if (menu?.bottom != null && menu?.top != null) {
            navHeight = menu.bottom + menu.top - (systemInfo.statusBarHeight || 0)
          }
        }
      } catch (e) {
        /* 忽略胶囊按钮读取失败 */
      }
      // #endif

      let safeAreaHeight = systemInfo.safeArea?.height || systemInfo.windowHeight
      if (systemInfo.statusBarHeight && navHeight) {
        safeAreaHeight = safeAreaHeight - systemInfo.statusBarHeight - navHeight
      }

      const screenHeight =
        (systemInfo.windowHeight / systemInfo.windowWidth) * 750

      commit('UPDATE_HEIGHT', {
        statusBarHeight: systemInfo.statusBarHeight,
        navigationBarHeight: navHeight,
        safeAreaHeight,
        screenHeight,
      })
    }
  }
})