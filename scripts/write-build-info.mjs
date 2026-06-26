import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const targetPath = join(root, "src/data/build-info.generated.json");
const deployedAt = new Date().toISOString();

writeFileSync(targetPath, `${JSON.stringify({ deployedAt }, null, 2)}\n`);
console.log(`Wrote build info for ${deployedAt}`);
