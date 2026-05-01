# Website Analysis: dhao2001.com

## Selectors
- **Article Title**: `.post-title` (post page), `.post-title-link` (list page)
- **Publication Date**: `.post-meta time[itemprop="dateCreated"]` or `.post-meta time[itemprop="datePublished"]`
- **Author**: "星期天" (extracted from footer or sidebar)
- **Tags**: `.post-tags a`
- **Categories**: `.post-category a`
- **Main Content**: `.post-body`
- **Pagination**: `.pagination`
  - Next Page Selector: `.pagination .extend.next`
  - URL Pattern: `/page/N/` (e.g., `https://www.dhao2001.com/page/2/`)

## URL Patterns
- **Article URL**: `https://www.dhao2001.com/YYYY/MM/DD/slug/`
- **Example**: `https://www.dhao2001.com/2025/08/09/stable-diffusion-webui-comfyui-install/`

## Technical Details
- **Theme**: Hexo NexT.Gemini
- **Site Generator**: Hexo
