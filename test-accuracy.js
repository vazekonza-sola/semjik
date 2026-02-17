import axios from "axios";

const baseUrl = "http://localhost:3000";

// Dataset untuk testing
const testDataset = {
  legitimate: [
    {
      name: "Chrome Indonesia - Residential",
      ip: "182.8.193.13",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8",
        "accept-encoding": "gzip, deflate, br",
        "sec-ch-ua": '"Chromium";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "x-timezone": "Asia/Jakarta",
      },
    },
    {
      name: "Firefox US - Residential",
      ip: "73.158.64.1",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.5",
        "accept-encoding": "gzip, deflate, br",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "x-timezone": "America/New_York",
      },
    },
    {
      name: "Safari MacOS - Residential",
      ip: "1.9.1.1", // Telstra Australia - residential
      ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-AU,en;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "x-timezone": "Australia/Sydney",
      },
    },
    {
      name: "Edge Windows - Residential",
      ip: "49.145.1.1", // Singtel Singapore - residential
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-SG,en;q=0.9",
        "sec-ch-ua": '"Microsoft Edge";v="122"',
        "sec-fetch-dest": "document",
        "x-timezone": "Asia/Singapore",
      },
    },
    {
      name: "Mobile Chrome Android - Residential",
      ip: "114.10.1.1",
      ua: "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "id-ID,id;q=0.9",
        "sec-ch-ua-mobile": "?1",
        "x-timezone": "Asia/Jakarta",
      },
    },
  ],

  bots: [
    {
      name: "curl Command",
      ip: "1.2.3.4",
      ua: "curl/7.68.0",
      headers: {
        accept: "*/*",
      },
    },
    {
      name: "Python Requests",
      ip: "5.6.7.8",
      ua: "python-requests/2.28.1",
      headers: {
        accept: "*/*",
        "accept-encoding": "gzip, deflate",
      },
    },
    {
      name: "Googlebot",
      ip: "66.249.64.1",
      ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      headers: {
        accept: "*/*",
      },
    },
    {
      name: "Selenium WebDriver",
      ip: "10.0.0.1",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      headers: {
        accept: "text/html",
        webdriver: "true",
      },
    },
    {
      name: "Puppeteer Headless",
      ip: "192.168.1.1",
      ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/122.0.0.0 Safari/537.36",
      headers: {
        accept: "text/html",
      },
    },
    {
      name: "AWS Datacenter with Spoofed Headers",
      ip: "3.5.140.2",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      headers: {
        accept: "text/html",
        "accept-language": "en-US,en;q=0.9",
      },
    },
    {
      name: "NL Datacenter + Indonesian Language (Mismatch)",
      ip: "185.213.155.247",
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      headers: {
        accept: "text/html",
        "accept-language": "id-ID,id;q=0.9",
        "x-timezone": "Asia/Jakarta",
      },
    },
    {
      name: "Scrapy Spider",
      ip: "45.33.1.1",
      ua: "Scrapy/2.7.1 (+https://scrapy.org)",
      headers: {
        accept: "*/*",
      },
    },
  ],
};

