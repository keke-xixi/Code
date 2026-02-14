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
/*每个页面公共css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
