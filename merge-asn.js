import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function mergeASNData() {
  console.log("📋 Merging ASN.txt into datacenter.json...\n");

  try {
    // Read ASN.txt
    const asnTxt = await fs.readFile(
      path.join(__dirname, "data/asn/ASN.txt"),
      "utf-8",
    );

    // Read existing datacenter.json
    const datacenterJson = JSON.parse(
      await fs.readFile(
        path.join(__dirname, "data/asn/datacenter.json"),
        "utf-8",
      ),
    );

    // Parse ASN.txt
    const lines = asnTxt
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("#"));
    const newAsns = [];
    const existingAsnNumbers = new Set(datacenterJson.asns.map((a) => a.asn));

    for (const line of lines) {
      const match = line.match(/AS(\d+)\s*#\s*(.+)/);
      if (match) {
        const asnNumber = parseInt(match[1]);
        const name = match[2].trim();

        // Skip if already exists
        if (existingAsnNumbers.has(asnNumber)) {
          console.log(`⏭️  Skipping AS${asnNumber} (already exists)`);
          continue;
        }

        // Determine type based on name
        let type = "datacenter";
        const nameLower = name.toLowerCase();

        if (
          nameLower.includes("cloud") ||
          nameLower.includes("aws") ||
          nameLower.includes("azure") ||
          nameLower.includes("google")
        ) {
          type = "cloud";
        } else if (
          nameLower.includes("cdn") ||
          nameLower.includes("akamai") ||
          nameLower.includes("cloudflare")
        ) {
          type = "cdn";
        } else if (
          nameLower.includes("hosting") ||
          nameLower.includes("host")
        ) {
          type = "hosting";
        }

        newAsns.push({
          asn: asnNumber,
          name: name,
          type: type,
        });

        console.log(`✅ Adding AS${asnNumber}: ${name} (${type})`);
      }
    }

    // Merge and sort
    const mergedAsns = [...datacenterJson.asns, ...newAsns].sort(
      (a, b) => a.asn - b.asn,
    );

    // Update datacenter.json
    datacenterJson.asns = mergedAsns;
    datacenterJson.last_updated = new Date().toISOString().split("T")[0];

    // Write back
    await fs.writeFile(
      path.join(__dirname, "data/asn/datacenter.json"),
      JSON.stringify(datacenterJson, null, 2),
      "utf-8",
    );

    console.log(`\n🎉 Merge complete!`);
    console.log(`📊 Total ASNs: ${mergedAsns.length}`);
    console.log(`➕ New ASNs added: ${newAsns.length}`);
    console.log(
      `📁 Existing ASNs: ${datacenterJson.asns.length - newAsns.length}`,
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

mergeASNData();
