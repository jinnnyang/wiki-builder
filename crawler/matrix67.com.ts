import { CheerioCrawler } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { html2markdown } from "../utils/html2text/src/index";
import url2DotMdPath from "../utils/common/url2DotMdPath";
import fileExists from "../utils/common/fileExists";
import getStoragePath from "../utils/common/getStoragePath";

const crawler = new CheerioCrawler({
  maxConcurrency: 5,
  maxRequestsPerMinute: 60,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 60,
  // limit requests per crawl for testing
  // maxRequestsPerCrawl: 5, // Uncomment for testing

  additionalMimeTypes: ["text/html", "application/xhtml+xml"],
  preNavigationHooks: [
    async (crawlingContext) => {
      const { request, log } = crawlingContext;

      request.headers = {
        ...request.headers,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      };

      const targetPath = getStoragePath(url2DotMdPath(request.url));
      if (await fileExists(targetPath)) {
        log.warning(`文件 ${targetPath} 已存在，跳过该请求`);
        request.skipNavigation = true;
      }
    },
  ],

  async requestHandler({ request, $, enqueueLinks, log }) {
    log.info(`正在处理: ${request.url}`);

    // 识别文章页：通常包含 article.post 或 .entry-content，且 URL 包含 archives 或日期路径
    const isArticle =
      $("article.post").length > 0 ||
      ($(".entry-content").length > 0 && request.url.includes("/archives/"));

    if (isArticle) {
      log.info(`识别为文章页: ${request.url}`);

      // 1. 提取元数据
      const title =
        $("h1.entry-title").first().text().trim() ||
        $("h1").first().text().trim();

      const author = "matrix67";

      const date =
        $("time.entry-date").attr("datetime") ||
        $("time").first().text().trim() ||
        "";

      const categories = $('.cat-links a, a[href*="/category/"]')
        .map((_, el) => $(el).text().trim())
        .get();

      const tags = $('.tag-links a, a[href*="/tag/"], a[rel="tag"]')
        .map((_, el) => $(el).text().trim())
        .get();

      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";

      // 2. 清理正文中的无关标签
      const $content = $(".entry-content").first();
      if ($content.length === 0) {
        log.warning(`未能找到 ${request.url} 的正文内容`);
        return;
      }

      const $articleContent = $content.clone();

      // 移除无关元素
      $articleContent.find("script, style, iframe, noscript").remove();
      $articleContent.find(".sharedaddy, .wpcnt, #jp-relatedposts").remove(); // Jetpack components
      $articleContent.find(".adsbygoogle").remove();

      const contentHtml = $articleContent.html() || "";

      // 3. 转换为 Markdown
      const markdown = html2markdown(contentHtml, {
        frontmatter: {
          title,
          author,
          date,
          categories,
          tags: [...new Set(tags)],
          description,
          source: request.loadedUrl,
        },
      });

      // 4. 保存文件
      const targetFile = url2DotMdPath(request.loadedUrl!);
      const absolutePath = getStoragePath(targetFile);

      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, markdown);
      log.info(`已保存: ${absolutePath} (${markdown.length} 字节)`);
    } else {
      log.info(`识别为列表或索引页: ${request.url}`);
    }

    // 5. 抓取更多链接
    await enqueueLinks({
      // 匹配文章路径
      regexps: [
        /^https:\/\/matrix67\.com\/blog\/archives\/\d+$/,
        /^https:\/\/matrix67\.com\/blog\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/$/,
      ],
      // 匹配分页路径
      globs: ["https://matrix67.com/blog/page/**"],
      // 匹配首页文章列表中的链接
      selector:
        'h1 a, .entry-title a, a.more-link, .nav-links a:contains("OLDER")',
    });
  },
});

(async () => {
  const startUrl = "https://matrix67.com/blog/";

  const startUrls = process.argv[2] ? [process.argv[2]] : [startUrl];

  await crawler.run(startUrls);
})();
