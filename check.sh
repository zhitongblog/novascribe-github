#!/bin/bash
echo "=================================="
echo "  NovaScribe GitHub 文件验证"
echo "=================================="
echo ""

errors=0
warnings=0

echo "检查必需文件..."
files=(
  "package.json"
  "tsconfig.json"
  "vite.config.ts"
  "electron-builder.yml"
  "index.html"
  ".gitignore"
  ".github/workflows/build.yml"
  "README.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (缺失)"
    ((errors++))
  fi
done

echo ""
echo "检查必需文件夹..."
folders=(
  "src"
  "electron"
  "docs"
  ".github/workflows"
)

for folder in "${folders[@]}"; do
  if [ -d "$folder" ]; then
    echo "  ✅ $folder"
  else
    echo "  ❌ $folder (缺失)"
    ((errors++))
  fi
done

echo ""
echo "检查不应存在的文件..."
bad_items=(
  "node_modules"
  "dist"
  "dist-electron"
  ".vite"
  ".env"
  ".claude"
)

for item in "${bad_items[@]}"; do
  if [ -e "$item" ]; then
    echo "  ⚠️  $item (不应该提交)"
    ((warnings++))
  else
    echo "  ✅ $item (已排除)"
  fi
done

echo ""
echo "=================================="
if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
  echo "  ✅ 验证通过！可以上传到 GitHub"
elif [ $errors -eq 0 ]; then
  echo "  ⚠️  有 $warnings 个警告"
else
  echo "  ❌ 有 $errors 个错误，$warnings 个警告"
fi
echo "=================================="
