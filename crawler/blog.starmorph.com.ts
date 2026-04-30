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
  // // limit requests per crawl
  // maxRequestsPerCrawl: 5,

  preNavigationHooks: [
    async (crawlingContext) => {
      const { request } = crawlingContext;
      // Skip pagination and list pages from saving, only articles
      const isArticle =
        request.url.match(/\/blog\/[^/]+$/) && !request.url.includes("/page/");
      if (isArticle) {
        const targetPath = getStoragePath(url2DotMdPath(request.url));
        if (await fileExists(targetPath)) {
          log.warning(
            `File ${targetPath} already exists, skipping navigation.`,
          );
          request.skipNavigation = true;
        }
      }
    },
  ],

  async requestHandler({ request, $, enqueueLinks }) {
    const url = request.loadedUrl || request.url;
    const isArticle = url.match(/\/blog\/[^/]+$/) && !url.includes("/page/");

    if (isArticle) {
      log.info(`Processing Article: ${url}`);

      // Metadata Extraction
      let title = $("h1").first().text().trim();
      let author = "";
      let date = "";

      // Try to get metadata from JSON-LD
      const jsonLdScripts = $('script[type="application/ld+json"]');
      jsonLdScripts.each((_, el) => {
        try {
          const jsonContent = $(el).html();
          if (!jsonContent) return;
          const jsonLd = JSON.parse(jsonContent);

          const findBlogPosting = (obj: any): any => {
            if (obj?.["@type"] === "BlogPosting") return obj;
            if (obj?.["@graph"] && Array.isArray(obj["@graph"])) {
              return obj["@graph"].find(
                (item: any) => item["@type"] === "BlogPosting",
              );
            }
            if (Array.isArray(obj)) {
              return obj.find((item: any) => item["@type"] === "BlogPosting");
            }
            return null;
          };

          const data = findBlogPosting(jsonLd);
          if (data) {
            title = data.headline || title;
            author =
              data.author?.name ||
              (typeof data.author === "string" ? data.author : author);
            date = data.datePublished || date;
          }
        } catch (e) {
          log.debug(
            `Failed to parse JSON-LD chunk: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      });

      // Fallback for metadata if JSON-LD fails
      if (!author) {
        author =
          $('meta[name="author"]').attr("content") ||
          $('meta[property="article:author"]').attr("content") ||
          "Dylan Boudro";
      }
      if (!date) {
        date =
          $('meta[property="article:published_time"]').attr("content") ||
          $('meta[name="publish-date"]').attr("content") ||
          "";
      }

      const $content = $("article .prose");
      if ($content.length > 0) {
        // Cleanup
        $content.find("script, style, iframe, noscript, svg").remove();

        // Remove specific UI elements if they exist
        // (e.g., sharing buttons, newsletter signups inside article)
        $content
          .find('div:contains("Subscribe"), div:contains("Newsletter")')
          .remove();

        const contentHtml = $content.html() || "";
        const markdown = html2markdown(contentHtml, {
          frontmatter: {
            title,
            author,
            date,
            source: url,
          },
        });

        const targetFile = url2DotMdPath(url);
        const absolutePath = getStoragePath(targetFile);

        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, markdown);
        log.info(`Successfully saved: ${absolutePath}`);
      } else {
        log.warning(`Article content (.prose) not found for: ${url}`);
      }
    } else {
      log.info(`Processing List/Pagination Page: ${url}`);
    }

    // Enqueue Links
    await enqueueLinks({
      globs: [
        "https://blog.starmorph.com/blog",
        "https://blog.starmorph.com/blog/*",
        "https://blog.starmorph.com/blog/page/*",
      ],
      // Exclude non-article paths like tags or about
      exclude: [
        "https://blog.starmorph.com/tags/**",
        "https://blog.starmorph.com/author/**",
      ],
    });
  },
});

(async () => {
  const startUrls = ["https://blog.starmorph.com/blog"];

  // If a URL is passed via command line, start with that
  if (process.argv[2]) {
    startUrls.push(process.argv[2]);
  }

  log.info(`Starting StarMorph Blog crawler...`);
  await crawler.run(startUrls);
})();
