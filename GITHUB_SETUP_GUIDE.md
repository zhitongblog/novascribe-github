# GitHub 上传和自动构建指南

本指南将帮助你将 NovaScribe 上传到 GitHub 并设置自动构建。

## 📋 准备工作

### 1. 复制文件到发布文件夹

**Windows (PowerShell)**:
```powershell
cd D:\code\story\novascribe
.\copy-to-github.ps1
```

**或者手动复制**:
```bash
# 进入源目录
cd D:\code\story\novascribe

# 复制必要文件（排除 node_modules, dist 等）
# 使用 PowerShell 或文件管理器手动复制以下内容到 novascribe-github 文件夹：
# - src/
# - electron/
# - public/
# - docs/
# - package.json, package-lock.json
# - tsconfig.json, vite.config.ts
# - electron-builder.yml
# - index.html, tailwind.config.js, postcss.config.js
# - LICENSE
```

### 2. 验证复制结果

确保 `D:\code\story\novascribe-github` 文件夹包含：

```
novascribe-github/
├── .github/
│   └── workflows/
│       └── build.yml          ✅ GitHub Actions 配置
├── .gitignore                 ✅ Git 忽略文件
├── src/                       ✅ 源代码
├── electron/                  ✅ Electron 代码
├── public/                    ✅ 公共资源
├── assets/                    ✅ 资源文件夹（空）
│   └── .gitkeep
├── docs/                      ✅ 文档
├── package.json               ✅ 项目配置
├── package-lock.json          ✅ 依赖锁定
├── tsconfig.json              ✅ TypeScript 配置
├── vite.config.ts             ✅ Vite 配置
├── electron-builder.yml       ✅ 打包配置
├── index.html                 ✅ HTML 入口
├── tailwind.config.js         ✅ Tailwind 配置
├── postcss.config.js          ✅ PostCSS 配置
├── README.md                  ✅ 项目说明
├── GITHUB_SETUP_GUIDE.md      ✅ 本指南
└── LICENSE                    ✅ 许可证

❌ 不应该包含：
├── node_modules/              ❌
├── dist/                      ❌
├── dist-electron/             ❌
├── .vite/                     ❌
├── *.db                       ❌
├── .env, .env.local           ❌
├── .claude/                   ❌
└── assets/* (除了 .gitkeep)   ❌
```

## 🚀 上传到 GitHub

### 方法 1: 使用 GitHub Desktop（推荐新手）

1. **下载并安装 GitHub Desktop**
   - 访问: https://desktop.github.com/
   - 下载并安装

2. **创建仓库**
   - 打开 GitHub Desktop
   - 点击 File → Add Local Repository
   - 选择 `D:\code\story\novascribe-github`
   - 如果提示不是 Git 仓库，点击 "Create Repository"

3. **配置仓库**
   - Name: `novascribe`
   - Description: `AI 驱动的网文创作工具`
   - ✅ 勾选 "Initialize this repository with a README"（如果还没有）
   - 选择 License: MIT
   - 点击 "Create Repository"

4. **首次提交**
   - 在左侧看到所有更改的文件
   - 输入提交消息: `Initial commit`
   - 点击 "Commit to main"

5. **发布到 GitHub**
   - 点击 "Publish repository"
   - 确认仓库名称: `novascribe`
   - Description: `AI 驱动的网文创作工具`
   - ✅ 选择公开（Public）或私有（Private）
   - 点击 "Publish Repository"

### 方法 2: 使用命令行（推荐开发者）

```bash
# 1. 进入发布文件夹
cd D:\code\story\novascribe-github

# 2. 初始化 Git 仓库
git init

# 3. 添加所有文件
git add .

# 4. 首次提交
git commit -m "Initial commit: NovaScribe v1.0.0"

# 5. 在 GitHub 上创建仓库
# 访问 https://github.com/new
# 创建名为 novascribe 的新仓库（不要初始化 README）

# 6. 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/你的用户名/novascribe.git

# 7. 推送到 GitHub
git branch -M main
git push -u origin main
```

## ⚙️ GitHub Actions 自动构建

### 验证 Actions 是否启用

1. 访问你的 GitHub 仓库
2. 点击顶部的 "Actions" 标签
3. 如果 Actions 被禁用，点击 "I understand my workflows, go ahead and enable them"

### 自动构建触发条件

GitHub Actions 会在以下情况自动构建：

#### 1. 推送代码到主分支

```bash
git add .
git commit -m "Update features"
git push
```

**结果**:
- ✅ 自动在 Windows, macOS, Linux 上构建
- ✅ 生成构建产物（Artifacts）
- ✅ 可在 Actions 页面下载测试版本

#### 2. 创建版本标签（发布正式版）

```bash
# 创建标签
git tag v1.0.0

# 推送标签到 GitHub
git push origin v1.0.0
```

**结果**:
- ✅ 自动在三个平台构建
- ✅ 创建 GitHub Release
- ✅ 自动上传安装包到 Release
- ✅ 用户可以下载正式版本

