@echo off
cd /d "%~dp0"
call npm run dev:wx-game
echo.
echo 请在微信开发者工具中：
echo   1. 选「小游戏」
echo   2. 导入目录: %~dp0dist\wxdb707-game
echo   3. AppID: wxdb70767113810f88
echo.
pause
