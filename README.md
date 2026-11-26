# seam 个人站

用 `npm ci` 安装依赖，`npm run dev` 启动本地预览。运行 `npm run build` 会先检查 TypeScript，再把首页、博客、项目和已有文章生成为 `dist/` 下的静态页面。

## 按改动找文件

| 要改什么 | 从哪里开始 |
| --- | --- |
| 首页介绍、公司和项目图标 | 编辑 `content/home.md`。图标放在 `public/media/brands/`，将图标和名称放进同一个 Markdown 链接即可显示为行内标签。 |
| 文章、项目、站名与导航文字 | 文章放在 `content/posts/`，项目列表在 `content/projects.json`，站名、栏目名称与 GitHub 主页在 `content/site.json`。对应的 Pages CMS 表单位于 `.pages.yml`。 |
| 页面布局和样式 | 页面入口在 `src/pages/<页面>/index.vue`。全站明暗色、布局和正文排版在 `src/styles/`。 |
| 栏目与路由 | 栏目地址在 `src/router/sections.ts`，页面组件和背景的对应关系在 `src/router/routes.ts`。 |
| 博客归档和文章详情 | `src/features/posts/index.ts` 读取 Markdown 并按日期排序。新文章填写标题、日期和正文，文件名决定详情地址。 |
| 签名与背景动画 | 签名动画在 `src/components/site-header/signature.vue`，梅枝和点阵在 `src/components/background/`。 |
