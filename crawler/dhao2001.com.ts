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
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 30,
  // maxRequestsPerCrawl: 5, // Uncomment for testing

  // Pre-navigation hook to skip already crawled files
  preNavigationHooks: [
    async (crawlingContext) => {
      const { request, log } = crawlingContext;
      const targetPath = getStoragePath(url2DotMdPath(request.url));
      if (await fileExists(targetPath)) {
        log.warning(`File ${targetPath} already exists, skipping...`);
        request.skipNavigation = true;
      }
    },
  ],

  async requestHandler({ request, $, enqueueLinks, log }) {
    // Check if it's an article page
    // Hexo articles usually follow /YYYY/MM/DD/slug/ pattern
    const articleRegex = /^https?:\/\/(www\.)?dhao2001\.com\/\d{4}\/\d{2}\/\d{2}\/.+\/$/;
    const isArticle = articleRegex.test(request.loadedUrl!);

    if (isArticle) {
      log.info(`Processing Article: ${request.loadedUrl}`);

      // 1. Extract metadata
      const title = $(".post-title").first().text().trim();
      const author = $(".site-author-name").first().text().trim() || "星期天";
      
      // Date from <time itemprop="dateCreated">
      const date = $(".post-meta time[itemprop='dateCreated']").attr("datetime") || 
                   $(".post-meta time[itemprop='datePublished']").attr("datetime") || 
                   "";

      const categories = $(".post-category a")
        .map((_, el) => $(el).text().trim())
        .get();

      const tags = $(".post-tags a")
        .map((_, el) => $(el).text().trim())
        .get();

      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";

      // 2. Clean content
      const $content = $(".post-body");
      if ($content.length === 0) {
        log.warning(`Could not find content for ${request.loadedUrl}`);
        return;
      }

      const $articleContent = $content.first().clone();
      
      // Remove noise
      $articleContent.find("script, style, iframe, noscript").remove();
      $articleContent.find(".post-widgets, .post-copyright, .reward, .post-nav").remove();
      $articleContent.find(".post-button, .post-footer").remove();

      const contentHtml = $articleContent.html() || "";

      // 3. Convert to Markdown
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

      // 4. Save file
      const targetFile = url2DotMdPath(request.loadedUrl!);
      const absolutePath = getStoragePath(targetFile);

      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, markdown);
      log.info(`Saved to ${absolutePath} (${markdown.length} bytes)`);
    } else {
      log.info(`Processing List/Other Page: ${request.loadedUrl}`);
    }

    // Enqueue links
    await enqueueLinks({
      // Match Hexo article pattern: YYYY/MM/DD/slug/
      regexps: [
        /^https:\/\/www\.dhao2001\.com\/\d{4}\/\d{2}\/\d{2}\/.+\/$/,
      ],
      // Pagination and main pages
      globs: [
        "https://www.dhao2001.com/",
        "https://www.dhao2001.com/page/*",
        "https://www.dhao2001.com/categories/**",
        "https://www.dhao2001.com/tags/**",
        "https://www.dhao2001.com/archives/**",
      ],
    });
  },
});

(async () => {
  const startUrl = "https://www.dhao2001.com/";
  const startUrls = process.argv[2] ? [process.argv[2]] : [startUrl];
  await crawler.run(startUrls);
})();
