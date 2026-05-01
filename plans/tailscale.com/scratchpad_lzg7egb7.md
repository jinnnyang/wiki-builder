# Tailscale Docs Exploration Report

## Identified Selectors
- **Main Content Container:** `main`
- **Title:** `h1`
- **Breadcrumbs:** `div.flex.items-center.gap-1.text-sm.text-gray-600` (or similar container above H1)
- **Sidebar Navigation:** `aside nav` or the `ul` with class `flex max-h-[90vh]...`
- **TOC (Right Sidebar):** `nav` or `div` with "ON THIS PAGE"
- **Last Validated:** `p` or `div` containing "Last validated"

## Site Structure Observations
- **Site Type:** Dynamic (SPA/Next.js). Content is rendered client-side.
- **URL Pattern:** `https://tailscale.com/docs/...` for documentation.
- **Metadata:** "Last validated" date is present; "Edit this page" link is NOT found.
- **Clean-up Elements:**
  - Global Header (`nav`)
  - Global Footer (`footer`)
  - Left Sidebar Documentation Tree (`aside`)
  - Right Sidebar Table of Contents
  - "Ask AI" floating button
  - "Your Privacy Choices" banner (if present)
