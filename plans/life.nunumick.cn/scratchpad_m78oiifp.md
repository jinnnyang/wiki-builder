# Task: Analyze code block structure on walkerdu.com

## Progress
- [x] Open https://walkerdu.com/2025/12/30/k8s-workloads/
- [x] Locate code blocks (e.g., Pod structure)
- [x] Inspect HTML structure (classes, tags, line numbers)
- [x] Document findings

## Findings
- **Outer Container**: `<figure class="highlight {language}">`
- **Internal Structure**:
  - A `<table>` with one `<tr>`.
  - Two `<td>` columns: `<td class="gutter">` and `<td class="code">`.
- **Gutter (Line Numbers)**:
  - Contains a `<pre>` block.
  - Each line number is wrapped in `<span class="line">X</span>` followed by a `<br>`.
- **Code (Content)**:
  - Contains a `<pre>` block.
  - Each line of code is wrapped in `<span class="line">...</span>` followed by a `<br>`.
  - Inside `<span class="line">`, there are further nested `<span>` tags for syntax highlighting (e.g., `<span class="token">`, `<span class="attr">`, etc.).
- **Spacing**: The presence of `<br>` tags between `<span class="line">` tags is a key detail for parsing.
