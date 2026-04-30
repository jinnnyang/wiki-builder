import { CheerioCrawler } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { html2markdown } from "../utils/html2text/src/index";
import url2DotMdPath from "../utils/common/url2DotMdPath";
import fileExists from "../utils/common/fileExists";
import getStoragePath from "../utils/common/getStoragePath";

const crawler = new CheerioCrawler({
  // Basic anti-crawling strategies:
  // Limit concurrency to avoid triggering rate limits
  maxConcurrency: 5,
  // Add a slight delay to be polite and avoid being blocked
  maxRequestsPerMinute: 30,
  maxRequestRetries: 4, // 最多重试4次，给足恢复时间
  requestHandlerTimeoutSecs: 30, // 单个请求超时设为30秒

  // limit requests per crawl
  maxRequestsPerCrawl: 5,

  // 导航前钩子，可以在这里修改请求配置或进行拦截
  preNavigationHooks: [
    async (crawlingContext, gotOptions) => {
      const { request, log } = crawlingContext;
      log.info(`即将请求: ${request.url}`);

      // 在这里，你可以基于任何条件来决定是否跳过该请求。
      // 例如，如果你想手动跳过某个特定的URL，可以这样做：
      const targetPath = getStoragePath(url2DotMdPath(request.url));
      if (await fileExists(targetPath)) {
        log.warning(`文件 ${targetPath} 已存在，跳过该请求`);
        request.skipNavigation = true;
      }
    },
  ],

  // 发起请求
  async requestHandler({ request, $, enqueueLinks, log }) {
    const title = $("title").text().trim();
    log.info(`Processing ${request.loadedUrl}: ${title}`);

    // linux.die.net usually puts main content in <div id="content">
    // If it doesn't exist, we fallback to <body>
    let contentHtml = "";
    const $content = $("#content");

    if ($content.length > 0) {
      // Clean up typical non-content elements inside content if any
      $content.find("#bg, #menu, #nav, .ad, script, style").remove();
      contentHtml = $content.html() || "";
    } else {
      // Fallback: use body but remove common noise
      $(
        "script, style, noscript, iframe, nav, header, footer, #bg, #menu, #right",
      ).remove();
      contentHtml = $("body").html() || "";
    }

    // Convert HTML to Markdown using the custom utility
    const markdown = html2markdown(contentHtml, {
      frontmatter: {
        title: title,
        source: request.loadedUrl,
      },
    });

    // Determine save path
    const targetFile = url2DotMdPath(request.loadedUrl);
    const absolutePath = getStoragePath(targetFile);

    // Ensure Directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    // Save File
    await fs.writeFile(absolutePath, markdown);
    log.info(`Saved to ${absolutePath} (${markdown.length} bytes)`);

    // Find and enqueue more man pages links
    await enqueueLinks({
      globs: ["https://linux.die.net/man/**"],
    });
  },
});

(async () => {
  // Start the crawler with a standard man page entry
  await crawler.run(["https://linux.die.net/man/1/ls"]);
})();
