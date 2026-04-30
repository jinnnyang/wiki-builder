# Crawlee.dev Markdown Crawler Implementation Plan

This plan outlines the creation of a specialized crawler for `crawlee.dev` that leverages the site's Markdown-friendly URL structure (`.md` suffix) to simplify content extraction.

## Goal
Recursively crawl `https://crawlee.dev` documentation by directly accessing `.md` files, extracting internal links, and saving the content to the local `data/` directory.

## User Review Required

> [!IMPORTANT]
> **Domain Scope**: The crawler is currently designed to stay within the `crawlee.dev` domain and prioritize documentation paths.
> **Link Transformation**: I will automatically append `.md` to extracted links that don't have it, as long as they appear to be documentation pages.

## Proposed Changes

### Crawler

#### [NEW] [crawlee.dev.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/crawlee.dev.ts)
- Implement a `BasicCrawler` (since we deal with raw text).
- **Seed URL**: `https://crawlee.dev/js/docs/quick-start.md`.
- **Request Handler**:
    1. Fetch the raw Markdown content using `sendRequest`.
    2. Save the content to `data/crawlee.dev/...` using `url2DotMdPath`.
    3. Extract links from the Markdown using a Regex that finds `[text](url)` patterns.
    4. Normalize extracted links:
        - Resolve relative links.
        - Ensure internal `crawlee.dev` links end with `.md`.
    5. Add valid internal documentation links to the queue.

### Utilities

- Use existing `utils/common/url2DotMdPath.ts` for consistent file naming.
- Use `utils/common/fileExists.ts` to avoid redundant downloads.

## Verification Plan

### Automated Tests
- Run the crawler with a limited request count.
- Verify that files are created in `data/crawlee.dev/` with `.md` extension.
- Inspect the content of a few saved files.
