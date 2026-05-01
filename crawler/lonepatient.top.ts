import { CheerioCrawler } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { html2markdown } from "../utils/html2text/src/index";
import url2DotMdPath from "../utils/common/url2DotMdPath";
import fileExists from "../utils/common/fileExists";
import getStoragePath from "../utils/common/getStoragePath";

const crawler = new CheerioCrawler({
  // Basic anti-crawling strategies:
  maxConcurrency: 5,
  maxRequestsPerMinute: 30,
  maxRequestRetries: 4,
  requestHandlerTimeoutSecs: 60,

  // limit requests per crawl
  // maxRequestsPerCrawl: 5,

  // 导航前钩子
  preNavigationHooks: [
    async (crawlingContext) => {
      const { request, log } = crawlingContext;
      log.info(`即将请求: ${request.url}`);

      // 伪装身份
      request.headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer": "http://lonepatient.top/",
      };

      const targetPath = getStoragePath(url2DotMdPath(request.url));
      if (await fileExists(targetPath)) {
        log.warning(`文件 ${targetPath} 已存在，跳过该请求`);
        request.skipNavigation = true;
      }
    },
  ],

  // 发起请求
  async requestHandler({ request, $, enqueueLinks, log }) {
    // Butterfly 主题文章容器通常在 #post
    const $articleContainer = $("#article-container");
    const isArticle = $articleContainer.length > 0 && $("#post").length > 0;

    if (isArticle) {
      log.info(`Processing Article: ${request.loadedUrl}`);

      // 1. 提取元数据
      const title = $("#post-info .post-title").text().trim() || $("title").text().split(" | ")[0].trim();
      const author = "lonepatient";
      
      const date = 
        $("#post-info .post-meta-date-created time").attr("datetime") ||
        $('meta[property="article:published_time"]').attr("content") ||
        "";

      const categories = $("#post-info .post-meta-categories a")
        .map((_, el) => $(el).text().trim())
        .get();

      const tags = $(".post-meta__tag-list a")
        .map((_, el) => $(el).text().trim().replace(/^#/, ""))
        .get();

      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";

      // 2. 专用解析器优化：处理 Hexo 代码块 (figure.highlight)
      $articleContainer.find("figure.highlight").each((_, figure) => {
        const $figure = $(figure);
        const lang =
          $figure
            .attr("class")
            ?.split(/\s+/)
            .find((c) => c !== "highlight" && c !== "line-numbers") || "";

        const codeLines: string[] = [];
        $figure.find(".code .line").each((_, line) => {
          codeLines.push($(line).text());
        });

        const codeText = codeLines.join("\n");
        const $newCode = $(`<pre><code class="language-${lang}"></code></pre>`);
        $newCode.find("code").text(codeText);
        $figure.replaceWith($newCode);
      });

      // 3. 清理正文中的无关标签 (Butterfly 特有元素)
      const $cleanContent = $articleContainer.clone();
      $cleanContent.find("script, style, iframe, noscript").remove();
      $cleanContent.find(".post-copyright, .reward-container, .post-outdate-notice, .adsbygoogle").remove();
      $cleanContent.find(".copy-notice, .save-as-image").remove(); // Butterfly 一些功能按钮
      
      const contentHtml = $cleanContent.html() || "";

      // 4. 转换为 Markdown
      const markdown = html2markdown(contentHtml, {
        frontmatter: {
          title,
          author,
          date,
          categories,
          tags,
          description,
          source: request.loadedUrl,
        },
      });

      // 5. 保存文件
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
      regexps: [
        /^http:\/\/lonepatient\.top\/\d{4}\/\d{2}\/\d{2}\/.+/, // 文章页
      ],
      globs: [
        "http://lonepatient.top/archives/**",
        "http://lonepatient.top/page/**",
        "http://lonepatient.top/categories/**",
        "http://lonepatient.top/tags/**",
      ],
    });
  },
});

(async () => {
  const startUrl = "http://lonepatient.top/archives/";
  // 如果命令行提供了参数，则使用参数，否则使用默认起始页
  const startUrls = process.argv[2] ? [process.argv[2]] : [startUrl];

  await crawler.run(startUrls);
})();
