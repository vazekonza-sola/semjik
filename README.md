# Anti-Bot Detection API

High-performance Node.js API for detecting and blocking automated traffic (VPN, proxy, Tor, datacenter, crawlers) while allowing legitimate human browser traffic.

## 🎯 Features

- **3-Layer Detection System**
  - **Layer 1 (Hard Block)**: Instant blocking of VPN/proxy/Tor/datacenter/crawler traffic
  - **Layer 2 (Human Validation)**: Instant allow for verified residential browser traffic
  - **Layer 3 (Risk Scoring)**: Weighted scoring for ambiguous traffic

- **High Performance**
  - Target latency: <20-40ms (uncached), <10ms (cached)
  - LRU caching with optional Redis support
  - Radix tree for fast CIDR lookups
  - Stateless API design

- **Comprehensive Detection**
  - 230+ VPN/Proxy/Tor IP ranges
  - 80+ Datacenter/Residential ASN providers
  - 280+ Crawler/SEO/Automation UA patterns
  - Browser header validation and consistency checks

- **Advanced Features**
  - Real-time analytics dashboard
  - Custom whitelist/blacklist (IP & ASN)
  - Behavioral analysis (request velocity)
  - Auto-update mechanisms for Tor nodes
  - Geolocation blocking

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
CACHE_TYPE=memory  # or redis
ENABLE_ANALYTICS=true
ENABLE_CUSTOM_LISTS=true
```

## 🚀 Usage

### Start Server

```bash
# Development
npm run dev

# Production
npm start
```

### API Endpoints

#### POST /detect

Detect bot traffic with full request analysis.

**Request:**

```json
{
  "ip": "182.8.193.13",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
  "headers": {
    "accept": "text/html,application/xhtml+xml...",
    "accept-language": "en-US,en;q=0.9",
    "sec-ch-ua": "\"Chromium\";v=\"122\"...",
    "sec-fetch-site": "none"
  }
}
```

**Response (Human):**

```json
{
  "allowed": true,
  "category": "human",
  "confidence": 85,
  "signals": ["residential_asn", "valid_browser_ua", "valid_browser_headers"],
  "layer": "human_validation",
  "latency_ms": 15
}
```

**Response (Bot):**

```json
{
  "allowed": false,
  "reason": "vpn_ip",
  "layer": "hard_block",
  "latency_ms": 8
}
```

**Response (Scoring):**

```json
{
  "allowed": false,
  "risk": 84,
  "category": "bot",
  "signals": ["ua_tool_like", "missing_browser", "datacenter_light"],
  "layer": "scoring",
  "latency_ms": 22
}
```

#### GET /detect

Same as POST but with query parameters:

```
GET /detect?ip=182.8.193.13&userAgent=Mozilla...&headers={"accept":"..."}
```

#### GET /admin/analytics

Get real-time analytics:

```json
{
  "uptime": { "hours": "12.34", "started": "2026-02-16T12:00:00Z" },
  "requests": {
    "total": 10000,
    "human": 7500,
    "bot": 2500,
    "humanRate": "75.00%",
    "botRate": "25.00%"
  },
  "blocking": {
    "byLayer": { "hard_block": 2000, "scoring": 500 },
    "byReason": { "vpn_ip": 800, "crawler_ua": 600, "datacenter_ip": 600 },
    "topASNs": { "16509 (Amazon AWS)": 450 },
    "topCountries": { "US": 300, "CN": 200 }
  },
  "performance": {
    "avgLatency": "18.50ms",
    "p50": "15.00ms",
    "p95": "35.00ms",
    "p99": "42.00ms"
  },
  "cache": {
    "hits": 8000,
    "misses": 2000,
    "hitRate": "80.00%"
  }
}
```

#### POST /admin/whitelist/ip

Add IP to whitelist:

```json
{
  "ip": "203.0.113.1"
}
```

#### POST /admin/blacklist/asn

Add ASN to blacklist:

```json
{
  "asn": 16509
}
```

## 🧪 Testing

Test with curl:

```bash
# Test residential Chrome (should allow)
curl -X POST http://localhost:3000/detect \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "182.8.193.13",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua": "\"Chromium\";v=\"122\"",
      "sec-fetch-site": "none"
    }
  }'

# Test curl (should block)
curl -X POST http://localhost:3000/detect \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "1.2.3.4",
    "userAgent": "curl/7.68.0",
    "headers": {
      "accept": "*/*"
    }
  }'
```

## 📊 Decision Flow

```
Request
  ↓
Custom Lists Check (whitelist/blacklist)
  ↓
IP Lookup (ipwho.is + local CIDR)
  ↓
Layer 1: Hard Block?
  YES → Deny (VPN/Tor/Datacenter/Crawler)
  NO ↓
Layer 2: Human Validation?
  YES → Allow (Residential + Valid Browser)
  NO ↓
Layer 3: Risk Scoring
  ↓
Risk < 30 → Allow (Human)
Risk 30-60 → Allow (Suspicious, log)
Risk 60-80 → Deny (High Risk)
Risk 80+ → Deny (Bot)
```

## 🔧 Data Maintenance

### Update Tor Exit Nodes

```bash
# Download latest Tor exit nodes
curl https://check.torproject.org/exit-addresses > data/cidr/tor_raw.txt

# Parse and update tor.json
node scripts/update-tor.js
```

### Update VPN/Proxy Lists

Manually update `data/cidr/vpn.json` and `data/cidr/proxy.json` from:

- Public VPN provider lists
- Commercial IP intelligence feeds
- Community-maintained blocklists

## 📈 Performance Optimization

- **Preload all data**: CIDR ranges, ASN maps, UA patterns loaded at startup
- **Memory caching**: LRU cache for IP lookups and detection results
- **Redis (optional)**: For multi-instance deployments
- **Zero DB queries**: All data in-memory for <20ms latency

## 🛡️ Security

- Rate limiting (100 req/min default)
- CORS enabled (configure for production)
- Helmet security headers
- Input validation on all endpoints

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

For issues or questions, please open a GitHub issue.
