# Implementation Plan - dhao2001.com Crawler

Analyze and implement a web crawler for [dhao2001.com](https://dhao2001.com/) to extract blog posts and convert them into clean Markdown files.

## User Review Required

> [!IMPORTANT]
> The site uses Hexo NexT theme. I have identified the primary content selectors.
> The author name "星期天" seems consistent across the site. I will extract it from the sidebar or use it as a default.

## Proposed Changes

### Crawler Script

#### [NEW] [dhao2001.com.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/dhao2001.com.ts)

Implement a `CheerioCrawler` using the project's standard patterns:
- **Selectors**:
  - Title: `h1.post-title` or `.post-title-link`
  - Date: `.post-meta time[itemprop="dateCreated"]` (attr `datetime`)
  - Categories: `.post-category a`
  - Tags: `.post-tags a`
  - Content: `.post-body`
- **Filtering**:
  - Remove `.post-widgets`, `.post-copyright`, `.reward`, `.post-nav`, and any comments sections.
- **URL Enqueueing**:
  - Articles: `/\d{4}/\d{2}/\d{2}/.+/`
  - Pagination: `/page/\d+/`

### Project Config

#### [MODIFY] [package.json](file:///c:/Users/jinnn/Documents/wiki-builder/package.json)

Add `crawl:dhao2001` script.

## Verification Plan

### Automated Tests
- Run `npm run crawl crawler/dhao2001.com.ts` with `maxRequestsPerCrawl` set to 5.
- Verify generated files in `data/www.dhao2001.com/`.

### Manual Verification
- Check formatting of a post with code blocks and images.
