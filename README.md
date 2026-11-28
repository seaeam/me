# seam 的个人网站

首页介绍近况，博客按日期归档文章，项目页列出正在维护的开源项目。站点使用 Vue 和 Vite SSG，页面内容保存在 `content/`。

## 本地开发

运行 `pnpm install --frozen-lockfile` 安装依赖，再用 `pnpm dev` 启动开发服务。运行 `pnpm build` 生成静态页面，`pnpm preview` 可以预览构建结果。

## 测试

用 `pnpm test` 执行全部测试，或用 `pnpm test:watch` 在开发时监听变动。测试放在所属模块的 `__SPEC__/` 中。例如，`pnpm test server/__SPEC__/github-cache.test.ts` 只运行服务端缓存测试。开发顺序和交付检查见[仓库协作约定](./AGENTS.md)。
