# 小宇宙喂养记录

> 纯本地、离线可用的宝宝喂养 PWA
> 单宝宝，无账号、无云同步

## 特性
- 三类记录：喂奶 / 尿布 / 睡觉
- 主页快捷卡片 + 今日明细 + 最近 7 天汇总
- 今日可编辑，昨日及更早仅汇总
- 完整离线（Service Worker + IndexedDB）
- iOS Safari / Chrome 添加到主屏幕
- 9:16 适配 iPhone 14 Pro
- 纯 HTML5 + CSS3 + ES6


## 部署到 GitHub Pages
1. GitHub 创建新仓库
2. 上传 outputs 下的所有文件

## iPhone 添加到主屏幕
1. Safari 打开网址
2. 分享 -> 添加到主屏幕
3. 桌面出现图标，独立窗口启动
本地预览

## 本地预览
Service Worker 需要 http 协议，用静态服务器：

## 目录
- index.html
- styles.css
- app.js
- sw.js
- manifest.webmanifest
- icon.svg

## 数据存储
数据库 xiaoyuzhou-feeding:
- feedings: id, time, amount, note
- diapers: id, time, type (pee/poop/mixed)
- sleeps: id, startTime, endTime, duration

数据完全保存在设备本地。
3. Settings Pages Source 选 Deploy from a branch
4. 分支 main / (root)
user app
