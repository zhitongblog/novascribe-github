@echo off
chcp 65001 >nul
echo ====================================
echo   快速推送到 GitHub
echo ====================================
echo.
echo 仓库存在，需要配置认证
echo.
echo 步骤 1: 生成 Personal Access Token
echo -------------------------------------
echo 1. 在浏览器中打开这个网址：
echo    https://github.com/settings/tokens/new
echo.
echo 2. 填写信息：
echo    Note: NovaScribe Development
echo    Expiration: 90 days
echo.
echo 3. 勾选权限：
echo    ✅ repo (完整勾选)
echo    ✅ workflow
echo.
echo 4. 点击 "Generate token"
echo.
echo 5. 复制生成的 token (ghp_xxxx...)
echo.
pause

echo.
echo 步骤 2: 配置 Token
echo -------------------------------------
set /p TOKEN="请粘贴你的 token: "

if "%TOKEN%"=="" (
    echo 错误：Token 不能为空
    pause
    exit /b 1
)

echo.
echo 正在配置远程地址...
cd /d "%~dp0"
git remote set-url origin https://%TOKEN%@github.com/zhitongblog/novascribe-github.git

echo.
echo 步骤 3: 推送代码
echo -------------------------------------
echo 正在推送...
git push -u origin main

echo.
echo ====================================
if %ERRORLEVEL% EQU 0 (
    echo ✅ 推送成功！
    echo.
    echo 查看代码：
    echo https://github.com/zhitongblog/novascribe-github
    echo.
    echo 查看构建：
    echo https://github.com/zhitongblog/novascribe-github/actions
    echo.
    echo Ubuntu 构建已修复，等待 5-15 分钟完成构建
) else (
    echo ❌ 推送失败！
    echo.
    echo 请检查：
    echo 1. Token 是否正确
    echo 2. Token 是否有 repo 权限
    echo 3. 网络连接是否正常
)
echo ====================================
pause
