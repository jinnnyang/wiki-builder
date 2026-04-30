# Crawlee.dev Markdown Crawler Walkthrough

I have successfully implemented and verified the Markdown-optimized crawler for `crawlee.dev`. This crawler takes advantage of the site's ability to serve raw Markdown content by appending `.md` to URLs.

## Changes Made

### Crawler Implementation
- **File**: [crawlee.dev.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/crawlee.dev.ts)
- **Engine**: Used `BasicCrawler` for lightweight, direct text processing.
- **Logic**:
    - Fetches raw Markdown using `sendRequest`.
    - Saves files to `data/crawlee.dev/` using the standard `url2DotMdPath` utility.
    - Uses a Regex (`/\[.*?\]\((.*?)\)/g`) to discover internal links.
    - Automatically normalizes links:
        - Resolves relative paths.
        - Appends `.md` to extensionless or `.html` links.
        - Filters for internal domain links only.

## Verification Results

I ran the crawler for a short duration, and it successfully discovered and downloaded multiple documentation pages:

### Sample Saved Files:
- `data/crawlee.dev/js/docs/quick-start.md`
- `data/crawlee.dev/js/api/cheerio-crawler/class/CheerioCrawler.md`
- `data/crawlee.dev/js/api/playwright-crawler/class/PlaywrightCrawler.md`
- `data/crawlee.dev/js/docs/guides/configuration.md`

### Logs:
```
INFO  Processing: https://crawlee.dev/js/docs/quick-start.md
INFO  Saved to .../data/crawlee.dev/js/docs/quick-start.md (18248 bytes)
INFO  Processing: https://crawlee.dev/js/docs/introduction.md
INFO  Saved to .../data/crawlee.dev/js/docs/introduction.md (2391 bytes)
...
```

The crawler is now ready for full-scale use. You can run it anytime using:
`npx tsx crawler/crawlee.dev.ts`
