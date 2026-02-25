# 遥遥的福运阁（GitHub Pages 发布包）

这个仓库已经整理好，可直接发布成 PWA。

## 已准备内容
- `docs/index.html`：主页面
- `docs/manifest.webmanifest`：PWA 配置
- `docs/service-worker.js`：离线缓存
- `docs/icons/*`：主屏图标
- `docs/.nojekyll`：确保静态文件原样发布

## 一次性发布步骤（最省事）
1. 新建一个 GitHub 仓库（比如 `yaoyao-fuyunge`）。
2. 在本机项目目录执行：

```bash
git add .
git commit -m "init pwa"
git branch -M main
git remote add origin https://github.com/<你的用户名>/yaoyao-fuyunge.git
git push -u origin main
```

3. 打开 GitHub 仓库页面：`Settings` -> `Pages`
4. `Build and deployment` 里设置：
- `Source`: `Deploy from a branch`
- `Branch`: `main`
- `Folder`: `/docs`

5. 保存后等 1-3 分钟，访问：
- `https://<你的用户名>.github.io/yaoyao-fuyunge/`

## iPhone 安装
1. 用 Safari 打开上面的链接。
2. 点击分享按钮 -> `添加到主屏幕`。
3. 主屏幕会显示应用名“遥遥的福运阁”和图标。
