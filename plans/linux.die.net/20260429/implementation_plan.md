# Implementation Plan: linux.die.net Crawler

## Goal Description
The goal is to develop a specialized web crawler (`crawler/linux.die.net.ts`) targeting pure HTML pages on `linux.die.net`. The crawler will use Crawlee's `CheerioCrawler` and convert the extracted HTML content into Markdown using the custom `utils/html2text` library. The resulting Markdown files will be organized according to their source URLs and saved locally. Basic anti-crawling strategies will be implemented to ensure the crawler operates reliably without being blocked.

## User Review Required
> [!IMPORTANT]
> Please review the URL to File Path Mapping logic below to ensure it matches your exact requirement for "如果叶节点不是文件，那么在该路径目录下保存为 index.md". 

## Open Questions
> [!WARNING]
> 1. **Starting URLs**: Should the crawler start from a specific root page (e.g., `https://linux.die.net/man/`) or multiple specific URLs? 
> 2. **Glob Patterns for enqueueLinks**: Should the crawler only follow links within `/man/` or the entire `linux.die.net` domain?
> 3. **Main Content Selector**: `linux.die.net` typically places the main text in a `<div id="content">`. Should we target this specific container, or process the entire `<body>`? Targeting `#content` avoids parsing the site navigation/sidebars into the markdown.

## Proposed Changes

### Crawler Script

#### [NEW] `crawler/linux.die.net.ts`
This script will implement the `CheerioCrawler`.

**Key Features:**
1. **HTML to Markdown**: Import and utilize `html2markdown` from `../utils/html2text/src/index.ts`.
2. **Path Mapping**: 
   - Base Directory: `data/linux.die.net/`
   - If the URL ends with a trailing slash `/` (e.g., `/man/1/`), it will be saved as `data/linux.die.net/man/1/index.md`.
   - If the URL has an extension (e.g., `/man/1/ls.html`), it will be saved as `data/linux.die.net/man/1/ls.md`.
   - If the URL lacks an extension (e.g., `/man/1/ls`), it will be treated as a file and saved as `data/linux.die.net/man/1/ls.md`.
3. **Anti-Crawling Strategies**:
   - Utilize Crawlee's default `got-scraping` for browser-like headers and TLS fingerprints.
   - Limit `maxConcurrency` (e.g., to 5 or 10) to avoid overloading the target server.
   - Add a slight delay or rate limit (`maxRequestsPerMinute`) to mimic human behavior.
4. **Data Extraction**:
   - Extract the `<title>` and `<h1>` (if available).
   - Extract the main content area (ideally `#content` or fallback to `<body>`).
   - Clean up navigation elements before passing the HTML to `html2markdown`.
   - Prepend Frontmatter/Title to the generated markdown.

## Verification Plan

### Automated Tests
- Run the crawler using `npx tsx crawler/linux.die.net.ts` with a small `maxRequestsPerCrawl` (e.g., 5).
- Verify that `data/linux.die.net/...` directories are correctly created and populated.
- Inspect the markdown content to ensure `html2markdown` processed the HTML successfully and skipped navigation menus.

### Manual Verification
- Review the generated Markdown structure.
- Confirm that anti-crawling rate-limits are functioning (checking the logs for request rates).
