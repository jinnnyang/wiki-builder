# Implementation Plan - Phodal.com Crawler

Implement a web crawler for `https://www.phodal.com` to archive blog posts as Markdown files.

## User Review Required

> [!IMPORTANT]
> The site has anti-bot protection (403 Forbidden for default User-Agents). We must use a common browser User-Agent.

## Proposed Changes

### [NEW] [phodal.com.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/phodal.com.ts)

Create a new crawler script using `CheerioCrawler`.

#### Key Features:
- **Link Discovery**: Use `https://www.phodal.com/sitemap.xml` to discover all blog posts.
- **Metadata Extraction**:
    - Title: `h2.section--center.mdl-grid.mdl-cell--11-col` (on article page)
    - Author: `.post-meta a[href^="/blog/author/"]`
    - Date: `.post-meta span`
    - Category: Extracted from sitemap or article page (if available) or list view. *Note: Sitemap doesn't have categories. I will try to find them on the article page or default to 'Uncategorized'.*
- **Content Extraction**:
    - Container: `.post_detail .mdl-card__supporting-text`
    - Cleaning: Remove `.post-meta`, `.mdl-card__actions`, and any other UI elements.
- **Incremental Crawling**: Skip existing files to save time and bandwidth.
- **Rate Limiting**: Set concurrency to 5 as recommended for personal blogs.

### [Component] Utils

- Use `html2markdown` from `utils/html2markdown.ts` for conversion.
- Use `fileExists` from `utils/file.ts` (if it exists) or implement a simple check.

## Verification Plan

### Automated Tests
- Run the crawler with `maxRequestsPerCrawl: 5` to verify:
    - Successful discovery of links from sitemap.
    - Correct extraction of metadata.
    - Clean Markdown output.
    - Correct file naming and storage path (`data/phodal.com/`).

### Manual Verification
- Inspect the generated Markdown files for:
    - Frontmatter correctness.
    - Content completeness.
    - Cleanliness (no navigation, footers, or sidebars).
    - Image URLs (should be absolute).
