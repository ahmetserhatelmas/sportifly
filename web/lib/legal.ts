import { readFileSync } from "node:fs";
import { join } from "node:path";

export function readLegal(name: string) {
  return readFileSync(join(process.cwd(), "content/legal", `${name}.md`), "utf8");
}
