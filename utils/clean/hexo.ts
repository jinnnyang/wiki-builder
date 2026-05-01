import { CheerioAPI } from "cheerio";

/**
 * Hexo 专用清洗：处理复杂的代码块布局
 */
export function hexoClean($container: any, $: CheerioAPI) {
  // 1. 处理 Hexo 标志性的 table 布局代码块 (figure.highlight)
  $container.find("figure.highlight").each((_: any, figure: any) => {
    const $figure = $(figure);
    
    // 提取语言 (如 <figure class="highlight yaml">)
    const lang = $figure.attr("class")?.split(/\s+/).find((c) => c !== "highlight" && c !== "line-numbers") || "";

    // 提取代码行内容 (跳过 .gutter 行号列，只取 .code 列)
    const codeLines: string[] = [];
    $figure.find(".code .line").each((_: any, line: any) => {
      codeLines.push($(line).text());
    });

    const codeText = codeLines.join("\n");

    // 用标准的 <pre><code class="language-xxx"> 结构替换 figure
    const $newCode = $(`<pre><code class="language-${lang}"></code></pre>`);
    $newCode.find("code").text(codeText);
    $figure.replaceWith($newCode);
  });

  // 2. 清理 Hexo 常见的锚点
  $container.find(".article-anchor, .header-anchor").remove();

  // 3. 移除多余的 class
  $container.find('.line-numbers, .gutter').remove();
}
