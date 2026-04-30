# Crawlee.dev Markdown Crawling Findings

## Link Formatting in https://crawlee.dev/js/docs/quick-start.md
- **Absolute vs Relative:** Links to other documentation pages are **absolute URLs** (e.g., `https://crawlee.dev/js/docs/introduction.md`).
- **Extensions:** Links **do have** the `.md` extension for documentation pages.
- **Images/Assets:** Some assets like images use relative paths (e.g., `/img/chrome-scrape-light.gif`).
- **Example Snippet:**
  ```markdown
  To learn in-depth how Crawlee works, read the [Introduction](https://crawlee.dev/js/docs/introduction.md)
  ...
  ![An image showing off Crawlee...](/img/chrome-scrape-light.gif)
  ...
  **Related links**
  * [Configuration](https://crawlee.dev/js/docs/guides/configuration.md)
  ```

