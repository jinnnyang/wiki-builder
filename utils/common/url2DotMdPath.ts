import path from "path";
// 给爬虫使用，根据页面的url确定本地要保存的相对位置，
// 也可以在爬取页面前检查是否已有文件，防止重复爬取。
export default function url2DotMdPath(url: string | URL) {
  const parsedUrl: URL = typeof url === "string" ? new URL(url) : url;

  // Determine save path
  const hostname = parsedUrl.hostname;
  let pathname = parsedUrl.pathname;
  let targetFile: string;

  if (pathname.endsWith("/")) {
    // If the leaf node is not a file (directory), save as index.md
    targetFile = path.join(hostname, pathname, "index.md");
  } else {
    const basename = path.basename(pathname);
    if (basename.includes(".")) {
      // If it has an extension (like .html), replace it with .md
      const mdPath = pathname.replace(/\.[^.]+$/, "") + ".md";
      targetFile = path.join(hostname, mdPath);
    } else {
      // If it's a file without an extension, append .md
      targetFile = path.join(hostname, `${pathname}.md`);
    }
  }

  return targetFile;
}
