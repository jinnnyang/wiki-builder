# Astral Docs Crawler Walkthrough

I have implemented a new crawler for `docs.astral.sh` (Material for MkDocs).

## Changes Made

### Crawler Implementation
- Created [docs.astral.sh.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/docs.astral.sh.ts).
- Configured `CheerioCrawler` to handle the specific HTML structure of Material for MkDocs.
- Targeted main project roots: `uv` and `ruff`.

### Content Extraction
- Identified `article.md-content__inner` as the primary content container.
- Implemented cleanup logic to remove UI elements like "Edit this page" buttons and navigation tags.
- Extracted titles from `h1` elements or page metadata.

### Markdown Conversion
- Integrated with the project's `html2markdown` utility.
- Added YAML frontmatter with `title` and `source` URL.

## Verification Results

### Sample Output
The following files were verified for quality:
- [uv/pip/environments/index.md](file:///C:/Users/jinnn/Documents/wiki-builder/data/docs.astral.sh/uv/pip/environments/index.md)
- [ruff/index.md](file:///C:/Users/jinnn/Documents/wiki-builder/data/docs.astral.sh/ruff/index.md)

The generated Markdown correctly preserves:
- Headers and anchor links.
- Code blocks (including language hints).
- Lists and tables.
- Links to other documentation pages.

## Status
The crawler is currently running in the background to complete the full documentation set for both `uv` and `ruff`.
