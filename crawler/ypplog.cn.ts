import { CheerioCrawler, ProxyConfiguration } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { html2markdown } from "../utils/html2text/src/index";
import url2DotMdPath from "../utils/common/url2DotMdPath";
import fileExists from "../utils/common/fileExists";
import getStoragePath from "../utils/common/getStoragePath";

const crawler = new CheerioCrawler({
  maxConcurrency: 10,
  maxRequestsPerMinute: 60,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 30,
  // maxRequestsPerCrawl: 5, // Uncomment for testing

  // 设置浏览器 Headers 以绕过基础的反爬检测
  additionalMimeTypes: ['text/html', 'application/xhtml+xml'],
  preNavigationHooks: [
    async (crawlingContext) => {
      const { request, log } = crawlingContext;
      
      // 设置 User-Agent 和其他浏览器常用 Headers
      request.headers = {
        ...request.headers,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
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

    // 识别文章页：通常包含 article.prose 且 og:type 为 article
    const isArticle = $('meta[property="og:type"]').attr('content') === 'article' && 
                      $('article.prose').length > 0;

    if (isArticle) {
      log.info(`识别为文章页: ${request.url}`);

      // 1. 提取元数据
      // 避开页眉中的站点标题，提取文章主体中的 h1
      const title = $("main h1").first().text().trim() || 
                    $("article h1").first().text().trim() || 
                    $("h1").last().text().trim();
      
      const author = $('meta[property="article:author"]').attr('content') || "Silas";
      
      // 优先从 time 标签获取标准时间
      const date = $('time').attr('datetime') || 
                   $('meta[property="article:published_time"]').attr('content') || 
                   $('time').text().trim() || "";

      // 分类：从面包屑导航中提取
      const categories = $('nav.text-sm a, .text-sm.text-gray-500 a')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(c => c !== "首页" && c !== "" && !c.includes("码造社"));

      // 标签：仅从 head 的 meta 标签中提取，避免抓到侧边栏的标签云
      const tags = $('head meta[property="article:tag"]')
        .map((_, el) => $(el).attr('content'))
        .get();

      const description = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || "";

      // 2. 清理正文中的无关标签
      const $content = $("article.prose").first();
      if ($content.length === 0) {
        log.warning(`未能找到 ${request.url} 的正文内容`);
        return;
      }

      // 复制一份，避免破坏原始 DOM
      const $articleContent = $content.clone();
      
      // 移除无关元素
      $articleContent.find("script, style, iframe, noscript").remove();
      $articleContent.find("#adblock-warning, .adblock-btn").remove();
      $articleContent.find(".maybe-in-article-ad").remove();
      $articleContent.find(".a2a_kit").remove(); // 分享按钮
      $articleContent.find("#waline").remove(); // 评论

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
        /^https:\/\/www\.ypplog\.cn\/[^/]+\/$/,
      ],
      // 匹配分页路径
      globs: [
        "https://www.ypplog.cn/page/**",
      ],
      // 排除非文章路径
      exclude: [
        /^https:\/\/www\.ypplog\.cn\/categories\//,
        /^https:\/\/www\.ypplog\.cn\/tags\//,
        /^https:\/\/www\.ypplog\.cn\/other\//,
        /^https:\/\/www\.ypplog\.cn\/search\//,
      ]
    });
  },
});

(async () => {
  const startUrl = "https://www.ypplog.cn/";
  
  // 如果命令行提供了参数，则使用参数
  const startUrls = process.argv[2] ? [process.argv[2]] : [startUrl];

  await crawler.run(startUrls);
})();
