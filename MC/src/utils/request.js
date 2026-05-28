const BASE_URL = process.env.BASE_URL || 'http://localhost:5005'  // 请求接口地址
const TIMEOUT = 30000; //请求超时时间 单位毫秒  30秒  30000

// 清除token
const clearTokens = () => {
  uni.removeStorageSync('accessToken')
  uni.removeStorageSync('refreshToken')
}

// 拿refreshToken 刷新accessToken
const refreshAccessToken = async () => {
  const accessToken = uni.getStorageSync('accessToken'); // 拿新 token的时候，请求头还是旧token
  const { data } = await uni.request({
    url: `${BASE_URL}/api/sysAuth/refreshToken`,
    method: 'GET',
	header: {
		'Authorization': `Bearer ${accessToken}`
	},
    data: {
      accessToken: refreshToken
    }
  })
  if (data.code === 200) {
    uni.setStorageSync('accessToken', data.result)
  } else {  
    clearTokens()
    gotoLogin()
  }
}

// 重新发起原始请求
const retryRequest = async (config) => {
  await refreshAccessToken()
  return uni.request(config)
}

// 跳转到登录页面
const gotoLogin = () => {
  uni.navigateTo({
    url: '/pages/home/index'
  })
}

const request = async (config) => {
  const { method = 'GET', url, ...rest } = config;
  
  // 从缓存读取 tokens
  let accessToken = uni.getStorageSync('accessToken');
  const refreshToken = uni.getStorageSync('refreshToken');

  // 构造请求头
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`
  };

  // 封装带超时的请求
  const requestWithTimeout = () => {
    return new Promise((resolve, reject) => {
      // 1. 设置超时定时器
      const timeoutTimer = setTimeout(() => {
        reject(new Error('请求超时，请检查网络或重试'));
      }, TIMEOUT);

      // 2. 发起请求
      uni.request({
        url: BASE_URL + url,
        method,
        header: headers,
        ...rest,
        success: async (res) => {
          clearTimeout(timeoutTimer); // 清除超时计时器
          if (res.data?.code === 401 && refreshToken) {
            // Token过期，尝试刷新
            try {
              const newTokens = await refreshAccessToken(refreshToken);
              const retryRes = await retryRequest(config);
              resolve(retryRes);
            } catch (err) {
              clearTokens();
              gotoLogin();
              reject('登录已过期，请重新登录');
            }
          } else if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res);
          } else {
            reject(res);
          }
        },
        fail: (err) => {
          clearTimeout(timeoutTimer); // 清除超时计时器
          reject(err);
        }
      });
    });
  };

  // 3. 执行请求并处理超时
  try {
    const response = await requestWithTimeout();
    return response;
  } catch (error) {
    if (error.message === '请求超时，请检查网络或重试') {
      uni.showToast({ title: '请求超时', icon: 'none' });
    }
    throw error; // 继续向上抛出错误
  }
};

export default request