import { BasicCrawler, log } from "crawlee";
import fs from "fs/promises";
import path from "path";
import url2DotMdPath from "../utils/common/url2DotMdPath";
import fileExists from "../utils/common/fileExists";
import { html2markdown } from "../utils/html2text/src/index";
import getStoragePath from "../utils/common/getStoragePath";

// 目标域名
const DOMAIN = "crawlee.dev";
const BASE_URL = `https://${DOMAIN}`;

const crawler = new BasicCrawler({
  maxConcurrency: 3,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 30,

  async requestHandler({ request, sendRequest, crawler }) {
    const { url } = request;

    // 0. Determine target path
    const targetFile = url2DotMdPath(url);
    const absolutePath = getStoragePath(targetFile);
    let markdownContent: string | undefined;

    // 1. Check if file already exists
    if (await fileExists(absolutePath)) {
      log.info(`File ${absolutePath} already exists, reading from disk for link extraction.`);
      markdownContent = await fs.readFile(absolutePath, "utf-8");
    } else {
      log.info(`Processing from web: ${url}`);
      // 2. Fetch Markdown content from web
      const response = await sendRequest({
        url,
        method: "GET",
      });

      markdownContent = response.body as string;
      if (!markdownContent || typeof markdownContent !== "string") {
        log.warning(`Skipping ${url}: No content found or invalid format.`);
        return;
      }

      // Check if content is actually HTML
      if (markdownContent.trim().startsWith("<!DOCTYPE html>") || markdownContent.includes("<html")) {
        log.info(`Detected HTML content for ${url}, converting to Markdown.`);
        markdownContent = html2markdown(markdownContent);
      }

      // 3. Save file to disk
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, markdownContent);
      log.info(`Saved to ${absolutePath} (${markdownContent.length} bytes)`);
    }

    // 3. 提取链接
    // 匹配 Markdown 链接格式 [text](url)
    const linkRegex = /\[.*?\]\((.*?)\)/g;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(markdownContent)) !== null) {
      let linkUrl = match[1].trim();

      // 忽略空链接或锚点链接
      if (!linkUrl || linkUrl.startsWith("#")) continue;

      try {
        // 处理相对路径
        const resolvedUrl = new URL(linkUrl, url);

        // 只爬取同域名下的链接
        if (resolvedUrl.hostname === DOMAIN) {
          let finalUrl = resolvedUrl.href;

          // 移除 hash 及其后的内容
          finalUrl = finalUrl.split("#")[0];

          // 确保以 .md 结尾
          // 如果已经是 .md 结尾则保持，否则追加 .md
          // 但要排除已经是文件的（如 .png, .svg 等）
          const pathname = resolvedUrl.pathname;
          const ext = path.extname(pathname);

          if (!ext) {
            // 没有扩展名，追加 .md
            finalUrl = finalUrl.replace(/\/$/, "") + ".md";
          } else if (ext !== ".md") {
            // 有扩展名但不是 .md
            // 如果是常见的文档路径，尝试转换为 .md
            // 例如 /js/docs/quick-start.html -> /js/docs/quick-start.md
            if (ext === ".html" || ext === ".htm") {
              finalUrl = finalUrl.replace(/\.html?$/, ".md");
            } else {
              // 其他扩展名（如图片、PDF等）跳过
              continue;
            }
          }

          links.push(finalUrl);
        }
      } catch (e) {
        log.debug(`Failed to parse link: ${linkUrl}`);
      }
    }

    // 4. 将新链接加入队列
    if (links.length > 0) {
      await crawler.addRequests(links);
    }
  },
});

(async () => {
  // 起始页面
  const startUrl = "https://crawlee.dev/js/docs/quick-start.md";

  // 如果从命令行传入了起始 URL，则使用它
  const urls = process.argv[2] ? [process.argv[2]] : [startUrl];

  log.info(`Starting crawler with: ${urls.join(", ")}`);
  await crawler.run(urls);
})();
