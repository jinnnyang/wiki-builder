import path from "path";

/**
 * Returns the storage path for a given sub-path, based on the SITES_ROOT environment variable.
 * If SITES_ROOT is not set, it defaults to "data".
 * If SITES_ROOT is a relative path, it's relative to the project root (process.cwd()).
 * If SITES_ROOT is an absolute path, it's used as is.
 *
 * @param subPath The sub-path within the storage root.
 * @returns The resolved absolute path.
 */
export default function getStoragePath(subPath: string = ""): string {
  const sitesRoot = process.env.SITES_ROOT || "data";
  const root = path.resolve(process.cwd(), sitesRoot);
  return path.join(root, subPath);
}
