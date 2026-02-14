import { createStore } from 'vuex'

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
      const systemInfo = uni.getSystemInfoSync()
      let navHeight = 44
      
      // #ifdef MP-WEIXIN
      const menu = wx.getMenuButtonBoundingClientRect()
      navHeight = menu.bottom + menu.top - systemInfo.statusBarHeight
      // #endif
      
      // 更准确的安全区域计算
      let safeAreaHeight = systemInfo.safeArea?.height || systemInfo.windowHeight
      
      // 如果存在状态栏和导航栏，需要减去它们的高度
      if (systemInfo.statusBarHeight && navHeight) {
        safeAreaHeight = safeAreaHeight - systemInfo.statusBarHeight - navHeight
      }
      
      // 计算屏幕高度（rpx）
      const screenHeight = (systemInfo.windowHeight / systemInfo.windowWidth) * 750
      
      commit('UPDATE_HEIGHT', {
        statusBarHeight: systemInfo.statusBarHeight,
        navigationBarHeight: navHeight,
        safeAreaHeight: safeAreaHeight,  // 修正后的安全高度
        screenHeight: screenHeight
      })
    }
  }
})