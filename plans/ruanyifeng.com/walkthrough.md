# Walkthrough: Ruan Yifeng Blog Crawler

I have successfully implemented and verified the crawler for `https://www.ruanyifeng.com/blog`.

## Changes Made

### Crawler Implementation
- Created [ruanyifeng.com.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/ruanyifeng.com.ts) using `CheerioCrawler`.
- Implemented robust selectors for:
    - **Title**: `.entry-title` / `#page-title`
    - **Date**: `abbr.published`
    - **Content**: `#main-content` / `.entry-content`
- Added cleanup logic to remove sidebars, comments, and scripts.
- Integrated with `html2markdown` for high-quality Markdown generation with frontmatter.

### Verification
- Ran the crawler with a limit of 5 requests (`maxRequestsPerCrawl: 5`).
- Successfully crawled and processed 2 full articles:
    - [weekly-issue-394.md](file:///C:/Users/jinnn/Documents/wiki-builder/data/www.ruanyifeng.com/blog/2026/04/weekly-issue-394.md)
    - [weekly-issue-393.md](file:///C:/Users/jinnn/Documents/wiki-builder/data/www.ruanyifeng.com/blog/2026/04/weekly-issue-393.md)
- Verified that the Markdown output includes:
    - Accurate frontmatter (Title, Author, Date, Categories, Source).
    - Preserved images and formatting.
    - Cleaned main content.

## How to Run
To run the crawler again or expand the limit:
1. Open [ruanyifeng.com.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/ruanyifeng.com.ts).
2. Adjust `maxRequestsPerCrawl` if needed.
3. Run: `npx tsx crawler/ruanyifeng.com.ts`
