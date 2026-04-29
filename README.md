# Wiki Builder

Wiki Builder is a specialized toolkit designed to create raw material for the **Karathy LLM Wiki**. Its primary goal is to provide high-quality, structured, and clean learning materials for AI agents by crawling and converting online documentation into LLM-friendly Markdown format.

## 🚀 Features

- **Specialized Crawlers**: Built-in support for `linux.die.net` and `man7.org` using [Crawlee](https://crawlee.dev/).
- **Zero-Dependency Converter**: `html2text` utility that transforms complex HTML into clean Markdown without external dependencies like Turndown (though optional support is available).
- **Anti-Crawling Strategies**: Integrated rate limiting, concurrency control, and browser-like headers to ensure reliable data extraction.
- **Structured Data**: Automatically organizes crawled content into a hierarchical directory structure based on URL slugs.
- **Modern Tech Stack**: Built with Next.js, TypeScript, and Tailwind CSS.

## 📁 Project Structure

```text
wiki-builder/
├── crawler/          # Crawler scripts (linux.die.net, man7.org)
├── utils/html2text/  # Zero-dependency HTML-to-Markdown converter
├── data/             # Generated Markdown files (ignored by git)
├── storage/          # Crawlee local storage (ignored by git)
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

To crawl documentation from `man7.org`:

```bash
npm run crawl:man7
```

To crawl documentation from `linux.die.net`:

```bash
npm run crawl:linux
```

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
