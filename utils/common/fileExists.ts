import { access } from "node:fs/promises";
import { constants, PathLike } from "node:fs";

export default async function fileExists(path: PathLike) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// // 使用
// if (await fileExists('./cache/page1.html')) {
//   console.log('文件存在');
// }
