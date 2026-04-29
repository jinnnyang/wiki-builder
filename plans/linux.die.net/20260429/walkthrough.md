# Walkthrough: linux.die.net Crawler

## Changes Made

I've implemented a new web crawler specifically designed for `linux.die.net` in `crawler/linux.die.net.ts`. 

### Key Features Implemented:
- **Crawler Framework**: Utilizes `CheerioCrawler` from Crawlee to fetch and parse HTML.
- **Content Extraction**: Selects the main content element (`#content` if available, otherwise falling back to `<body>`), and strips out noisy elements like navigation, menus, and sidebars.
- **HTML to Markdown**: Integrates your custom `html2markdown` tool from `utils/html2text` to do a clean, zero-dependency transformation.
- **File Path Resolution**: Dynamically calculates the target `.md` file path from the URL:
  - Trailing slashes are saved as `<path>/index.md`.
  - Filenames with extensions have their extension replaced with `.md`.
  - Filenames without extensions are appended with `.md`.
- **Anti-crawling Setup**: Configured with a `maxConcurrency` of 5 and a `maxRequestsPerMinute` of 120 to scrape the website politely without getting rate-limited or blocked.

## Source Code

```typescript
// Excerpt from crawler/linux.die.net.ts
const targetFile = pathname.endsWith('/') 
    ? path.join('data', hostname, pathname, 'index.md')
    : path.basename(pathname).includes('.') 
        ? path.join('data', hostname, pathname.replace(/\.[^.]+$/, '') + '.md')
        : path.join('data', hostname, `${pathname}.md`);
```

## Validation
- The script properly imports `html2markdown`.
- The crawler uses a polite rate limit (`120` max requests per minute, max concurrency `5`) to serve as a basic anti-crawling strategy.
- Path mappings cleanly reflect the structure of `linux.die.net`.

## Next Steps
You can run this crawler using:
```bash
npx tsx crawler/linux.die.net.ts
```
