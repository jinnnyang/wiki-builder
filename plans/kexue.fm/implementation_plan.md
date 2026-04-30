# Implementation Plan - kexue.fm Crawler

Analyze the structure of `https://kexue.fm` and implement a robust crawler `crawler/kexue.fm.ts` that extracts articles, handles MathJax formulas according to specific rules, and saves them as Markdown.

## User Review Required

> [!IMPORTANT]
> The site uses client-side MathJax rendering. I will use `PlaywrightCrawler` to ensure we can target the `MathJax-Element-N` structure you described.
> 
> [!NOTE]
> The formula transformation rule will be:
> - Inline formulas: ` $ <latex> $ ` (with spaces)
> - Block formulas: `$$` on separate lines before and after.

## Proposed Changes

### Crawler Development

#### [NEW] [kexue.fm.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/kexue.fm.ts)
- Initialize `PlaywrightCrawler`.
- **Request Handler**:
    - Identify if it's an article page using `#PostContent`.
    - **Metadata Extraction**:
        - **Title**: `.PostHead h1 a`
        - **Author**: Extract from `.submitted span:nth-child(2)` (likely "苏剑林").
        - **Date**: Extract from `.submitted span:nth-child(3)`.
        - **Categories**: `#breadcrumb a` (excluding the first "首页").
        - **Tags**: `.tools .cat a` (filtering for links containing `/tag/`).
    - **MathJax Processing** (via `page.evaluate`):
        - Find `[id^="MathJax-Element-"]` (source blocks).
        - Find `[id$="-Frame"]` (rendered frames).
        - For each source block:
            - Determine if it's display math (script type `mode=display`).
            - Replace with its content wrapped in delimiters: ` $ latex $ ` or `\n$$\nlatex\n$$\n`.
        - Remove all frame blocks.
    - **Markdown Generation**:
        - Pass the modified `#PostContent` HTML to `html2markdown`.
        - Include extracted metadata in frontmatter.
    - **Saving**:
        - Use `SITES_ROOT` environment variable for the base path.
        - Use `url2DotMdPath` for the relative path.
    - **Link Enqueueing**:
        - Enqueue article links: `/archives/\d+`.
        - Enqueue pagination links: `/page/\d+`.
        - Enqueue category/archive links.

## Verification Plan

### Automated Tests
- Run the crawler with the sample URL: `npx ts-node crawler/kexue.fm.ts https://kexue.fm/archives/11719`.
- Inspect the generated `.md` file to verify:
    - Metadata accuracy.
    - MathJax formula formatting (delimiters and spacing).
    - Overall Markdown structure.

### Manual Verification
- Check a few more articles with different math structures (e.g., multi-line equations).
- Verify that sidebar content and advertisements are excluded.
