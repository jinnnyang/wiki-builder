# Matrix67 Crawler Investigation Plan

- [x] Inspect article page (https://matrix67.com/blog/archives/4722)
    - [x] Main article container: `article` (standard WordPress structure)
    - [x] Title class (h1): `h1.entry-title` (or simply `h1`)
    - [x] Date class and format: `time` tag, format `YYYY 年 M 月 D 日`
    - [x] Categories and tags markup: `a` tags within metadata section below content
    - [x] Main content div: `div.entry-content` (or simply the div after title)
- [x] Inspect blog list page (https://matrix67.com/blog/)
    - [x] Article link listing structure: `h1` titles containing `a` tags.
    - [x] "Next Page" link class: Text is "OLDER", usually in `.nav-links a`.

## Findings
- **Article Page (https://matrix67.com/blog/archives/4722):**
    - **Container:** The article is likely wrapped in an `<article>` tag.
    - **Title:** `h1` (observed as non-interactive text on the article page).
    - **Date:** In a `<time>` tag. Format: `2011 年 11 月 8 日`.
    - **Tags/Categories:** Metadata links at the bottom of the post content, with links like `/archives/tag/...`.
    - **Content:** The main body is in a `div` following the title/meta.
- **Blog List Page (https://matrix67.com/blog/):**
    - **Articles:** Each post has an `h1` title containing an `a` link to the article.
    - **Date:** `<time>` tag.
    - **Pagination:** The "Next Page" link has the text "OLDER".
    - **"Read more":** Link with class `more-link`.
