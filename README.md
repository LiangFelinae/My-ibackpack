# 小亮的背包（My-ibackpack）

这是一个纯前端单人票券背包项目，支持 PWA、离线使用、iPhone 添加到主屏。

## 项目定位
- 仅本地使用（无登录、无后端）
- 票券新增、使用、分类查看、统计
- 本地存储（`localStorage`）+ 导入导出备份
- iPhone PWA（主屏图标、离线缓存）

## 目录说明
- `index.html`：主页面（开发主文件）
- `manifest.webmanifest`：PWA 配置
- `service-worker.js`：离线缓存
- `icons/`：图标资源（含你自定义封面图）
- `docs/`：GitHub Pages 发布目录（与根目录保持同步）

## 开发约定（重要）
从现在开始，所有后续修改都在这个目录下进行：
- `/Users/liang/Documents/New project/My-ibackpack`

## 本地预览
可用任意静态服务器打开（不要直接双击 HTML）：

```bash
cd "/Users/liang/Documents/New project/My-ibackpack"
python3 -m http.server 8080
```

浏览器访问：
- `http://localhost:8080`

## GitHub 上传（建议）
在 `My-ibackpack` 目录执行：

```bash
cd "/Users/liang/Documents/New project/My-ibackpack"
git add .
git commit -m "update: xiaoliang backpack"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

然后在仓库 `Settings -> Pages` 设置：
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/docs`

## iPhone 使用
1. Safari 打开 GitHub Pages 链接
2. 分享 -> 添加到主屏幕
3. 若图标或样式没更新：删除主屏快捷方式后重新添加

