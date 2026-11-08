import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildGtmContainer } from "./gtmContainer";

const target = join(__dirname, "gtm-container.json");
writeFileSync(target, `${JSON.stringify(buildGtmContainer(), null, 2)}\n`);
console.log(`Wrote ${target}`);
