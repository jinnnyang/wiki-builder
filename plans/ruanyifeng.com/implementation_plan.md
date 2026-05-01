# Crawl Ruan Yifeng's Blog

This plan outlines the implementation of a web crawler for `https://www.ruanyifeng.com/blog`. The crawler will extract article content, convert it to Markdown, and save it locally.

## User Review Required

> [!IMPORTANT]
> The crawler will be limited to 5 pages per run during development/testing as requested.

## Proposed Changes

### Crawler

#### [NEW] [ruanyifeng.com.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/ruanyifeng.com.ts)

- Implement a `CheerioCrawler` to scrape `https://www.ruanyifeng.com/blog`.
- **Selectors**:
    - Article Detection: URL pattern `blog/\d{4}/\d{2}/.+\.html` or presence of `#entry-title`.
    - Title: `#entry-title`
    - Date: `abbr.published` or text match in metadata.
    - Content: `.asset-body`
    - Categories/Tags: `.asset-meta` or breadcrumbs.
- **Cleanup**: Remove sidebars, comments, scripts, and ads.
- **Markdown Conversion**: Use `html2markdown` with frontmatter (title, author, date, categories, source).
- **Storage**: Save to `data/ruanyifeng.com/` using `url2DotMdPath`.
- **Constraint**: Set `maxRequestsPerCrawl: 5`.

## Verification Plan

### Automated Tests
- Run the crawler script: `npx ts-node crawler/ruanyifeng.com.ts`.
- Verify that 5 markdown files are generated in the storage directory.
- Check the content of the generated markdown files for correct formatting and frontmatter.

### Manual Verification
- Inspect the generated markdown files to ensure no unwanted elements (like sidebar content) are included.
