import * as path from "path";

/** Given /foo/bar/MFoo return MFoo only */
export function directoryNameFrom(absolutePath: string): string {
  // +1 to remove the trailing /
  return absolutePath.substring(path.dirname(absolutePath).length + 1);
}
