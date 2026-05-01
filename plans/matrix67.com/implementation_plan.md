# Matrix67 Blog Crawler Implementation Plan

Implement a robust TypeScript crawler for `https://matrix67.com/` using the `CheerioCrawler` framework, following the project's established patterns for content extraction and cleaning.

## User Review Required

> [!IMPORTANT]
> The site uses manual HTML for math formulas (Unicode, `<sup>`, `<sub>`, and images) rather than MathJax. The crawler will preserve these as-is.

## Proposed Changes

### [Crawler]

#### [NEW] [matrix67.com.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/matrix67.com.ts)
- Implement `CheerioCrawler` for `matrix67.com`.
- Use `preNavigationHooks` for header masking and incremental skip.
- Implement `requestHandler` to:
  - Distinguish between article pages and list pages.
  - Extract metadata (title, author, date, categories, tags) from both meta tags and page content.
  - Target `.entry-content` for the main text.
  - Clean up redundant elements (sidebar, comments, ads).
  - Use `html2markdown` for conversion and saving.
- Configure `enqueueLinks` to follow pagination and article links.

## Verification Plan

### Automated Tests
- Run with `maxRequestsPerCrawl: 5` to verify basic functionality:
  ```powershell
  npx tsx .\crawler\matrix67.com.ts
  ```
- Check the generated Markdown files in `storage/datasets/default/` (or wherever the `save` function puts them, usually `data/` based on previous examples) for:
  - Correct frontmatter.
  - Clean content (no sidebar/header).
  - Preserved math images and Unicode symbols.

### Manual Verification
- Inspect 1-2 generated files to ensure formatting is correct and math formulas are readable.
