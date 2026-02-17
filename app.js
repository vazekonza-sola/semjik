import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

// Import engines
import IPLookup from "./engine/ipLookup.js";
import HardBlock from "./engine/hardBlock.js";
import HumanCheck from "./engine/humanCheck.js";
import LanguageCheck from "./engine/languageCheck.js";
import Scoring from "./engine/scoring.js";

// Import cache
import MemoryCache from "./cache/memory.js";
import RedisCache from "./cache/redis.js";

// Import utils
import Analytics from "./utils/analytics.js";
import CustomLists from "./utils/customLists.js";

// Import routes
import adminRoutes from "./routes/admin.js";

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

async function buildApp() {
  // Initialize Fastify
  const fastify = Fastify({
    logger: {
      level: LOG_LEVEL,
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: true, // Allow all origins (adjust for production)
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable CSP for API
  });

  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  });

  // Initialize engines
  console.log("🚀 Initializing Anti-Bot API...\n");

  const ipLookup = new IPLookup();
  await ipLookup.init();

  const hardBlock = new HardBlock();
  await hardBlock.init();

  const humanCheck = new HumanCheck();
  await humanCheck.init();

  const languageCheck = new LanguageCheck();
  await languageCheck.init();

  const scoring = new Scoring();

  // Initialize cache
  const cacheType = process.env.CACHE_TYPE || "memory";
  let cache;

  if (cacheType === "redis") {
    cache = new RedisCache();
    await cache.init();

    if (!cache.enabled) {
      console.log("⚠️  Redis failed, falling back to memory cache");
      cache = new MemoryCache();
    }
  } else {
    cache = new MemoryCache();
  }

  console.log(
    `✅ Cache: ${cacheType === "redis" && cache.enabled ? "Redis" : "Memory"}\n`,
  );

  // Initialize utils
  const analytics = new Analytics();
  console.log(`✅ Analytics: ${analytics.enabled ? "Enabled" : "Disabled"}\n`);

  const customLists = new CustomLists();
  await customLists.init();
  console.log(
    `✅ Custom Lists: ${customLists.enabled ? "Enabled" : "Disabled"}\n`,
  );

  // Register protected routes (with API key auth)
  const protectedDetectRoutes = (await import("./routes/protectedDetect.js"))
    .default;
  await fastify.register(protectedDetectRoutes, {
    prefix: "",
    ipLookup,
    hardBlock,
    humanCheck,
    languageCheck,
    scoring,
    cache,
    analytics,
    customLists,
  });

  await fastify.register(adminRoutes, {
    prefix: "",
    analytics,
    customLists,
    cache,
    ipLookup,
  });

  // Health check endpoint
  fastify.get("/health", async (request, reply) => {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  });

  // Root endpoint - return 404 for security
  fastify.get("/", async (request, reply) => {
    reply.code(404);
    return { error: "Not Found" };
  });

  return fastify;
}

async function start() {
  try {
    const fastify = await buildApp();

    await fastify.listen({ port: PORT, host: HOST });

    console.log("\n🎉 Anti-Bot API is running!\n");
    console.log(`📍 Server: http://${HOST}:${PORT}`);
    console.log(`📊 Health: http://${HOST}:${PORT}/health`);
    console.log(`📈 Analytics: http://${HOST}:${PORT}/admin/analytics`);
    console.log("\n✨ Ready to detect bots!\n");
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n👋 Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n\n👋 Shutting down gracefully...");
  process.exit(0);
});

start();
