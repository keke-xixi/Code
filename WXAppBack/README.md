# WXAppBack

个人云笔记与文件存储后端（Node.js + Express + **MySQL**）。

## 功能

- 账号密码登录（JWT）
- 笔记 CRUD（标题、正文、标签）
- 文件上传（图片 / 视频 / 安装包 / 其它）
- 用户管理（**仅管理员**）：创建账号、禁用、重置密码、删除

普通用户只能使用管理员预先创建的账号登录，不能自行注册。

## 快速开始

```bash
cd WXAppBack
cp .env.example .env   # 填入 MySQL 连接信息
npm install
npm run dev
```

## 数据库（MySQL）

在 `.env` 中配置（已对接 Navicat 的 `money` 库）：

```env
DB_HOST=39.106.138.81
DB_PORT=3306
DB_USER=learner
DB_PASSWORD=你的密码
DB_NAME=money
```

首次启动会自动在 `money` 库创建以下表（`wx_` 前缀，不影响原有表）：

| 表名 | 说明 |
|------|------|
| `wx_users` | 用户账号 |
| `wx_notes` | 笔记 |
| `wx_files` | 文件元数据 |

文件实体仍保存在服务器本地 `uploads/` 目录，数据库只存路径和元信息。

默认管理员（若 `wx_users` 中不存在则自动创建）：

- 用户名：`admin`
- 密码：`admin123`（请在 `.env` 中修改）

服务地址：`http://localhost:5010`

## 环境要求

- **Node.js 16+**
- **MySQL 5.7+** 或 MariaDB

## 常见问题

**端口被占用 `EADDRINUSE :::5010`**

关闭占用 5010 的进程，或在 `.env` 中修改 `PORT=5011`。

**数据库连接失败**

检查 `.env` 中 DB 配置，确认 Navicat 能连上同一地址，且 `learner` 账号有 `money` 库的读写权限。

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录 | 公开 |
| GET | `/api/auth/me` | 当前用户 | 登录 |
| GET | `/api/notes` | 笔记列表 | 登录 |
| POST | `/api/notes` | 新建笔记 | 登录 |
| PUT | `/api/notes/:id` | 更新笔记 | 登录 |
| DELETE | `/api/notes/:id` | 删除笔记 | 登录 |
| GET | `/api/files` | 文件列表 | 登录 |
| POST | `/api/files/upload` | 上传文件 | 登录 |
| GET | `/api/files/:id/download` | 下载文件 | 登录 |
| DELETE | `/api/files/:id` | 删除文件 | 登录 |
| GET | `/api/users` | 用户列表 | 管理员 |
| POST | `/api/users` | 创建用户 | 管理员 |
| PATCH | `/api/users/:id` | 更新用户 | 管理员 |
| DELETE | `/api/users/:id` | 删除用户 | 管理员 |

## 数据目录

- MySQL 表：`wx_users` / `wx_notes` / `wx_files`（在 `money` 库）
- `uploads/{userId}/` — 用户上传文件（本地磁盘）

## 小程序联调

开发时在 `WXApp/src/config/index.js` 中配置 `baseUrl` 为你的局域网 IP，例如：

`http://192.168.1.100:5010`

并在微信开发者工具中勾选「不校验合法域名」。
