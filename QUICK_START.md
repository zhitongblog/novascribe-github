# 快速开始 - 3 步上传到 GitHub

## ✅ 当前状态

文件已准备完毕，可以直接上传到 GitHub！

## 🚀 方法 1: GitHub Desktop（推荐）

### 第 1 步：安装 GitHub Desktop

1. 下载：https://desktop.github.com/
2. 安装并登录你的 GitHub 账号

### 第 2 步：发布仓库

1. 打开 GitHub Desktop
2. 点击 `File` → `Add Local Repository`
3. 选择文件夹：`D:\code\story\novascribe-github`
4. 如果提示 "not a Git repository"，点击 `Create a repository`
5. 填写信息：
   - **Name**: `novascribe`
   - **Description**: `AI 驱动的网文创作工具`
   - **Git Ignore**: None (已有 .gitignore)
   - **License**: MIT (已有 LICENSE)
6. 点击 `Create Repository`

### 第 3 步：推送到 GitHub

1. 在左下角输入提交消息：`Initial commit: NovaScribe v1.0.0`
2. 点击 `Commit to main`
3. 点击 `Publish repository`
4. 选择：
   - ✅ **Public** (公开) 或 **Private** (私有)
   - Repository name: `novascribe`
5. 点击 `Publish Repository`

### 完成！

访问：`https://github.com/你的用户名/novascribe`

---

## 🚀 方法 2: 命令行

```bash
# 第 1 步：初始化仓库
cd D:\code\story\novascribe-github
git init
git add .
git commit -m "Initial commit: NovaScribe v1.0.0"

# 第 2 步：在 GitHub 上创建仓库
# 访问 https://github.com/new
# 创建名为 novascribe 的仓库（不要初始化 README）

# 第 3 步：推送代码（替换你的用户名）
git remote add origin https://github.com/你的用户名/novascribe.git
git branch -M main
git push -u origin main
```

---

## 🤖 自动构建

代码推送后，GitHub Actions 会自动：

1. ✅ 在 Windows、macOS、Linux 上构建
2. ✅ 生成安装包
3. ✅ 上传构建产物

查看构建状态：
- 访问 `https://github.com/你的用户名/novascribe/actions`

---

## 📦 发布正式版本

```bash
# 1. 更新版本号（编辑 package.json）
# "version": "1.0.0"

# 2. 提交并创建标签
git add package.json
git commit -m "chore: bump version to 1.0.0"
git tag v1.0.0

# 3. 推送
git push
git push origin v1.0.0
```

GitHub 会自动：
- ✅ 构建所有平台
- ✅ 创建 Release
- ✅ 上传安装包

---

## 📚 更多信息

详细指南：查看 `GITHUB_SETUP_GUIDE.md`

---

## ⚠️ 重要提示

### 已排除的文件（不会上传）：

- ❌ `node_modules/` - 依赖包
- ❌ `dist/`, `dist-electron/` - 构建产物
- ❌ `.env`, `.env.local` - 环境变量
- ❌ `*.db`, `*.sqlite` - 数据库文件
- ❌ `.claude/` - Claude 配置
- ❌ `assets/*` - 用户文件（只保留 .gitkeep）

这些文件在 `.gitignore` 中定义，不会被提交。

### 安全提醒：

- ✅ 不要提交 API Keys
- ✅ 不要提交数据库文件
- ✅ 不要提交用户数据

---

## 🎯 下一步

上传成功后：

1. ✅ **编辑 README.md**
   - 替换 `你的用户名` 为实际用户名
   - 添加项目截图

2. ✅ **配置仓库设置**
   - Settings → Actions → General
   - Workflow permissions → Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

3. ✅ **添加项目描述**
   - 在仓库页面点击右侧齿轮图标
   - 添加描述和标签

4. ✅ **邀请协作者**
   - Settings → Collaborators
   - 添加团队成员

---

需要帮助？查看 `GITHUB_SETUP_GUIDE.md` 获取详细说明。