### 查看构建状态

1. 访问仓库的 Actions 页面
   - `https://github.com/你的用户名/novascribe/actions`

2. 点击具体的工作流查看详情
   - 可以看到每个平台的构建日志
   - 可以下载构建产物

3. 构建成功后：
   - ✅ 绿色对勾表示成功
   - ❌ 红色叉表示失败
   - 🟡 黄色圆圈表示正在构建

### 下载构建产物

#### Artifacts（开发版本）

推送代码后：
1. 进入 Actions 页面
2. 点击最新的工作流运行
3. 滚动到页面底部的 "Artifacts" 区域
4. 下载对应平台的构建产物：
   - `novascribe-windows-latest`
   - `novascribe-macos-latest`
   - `novascribe-ubuntu-latest`

#### Release（正式版本）

创建标签后：
1. 进入仓库的 Releases 页面
   - `https://github.com/你的用户名/novascribe/releases`
2. 找到对应版本（如 v1.0.0）
3. 下载 Assets 中的安装包

## 🔧 修复常见问题

### 构建失败

#### 问题 1: 找不到 package.json

**错误信息**: `Error: Cannot find module 'package.json'`

**解决方法**:
```bash
# 确认 package.json 在仓库根目录
ls -la | grep package.json

# 如果不存在，从原项目复制
cp ../novascribe/package.json .
git add package.json
git commit -m "Add package.json"
git push
```

#### 问题 2: npm install 失败

**错误信息**: `npm ERR! code E404`

**解决方法**:
1. 确认 package-lock.json 已提交
2. 或者在 workflow 中使用 `npm install` 而不是 `npm ci`

修改 `.github/workflows/build.yml`:
```yaml
- name: Install dependencies
  run: npm install  # 改为 install
```

#### 问题 3: 构建超时

**错误信息**: `The job running on ... has exceeded the maximum execution time`

**解决方法**:
在 workflow 中增加超时时间：
```yaml
jobs:
  build:
    timeout-minutes: 60  # 增加到 60 分钟
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
```

### Actions 权限问题

#### 问题: 无法创建 Release

**错误信息**: `Resource not accessible by integration`

**解决方法**:
1. 进入仓库设置: Settings → Actions → General
2. 滚动到 "Workflow permissions"
3. 选择 "Read and write permissions"
4. ✅ 勾选 "Allow GitHub Actions to create and approve pull requests"
5. 点击 "Save"

## 📝 版本发布工作流

### 开发阶段

```bash
# 开发新功能
git add .
git commit -m "feat: add new feature"
git push

# 自动触发构建，生成测试版本
# 从 Actions 下载 Artifacts 测试
```

### 发布版本

```bash
# 1. 更新版本号
# 编辑 package.json 中的 version 字段
# 例如: "version": "1.0.0"

# 2. 提交版本更新
git add package.json
git commit -m "chore: bump version to 1.0.0"
git push

# 3. 创建并推送标签
git tag v1.0.0
git push origin v1.0.0

# 4. GitHub Actions 自动：
#    - 构建所有平台
#    - 创建 Release
#    - 上传安装包
```

### 发布后

1. 访问 Releases 页面
2. 编辑 Release 添加更新日志：

```markdown
## 🎉 v1.0.0

### ✨ 新功能
- 添加了 XX 功能
- 支持 YY 特性

### 🐛 修复
- 修复了 ZZ 问题

### 📝 改进
- 优化了性能
- 改进了用户界面

### 📦 下载
- Windows: NovaScribe-Setup-1.0.0.exe
- macOS: NovaScribe-1.0.0.dmg
- Linux: NovaScribe-1.0.0.AppImage
```

## 🔐 安全建议

### 不要提交敏感信息

确保以下文件在 .gitignore 中：

```gitignore
# 环境变量
.env
.env.local
.env.production

# 数据库
*.db
*.sqlite

# 用户数据
assets/*
!assets/.gitkeep

# API Keys（如果有配置文件）
config/secrets.json
```

### 使用 GitHub Secrets

如果需要在构建时使用密钥：

1. 进入仓库设置: Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加密钥，例如:
   - Name: `GEMINI_API_KEY`
   - Value: `your-api-key-here`

在 workflow 中使用：
```yaml
- name: Build with API Key
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: npm run build
```

## 🎯 下一步

完成上传后，你可以：

1. ✅ **添加 README 徽章**: 显示构建状态
2. ✅ **配置分支保护**: 保护 main 分支
3. ✅ **设置 Issues 模板**: 方便用户反馈
4. ✅ **添加贡献指南**: 吸引开源贡献者
5. ✅ **配置 GitHub Pages**: 部署项目文档

## 📚 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Electron Builder 文档](https://www.electron.build/)
- [GitHub Releases 指南](https://docs.github.com/en/repositories/releasing-projects-on-github)

---

需要帮助？在仓库创建 Issue 或查看文档。
