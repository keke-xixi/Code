---
name: git-1-commit-push
description: >-
  Commits all relevant changes and pushes the current branch to origin. Use when
  the user sends exactly「1」as the message (alone), or asks to run the「1」
  commit-and-push skill.
---

# 「1」提交并推送

## 触发

用户单独发送 **`1`**（或明确说「跑 1 skill / 提交并推送」）时，**立即阅读本 skill** 并在当前仓库根目录执行，不要只口头说明步骤。

## 目标

1. 若有未提交改动：**暂存 → 提交 → 推送**
2. 若工作区已干净但本地超前远程：**仅推送**
3. 向用户汇报：分支名、commit hash（若有）、远程结果；失败时给出本机可复制的命令

## Git 安全（必须遵守）

- **不要**改 `git config`
- **不要** `push --force`、hard reset 等破坏性操作（用户明确要求除外）
- **不要** `--no-verify` / `--no-gpg-sign`（用户明确要求除外）
- **不要**向 main/master force push
- **不要**提交明显含密钥的文件（`.env`、credentials 等）；若用户坚持，先警告
- 仅当用户在本对话中**已通过「1」触发本 skill** 时才 commit；与「2」自主优化 skill 的「不擅自 commit」不冲突

## 工作流

### 1. 并行查看状态（Shell，PowerShell 用 `;` 链接，勿用 `&&`）

在仓库根目录执行：

- `git status`
- `git diff`（含 staged / unstaged）
- `git log -3 --oneline`（学 commit 风格）
- `git branch -vv`（当前分支与 tracking）

### 2. 提交（仅当有可提交改动时）

- 将**与本次改动相关**的文件 `git add`（勿盲目 `add -A` 若含无关生成物；`.godot/` 等若已在 ignore 则跳过）
- 写 **1–2 句** commit message，说明 **why**，风格对齐近期 log；中文或英文均可，与仓库一致即可
- Windows 下可用：`git commit -m "标题"` 或多行 `-m`；不必强求 bash HEREDOC
- 若 pre-commit hook 失败：**修问题后新建 commit**，不要 amend（除非用户规则里 amend 条件全满足）

### 3. 推送

- 推送到当前分支的 upstream；若无 upstream：`git push -u origin HEAD`
- 需要网络权限：`git_write` + `full_network`（失败可 `all` 重试一次）
- 若 SSL / 网络失败：说明错误，请用户本机执行 `git push`（VPN/代理/SSH remote）

### 4. 收尾

- 再跑 `git status` 确认 clean 且与 remote 同步（或 ahead 0）
- 回复简洁：**分支、commit 摘要、是否已 push**

## 无改动时

- working tree clean 且 **nothing to commit**：若 ahead of origin → 只 push；若已同步 → 告知「无需提交，已与远程一致」

## 开场一句（可选）

`已按「1」执行：检查改动 → 提交 → 推送。`
