@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo [WXAppBack] 正在检查端口 5010...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5010" ^| findstr "LISTENING"') do (
  echo [WXAppBack] 关闭占用端口的进程 PID=%%a
  taskkill /F /PID %%a >nul 2>&1
)

if not exist .env copy .env.example .env >nul

if not exist node_modules (
  echo [WXAppBack] 首次运行，正在安装依赖...
  call npm install
)

echo.
echo [WXAppBack] 启动中...
echo.
node src/index.js
pause
