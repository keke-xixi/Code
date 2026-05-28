<script>
export default {
  onLaunch: function () {
    // 初始计算
    this.$store.dispatch('calculateHeights')
    
    // 监听屏幕旋转
    uni.onWindowResize(() => {
      this.$store.dispatch('calculateHeights')
    })
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style>
/* 小程序不支持 App 根节点使用 * 选择器，全局样式见 global.scss */
</style>
