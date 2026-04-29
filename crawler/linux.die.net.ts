import { CheerioCrawler } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { html2markdown } from "../utils/html2text/src/index";

const crawler = new CheerioCrawler({
  // Basic anti-crawling strategies:
  // Limit concurrency to avoid triggering rate limits
  maxConcurrency: 5,
  // Add a slight delay to be polite and avoid being blocked
  maxRequestsPerMinute: 120,

  // limit requests per crawl
  maxRequestsPerCrawl: 2,

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
    const url = new URL(request.loadedUrl);
    const hostname = url.hostname;
    let pathname = url.pathname;
    let targetFile: string;

    if (pathname.endsWith("/")) {
      // If the leaf node is not a file (directory), save as index.md
      targetFile = path.join("data", hostname, pathname, "index.md");
    } else {
      const basename = path.basename(pathname);
      if (basename.includes(".")) {
        // If it has an extension (like .html), replace it with .md
        const mdPath = pathname.replace(/\.[^.]+$/, "") + ".md";
        targetFile = path.join("data", hostname, mdPath);
      } else {
        // If it's a file without an extension, append .md
        targetFile = path.join("data", hostname, `${pathname}.md`);
      }
    }

    const absolutePath = path.resolve(process.cwd(), targetFile);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

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
