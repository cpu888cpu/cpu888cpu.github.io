# 个人主页（链接 GitHub 自动同步）

一个纯静态单页站点：头像、简介、仓库列表、语言标签、Star 总数全部从 GitHub API 实时读取。
没有构建步骤，不需要后端，改一行配置就能上线。

## 文件结构

```
site/
├── index.html   页面结构
├── style.css    样式（深海深色主题、响应式）
├── app.js       配置 + GitHub 数据渲染
└── README.md    本文件
```

## 第一步：填你的用户名

打开 `app.js`，最上方：

```js
const CONFIG = {
  githubUser: "your-username",   // ← 改成你的 GitHub 用户名
  maxRepos: 9,                   // 最多显示几个仓库
  excludeRepos: [],              // 不想展示的仓库名，如 ["dotfiles"]
  blogUrl: "",                   // 博客地址，留空自动隐藏按钮
  email: "",                     // 邮箱，留空自动隐藏按钮
  aboutText: ""                  // 自定义「关于」，留空则用 GitHub 简介
};
```

保存后刷新页面即可，其余内容自动同步。

## 第二步：本地预览（可选）

```bash
cd site
python3 -m http.server 8000
```

浏览器打开 `http://localhost:8000`。
注意：必须是 http 服务，直接双击 `index.html` 用 `file://` 打开时，部分浏览器会拦截跨域请求。

## 第三步：部署到 GitHub Pages

1. 在 GitHub 新建仓库，例如 `你的用户名.github.io`（这样域名最美观）或 `mysite`
2. 把 `site/` 里的三个文件推到仓库根目录：

```bash
git init
git add index.html style.css app.js
git commit -m "init personal site"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库.git
git push -u origin main
```

3. 仓库 → Settings → Pages
   - Source 选 `Deploy from a branch`
   - Branch 选 `main`，目录 `/ (root)`，保存
4. 等一两分钟，访问：
   - 仓库名是 `你的用户名.github.io` → `https://你的用户名.github.io`
   - 其他仓库名 → `https://你的用户名.github.io/仓库名/`

## 换成自己的域名（可选）

在 `site/` 下新增一个 `CNAME` 文件，内容写一行域名，例如：

```
me.example.com
```

然后在域名服务商处加一条 CNAME 记录指向 `你的用户名.github.io`。

## 注意事项

- **API 频率限制**：未登录的 GitHub API 每小时 60 次 / 每 IP。个人主页够用；如果被刷，可以换成构建时生成静态数据（见下）。
- **只显示公开仓库**：私有仓库不会出现在列表里，这是 GitHub API 的权限决定的（前端不带 token 就是这样，安全上也正确）。
- **想彻底不依赖 API**：可以改成构建时拉一次数据、写进 `data.json`，前端只读这个文件。需要的话我可以补一个脚本。
- **CORS**：GitHub 的 `api.github.com` 允许跨域，所以纯前端可以直接调。

## 已知设计取舍

- 用系统字体栈，不引外部字体，避免国内加载慢或被墙。
- 无第三方依赖，只有 3 个文件，GitHub Pages 完全够用。
- 语言筛选条只在仓库涉及 2 种以上语言时出现，避免只有一颗按钮的尴尬。
