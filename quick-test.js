import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import ipaddr from "ipaddr.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function quickTest() {
  let errors = [];

  // Test 1: FireHOL
  try {
    const content = await fs.readFile(
      path.join(__dirname, "data/firehol_level1.netset"),
      "utf-8",
    );
    const lines = content
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"));

    // Test first 10 CIDRs
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      try {
        ipaddr.parseCIDR(lines[i].trim());
      } catch (e) {
        errors.push(`FireHOL CIDR ${i}: ${lines[i]} - ${e.message}`);
      }
    }

    console.log(`FireHOL: ${lines.length} entries, tested 10 samples`);
  } catch (e) {
    errors.push(`FireHOL file error: ${e.message}`);
  }

  // Test 2: Crawler DB
  try {
    const db = JSON.parse(
      await fs.readFile(
        path.join(__dirname, "data/crawler-user-agents.json"),
        "utf-8",
      ),
    );

    let patterns = 0;
    let instances = 0;

    for (const entry of db) {
      if (entry.pattern) patterns++;
      if (entry.instances) instances += entry.instances.length;
    }

    console.log(
      `Crawler DB: ${db.length} entries, ${patterns} patterns, ${instances} instances`,
    );
  } catch (e) {
    errors.push(`Crawler DB error: ${e.message}`);
  }

  if (errors.length > 0) {
    console.log("\nERRORS FOUND:");
    errors.forEach((e) => console.log(`- ${e}`));
    process.exit(1);
  } else {
    console.log("\nALL TESTS PASSED!");
  }
}

quickTest();
