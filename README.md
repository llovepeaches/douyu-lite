# DouyuHub · 斗鱼直播聚合第三方应用

基于**斗鱼公开数据**构建的跨平台第三方应用。一套前端代码覆盖 Web / PWA / Windows / macOS / Android / iOS，提供直播间聚合浏览、实时弹幕、人气数据看板、主播关注与开播提醒四大功能。

> 数据来自斗鱼对外公开的 HTTP 接口与弹幕 WebSocket 服务；不登录、不抓取私有数据、不转码分发直播流。项目仅供学习与研究使用。

---

## 一、快速开始

```bash
cd /workspace/douyu-app

# 1. 安装依赖（根目录 / 前端 / 服务端）
npm install
npm --prefix client install
npm --prefix server install

# 2. 开发模式（API 服务 :3001 + 前端热更新 :5173）
npm run dev

# 3. 生产模式（构建 + 单端口运行，访问 http://localhost:3001）
npm run build
npm start
```

生产模式下 Node 服务同时托管前端静态文件和 API 代理，浏览器打开 `http://localhost:3001` 即可使用。

## 二、功能

| 模块 | 说明 |
|---|---|
| 首页推荐 | 斗鱼综合推荐流，无限滚动加载，分类快捷入口 |
| 分区发现 | 按游戏/品类浏览分区房间，支持翻页和筛选 |
| 直播间 | 房间详情、直播观看入口（跳转斗鱼官方）、**实时弹幕**、关键词高亮与系统通知 |
| 实时弹幕 | 浏览器直连 `wss://danmuproxy.douyu.com:8506`，自实现 STT 私有协议（登录/入组/心跳/解包），自动重连，聊天/礼物/进场消息解析 |
| 数据看板 | TOP 热度榜、分区人气饼图、全站人气趋势（本地每分钟采样，ECharts 渲染） |
| 我的关注 | 本地收藏主播、开播状态轮询、浏览器开播通知 |
| 搜索 | 直播间/主播搜索（斗鱼接口有 IP 级限频，已做友好降级提示） |

## 三、技术架构

```
client/    React 18 + TypeScript + Vite + ECharts + HLS.js + PWA
server/    Express 轻量代理：斗鱼接口转发 / CORS / 图片代理 / 缓存
electron/  Electron 桌面壳（Windows / macOS / Linux）
mobile/    Capacitor 壳（Android / iOS）
```

- 浏览器无法直连斗鱼 HTTP 接口（CORS），由 `server/index.js` 转发并注入 UA/Referer。
- 直播弹幕走浏览器原生 WebSocket，不经过代理；斗鱼图片经 `/api/proxy` 白名单转发。
- 收藏、设置、采样数据全部存本地 `localStorage`，不上传服务器。

## 四、四端打包

### Web / PWA（全平台浏览器）
```bash
npm run build && npm start
```
访问 `http://localhost:3001`，在浏览器菜单中选择「安装应用」即可作为 PWA 安装到 Windows / macOS / Android 桌面，支持独立窗口与离线缓存。

### Windows / macOS（Electron）
```bash
npm install -D electron electron-builder
npm run electron:dev     # 开发预览
npm run electron:build   # 产物在 release/ 目录（exe / dmg / AppImage）
```
> Electron 交叉编译限制：Windows 安装包建议在 Windows 上构建，macOS 的 dmg/ipa 必须在 macOS 上构建（Apple 签名要求）。

### Android / iOS（Capacitor）
```bash
cd mobile && npm install
npm run add:android    # 生成 android/ 工程，再用 Android Studio 构建 APK
npm run add:ios        # 生成 ios/ 工程（需 macOS + Xcode）
```
移动端 WebView 需要访问部署后的后端：在 `mobile/capacitor.config.json` 的 `server.url` 中填入你的 API 服务公网地址，例如 `https://api.example.com`。

## 五、GitHub Actions 自动构建

项目已配置完整的多平台 CI 流水线（`.github/workflows/build.yml`），代码推送到 GitHub 后可自动构建并发布安装包。

### 触发方式

| 方式 | 说明 |
|---|---|
| 手动触发 | GitHub 仓库 → Actions → 「构建 DouyuHub 全平台安装包」→ Run workflow，可选择目标平台 |
| 标签触发 | 推送 `v*` 标签（如 `git tag v1.0.0 && git push origin v1.0.0`），自动构建全部平台并创建 GitHub Release |

