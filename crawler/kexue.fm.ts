import { PlaywrightCrawler } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { html2markdown } from "../utils/html2text/src/index";
import url2DotMdPath from "../utils/common/url2DotMdPath";
import fileExists from "../utils/common/fileExists";
import getStoragePath from "../utils/common/getStoragePath";

const crawler = new PlaywrightCrawler({
  maxConcurrency: 5,
  maxRequestsPerMinute: 20,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 60,
  maxRequestsPerCrawl: 5, // Limit for testing as requested

  preNavigationHooks: [
    async (crawlingContext) => {
      const { request, log } = crawlingContext;
      const targetPath = getStoragePath(url2DotMdPath(request.url));
      if (await fileExists(targetPath)) {
        log.warning(`File ${targetPath} already exists, skipping.`);
        request.skipNavigation = true;
      }
    },
  ],

  async requestHandler({ request, page, enqueueLinks, log }) {
    log.info(`Processing: ${request.url}`);

    // Wait for the main content to load
    const contentSelector = "#PostContent";
    try {
      await page.waitForSelector(contentSelector, { timeout: 10000 });
    } catch (e) {
      log.warning(`Content selector ${contentSelector} not found on ${request.url}. Skipping.`);
      return;
    }

    // Capture console messages from the browser
    page.on('console', msg => log.info(`Browser: ${msg.text()}`));

    // 1. MathJax Processing - Use placeholders to avoid browser whitespace collapsing
    await page.evaluate(async function() {
      console.log("[BROWSER] Starting MathJax processing...");
      
      // Wait for MathJax to finish rendering if it exists
      if ((window as any).MathJax && (window as any).MathJax.Hub) {
        console.log("[BROWSER] Waiting for MathJax Hub...");
        await new Promise(function(resolve) { (window as any).MathJax.Hub.Queue(resolve); });
      }

      // Find all MathJax source elements
      const mathElements = document.querySelectorAll('[id^="MathJax-Element-"]:not([id$="-Frame"])');
      console.log(`[BROWSER] Found ${mathElements.length} MathJax source elements.`);
      
      if (mathElements.length > 0) {
        mathElements.forEach(function(el) {
          const type = el.getAttribute('type') || '';
          const isDisplay = type.includes('mode=display');
          const latex = el.textContent || '';
          
          const span = document.createElement('span');
          if (isDisplay) {
            span.textContent = `__MATH_BLOCK_START__${latex.trim()}__MATH_BLOCK_END__`;
          } else {
            span.textContent = `__MATH_INLINE_START__${latex.trim()}__MATH_INLINE_END__`;
          }
          el.replaceWith(span);
        });

        // Remove frames
        document.querySelectorAll('[id$="-Frame"]').forEach(function(el) { el.remove(); });
      } else {
        console.log("[BROWSER] No MathJax elements found. Attempting raw LaTeX fallback...");
        // Fallback: If no MathJax elements, the page might have raw $...$ or $$...$$
        // We'll wrap them in placeholders so they survive html2markdown
        const content = document.querySelector("#PostContent");
        if (content) {
          // This is a bit risky but can work for simple cases
          // Better to handle it post-conversion if possible
        }
      }

      // Always remove rendered artifacts to keep HTML clean
      document.querySelectorAll('.MathJax_Preview, .MathJax_Display, .MathJax').forEach(function(el) { el.remove(); });
    });

    // 2. Metadata Extraction
    const metadata = await page.evaluate(() => {
      const title = document.querySelector(".PostHead h1 a")?.textContent?.trim() || document.title;
      const author = document.querySelector(".submitted span:nth-child(2)")?.textContent?.trim() || "";
      const dateText = document.querySelector(".submitted span:nth-child(3)")?.textContent?.trim() || "";
      const categories = Array.from(document.querySelectorAll("#breadcrumb a")).slice(1).map(a => a.textContent?.trim()).filter(Boolean);
      const tags = Array.from(document.querySelectorAll(".tools .cat a")).filter(a => (a as HTMLAnchorElement).href.includes("/tag/")).map(a => a.textContent?.trim()).filter(Boolean);
      return { title, author, date: dateText, categories, tags };
    });

    // 3. Get the modified content HTML
    let contentHtml = await page.innerHTML(contentSelector);

    // 4. Convert to Markdown
    let markdown = html2markdown(contentHtml, {
      frontmatter: {
        title: metadata.title,
        author: metadata.author,
        date: metadata.date,
        categories: metadata.categories,
        tags: metadata.tags,
        source: request.loadedUrl,
      },
    });

    // 5. Post-process Markdown
    // If MathJax placeholders were found, restore them
    if (markdown.includes("__MATH_")) {
      // Inline: $ <latex> $ -> Correct: $<latex>$ (spaces outside)
      markdown = markdown.replace(/__MATH_INLINE_START__([\s\S]*?)__MATH_INLINE_END__/g, (_, p1) => ` $${p1.trim()}$ `);
      // Block: $$ on separate lines
      markdown = markdown.replace(/__MATH_BLOCK_START__([\s\S]*?)__MATH_BLOCK_END__/g, (_, p1) => `\n\n$$\n${p1.trim()}\n$$\n\n`);
    } else {
      // Fallback: Handle raw LaTeX delimiters if MathJax didn't run
      // Inline: $...$ -> $<...>$ (spaces outside)
      markdown = markdown.replace(/(?<!\\)\$([^$]+)(?<!\\)\$/g, (_, p1) => ` $${p1.trim()}$ `);
      // Block: \begin{equation}...\end{equation} -> \n$$\n...\n$$\n
      markdown = markdown.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, (_, p1) => `\n\n$$\n${p1.trim()}\n$$\n\n`);
      markdown = markdown.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, p1) => `\n\n$$\n${p1.trim()}\n$$\n\n`);
    }

    // 6. Save File
    const targetFile = url2DotMdPath(request.loadedUrl!);
    const absolutePath = getStoragePath(targetFile);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, markdown);
    log.info(`Saved to ${absolutePath} (${markdown.length} bytes)`);

    // 6. Enqueue Links
    await enqueueLinks({
      regexps: [
        /^https:\/\/kexue\.fm\/archives\/\d+/, // Articles
      ],
      globs: [
        "https://kexue.fm/page/*",    // Pagination
        "https://kexue.fm/category/*", // Categories
        "https://kexue.fm/tag/*",      // Tags
      ],
    });
  },
});

(async () => {
  const testUrl = "https://kexue.fm/archives/11719";
  const startUrls = process.argv[2] ? [process.argv[2]] : [testUrl];
  await crawler.run(startUrls);
})();
