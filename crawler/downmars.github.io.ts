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
  maxRequestsPerCrawl: 5, // Limit for testing as requested

  // 导航前钩子
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

  // 发起请求
  async requestHandler({ request, $, enqueueLinks, log }) {
    // 检查是否为具体的文章页面
    // Hugo PaperMod 通常使用 .post-single 或在 main 中包含 .post-content
    const $content = $(".post-content");
    const isArticle = $content.length > 0;

    if (isArticle) {
      log.info(`Processing Article: ${request.loadedUrl}`);

      // 1. 提取元数据
      const title = $(".post-title").text().trim() || $("title").text().replace(/\s*\|\s*DLog\s*$/, "").trim();
      const author = "downmars";
      
      // PaperMod post-meta often looks like "March 15, 2026 · 5 min · downmars"
      // But we can also look at meta tags for cleaner data
      const date = $('meta[property="article:published_time"]').attr("content") || 
                   $(".post-meta time").attr("datetime") || 
                   $(".post-meta").text().match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";

      const tags = $(".post-tags a")
        .map((_, el) => $(el).text().trim())
        .get();

      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";

      // 2. 清理正文中的无关标签
      // Remove TOC
      $content.find("#toc, .toc").remove();
      $content.find("script, style, iframe, noscript").remove();
      
      // Remove anchor links from headers (Hugo common)
      $content.find("a.anchor").remove();
      
      const contentHtml = $content.html() || "";

      // 3. 转换为 Markdown
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

      // 4. 保存文件
      const targetFile = url2DotMdPath(request.loadedUrl!);
      const absolutePath = getStoragePath(targetFile);

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
        /^https:\/\/downmars\.github\.io\/zh\/posts\/.+/, // 文章页
      ],
      // 使用 globs 处理简单的分页和归档路径
      globs: [
        "https://downmars.github.io/zh/posts/",
        "https://downmars.github.io/zh/posts/page/**",
        "https://downmars.github.io/zh/archives/**",
        "https://downmars.github.io/zh/tags/**",
      ],
    });
  },
});

(async () => {
  // 默认从首页或 posts 页开始
  const startUrl = "https://downmars.github.io/zh/posts/";

  // 如果命令行提供了参数，则使用参数
  const startUrls = process.argv[2] ? [process.argv[2]] : [startUrl];

  await crawler.run(startUrls);
})();
