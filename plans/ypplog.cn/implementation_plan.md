# Crawler for lonepatient.top

This plan outlines the development of a TypeScript-based crawler for `http://lonepatient.top`, a personal blog built with Hexo and the Butterfly theme.

## User Review Required

> [!IMPORTANT]
> The site uses HTTP. All internal links will be crawled within the `lonepatient.top` domain.
> I will use a concurrency limit of 5 and a rate limit to be respectful to the personal blog.

## Proposed Changes

### Crawler Development

#### [NEW] [lonepatient.top.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/lonepatient.top.ts)
- Initialize `CheerioCrawler`.
- Implement `preNavigationHooks` for anti-crawling headers and incremental check.
- In `requestHandler`:
    - Identify article pages using `#post` and `#article-container`.
    - Extract metadata:
        - `title`: `#post-info .post-title`
        - `date`: `#post-info .post-meta-date-created time` (or meta tags)
        - `categories`: `#post-info .post-meta-categories a`
        - `tags`: `.post-meta__tag-list a`
    - Clean content:
        - Clone `#article-container`.
        - Remove `.post-copyright`, `#related-posts`, `.adsbygoogle`, etc.
        - Normalize Hexo code blocks (`figure.highlight`).
    - Convert to Markdown using `html2markdown`.
    - Save to `storage/` directory.
- Enqueue links for pagination and articles.

## Verification Plan

### Automated Tests
- Run the crawler with `maxRequestsPerCrawl: 5` to verify initial extraction and file saving.
- Check the generated Markdown files for metadata accuracy and clean content.

### Manual Verification
- Inspect 1-2 articles to ensure code blocks and images are correctly handled.
