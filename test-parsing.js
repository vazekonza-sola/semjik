import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import ipaddr from "ipaddr.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testParsing() {
  console.log("🧪 Testing file parsing...\n");

  // Test 1: FireHOL Level 1
  console.log("1️⃣ Testing firehol_level1.netset...");
  try {
    const fireholContent = await fs.readFile(
      path.join(__dirname, "data/firehol_level1.netset"),
      "utf-8",
    );

    const fireholLines = fireholContent.split("\n");
    const fireholCIDRs = fireholLines
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => line.trim());

    console.log(`   ✅ Total lines: ${fireholLines.length}`);
    console.log(`   ✅ Valid CIDR entries: ${fireholCIDRs.length}`);

    // Test parsing a few CIDRs
    let validCount = 0;
    let invalidCount = 0;
    const testSample = fireholCIDRs.slice(0, 100); // Test first 100

    for (const range of testSample) {
      try {
        ipaddr.parseCIDR(range);
        validCount++;
      } catch (e) {
        invalidCount++;
        console.log(`   ⚠️  Invalid CIDR: ${range}`);
      }
    }

    console.log(
      `   ✅ Sample test (100 entries): ${validCount} valid, ${invalidCount} invalid`,
    );

    if (invalidCount > 0) {
      console.log(
        `   ⚠️  Warning: Found ${invalidCount} invalid entries in sample`,
      );
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log("\n2️⃣ Testing crawler-user-agents.json...");
  try {
    const crawlerDatabase = JSON.parse(
      await fs.readFile(
        path.join(__dirname, "data/crawler-user-agents.json"),
        "utf-8",
      ),
    );

    console.log(`   ✅ Total entries: ${crawlerDatabase.length}`);

    // Extract patterns
    let patternCount = 0;
    let instanceCount = 0;

    for (const entry of crawlerDatabase) {
      if (entry.pattern) {
        patternCount++;
      }
      if (entry.instances && Array.isArray(entry.instances)) {
        instanceCount += entry.instances.length;
      }
    }

    console.log(`   ✅ Patterns extracted: ${patternCount}`);
    console.log(`   ✅ Known instances: ${instanceCount}`);

    // Test a few patterns
    console.log("\n   Sample patterns:");
    for (let i = 0; i < 5; i++) {
      const entry = crawlerDatabase[i];
      console.log(
        `   - ${entry.pattern} (${entry.instances?.length || 0} instances)`,
      );
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log("\n✅ Parsing test complete!");
}

testParsing().catch(console.error);
