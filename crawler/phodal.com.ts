import { CheerioCrawler } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { html2markdown } from "../utils/html2text/src/index";
import url2DotMdPath from "../utils/common/url2DotMdPath";
import fileExists from "../utils/common/fileExists";
import getStoragePath from "../utils/common/getStoragePath";
import { makeUrlsAbsolute, normalizeCodeBlocks } from "../utils/common/dom";

const crawler = new CheerioCrawler({
  maxConcurrency: 5,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 60,
  // maxRequestsPerCrawl: 5, // Uncomment for testing

  preNavigationHooks: [
    async (crawlingContext) => {
      const { request, log } = crawlingContext;
      
      // Set headers to bypass anti-bot
      request.headers = {
        ...request.headers,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      };

      // Skip if file already exists
      if (request.url.includes('/blog/') && !request.url.endsWith('/blog/') && !request.url.includes('?page=') && !request.url.endsWith('sitemap.xml')) {
        const targetPath = getStoragePath(url2DotMdPath(request.url));
        if (await fileExists(targetPath)) {
          log.warning(`Skipping existing file: ${targetPath}`);
          request.skipNavigation = true;
        }
      }
    },
  ],

  async requestHandler({ request, $, enqueueLinks, log }) {
    log.info(`Processing: ${request.url}`);

    // Handle Sitemap
    if (request.url.endsWith('sitemap.xml')) {
      const urls = $('loc').map((_, el) => $(el).text().trim()).get();
      const blogUrls = urls.filter(u => u.includes('/blog/') && !u.endsWith('/blog/') && !u.includes('?page='));
      log.info(`Found ${blogUrls.length} blog posts in sitemap`);
      await enqueueLinks({ urls: blogUrls });
      return;
    }

    // Article Page Identification
    const isArticle = $('.post_detail').length > 0;

    if (isArticle) {
      log.info(`Identified article: ${request.url}`);

      // 1. Extract Metadata
      const title = $("h2.section--center.mdl-grid.mdl-cell--11-col").first().text().trim();
      const author = $(".post-meta a[href*='/author/']").first().text().trim() || "Phodal Huang";
      
      // Extract date from .post-meta text content
      const postMetaText = $(".post-meta").text().trim();
      // Regex to match date like 2026年4月22日 15:54
      const dateMatch = postMetaText.match(/\d{4}年\d{1,2}月\d{1,2}日\s+\d{1,2}:\d{1,2}/);
      const date = dateMatch ? dateMatch[0] : "";

      // Category is usually missing on individual pages but we can try to infer or get it from list
      // For now, let's look for any category link
      const category = $(".post-meta a[href*='/category/']").first().text().trim() || "Blog";

      const description = $('meta[name="description"]').attr('content') || "";

      // 2. Normalization & Cleaning
      makeUrlsAbsolute($, request.loadedUrl || request.url);

      const $container = $(".post_detail .mdl-card__supporting-text").first();
      if ($container.length === 0) {
        log.warning(`Content container not found for ${request.url}`);
        return;
      }

      const $content = $container.clone();
      normalizeCodeBlocks($content);
      
      // Remove meta info from the content itself if it's duplicated
      $content.find(".post-meta").remove();
      $content.find("script, style, iframe, noscript").remove();
      
      // Remove "Related Articles" section if it's inside the container (it usually is)
      // The "Related Articles" section is usually in a separate div but let's be safe
      $container.parent().find(".mdl-card__actions.mdl-card--border").remove();

      const contentHtml = $content.html() || "";

      // 3. Convert to Markdown
      const markdown = html2markdown(contentHtml, {
        frontmatter: {
          title,
          author,
          date,
          categories: [category],
          description,
          source: request.loadedUrl || request.url,
        },
      });

      // 4. Save
      const targetFile = url2DotMdPath(request.loadedUrl || request.url);
      const absolutePath = getStoragePath(targetFile);

      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, markdown);
      log.info(`Saved: ${absolutePath} (${markdown.length} bytes)`);
    } else {
      log.info(`List or other page: ${request.url}`);
      // Fallback link discovery for non-sitemap starts
      await enqueueLinks({
        regexps: [/^https:\/\/www\.phodal\.com\/blog\/.+\/$/],
        exclude: [/^https:\/\/www\.phodal\.com\/blog\/page\//, /^https:\/\/www\.phodal\.com\/blog\/$/]
      });
      
      // Enqueue next pages if any
      await enqueueLinks({
        globs: ["https://www.phodal.com/blog/?page=*"],
      });
    }
  },
});

(async () => {
  // Use sitemap for comprehensive crawling
  const startUrl = "https://www.phodal.com/sitemap.xml";
  
  const startUrls = process.argv[2] ? [process.argv[2]] : [startUrl];

  await crawler.run(startUrls);
})();
