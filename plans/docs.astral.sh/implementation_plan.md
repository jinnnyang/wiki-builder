# Astral Docs Crawler Implementation Plan

This plan outlines the creation of a web crawler for `docs.astral.sh`, which hosts documentation for `uv` and `ruff`. The crawler will use `CheerioCrawler` and the project's custom `html2markdown` utility.

## User Review Required

> [!IMPORTANT]
> The crawler will target both `uv` and `ruff` sub-directories under `docs.astral.sh`.
> It will save the files in the local wiki structure based on the URL path.

## Proposed Changes

### [NEW] [docs.astral.sh.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/docs.astral.sh.ts)

A new crawler script will be created with the following features:
- **Base URLs**: `https://docs.astral.sh/uv/` and `https://docs.astral.sh/ruff/`.
- **Selectors**:
  - **Navigation**: `nav.md-nav a.md-nav__link` to find internal documentation links.
  - **Content Area**: `article.md-content__inner` which is the standard content container for Material for MkDocs.
  - **Title**: `h1` within the content area.
  - **Exclusions**: Remove UI elements like "Edit this page" (`.md-content__button`), tags (`.md-tags`), and social links.
- **Deduplication**: Uses `fileExists` and `getStoragePath` to skip already crawled pages.
- **Markdown Conversion**: Uses `html2markdown` with frontmatter (title, source URL).

## Verification Plan

### Automated Tests
1. Run the crawler for a few pages:
   ```powershell
   npx tsx .\crawler\docs.astral.sh.ts https://docs.astral.sh/uv/getting-started/
   ```
2. Verify the generated Markdown file in the output directory (e.g., `data/docs.astral.sh/uv/getting-started.md`).

### Manual Verification
- Check the quality of the generated Markdown, ensuring headers, code blocks, and links are correctly preserved and UI clutter is removed.
