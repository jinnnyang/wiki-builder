import { CheerioCrawler } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { html2markdown } from "../utils/html2text/src/index";
import url2DotMdPath from "../utils/common/url2DotMdPath";
import fileExists from "../utils/common/fileExists";

const crawler = new CheerioCrawler({
  // Basic anti-crawling strategies:
  maxConcurrency: 5,
  maxRequestsPerMinute: 30,
  maxRequestRetries: 4,
  requestHandlerTimeoutSecs: 30,

  // // limit requests per crawl
  // maxRequestsPerCrawl: 5,

  // 导航前钩子
  preNavigationHooks: [
    async (crawlingContext) => {
      const { request, log } = crawlingContext;
      log.info(`即将请求: ${request.url}`);

      const targetPath = path.resolve(
        process.cwd(),
        "data",
        url2DotMdPath(request.url),
      );
      if (await fileExists(targetPath)) {
        log.warning(`文件 ${targetPath} 已存在，跳过该请求`);
        request.skipNavigation = true;
      }
    },
  ],

  // 发起请求
  async requestHandler({ request, $, enqueueLinks, log }) {
    // 检查是否为具体的文章页面
    // 目标文章页面通常包含 .article-entry 元素
    const $content = $(".article-entry");
    const isArticle = $content.length > 0;

    if (isArticle) {
      log.info(`Processing Article: ${request.loadedUrl}`);

      // 1. 提取元数据
      const title = $("title")
        .text()
        .replace(/\s*\|\s*学海无涯，行者无疆\s*$/, "")
        .trim();

      const author = "walkerdu";

      const date =
        $('meta[property="article:published_time"]').attr("content") || "";

      const tags = $('meta[property="article:tag"]')
        .map((_, el) => $(el).attr("content"))
        .get();

      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";

      // 2. 专用解析器优化：处理 Hexo 代码块 (figure.highlight)
      // Hexo 默认使用 table 布局显示代码和行号，直接转换会非常混乱
      $content.find("figure.highlight").each((_, figure) => {
        const $figure = $(figure);
        // 提取语言 (如 <figure class="highlight yaml">)
        const lang =
          $figure
            .attr("class")
            ?.split(/\s+/)
            .find((c) => c !== "highlight" && c !== "line-numbers") || "";

        // 提取代码行内容 (跳过 .gutter 行号列，只取 .code 列)
        const codeLines: string[] = [];
        $figure.find(".code .line").each((_, line) => {
          // 这里取 text() 会包含所有嵌套 span 的内容
          codeLines.push($(line).text());
        });

        const codeText = codeLines.join("\n");

        // 用标准的 <pre><code class="language-xxx"> 结构替换 figure
        const $newCode = $(`<pre><code class="language-${lang}"></code></pre>`);
        $newCode.find("code").text(codeText);
        $figure.replaceWith($newCode);
      });

      // 3. 清理正文中的无关标签
      $content.find("script, style, iframe, noscript").remove();
      // 清除 Hexo 常带的标题锚点链接
      $content.find(".article-anchor").remove();
      // 清除可能存在的赞赏、分享等组件 (Hexo 常见类名)
      $content
        .find(".reward-container, .post-copyright, .social-share")
        .remove();

      const contentHtml = $content.html() || "";

      // 4. 转换为 Markdown
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

      // 5. 保存文件
      const targetFile = url2DotMdPath(request.loadedUrl!);
      const absolutePath = path.resolve(process.cwd(), "data", targetFile);

      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, markdown);
      log.info(`Saved to ${absolutePath} (${markdown.length} bytes)`);
    } else {
      log.info(`Processing List/Other Page: ${request.loadedUrl}`);
    }

    // 抓取更多的链接
    await enqueueLinks({
      // 使用 regexps 处理复杂的 URL 模式
      regexps: [
        /^https:\/\/walkerdu\.com\/\d{4}\/\d{2}\/\d{2}\/.+/, // 文章页
      ],
      // 使用 globs 处理简单的分页和归档路径
      globs: [
        "https://walkerdu.com/archives/**",
        "https://walkerdu.com/page/**",
        "https://walkerdu.com/tags/**",
        "https://walkerdu.com/categories/**",
      ],
    });
  },
});

(async () => {
  // 使用用户提供的测试链接 (添加末尾斜杠以保持一致性)
  const testUrl = "https://walkerdu.com/2025/12/30/k8s-workloads/";

  // 如果命令行提供了参数，则使用参数，否则使用测试链接
  const startUrls = process.argv[2] ? [process.argv[2]] : [testUrl];

  await crawler.run(startUrls);
})();
