# Walkthrough - ypplog.cn Crawler Implementation

We have successfully developed and verified a robust crawler for `ypplog.cn`.

## Changes Made

### Crawler Implementation
- **Script**: [ypplog.cn.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/ypplog.cn.ts)
- **Engine**: Switched from `PlaywrightCrawler` to `CheerioCrawler` for better performance and reliability.
- **Security**: Implemented custom browser headers (User-Agent, Accept, etc.) to bypass basic anti-bot checks.
- **Selectors**:
    - **Title**: `main h1` / `article h1` (avoids site-wide header titles).
    - **Metadata**: Extracted from standard `<meta>` tags and `<time>` elements.
    - **Categories**: Parsed from breadcrumb navigation.
    - **Tags**: Extracted exclusively from `<head>` meta tags to avoid sidebar tag clouds.
- **Cleaning**: Automatically removes adblock warnings, share buttons, scripts, and sidebar elements before conversion.

## Verification Results

### Sample Article Extraction
We verified the extraction on the article: [My Knowledge Base Evolution](https://www.ypplog.cn/my-knowledge-base-evolution-from-memo-to-llm-wiki/)

**Frontmatter Result:**
```yaml
title: 我的知识库进化史：从备忘录到AI维护的LLM Wiki
author: Silas
date: "2026-04-23T10:00:00+08:00"
categories:
  - 工具效率
tags:
  - 知识管理
  - AI
  - LLM Wiki
  - Obsidian
  - 效率
  - 个人知识库
description: 从iOS备忘录到RAG，再到Karpathy的LLM Wiki思路...
source: "https://www.ypplog.cn/my-knowledge-base-evolution-from-memo-to-llm-wiki/"
```

### Performance
- The crawler processed dozens of articles in seconds.
- Storage path: `data/www.ypplog.cn/`

## How to Run
To perform a full crawl:
```bash
npx tsx crawler/ypplog.cn.ts
```
To crawl a specific article:
```bash
npx tsx crawler/ypplog.cn.ts [URL]
```
