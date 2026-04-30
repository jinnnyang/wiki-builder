# Implementation Plan: Nunumick Blog Crawler

This plan outlines the implementation of a web crawler targeting `https://life.nunumick.cn/blog/posts/` to extract blog posts and convert them to Markdown, extracting the specified metadata (`title`, `author`, `date`, `category`) as frontmatter.

## Goal Description

Create a robust web crawler using Crawlee's `CheerioCrawler` to parse blog posts from `https://life.nunumick.cn`. It will extract the main content along with meta information (title, author, date, category), convert the HTML to a clean Markdown format with frontmatter, and save it locally. This implementation will use the existing `html2markdown` utility and follow the same architecture as the current `linux.die.net.ts` crawler.

## User Review Required

- **Title Extraction**: The page's `<title>` tag contains `" - 默尘"`. Should I automatically strip this suffix, or do you prefer to extract the title from `<h2 class="entry_title">` which already has a clean title? In the plan below, I will extract from `<title>` and remove the suffix.
- **Content Scope**: The blog post content is encapsulated within `<div class="entry_cont">`. I will use this as the extraction root for the markdown conversion to avoid grabbing sidebars and footers.
- **Link Enqueueing**: The crawler will start from `https://life.nunumick.cn/blog/posts/` and look for blog post URLs that match the pattern `https://life.nunumick.cn/blog/*/*/*/*.html` (e.g., `2026/03/02/xxx.html`) to avoid crawling non-article pages. Please confirm if this URL pattern covers all your blog posts.

## Open Questions

> [!NOTE]
> Are there any specific categories or tags from the site that you want to ignore during crawling, or should we scrape everything that matches the blog post URL pattern?

## Proposed Changes

---

### Crawler Script

#### [NEW] [nunumick.blog.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/nunumick.blog.ts)

I will create a new file `nunumick.blog.ts` in the `crawler` directory. The implementation will include:

1. **Crawler Setup**: Using `CheerioCrawler` with polite settings (concurrency limits, pre-navigation duplicate check).
2. **Metadata Extraction Logic**:
   - `title`: `$("title").text().replace(/\s*-\s*默尘\s*$/, "").trim()`
   - `author`: `$(".entry_data span:contains('作者：')").text().replace("作者：", "").trim()`
   - `date`: `$(".entry_data span:contains('发布时间：')").text().replace("发布时间：", "").trim()`
   - `category`: `$(".entry_data .entry_cate a").map((_, el) => $(el).text().trim()).get()` (as an Array)
3. **Content Extraction**: Select `.entry_cont`, remove any potential noise (`script`, `style`), and pass its `.html()` to your custom `html2markdown` function.
4. **Frontmatter Configuration**: Inject the extracted metadata into the `frontmatter` property of the `html2markdown` options.
5. **Queueing Strategy**: Start at `https://life.nunumick.cn/blog/posts/` and use `enqueueLinks` with a glob `https://life.nunumick.cn/blog/*/*/*/*.html` to recursively discover pages.

## Verification Plan

### Automated Tests
1. Run the script against the test URL provided: `ts-node crawler/nunumick.blog.ts` (modified to just target that URL for the test).
2. Validate the generated Markdown file in the `data` directory to ensure:
   - Frontmatter is formatted properly with all metadata fields.
   - Main content is cleanly converted without HTML noise.

### Manual Verification
Review the generated `openclaw-multi-agent-setup.md` to ensure code blocks, lists, and headings are properly formatted by `html2markdown`.
