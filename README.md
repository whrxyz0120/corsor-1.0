# 宝宝记录

简洁的网页版宝宝喂养记录工具，纯前端 HTML/CSS/JS + IndexedDB。支持 PWA 离线使用，可添加到 iPhone 主屏幕。

## 功能
- 喂奶: 快捷按钮 60/90/100/120/150 + 自定义
- 尿布: 尿尿 / 大便 / 混合
- 睡觉: 一键开始/结束，自动计算时长
- 编辑: 今日记录可改可删
- 最近 7 天汇总
- PWA 离线可用
## 部署
1. push app 目录
2. Pages -> main + /app
3. 打开网址
也可 Netlify/Vercel/Cloudflare

## iPhone 主屏
1. Safari 打开
2. 分享 -> 添加到主屏幕
3. 离线可用

## 本地运行
cd app
python -m http.server 8000
打开 localhost:8000
不能用 file:// (SW 需要 HTTP)

## 数据
- IndexedDB 本地存储
- 启动时清理 7 天前数据
- 清浏览器数据 = 清空所有

## 技术栈
原生 HTML/CSS/JS, IndexedDB, Service Worker, Web App Manifest
