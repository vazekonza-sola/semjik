/**
 * Comprehensive Bot Detection Test Script
 * Tests various scenarios for bot detection accuracy and false positive prevention
 */

const API_URL = "http://localhost:3000/blocker";
const API_KEY = "bbk_live_iiyTiiPFqbIj6S59vxXOgA9YEp8MhUlc"; // Replace with your actual API key

// Test scenarios
const tests = [
  // ========================================
  // BOT DETECTION TESTS (Should be blocked)
  // ========================================
  {
    name: "🤖 VPN Detection - Cloudflare DNS",
    ip: "1.1.1.1",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
    },
    expectedBlocked: true,
    expectedReason: ["vpn_ip", "datacenter_ip"],
  },
  {
    name: "🤖 Crawler UA - Googlebot",
    ip: "8.8.8.8",
    userAgent:
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    expectedBlocked: true,
    expectedReason: ["crawler_ua"],
  },
  {
    name: "🤖 HTTP Client - Python Requests",
    ip: "8.8.8.8",
    userAgent: "python-requests/2.28.1",
    headers: {
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate",
    },
    expectedBlocked: true,
    expectedReason: ["http_client_ua", "crawler_ua"],
  },
  {
    name: "🤖 HTTP Client - cURL",
    ip: "8.8.8.8",
    userAgent: "curl/7.68.0",
    headers: {
      Accept: "*/*",
    },
    expectedBlocked: true,
    expectedReason: ["http_client_ua", "crawler_ua"],
  },
  {
    name: "🤖 Bad Referer - Semalt Spam",
    ip: "8.8.8.8",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "http://semalt.com/crawler.php",
    },
    expectedBlocked: true,
    expectedReason: ["bad_referer"],
  },
  {
    name: "🤖 Missing User-Agent",
    ip: "8.8.8.8",
    userAgent: "",
    headers: {
      Accept: "text/html",
    },
    expectedBlocked: true,
    expectedReason: ["missing_ua"],
  },

  // ========================================
  // FALSE POSITIVE PREVENTION (Should NOT be blocked)
  // ========================================
  {
    name: "✅ Legitimate User - Chrome Desktop",
    ip: "8.8.8.8",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Sec-Ch-Ua":
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    expectedBlocked: false,
  },
  {
    name: "✅ Legitimate User - Firefox Desktop",
    ip: "8.8.8.8",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
    },
    expectedBlocked: false,
  },
  {
    name: "✅ Legitimate User - Chrome Mobile",
    ip: "8.8.8.8",
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120"',
      "Sec-Ch-Ua-Mobile": "?1",
      "Sec-Ch-Ua-Platform": '"Android"',
      "Upgrade-Insecure-Requests": "1",
    },
    expectedBlocked: false,
  },
];

// Test runner
async function runTests() {
  console.log("🧪 Starting Bot Detection Tests...\n");
  console.log("=".repeat(80));

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of tests) {
    try {
      // Build realistic headers - merge test headers with User-Agent
      const requestHeaders = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        ...test.headers,
      };

      // Add User-Agent to headers if provided
      if (test.userAgent) {
        requestHeaders["User-Agent"] = test.userAgent;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          ip: test.ip,
          userAgent: test.userAgent,
        }),
      });

      const data = await response.json();

      // Debug: log response structure for first test
      if (results.length === 0) {
        console.log("📋 Sample Response Structure:");
        console.log(JSON.stringify(data, null, 2));
        console.log("-".repeat(80));
      }

      // Handle different response structures
      const responseData = data.data || data;
      const isBlocked =
        responseData.is_blocked === 1 || responseData.is_blocked === true;
      const reason = responseData.reason;
      const redirectUrl = responseData.redirect_url;
      const shouldRedirect = responseData.should_redirect;

      // Check if result matches expectation
      const testPassed = isBlocked === test.expectedBlocked;

      if (testPassed) {
        passed++;
        console.log(`✅ PASS: ${test.name}`);
        console.log(`   Blocked: ${isBlocked}, Reason: ${reason || "N/A"}`);
        if (redirectUrl) {
          console.log(`   🔀 Redirect URL: ${redirectUrl}`);
        }
      } else {
        failed++;
        console.log(`❌ FAIL: ${test.name}`);
        console.log(
          `   Expected blocked: ${test.expectedBlocked}, Got: ${isBlocked}`,
        );
        console.log(`   Reason: ${reason || "N/A"}`);
      }

      results.push({
        test: test.name,
        passed: testPassed,
        isBlocked,
        reason,
        redirectUrl,
        shouldRedirect,
      });

      console.log("-".repeat(80));

      // Add small delay between requests to be more human-like
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      failed++;
      console.log(`❌ ERROR: ${test.name}`);
      console.log(`   ${error.message}`);
      console.log("-".repeat(80));
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total Tests: ${tests.length}`);
  console.log(
    `✅ Passed: ${passed} (${((passed / tests.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `❌ Failed: ${failed} (${((failed / tests.length) * 100).toFixed(1)}%)`,
  );
  console.log("=".repeat(80));

  // Detailed results
  console.log("\n📋 DETAILED RESULTS:\n");
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.test}`);
    console.log(`   Status: ${result.passed ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`   Blocked: ${result.isBlocked}`);
    console.log(`   Reason: ${result.reason || "N/A"}`);
    if (result.redirectUrl) {
      console.log(`   Redirect: ${result.redirectUrl}`);
    }
    console.log("");
  });

  return { passed, failed, total: tests.length };
}

// Run tests
runTests()
  .then(({ passed, failed, total }) => {
    if (failed === 0) {
      console.log("\n🎉 All tests passed!");
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n💥 Test runner error:", error);
    process.exit(1);
  });
