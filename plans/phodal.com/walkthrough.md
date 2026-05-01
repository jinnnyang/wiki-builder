# Walkthrough - Phodal.com Crawler Implementation

I have implemented a robust crawler for `phodal.com` that converts blog articles into high-quality Markdown files.

## Changes Made

### Crawler Implementation
- **File**: [phodal.com.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/phodal.com.ts)
- **Engine**: `CheerioCrawler` for fast, static content parsing.
- **Discovery**: Automatically parses `https://www.phodal.com/sitemap.xml` to discover over 1000+ blog articles.
- **Anti-Bot**: Configured with custom browser headers to avoid `403 Forbidden` errors.
- **Cleaning**: Specifically targets `.post_detail` container and removes MDL-specific UI elements, sidebar fragments, and related article links.

### Metadata Extraction
- **Title**: Extracted from the main H2 header.
- **Author**: Extracted from the post meta link.
- **Date**: Normalized from the post meta text (e.g., `2026年4月22日 15:54`).
- **Category**: Defaults to `Blog` (extracted from list view if available).

## Verification Results

### Sample Output
I verified the output with several recent articles. The Markdown is clean and contains full frontmatter.

Example file: [task-adaptive-harness/index.md](file:///c:/Users/jinnn/Documents/wiki-builder/data/www.phodal.com/blog/task-adaptive-harness/index.md)

### Performance
- **Concurrency**: Set to 5 to be respectful to the server.
- **Incremental**: The crawler skips files that already exist in `data/www.phodal.com/`.

## Current Status
The full crawl is currently running in the background (Command ID: `c18480ba-c021-4602-bf18-33fd6fdf269c`).
