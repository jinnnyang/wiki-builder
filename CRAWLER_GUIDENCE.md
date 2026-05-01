# Crawler Development Guidance

This document serves as a Standard Operating Procedure (SOP) and reference guide for developing new crawlers within the Wiki Builder project.

## 1. Workflow (SOP)

### Step 1: Site Reconnaissance
Before writing any code, use browser dev tools to understand the site:
- **Identify Framework**: Recognize the CMS or static site generator (e.g., Hexo, Docusaurus, Next.js). This hints at common DOM structures.
- **Analyze URL Patterns**: Distinguish between article URLs (e.g., `/YYYY/MM/DD/slug/`) and list/pagination URLs (e.g., `/page/2/`, `/categories/`).
- **Locate Selectors**: Find consistent CSS selectors for Title, Author, Date, Categories, Tags, and the main Content body.
- **Assess Anti-Crawling**: Check for rate limits, dynamic rendering (client-side only), or anti-bot protections.

### Step 2: Implementation Planning
- Choose between `CheerioCrawler` (fast, for static HTML) and `PlaywrightCrawler` (slower, for dynamic/SPA or heavy anti-bot sites).
- Define the routing logic: which URLs to extract content from vs. which URLs to only enqueue links from.
- Plan DOM cleanup: identify elements to remove before markdown conversion (ads, sidebars, comments).

### Step 3: Development
- Create a new `.ts` file in the `crawler/` directory.
- Use `preNavigationHooks` to implement incremental crawling (skip existing files).
- Implement `requestHandler` for precise metadata extraction, content cleaning (`$.clone().find(...).remove()`), and DOM structural transformation.
- Use the project's `html2markdown` utility for conversion.
- Configure `enqueueLinks` with strict `regexps` and `globs`.

### Step 4: Verification
- Run a dry test by setting `maxRequestsPerCrawl: 5`.
- Verify the generated markdown in the `data/` directory.
- Check frontmatter accuracy, content cleanliness, and proper markdown formatting (code blocks, tables).
- Add an npm script to `package.json`.

---

## 2. Do & Don't

### ✅ Do
- **Do use Regex for Article Identification**: Always prefer URL pattern matching over DOM element presence to identify article pages. (e.g., `/archive/` pages might contain `.post-title` but aren't articles).
- **Do implement Incremental Crawling**: Always check if the target Markdown file exists and use `request.skipNavigation = true` to save bandwidth and time.
- **Do clone the DOM before cleaning**: Use `$content.clone()` before removing noise elements to avoid altering the state if the crawler needs to re-process or if it affects Cheerio's internal tree unexpectedly.
- **Do use polite crawling settings**: Respect `maxConcurrency` and `maxRequestsPerMinute` to avoid DDOSing target sites or getting banned.

### ❌ Don't
- **Don't crawl without inspecting the network**: Ensure you aren't downloading massive unnecessary assets if using a browser-based crawler.
- **Don't rely solely on visual appearance**: Inspect the raw HTML. What looks like a date might be inside a complex `<span>` or require extracting an attribute like `datetime`.
- **Don't hardcode absolute paths for local saving**: Always use the project's utility functions (`getStoragePath`, `url2DotMdPath`) for consistent file placement.

---

## 3. Caution & Advanced Scenarios

### Complex UI Layouts & Markdown Conversion (DOM Transformation)
Modern frameworks often use complex UI patterns (e.g., "Cards" wrapping `<h4>` and `<p>` inside an `<a>` tag, or inline "Tabs" separated only by CSS margins). When standard HTML-to-Markdown converters process these, the output is often visually "smashed" or incorrectly nested.
**Solution**:
- **Transform, don't just clean**: Before passing HTML to `html2markdown`, use Cheerio to structurally modify the DOM. For example, find card-style links and replace them with standard `<li><a href="...">...</a>: ...</li>` structures.
- **Fix Inline Spacing**: Use Cheerio to insert explicit spaces between adjacent inline elements (e.g., `$('a + a').each((_, el) => $(el).before(' '))`) that rely on CSS for visual spacing, preventing them from sticking together in the resulting text.
- **Targeted Cleanup**: When removing "noise" (e.g., "Edit this page", "Ask AI" buttons), use targeted text or class selectors to ensure you don't inadvertently strip out surrounding context like introductory paragraphs.

### Dynamic Content & Client-Side Rendering
If `CheerioCrawler` returns empty or skeleton HTML, the site likely uses client-side rendering.
**Solution**: Switch to `PlaywrightCrawler` and use `page.waitForSelector('.main-content')` before extracting HTML.

### Anti-Debugging (Disabled Console / `debugger` loops)
Some sites aggressively prevent inspection.
**Solution**:
- In DevTools, use "Deactivate breakpoints".
- Use Local Overrides to modify and neutralize their detection scripts.
- In `PlaywrightCrawler`, use `page.addInitScript` to override detection mechanisms (e.g., spoofing window resize events or overriding `console` modifications).

### Encrypted Data Responses
If Network APIs return encrypted blobs:
**Solution**:
- **Prefer DOM Extraction**: The easiest path is to let the browser decrypt and render the content, then use `PlaywrightCrawler` to scrape the final HTML DOM.
- **API Hooking**: If raw data is needed, inject a script to hook into `JSON.parse` or the site's specific decryption function to intercept the data right after it's decoded.

### Rate Limiting & IP Bans
If you start receiving 403 Forbidden or 429 Too Many Requests:
**Solution**:
- Lower `maxRequestsPerMinute`.
- Increase `maxRequestRetries` and add exponential backoff.
- Use `SessionPool` in Crawlee to rotate user agents and session footprints.
