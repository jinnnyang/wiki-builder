# Analysis of docs.astral.sh (Material for MkDocs)

## CSS Selectors
1. **Navigation Links (Sidebar):**
   - Selector: `nav.md-nav a.md-nav__link`
   - Details: The left sidebar uses `nav.md-nav` with `aria-label="Navigation"`. Links have the class `.md-nav__link`.
2. **Main Content Area:**
   - Selector: `article.md-content__inner`
   - Details: This is the standard Material for MkDocs content container.
3. **Page Title:**
   - Selector: `article.md-content__inner h1`
   - Details: Usually the first element in the content area.

## Metadata & JSON-LD
- **Meta Tags:** Standard MkDocs tags like `description`, `generator` (Material for MkDocs), and Open Graph tags.
- **JSON-LD:** Standard Material for MkDocs usually includes BreadcrumbList and WebSite JSON-LD.

## Material for MkDocs Verification
- **Confirmed:** Uses standard classes:
  - `md-header`
  - `md-nav`
  - `md-main`
  - `md-content`
  - `md-sidebar`
  - `md-footer` (if enabled)
- The site is definitely built with Material for MkDocs.

## Quirks / Notes
- The site has a version switcher and search functionality that are standard for the theme.
- The sidebar can be multi-level; child links are nested within `nav.md-nav__list`.
