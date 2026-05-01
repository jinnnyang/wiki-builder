# Task: Implement Ruan Yifeng's Blog Crawler

- [x] Create `crawler/ruanyifeng.com.ts`
    - [x] Setup `CheerioCrawler` configuration
    - [x] Implement `requestHandler`
        - [x] Article detection logic
        - [x] Metadata extraction (Title, Date, Author, Categories)
        - [x] Content cleanup
        - [x] HTML to Markdown conversion
        - [x] File saving logic
    - [x] Implement link enqueuing logic (Pagination and Articles)
- [/] Verify implementation
    - [ ] Run crawler with `maxRequestsPerCrawl: 5`
    - [ ] Check generated Markdown files
