# Implementation Plan - Tailscale Docs Crawler

Crawling Tailscale documentation and converting it to clean Markdown files.

## User Review Required

> [!IMPORTANT]
> The Tailscale documentation site is a modern Next.js application. While it supports SSR, some complex components (like interactive CLI examples or dynamic platform toggles) might be simplified during Markdown conversion.

## Proposed Changes

### Crawler Development

#### [NEW] [tailscale.com.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/tailscale.com.ts)
Create a new crawler script specifically for Tailscale docs.

**Key Features:**
- **Crawler**: `CheerioCrawler` for fast, server-side DOM parsing.
- **Selectors**:
  - Main Content: `article.prism.markdown-content`
  - Title: `h1`
  - Breadcrumbs: `nav[aria-label="Breadcrumb"]`
- **DOM Cleaning**:
  - Remove sidebar, TOC, header, footer.
  - Remove feedback widgets and "Ask AI" buttons.
  - Remove scripts, styles, and SVGs.
- **Metadata**: Extract title and original source URL into frontmatter.
- **Incremental Crawling**: Skip pages that already have a corresponding `.md` file in `data/`.

## Verification Plan

### Automated Tests
- Run the crawler with a limit: `npx ts-node crawler/tailscale.com.ts --limit 5`
- Verify the generated files in `data/tailscale.com/docs/`.

### Manual Verification
- Inspect the generated Markdown for:
  - Correct title in frontmatter.
  - Clean body content (no sidebar text).
  - Preserved code blocks and tables.
  - Correct relative link handling.
