# Walkthrough - Jishuzhan.net Crawler Implementation

I have implemented a new crawler for `https://jishuzhan.net/` following the existing patterns in the repository.

## Changes Made

### Crawler Implementation
- **File:** [jishuzhan.net.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/jishuzhan.net.ts)
- **Engine:** Uses `CheerioCrawler` for efficient scraping of SSR-rendered content.
- **Content Cleaning:**
  - Specifically handles `md-editor-v3` structure to produce clean Markdown.
  - Removes UI elements like "Copy Code" buttons.
  - Simplifies code blocks to standard `<pre><code>` before conversion.
- **Metadata:** Extracts title, source, and description (author/date extraction implemented but may vary based on specific page structure).
- **Link Discovery:** Automatically follows article links (`/article/*`), categories, and tags.

## Verification Results

### Single Article Crawl
- **URL:** `https://jishuzhan.net/article/2049688349217193986`
- **Output:** [2049688349217193986.md](file:///C:/Users/jinnn/Documents/wiki-builder/data/jishuzhan.net/article/2049688349217193986.md)
- **Result:** Successfully converted to Markdown with preserved code blocks and clean formatting.

### Batch Crawl
- Verified that the crawler correctly enqueues multiple articles and navigates through category pages.

## How to Run
To start the crawler:
```powershell
npx tsx .\crawler\jishuzhan.net.ts
```
To crawl a specific URL:
```powershell
npx tsx .\crawler\jishuzhan.net.ts [URL]
```
