#!/bin/bash
# StoryGlint macOS 安装修复脚本
# 双击运行此脚本即可修复"文件已损坏"问题

echo "正在修复 StoryGlint..."
sudo xattr -rd com.apple.quarantine /Applications/StoryGlint.app
echo ""
echo "✅ 修复完成！现在可以正常打开 StoryGlint 了。"
echo ""
read -p "按回车键关闭此窗口..."
