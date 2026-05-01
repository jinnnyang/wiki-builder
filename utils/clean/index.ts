import { CheerioAPI } from "cheerio";
import { commonClean, extractCommonMeta } from "./common";
import { hexoClean } from "./hexo";
import { docusaurusClean } from "./docusaurus";
import { jishuzhanClean } from "./jishuzhan";

export {
  commonClean,
  extractCommonMeta,
  hexoClean,
  docusaurusClean,
  jishuzhanClean
};

/**
 * 尝试根据页面特征识别渲染框架
 */
export function detectFramework($: CheerioAPI): string {
  if ($('meta[name="generator"]').attr('content')?.toLowerCase().includes('hexo')) return 'HEXO';
  if ($('.article-entry').length > 0 && $('.highlight').length > 0) return 'HEXO';
  
  if ($('div[class*="admonition"]').length > 0 || $('.theme-doc-markdown').length > 0) return 'DOCUSAURUS';
  if ($('html').attr('data-theme')?.includes('docusaurus')) return 'DOCUSAURUS';
  
  if ($('.md-editor-preview').length > 0) return 'JISHUZHAN';
  
  if ($('meta[name="next-head-count"]').length > 0 || $('#__next').length > 0) return 'NEXTJS';
  
  return 'GENERIC';
}
