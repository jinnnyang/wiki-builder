import { CheerioAPI } from "cheerio";

/**
 * Docusaurus 专用清洗
 */
export function docusaurusClean($container: any, $: CheerioAPI) {
  // 1. 处理 Admonitions (提示框 / Callouts)
  // Docusaurus 的提示框通常有 admonition 类，且有一个具体的类型类
  $container.find('div[class*="admonition"]').each((_: any, el: any) => {
    const $el = $(el);
    const classes = $el.attr('class') || '';
    
    // 提取类型 (note, tip, danger, etc.)
    const typeMatch = classes.match(/admonition-(\w+)/) || classes.match(/admonition_(\w+)/);
    const type = typeMatch ? typeMatch[1] : 'note';
    
    // 提取标题 (通常在 admonition-heading 或特定类名中)
    const title = $el.find('[class*="admonitionHeading"], [class*="admonition-heading"]').text().trim() || type.toUpperCase();
    
    // 提取内容
    const content = $el.find('[class*="admonitionContent"], [class*="admonition-content"]').html() || $el.html();
    
    $el.replaceWith(`\n:::${type} ${title}\n${content}\n:::\n`);
  });

  // 2. 清理正文中的导航和反馈按钮
  $container.find('.theme-doc-footer-edit-this-page, .pagination-nav').remove();
  $container.find('button[class*="copyButton"]').remove();

  // 3. 移除内联 TOC (如果被包含在正文容器中)
  $container.find('.table-of-contents, .toc-inline').remove();
}
