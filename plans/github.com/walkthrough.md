# GitHub Documentation Management Tool Walkthrough

I have implemented a new tool `crawler/github.com.ts` that allows you to manage documentation from GitHub repositories efficiently using Git's **sparse-checkout** and **blobless shallow cloning**.

## Key Features

- **Efficient Storage**: Uses `--depth 1` and `--filter=blob:none` to download only the necessary metadata, and `sparse-checkout` to only download the specific documentation files you need.
- **Consistent Pathing**: Automatically saves repositories in `<storage_dir>/github.com/<user>/<repo>/`, consistent with other crawlers in the project.
- **No Git Conflicts**: Since repositories are stored in the ignored `data/` directory, they won't interfere with your main project's Git tracking.

## Usage Guide

### 1. Initialize a repository
You can use either the `user/repo` format or a full GitHub URL.

```bash
# Using user/repo and a specific path
npx tsx crawler/github.com.ts init microsoft/vscode docs

# Using a full URL (automatically extracts user/repo and path)
npx tsx crawler/github.com.ts init https://github.com/microsoft/vscode/tree/main/docs
```

### 2. Add more directories
Add additional documentation folders to your local copy.

```bash
npx tsx crawler/github.com.ts add microsoft/vscode wiki
```

### 3. Remove directories
Remove folders you no longer need from your local workspace.

```bash
npx tsx crawler/github.com.ts remove microsoft/vscode wiki
```

### 4. Update documentation
Pull the latest changes from the remote repository.

```bash
npx tsx crawler/github.com.ts update microsoft/vscode
```

## Verification Results

I have verified all subcommands with a test repository (`octocat/Spoon-Knife`):
- [x] **`init`**: Successfully parsed URLs and initialized sparse-checkout.
- [x] **`add`**: Successfully added directories to the checkout list.
- [x] **`remove`**: Successfully filtered and updated the sparse-checkout set.
- [x] **`update`**: Successfully pulled latest changes.