async function runAccuracyTest() {
  console.log("📊 ACCURACY TEST - Anti-Bot Detection System\n");
  console.log("=".repeat(70));

  let truePositives = 0; // Bots correctly blocked
  let trueNegatives = 0; // Legitimate correctly allowed
  let falsePositives = 0; // Legitimate incorrectly blocked
  let falseNegatives = 0; // Bots incorrectly allowed

  const results = {
    legitimate: [],
    bots: [],
  };

  // Test Legitimate Traffic
  console.log("\n🟢 Testing LEGITIMATE Traffic (Should ALLOW)\n");
  for (const test of testDataset.legitimate) {
    try {
      const res = await axios.post(`${baseUrl}/detect`, {
        ip: test.ip,
        userAgent: test.ua,
        headers: test.headers,
      });

      const isBlocked = res.data.data.is_blocked === 1;
      const risk = res.data.data._debug.risk;

      if (!isBlocked) {
        trueNegatives++;
        console.log(`✅ ${test.name}: PASS (allowed, risk: ${risk})`);
        results.legitimate.push({ name: test.name, result: "correct", risk });
      } else {
        falsePositives++;
        console.log(
          `❌ ${test.name}: FAIL (blocked - FALSE POSITIVE, risk: ${risk})`,
        );
        console.log(`   Reason: ${res.data.data.reason}`);
        results.legitimate.push({
          name: test.name,
          result: "false_positive",
          risk,
        });
      }
    } catch (error) {
      console.error(`❌ ${test.name}: ERROR - ${error.message}`);
    }
  }

  // Test Bot Traffic
  console.log("\n🔴 Testing BOT Traffic (Should BLOCK)\n");
  for (const test of testDataset.bots) {
    try {
      const res = await axios.post(`${baseUrl}/detect`, {
        ip: test.ip,
        userAgent: test.ua,
        headers: test.headers,
      });

      const isBlocked = res.data.data.is_blocked === 1;
      const risk = res.data.data._debug.risk;

      if (isBlocked) {
        truePositives++;
        console.log(`✅ ${test.name}: PASS (blocked, risk: ${risk})`);
        console.log(`   Reason: ${res.data.data.reason}`);
        results.bots.push({ name: test.name, result: "correct", risk });
      } else {
        falseNegatives++;
        console.log(
          `❌ ${test.name}: FAIL (allowed - FALSE NEGATIVE, risk: ${risk})`,
        );
        results.bots.push({ name: test.name, result: "false_negative", risk });
      }
    } catch (error) {
      console.error(`❌ ${test.name}: ERROR - ${error.message}`);
    }
  }

  // Calculate Metrics
  const totalTests = testDataset.legitimate.length + testDataset.bots.length;
  const totalLegitimate = testDataset.legitimate.length;
  const totalBots = testDataset.bots.length;

  const accuracy = ((truePositives + trueNegatives) / totalTests) * 100;
  const falsePositiveRate = (falsePositives / totalLegitimate) * 100;
  const falseNegativeRate = (falseNegatives / totalBots) * 100;
  const precision = (truePositives / (truePositives + falsePositives)) * 100;
  const recall = (truePositives / (truePositives + falseNegatives)) * 100;
  const f1Score = (2 * (precision * recall)) / (precision + recall);

  // Display Results
  console.log("\n" + "=".repeat(70));
  console.log("📈 CONFUSION MATRIX\n");
  console.log("                    Predicted Legitimate    Predicted Bot");
  console.log(
    `Actual Legitimate        ${trueNegatives}                    ${falsePositives}`,
  );
  console.log(
    `Actual Bot               ${falseNegatives}                    ${truePositives}`,
  );

  console.log("\n" + "=".repeat(70));
  console.log("📊 ACCURACY METRICS\n");

  console.log(`Total Tests:              ${totalTests}`);
  console.log(`  - Legitimate:           ${totalLegitimate}`);
  console.log(`  - Bots:                 ${totalBots}`);
  console.log("");
  console.log(`True Positives (TP):      ${truePositives} (bots blocked)`);
  console.log(
    `True Negatives (TN):      ${trueNegatives} (legitimate allowed)`,
  );
  console.log(
    `False Positives (FP):     ${falsePositives} (legitimate blocked) ⚠️`,
  );
  console.log(`False Negatives (FN):     ${falseNegatives} (bots allowed) ⚠️`);
  console.log("");

  const accuracyStatus = accuracy >= 90 ? "✅" : "❌";
  const fpStatus = falsePositiveRate <= 10 ? "✅" : "❌";
  const fnStatus = falseNegativeRate <= 10 ? "✅" : "❌";
  const precisionStatus = precision >= 85 ? "✅" : "❌";
  const recallStatus = recall >= 85 ? "✅" : "❌";

  console.log(
    `${accuracyStatus} Accuracy:              ${accuracy.toFixed(2)}% (target: ≥90%)`,
  );
  console.log(
    `${fpStatus} False Positive Rate:   ${falsePositiveRate.toFixed(2)}% (target: ≤10%)`,
  );
  console.log(
    `${fnStatus} False Negative Rate:   ${falseNegativeRate.toFixed(2)}% (target: ≤10%)`,
  );
  console.log(
    `${precisionStatus} Precision:             ${precision.toFixed(2)}% (target: ≥85%)`,
  );
  console.log(
    `${recallStatus} Recall:                ${recall.toFixed(2)}% (target: ≥85%)`,
  );
  console.log(`   F1 Score:              ${f1Score.toFixed(2)}%`);

  // Overall Assessment
  console.log("\n" + "=".repeat(70));
  const allPassed =
    accuracy >= 90 && falsePositiveRate <= 10 && falseNegativeRate <= 10;

  if (allPassed) {
    console.log("🎉 OVERALL ASSESSMENT: EXCELLENT");
    console.log("   All metrics meet or exceed targets!");
  } else {
    console.log("⚠️  OVERALL ASSESSMENT: NEEDS TUNING");
    console.log("   Some metrics below target. Recommendations:");

    if (falsePositiveRate > 10) {
      console.log(
        "   - High FP: Increase thresholds or refine detection rules",
      );
    }
    if (falseNegativeRate > 10) {
      console.log("   - High FN: Decrease thresholds or add more bot patterns");
    }
    if (accuracy < 90) {
      console.log("   - Low Accuracy: Review and tune scoring weights");
    }
  }

  console.log("=".repeat(70) + "\n");
}

runAccuracyTest().catch(console.error);
