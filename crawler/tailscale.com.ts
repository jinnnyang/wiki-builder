import { CheerioCrawler, log } from "crawlee";
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
  requestHandlerTimeoutSecs: 60,
  // maxRequestsPerCrawl: 10, // Uncomment for testing

  preNavigationHooks: [
    async (crawlingContext) => {
      const { request } = crawlingContext;
      const targetPath = getStoragePath(url2DotMdPath(request.url));
      if (await fileExists(targetPath)) {
        log.info(`File ${targetPath} already exists, skipping navigation.`);
        request.skipNavigation = true;
      }
    },
  ],

  async requestHandler({ request, $, enqueueLinks }) {
    const url = request.loadedUrl || request.url;
    log.info(`Processing: ${url}`);

    // Tailscale docs main content is inside <article class="prism markdown-content">
    const $content = $("article.prism.markdown-content").clone();

    if ($content.length > 0) {
      // 1. Title Extraction
      const title = $content.find("h1").first().text().trim() || $("title").text().split("|")[0].trim();

      // 2. DOM Cleanup & Transformation
      
      // Transform Cards (a.not-prose) into readable lists
      // Tailscale uses these for landing pages/indexes
      const $cards = $content.find('a.not-prose');
      if ($cards.length > 0) {
        const $ul = $('<ul />');
        $cards.each((_, el) => {
          const $card = $(el);
          const href = $card.attr('href');
          const title = $card.find('h4').text().trim();
          const description = $card.find('p').text().trim();
          
          if (title && href) {
            $ul.append(`<li><a href="${href}"><strong>${title}</strong></a>: ${description}</li>`);
          }
        });
        // Replace the first card with the whole UL, and remove the others
        $cards.first().replaceWith($ul);
        $cards.slice(1).remove();
      }

      // Add spaces between adjacent links that are smashed together (e.g. tabs)
      $content.find('a + a').each((_, el) => {
        $(el).before(' ');
      });

      // Remove unwanted elements
      $content.find("h1").first().remove(); // Remove title from body
      $content.find("nav[aria-label='Breadcrumb']").remove();
      $content.find("aside").remove();
      $content.find("script, style, iframe, noscript, svg").remove();
      $content.find(".feedback-widget").remove();
      $content.find("button").remove();
      
      // Remove specific Tailscale noise
      $content.find('a:contains("Edit this page")').remove();
      $content.find('p:contains("Last validated:")').remove();
      $content.find('.right-sidebar').remove();

      const contentHtml = $content.html() || "";
      const markdown = html2markdown(contentHtml, {
        frontmatter: {
          title,
          source: url,
          date: new Date().toISOString().split('T')[0],
        },
      });

      const targetFile = url2DotMdPath(url);
      const absolutePath = getStoragePath(targetFile);

      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, markdown);
      log.info(`Successfully saved: ${absolutePath}`);
    } else {
      log.warning(`Content area not found for: ${url}. This might be a landing page or index.`);
    }

    // Enqueue Links
    // We only want to crawl under tailscale.com/docs/
    await enqueueLinks({
      globs: ["https://tailscale.com/docs/**"],
      // Only keep documentation links, avoid blog, pricing, etc.
      // And avoid non-html assets
      exclude: [
        "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif", "**/*.svg",
        "**/*.pdf", "**/*.zip", "https://tailscale.com/docs/search/**",
        "**#**", // Avoid anchors
      ],
      transformRequestFunction(req) {
        // Remove trailing slash and anchors for normalization
        req.url = req.url.split("#")[0].replace(/\/$/, "");
        return req;
      },
    });
  },
});

(async () => {
  const startUrl = "https://tailscale.com/docs";

  // If a URL is passed via command line, start with that
  const urls = process.argv[2] ? [process.argv[2]] : [startUrl];

  log.info(`Starting Tailscale Docs crawler with: ${urls.join(", ")}`);
  await crawler.run(urls);
})();
