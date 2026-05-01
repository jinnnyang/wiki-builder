import { CheerioAPI } from "cheerio";

/**
 * Jishuzhan / md-editor-v3 专用清洗
 */
export function jishuzhanClean($container: any, $: CheerioAPI) {
  // 1. 处理 md-editor-v3 代码块 (通常包在 details 中)
  $container.find("details.md-editor-code").each((_: any, details: any) => {
    const $details = $(details);
    const $pre = $details.find("pre");
    const $code = $pre.find("code");
    
    // 提取语言
    const lang = $code.attr("language") || "";
    
    // 提取代码内容
    let codeText = $details.find(".md-editor-code-block").text();
    if (!codeText) {
      codeText = $pre.find("code").text() || $pre.text();
    }
    
    // 移除行号
    $pre.find("span[rn-wrapper]").remove();

    // 替换为标准结构
    const $newCode = $(`<pre><code class="language-${lang}"></code></pre>`);
    $newCode.find("code").text(codeText.trim());
    $details.replaceWith($newCode);
  });

  // 2. 移除编辑器 UI 干扰
  $container.find(".md-editor-code-head").remove();
}
