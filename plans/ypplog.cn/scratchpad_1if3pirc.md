# Analysis of ypplog.cn

## Identified Selectors
1. **Article Title**: `h1` (main article title) or `main h1`.
2. **Article Content**: `.prose` or `article`.
3. **Published Date**: The text within the metadata section, likely `.text-gray-500` or a sibling of "发布于".
4. **Categories**: The second link in the breadcrumb: `nav[aria-label="Breadcrumb"] a:nth-child(2)` or `.hover\:text-blue-600` in the breadcrumb area.
5. **Tags**: `a[href^='/tags/']` at the bottom of the content.
6. **Author**: `.author-name` (sidebar) or the div containing "Silas".

## Cleaning Rules
- **Ads/Modals**: `.adblock-btn`, the bottom banner, and the initial popup.
- **Sidebars**: `aside` or the container for "关于作者", "相关文章", "标签云".
- **Table of Contents**: `details` element with "文章目录".
- **Metadata**: "发布于", "阅读量" lines.
- **Social/Related**: Share buttons at bottom, related posts links inside content.
- **Front Matter text**: The block at the beginning starting with `title: ...` if it's rendered as text.
