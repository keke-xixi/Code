/** 兼容新版基础库，避免 getSystemInfoSync 废弃警告 */
export const getSystemMetrics = () => {
  if (typeof uni.getWindowInfo === 'function') {
    const win = uni.getWindowInfo()
    const device =
      typeof uni.getDeviceInfo === 'function' ? uni.getDeviceInfo() : {}
    return {
      windowWidth: win.windowWidth,
      windowHeight: win.windowHeight,
      statusBarHeight: win.statusBarHeight || 0,
      safeArea: win.safeArea,
      screenWidth: device.screenWidth || win.screenWidth || win.windowWidth,
      screenHeight: device.screenHeight || win.screenHeight || win.windowHeight,
    }
  }
  const legacy = uni.getSystemInfoSync()
  return {
    windowWidth: legacy.windowWidth,
    windowHeight: legacy.windowHeight,
    statusBarHeight: legacy.statusBarHeight || 0,
    safeArea: legacy.safeArea,
    screenWidth: legacy.screenWidth,
    screenHeight: legacy.screenHeight,
  }
}
