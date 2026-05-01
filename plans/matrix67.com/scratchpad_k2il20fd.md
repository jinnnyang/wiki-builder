# Matrix67 Crawler Investigation

## Checklist
- [x] Visit a math-heavy post on matrix67.com
- [x] Identify formula rendering method (MathJax, KaTeX, images, etc.)
- [x] Examine DOM structure for formulas
- [x] Document findings for html2markdown conversion

## Findings
- URL: https://matrix67.com/blog/archives/4722 (and others)
- Rendering Method: Manual rendering using a mix of techniques:
    - Simple exponents: HTML `<sup>` tags (e.g., `a<sup>2</sup>`).
    - Symbols: Unicode characters (e.g., `√`, `–`, `·`).
    - Complex notation (e.g., fractions, integrals, multi-line roots): Images/Screenshots (often from Mathematica).
    - No MathJax or KaTeX detected.
- DOM Structure: 
    - Text-based formulas are inline within `<p>` tags.
    - Exponents are in `<sup>` tags.
    - Square roots use a Unicode `√` followed by text that might have a `border-top` or `text-decoration: overline` (vinculum).
    - Large formulas are `<img>` tags with `src` pointing to `matrix67.com/blogimage_YYYY/...`.
- Conversion Implications:
    - `html2markdown` should preserve `<sup>` tags as `^` or HTML if needed.
    - Unicode symbols should be kept as-is or mapped to LaTeX if possible.
    - Images must be downloaded or linked correctly.
    - No special handling for script-based math engines is required.
