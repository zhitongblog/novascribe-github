@echo off
echo ====================================
echo   创建 GitHub 仓库并推送代码
echo ====================================
echo.

echo 方法 1: 使用浏览器手动创建
echo -------------------------------------
echo 1. 访问: https://github.com/new
echo 2. Repository name: novascribe-github
echo 3. Description: NovaScribe - AI 驱动的网文创作工具
echo 4. 选择 Private 或 Public
echo 5. 不要勾选任何初始化选项
echo 6. 点击 "Create repository"
echo 7. 然后返回这里按任意键继续推送
echo.
pause

echo.
echo 正在推送代码到 GitHub...
cd /d "%~dp0"
git push -u origin main

echo.
echo ====================================
if %ERRORLEVEL% EQU 0 (
    echo 推送成功！
    echo 查看构建状态：
    echo https://github.com/zhitongblog/novascribe-github/actions
) else (
    echo 推送失败！
    echo.
    echo 如果是认证问题，请查看 配置GitHub认证.txt
)
echo ====================================
pause
