import { CheerioCrawler } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { html2markdown } from "../utils/html2text/src/index";
import url2DotMdPath from "../utils/common/url2DotMdPath";
import fileExists from "../utils/common/fileExists";
import getStoragePath from "../utils/common/getStoragePath";

const crawler = new CheerioCrawler({
  maxConcurrency: 5,
  maxRequestsPerMinute: 30,
  maxRequestRetries: 4,
  requestHandlerTimeoutSecs: 30,

  preNavigationHooks: [
    async (crawlingContext) => {
      const { request, log } = crawlingContext;
      log.info(`即将请求: ${request.url}`);

      const targetPath = getStoragePath(url2DotMdPath(request.url));
      if (await fileExists(targetPath)) {
        log.warning(`文件 ${targetPath} 已存在，跳过该请求`);
        request.skipNavigation = true;
      }
    },
  ],

  async requestHandler({ request, $, enqueueLinks, log }) {
    // 1. 检查是否为具体的文章页面
    // 目标文章页面通常包含 .md-editor-preview 或 .md-editor-v3-preview 元素
    const $content = $(".md-editor-preview, .md-editor-v3-preview");
    const isArticle = $content.length > 0;

    if (isArticle) {
      log.info(`Processing Article: ${request.loadedUrl}`);

      // 2. 提取元数据
      const title = $("h1.title").text().trim() || $("title").text().trim();
      const author = $(".article-info .author, .author").first().text().trim();
      const date = $(".article-info .time, .time, .date").first().text().trim();
      const tags = $(".el-tag__content, .tag-list .tag-item, .tags .tag, .category-tag")
        .map((_, el) => $(el).text().trim())
        .get();

      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";

      // 3. 专用解析器优化：处理 md-editor-v3 代码块
      $content.find("details.md-editor-code").each((_, details) => {
        const $details = $(details);
        const $pre = $details.find("pre");
        const $code = $pre.find("code");
        
        // 提取语言
        const lang = $code.attr("language") || "";
        
        // 提取代码内容 (通常在 .md-editor-code-block 中)
        let codeText = $details.find(".md-editor-code-block").text();
        if (!codeText) {
          // 备选方案：直接取 pre 的文本并清理
          codeText = $pre.find("code").text() || $pre.text();
        }
        
        // 去除可能的行号或 UI 文本 (如果有的话)
        // 在 md-editor-v3 中，如果存在行号，它们可能在 span[rn-wrapper] 中
        $pre.find("span[rn-wrapper]").remove();

        // 用标准的 <pre><code class="language-xxx"> 结构替换 details
        const $newCode = $(`<pre><code class="language-${lang}"></code></pre>`);
        $newCode.find("code").text(codeText.trim());
        $details.replaceWith($newCode);
      });

      // 4. 清理正文中的无关标签
      $content.find("script, style, iframe, noscript").remove();
      // 移除编辑器的 UI 元素 (如果有漏掉的)
      $content.find(".md-editor-code-head").remove();

      const contentHtml = $content.html() || "";

      // 5. 转换为 Markdown
      const markdown = html2markdown(contentHtml, {
        frontmatter: {
          title,
          author,
          date,
          tags,
          description,
          source: request.loadedUrl,
        },
      });

      // 6. 保存文件
      const targetFile = url2DotMdPath(request.loadedUrl!);
      const absolutePath = getStoragePath(targetFile);

      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, markdown);
      log.info(`Saved to ${absolutePath} (${markdown.length} bytes)`);
    } else {
      log.info(`Processing List/Other Page: ${request.loadedUrl}`);
    }

    // 7. 抓取更多的链接
    await enqueueLinks({
      regexps: [
        /^https:\/\/jishuzhan\.net\/article\/\d+/, // 文章页
      ],
      globs: [
        "https://jishuzhan.net/category/**",
        "https://jishuzhan.net/tag/**",
        "https://jishuzhan.net/",
      ],
    });
  },
});

(async () => {
  // 示例链接
  const testUrl = "https://jishuzhan.net/article/2049688349217193986";

  const startUrls = process.argv[2] ? [process.argv[2]] : [testUrl];

  await crawler.run(startUrls);
})();
