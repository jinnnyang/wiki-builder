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
  // maxRequestsPerCrawl: 20,

  // 导航前钩子
  preNavigationHooks: [
    async (crawlingContext, gotOptions) => {
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
    const isArticle = request.loadedUrl?.match(
      /\/blog\/\d{4}\/\d{2}\/\d{2}\/.*\.html$/,
    );

    if (isArticle) {
      log.info(`Processing Article: ${request.loadedUrl}`);

      // 提取元数据
      const title = $("title")
        .text()
        .replace(/\s*-\s*默尘\s*$/, "")
        .trim();
      const author = $(".entry_data > span")
        .eq(0)
        .text()
        .replace("作者：", "")
        .trim();
      const date = $(".entry_data > span")
        .eq(1)
        .text()
        .replace("发布时间：", "")
        .trim();
      const category = $(".entry_data .entry_cate a")
        .map((_, el) => $(el).text().trim())
        .get();

      // 提取正文
      const $content = $(".entry_cont");
      if ($content.length > 0) {
        // 清理正文中的无关标签
        $content.find("script, style, iframe, noscript").remove();
        const contentHtml = $content.html() || "";

        // 转换为 Markdown
        const markdown = html2markdown(contentHtml, {
          frontmatter: {
            title,
            author,
            date,
            category,
            source: request.loadedUrl,
          },
        });

        // 保存文件
        const targetFile = url2DotMdPath(request.loadedUrl!);
        const absolutePath = path.resolve(process.cwd(), "data", targetFile);

        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, markdown);
        log.info(`Saved to ${absolutePath} (${markdown.length} bytes)`);
      } else {
        log.warning(`未找到正文内容 (.entry_cont): ${request.loadedUrl}`);
      }
    } else {
      log.info(`Processing List Page: ${request.loadedUrl}`);
    }

    // 抓取更多的链接
    await enqueueLinks({
      globs: ["https://life.nunumick.cn/blog/**/*.html"],
    });
  },
});

(async () => {
  // Start the crawler
  // 测试特定页面
  // await crawler.run(["https://life.nunumick.cn/blog/2026/03/02/openclaw-multi-agent-setup.html"]);
  // 从列表页启动
  await crawler.run(["https://life.nunumick.cn/blog/posts/"]);
})();
