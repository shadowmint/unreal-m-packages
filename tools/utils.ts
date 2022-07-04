import * as path from "path";
import * as fs from "fs";
import { UnrealToolsError, UnrealToolsErrorCode } from "./errors";

/** Given /foo/bar/MFoo return MFoo only */
export function directoryNameFrom(absolutePath: string): string {
  // +1 to remove the trailing /
  return absolutePath.substring(path.dirname(absolutePath).length + 1);
}

/** Recursive copy to target */
export async function copyRecursive(src: string, dest: string): Promise<void> {
  const exists = fs.existsSync(src);
  if (exists) {
    const stats = await fs.promises.stat(src);
    const isDirectory = exists && stats.isDirectory();
    if (!isDirectory) {
      throw new UnrealToolsError(UnrealToolsErrorCode.CantCopyFromNonFolderTarget, src);
    }
  }

  const destExists = fs.existsSync(dest);
  if (destExists) {
    const destStats = await fs.promises.stat(src);
    const destIsDirectory = exists && destStats.isDirectory();
    if (!destIsDirectory) {
      throw new UnrealToolsError(UnrealToolsErrorCode.CantCopyToNonFolderTarget, dest);
    }
  } else {
    await fs.promises.mkdir(dest);
  }

  for (let file of await fs.promises.readdir(src)) {
    const fullPath = path.join(src, file);
    const fileStats = await fs.promises.stat(fullPath);
    const isDirectory = fileStats.isDirectory();
    if (isDirectory) {
      const targetDirectory = path.join(dest, file);
      await copyRecursive(fullPath, targetDirectory);
    } else {
      const targetFile = path.join(dest, file);
      await fs.promises.copyFile(fullPath, targetFile);
    }
  }
}
