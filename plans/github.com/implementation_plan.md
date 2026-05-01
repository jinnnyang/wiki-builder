# GitHub Documentation Management Tool Implementation Plan

Create a new tool `crawler/github.com.ts` to manage documentation from GitHub repositories using Git's sparse-checkout feature. This allows for downloading only specific directories (like `docs`) instead of the entire repository.

## Proposed Changes

### [NEW] [github.com.ts](file:///c:/Users/jinnn/Documents/wiki-builder/crawler/github.com.ts)

A CLI tool that supports the following subcommands:

1.  **`init <repo_info> [path]`**
    - `repo_info` can be `user/repo` or a GitHub URL.
    - Clones the repo using: `git clone --depth 1 --no-checkout --filter=blob:none <url> <targetDir>`.
    - Initializes sparse-checkout: `git sparse-checkout init --cone`.
    - Sets the initial path: `git sparse-checkout set <path>`.
    - Performs initial checkout: `git checkout`.

2.  **`add <user/repo> <paths...>`**
    - Adds new directories to the sparse-checkout: `git sparse-checkout add <paths...>`.

3.  **`remove <user/repo> <paths...>`**
    - Removes directories from the sparse-checkout.
    - Logic:
        - Get the current list: `git sparse-checkout list`.
        - Filter out the specified paths.
        - Set the new list: `git sparse-checkout set <filtered_paths>`.

4.  **`update <user/repo>`**
    - Updates the repository content: `git pull`.

## Implementation Details

### Storage Path
Repositories will be stored in `<configured_storage_dir>/github.com/<user>/<repo>/`.
This is consistent with other crawlers. The `<configured_storage_dir>` defaults to `data/` if `SITES_ROOT` is not set.

### Nested Git Repositories
> [!NOTE]
> Since the `data/` directory is already in `.gitignore`, nested `.git` folders within `data/` will **not** be tracked or seen by the parent repository. This avoids any "git in git" conflicts (like accidental submodules or tracking ambiguity). Using direct `git` commands within these ignored directories is the simplest and most robust way to manage the documentation without the overhead of Git submodules.

### Argument Parsing & execution
- **Argument Parsing**: Manual parsing of `process.argv`.
- **Git Operations**: Using `child_process.execSync` for synchronous execution.

## Verification Plan

### Automated Tests
- Test `init` with both `user/repo` and full URL.
- Test `add` to see if new directories appear.
- Test `remove` to see if directories are removed from the working tree.
- Test `update` to ensure it pulls changes.

### Manual Verification
- Run `npx tsx crawler/github.com.ts init microsoft/vscode docs` and verify `data/github.com/microsoft/vscode/docs` exists.
- Run `npx tsx crawler/github.com.ts add microsoft/vscode wiki` and verify `wiki` directory appears.
- Run `npx tsx crawler/github.com.ts remove microsoft/vscode wiki` and verify `wiki` directory is removed.
