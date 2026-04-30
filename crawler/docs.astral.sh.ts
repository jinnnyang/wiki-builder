import { CheerioCrawler, log } from "crawlee";
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
  requestHandlerTimeoutSecs: 60,
  // limit requests per crawl
  maxRequestsPerCrawl: 20,
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

    // Extract content from Material for MkDocs structure
    const $content = $("article.md-content__inner");

    if ($content.length > 0) {
      // 1. Title Extraction
      const title =
        $content.find("h1").first().text().trim() ||
        $("title").text().split("-")[0].trim();

      // 2. Cleanup UI elements from content area
      // MkDocs Material often has buttons and tags inside the article area
      $content.find(".md-content__button").remove(); // "Edit this page" button
      $content.find(".md-tags").remove(); // Tags
      $content.find("nav.md-footer-nav").remove(); // Previous/Next links if inside
      $content.find("script, style, iframe, noscript, svg").remove();

      const contentHtml = $content.html() || "";
      const markdown = html2markdown(contentHtml, {
        frontmatter: {
          title,
          source: url,
        },
      });

      const targetFile = url2DotMdPath(url);
      const absolutePath = getStoragePath(targetFile);

      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, markdown);
      log.info(`Successfully saved: ${absolutePath}`);
    } else {
      log.warning(
        `Content area (article.md-content__inner) not found for: ${url}`,
      );
    }

    // Enqueue Links
    // We want to crawl everything under docs.astral.sh
    await enqueueLinks({
      globs: ["https://docs.astral.sh/**"],
      // Exclude non-documentation paths if any
      exclude: [
        "**/*.png",
        "**/*.jpg",
        "**/*.jpeg",
        "**/*.gif",
        "**/*.svg",
        "**/*.pdf",
        "**/*.zip",
        "https://docs.astral.sh/search/**",
      ],
      // Only crawl links that look like documentation pages (usually end with / or .html)
      transformRequestFunction(req) {
        if (req.url.includes("#")) {
          req.url = req.url.split("#")[0];
        }
        return req;
      },
    });
  },
});

(async () => {
  // Start URLs for Astral Docs projects
  const startUrls = [
    "https://docs.astral.sh/uv/",
    "https://docs.astral.sh/ruff/",
  ];

  // If a URL is passed via command line, start with that
  if (process.argv[2]) {
    startUrls.length = 0; // Clear defaults
    startUrls.push(process.argv[2]);
  }

  log.info(`Starting Astral Docs crawler...`);
  await crawler.run(startUrls);
})();
