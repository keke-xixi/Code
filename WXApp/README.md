# WXApp — 云笔记微信小程序

个人云笔记与文件存储小程序，配合 `WXAppBack` 后端使用。

## 功能

- 账号登录（无自助注册，使用管理员创建的账号）
- 笔记：新建、编辑、搜索、标签
- 文件：上传图片 / 视频 / 安装包等到云端
- 管理员：用户管理（创建、禁用、重置密码、删除）

## 开发

```bash
cd WXApp
npm install
npm run dev:mp-weixin
```

用微信开发者工具导入编译产物：

`WXApp/dist/dev/mp-weixin`

## 配置

1. 在 `src/manifest.json` → `mp-weixin.appid` 填入你的小程序 AppID
2. 在 `src/config/index.js` 修改 `BASE_URL` 为后端地址  
   - 本机调试：`http://localhost:5010`（仅模拟器）  
   - 真机调试：改为电脑局域网 IP，如 `http://192.168.1.100:5010`
3. 开发者工具勾选 **不校验合法域名**

## 默认管理员

后端首次启动自动创建（见 `WXAppBack/.env.example`）：

- 用户名：`admin`
- 密码：`admin123`

登录后可在「用户管理」中为家人/设备创建普通账号。

## 目录

```
WXApp/src/
├── pages/
│   ├── login/       登录
│   ├── home/        首页
│   ├── notes/       笔记列表与编辑
│   ├── files/       文件云盘
│   └── admin/       用户管理（仅 admin）
├── api/             接口封装
├── utils/request.js 请求与鉴权
└── config/index.js  后端地址
```
