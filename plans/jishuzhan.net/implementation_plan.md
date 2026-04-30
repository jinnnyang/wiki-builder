# Implementation Plan - Jishuzhan.net Crawler

This plan outlines the implementation of a web crawler for `https://jishuzhan.net/` to scrape articles and convert them into Markdown files, following the patterns established in existing crawlers like `walkerdu.com.ts`.

## User Review Required

> [!IMPORTANT]
> The site uses `md-editor-v3` for rendering content. I will implement specific logic to clean up its code block structure (removing "Copy Code" text and nested spans) to ensure clean Markdown output.

## Proposed Changes

### Crawler

#### [NEW] [jishuzhan.net.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/jishuzhan.net.ts)

Implement the crawler using `Crawlee`'s `CheerioCrawler`:
- **Initial URL:** `https://jishuzhan.net/`
- **Request Handler:**
  - Detect if the page is an article using `.md-editor-v3-preview`.
  - Extract metadata:
    - Title: `.article-title`
    - Author: `.author-name`
    - Date: `.time`
    - Tags: `.category-tag`
  - Content Cleaning:
    - Remove `summary` from `details.md-editor-code`.
    - Simplify `pre > code` structure.
    - Remove irrelevant elements (scripts, styles, ads).
  - Convert to Markdown using `html2markdown`.
  - Save to `data/jishuzhan.net/...` using `url2DotMdPath`.
- **Link Enqueuing:**
  - Articles: `a[href^="/article/"]`
  - Categories: `a[href^="/category/"]`
  - Pagination/Archives if applicable.

## Verification Plan

### Automated Tests
- Run the crawler for a single article:
  `npx tsx .\crawler\jishuzhan.net.ts https://jishuzhan.net/article/2049688349217193986`
- Verify the generated Markdown file in `data/jishuzhan.net/article/2049688349217193986.md`.

### Manual Verification
- Check the Markdown content for:
  - Correct frontmatter (title, author, date, tags, source).
  - Clean article body without "Copy Code" noise.
  - Properly formatted code blocks with language tags.
