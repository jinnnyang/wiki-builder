import { CheerioCrawler } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { html2markdown } from "../utils/html2text/src/index";
import url2DotMdPath from "../utils/common/url2DotMdPath";
import fileExists from "../utils/common/fileExists";
import getStoragePath from "../utils/common/getStoragePath";

const crawler = new CheerioCrawler({
  maxConcurrency: 2,
  maxRequestsPerMinute: 20,
  maxRequestRetries: 4,
  requestHandlerTimeoutSecs: 30,
  // maxRequestsPerCrawl: 5, // Limit for testing as requested

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
    // 阮一峰的博客文章通常包含 .entry-title
    const $title = $(".entry-title");
    const isArticle = $title.length > 0;

    if (isArticle) {
      log.info(`Processing Article: ${request.loadedUrl}`);

      // 1. 提取元数据
      const title = $title.first().text().trim();
      const author = "阮一峰";

      // 日期通常在 abbr.published 中
      const date =
        $("abbr.published").first().attr("title") ||
        $("abbr.published").first().text().trim() ||
        $(".asset-meta")
          .text()
          .match(/\d{4}年\d{1,2}月\d{1,2}日/)?.[0] ||
        "";

      const categories = $(".asset-meta a")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((cat) => cat !== "»" && cat !== "首页" && cat !== "档案");

      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";

      // 2. 清理正文中的无关标签
      const $content = $("#main-content, .entry-content");
      if ($content.length === 0) {
        log.warning(`Could not find content for ${request.loadedUrl}`);
        return;
      }

      // 复制一份，避免破坏原始 DOM (如果后续需要)
      const $articleContent = $content.first().clone();
      $articleContent.find("script, style, iframe, noscript").remove();
      $articleContent.find(".feed-link, .entry-footer").remove();

      const contentHtml = $articleContent.html() || "";

      // 3. 转换为 Markdown
      const markdown = html2markdown(contentHtml, {
        frontmatter: {
          title,
          author,
          date,
          categories,
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
      // 阮一峰博客的文章模式
      regexps: [
        /^https:\/\/www\.ruanyifeng\.com\/blog\/\d{4}\/\d{2}\/.+\.html$/,
      ],
      // 分页和归档
      globs: [
        "https://www.ruanyifeng.com/blog/",
        "https://www.ruanyifeng.com/blog/index.html",
        "https://www.ruanyifeng.com/blog/archives.html",
        "https://www.ruanyifeng.com/blog/weekly/",
        "https://www.ruanyifeng.com/blog/weekly/index.html",
      ],
    });
  },
});

(async () => {
  // 从首页开始
  const startUrl = "https://www.ruanyifeng.com/blog/";

  // 如果命令行提供了参数，则使用参数
  const startUrls = process.argv[2] ? [process.argv[2]] : [startUrl];

  await crawler.run(startUrls);
})();
