import { CheerioAPI } from "crawlee";

/**
 * 通用清洗逻辑：URL 绝对化、移除无关标签、噪音清理
 */
export function commonClean($: CheerioAPI, baseUrl: string) {
  // 1. URL 绝对化 (href & src)
  $('a[href], img[src], source[src], iframe[src]').each((_: number, el: any) => {
    const $el = $(el);
    ['href', 'src'].forEach(attr => {
      const val = $el.attr(attr);
      if (val && !val.startsWith('http') && !val.startsWith('#') && !val.startsWith('mailto:') && !val.startsWith('tel:')) {
        try {
          $el.attr(attr, new URL(val, baseUrl).href);
        } catch (e) {
          // 忽略无效 URL
        }
      }
    });
  });

  // 2. 移除绝对噪音
  $('script, style, iframe, noscript, svg, symbol').remove();

  // 3. 移除常见的无关 UI 元素 (黑名单式清理)
  const noiseSelectors = [
    '.ads', '.adsense', '.ad-container', '.advertisement',
    '.social-share', '.share-buttons', '.post-sharing',
    '.comment-section', '#disqus_thread', '#comments',
    '.related-posts', '.recommended-articles',
    '.sidebar', '#sidebar', 'aside',
    'header:not(article header)', 'footer',
    '.nav-links', '.pagination'
  ];
  $(noiseSelectors.join(', ')).remove();

  // 4. 清理内联样式和事件属性
  $('*').removeAttr('style').removeAttr('onclick').removeAttr('onload');
}

/**
 * 通用元数据提取 (Frontmatter 基础)
 */
export function extractCommonMeta($: CheerioAPI) {
  return {
    title: $('meta[property="og:title"]').attr('content') || $('title').text().trim() || '',
    description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
    author: $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content') || '',
    date: $('meta[property="article:published_time"]').attr('content') || $('time').attr('datetime') || '',
    tags: $('meta[property="article:tag"]').map((_, el) => $(el).attr('content')).get(),
    image: $('meta[property="og:image"]').attr('content') || ''
  };
}