### 构建产物

| Job | 运行系统 | 产物 |
|---|---|---|
| Web / PWA | Ubuntu | `douyuhub-web-pwa.zip`（可直接部署到任意静态托管） |
| Windows | Windows | Electron 生成的 `.exe`（NSIS 安装版 + 便携版） |
| macOS | macOS | Electron 生成的 `.dmg` + `.zip` |
| Android | Ubuntu | Capacitor 生成的调试版 `.apk` |
| iOS | macOS | 模拟器版 `.app`（无需签名，用于 Xcode 模拟器测试） |

### 下载安装包（已发布）

正式安装包已发布到 [Releases 页面](https://github.com/llovepeaches/douyu-lite/releases/tag/v1.0.0)，打开即可直接下载，无需登录 GitHub Actions：

| 平台 | 文件 | 大小 |
|---|---|---|
| Windows | `douyuhub-windows-exe.zip` | 116 MB |
| macOS | `douyuhub-macos-dmg.zip` | 112 MB |
| Android | `douyuhub-android-apk.zip` | 4 MB |
| iOS | `douyuhub-ios-simulator.zip` | 1.7 MB |
| Web / PWA | `douyuhub-web-pwa.zip` | 0.6 MB |

如需重新发布，到 Actions 运行「发布安装包到 Release」，可指定构建 run ID 和版本号。

### 本次实测结果（2026-11-20）

代码已推送到 `llovepeaches/douyu-lite`，run #3（[44716263545](https://github.com/llovepeaches/douyu-lite/actions/runs/44716263545)）**五个平台全部构建成功**，产物大小：macOS 约 228 MB、Windows 约 223 MB、Android APK 约 4 MB、iOS 模拟器包约 1.7 MB、Web 约 0.6 MB。

> 修复过程中踩过的三个 CI 坑，已全部解决：① electron-builder 新版废弃了顶层 `icons` 属性；② `android-actions/setup-android` 安装废弃的 `tools` 包会失败（已移除，runner 自带 SDK）；③ electron-builder 在 CI 中会尝试隐式发布，需加 `--publish never`。

### 配置 API 服务地址（移动端）

Android/iOS 应用的 WebView 需要访问后端 API。在 GitHub 仓库 → Settings → Secrets and variables → Actions → Variables 中添加变量：

- 名称：`API_BASE_URL`
- 值：你部署的后端地址，例如 `https://api.example.com`

CI 会自动将其注入 Capacitor 配置。未配置时构建仍会成功，但移动端需要手动设置后端地址才能加载数据。

### 本地连接 GitHub

```bash
# 登录 GitHub CLI（会打开浏览器授权）
gh auth login

# 创建仓库并推送
gh repo create douyuhub --public --source=. --remote=origin --push

# 或关联已有仓库
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

推送后打开 Actions 页面即可看到构建任务。

## 六、接口说明

| 前端路由 | 上游斗鱼接口 |
|---|---|
| `/api/cate` | `m.douyu.com/api/cate/list` + `open.douyucdn.cn/api/RoomApi/game` |
| `/api/rooms` | `www.douyu.com/gapi/rkc/directory/mixList/2_{id}/{page}` |
| `/api/recommend` | `www.douyu.com/japi/weblist/apinc/allpage/6/{page}` |
| `/api/search` | `www.douyu.com/japi/search/api/searchShow\|searchUser` |
| `/api/room/:rid` | `www.douyu.com/betard/{rid}` |
| `/api/play/:rid` | `www.douyu.com/lapi/live/getH5PlayV1/{rid}` |
| `/api/proxy` | 斗鱼 CDN 图片白名单转发 |

## 七、已知限制

1. **直播画面**：斗鱼 H5 播放地址有防盗链和签名限制，内嵌播放可能失败；应用会自动降级为跳转斗鱼官方直播间观看，弹幕仍在应用内同步。
2. **搜索限频**：斗鱼搜索接口对 IP 有严格频率限制，频繁搜索会返回错误，属正常现象。
3. **弹幕连接**：依赖斗鱼弹幕服务的可用性；网络受限时面板会显示连接状态并自动重连。
4. **原生安装包**：iOS / macOS 构建需要 Apple 生态环境；本项目提供完整工程与脚本，需在对应系统执行。

---

© 2026 DouyuHub · 非官方项目，与斗鱼直播平台无关联。
