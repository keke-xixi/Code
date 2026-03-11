import {
	createSSRApp
} from "vue";
import App from "./App.vue";
import store from "./store/index.js"
import './assets/css/global.scss'

// 关闭自动打印
// import { disAutoConnect } from 'vue-plugin-hiprint';
// disAutoConnect();

import ToastMessage from '@/components/toast/toastMessage.vue'

export function createApp() {
  const app = createSSRApp(App)

  // 注册为全局组件
  app.component('ToastMessage', ToastMessage)
  // 关键点：使用 vuex 的 provide/inject 方式
  app.use(store)
  
  return {
    app,
    store // 如果需要服务端渲染时访问store
  }
}
