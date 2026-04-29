# Wiki Builder (中文版)

Wiki Builder 是一个专门为 **Karathy LLM Wiki** 创建原始素材的工具包。它的核心目标是通过抓取和转换在线文档，为 AI Agent 提供高质量、结构化且易于解析的 Markdown 格式学习资料。

## 🚀 功能特性

- **专用爬虫**：基于 [Crawlee](https://crawlee.dev/) 内置了对 `linux.die.net` 和 `man7.org` 的支持。
- **零依赖转换器**：`html2text` 工具可将复杂的 HTML 转换为纯净的 Markdown，不依赖 Turndown 等外部库。
- **反爬虫策略**：集成速率限制、并发控制和模拟浏览器请求头，确保数据提取的稳定性。
- **结构化数据**：根据 URL 路径自动将抓取的内容整理成层级分明的目录结构。
- **现代技术栈**：使用 Next.js、TypeScript 和 Tailwind CSS 构建。

## 📁 项目结构

```text
wiki-builder/
├── crawler/          # 爬虫脚本 (linux.die.net, man7.org)
├── utils/html2text/  # 零依赖 HTML 转 Markdown 转换器
├── data/             # 生成的 Markdown 文件 (git 忽略)
├── storage/          # Crawlee 本地存储 (git 忽略)
├── app/              # 用于浏览 Wiki 的 Next.js 前端
└── public/           # 静态资源
```

## 🛠️ 快速开始

### 前提条件

- Node.js (v20 或更高版本)
- npm, pnpm 或 yarn

### 安装

```bash
npm install
# 或者
pnpm install
```

### 运行爬虫

抓取 `man7.org` 的文档：

```bash
npm run crawl:man7
```

抓取 `linux.die.net` 的文档：

```bash
npm run crawl:linux
```

*注意：您可以在爬虫脚本中配置 `maxRequestsPerCrawl` 以进行测试。*

### 启动 Web 界面

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可浏览您的本地 Wiki。

## 🔧 工具库

### html2text

位于 `utils/html2text`，这是一个独立的 TypeScript 库，通过将 HTML AST 转换为 Markdown AST 并进行序列化来工作。它支持：
- 表格
- 嵌套列表
- 代码块（支持语法高亮）
- 定义列表
- 图片和链接

## 📄 开源协议

MIT
