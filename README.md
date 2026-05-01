# Wiki Builder

Wiki Builder is a specialized toolkit designed to create raw material for the **Karathy LLM Wiki**. Its primary goal is to provide high-quality, structured, and clean learning materials for AI agents by crawling and converting online documentation into LLM-friendly Markdown format.

## 🚀 Features

- **Specialized Crawlers**: Support for 15+ documentation sites and blogs (e.g., `linux.die.net`, `nextjs.org`, `ruanyifeng.com`) using [Crawlee](https://crawlee.dev/).
- **Intelligent Cleaning**: Automated framework detection (Hexo, Docusaurus, Next.js, etc.) and content cleaning for high-quality Markdown.
- **Zero-Dependency Converter**: `html2text` utility that transforms complex HTML into clean Markdown.
- **Anti-Crawling Strategies**: Integrated rate limiting, concurrency control, and browser-like headers.
- **Structured Data**: Automatically organizes crawled content into a hierarchical directory structure.
- **Modern Tech Stack**: Built with Next.js, TypeScript, and Tailwind CSS.

## 📁 Project Structure

```text
wiki-builder/
├── crawler/          # Crawler scripts for various sites
├── utils/
│   ├── html2text/    # HTML-to-Markdown converter
│   └── clean/        # Post-processing and cleaning utilities
├── data/             # Generated Markdown files (ignored)
├── plans/            # Implementation plans and design docs
├── storage/          # Crawlee local storage (ignored)
├── app/              # Next.js frontend for browsing the wiki
└── public/           # Static assets
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm, pnpm, or yarn

### Installation

```bash
npm install
# or
pnpm install
```

### Running Crawlers

To run a specific crawler (e.g., `ruanyifeng.com`):
```bash
npm run crawl:ruanyifeng
```

Or run any crawler script directly:
```bash
npm run crawl crawler/some-site.ts
```

*Note: Available crawler scripts are located in the `crawler/` directory.*

*Note: You can configure `maxRequestsPerCrawl` in the crawler scripts for testing.*

### Starting the Web Interface

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to browse your local wiki.

## 🔧 Utilities

### html2text

Located in `utils/html2text`, this is a standalone TypeScript library that converts HTML AST to Markdown AST and then serializes it. It handles:
- Tables
- Nested lists
- Code blocks (with syntax highlighting support)
- Definition lists
- Images and Links

## 📄 License

MIT
