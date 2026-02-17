# Anti-Bot API Testing Guide

## 🧪 Test Suite Overview

Script `test-suite.js` menguji 3 aspek utama:

### 1. **Performance Test** ⚡

- Mengirim 100 request untuk mengukur latency
- Metrics: Min, Avg, P50, P95, P99, Max
- **Target**: P95 < 40ms (uncached), < 10ms (cached)

### 2. **Accuracy Test** 🎯

- Menguji legitimate traffic (4 test cases)
- Menguji bot traffic (6 test cases)
- **Target**: Accuracy ≥ 90%

### 3. **False Positive Test** ⚠️

- Mengukur berapa banyak legitimate user yang diblokir
- **Target**: False Positive Rate ≤ 10%

---

## 📋 Test Cases

### ✅ Legitimate Traffic (Should ALLOW)

1. Chrome Desktop + Residential ISP
2. Firefox Desktop + Residential ISP
3. Safari MacOS + Residential ISP
4. Edge Desktop + Residential ISP

### ❌ Bot Traffic (Should BLOCK)

1. curl Command Line
2. Python Requests
3. Googlebot Crawler
4. Selenium WebDriver
5. Puppeteer Headless
6. AWS Datacenter IP

---

## 🚀 Cara Menjalankan Test

### 1. Pastikan server berjalan

```bash
npm run dev
```

### 2. Jalankan test suite

```bash
node test-suite.js
```

### 3. Lihat hasil

Script akan menampilkan:

- ⚡ Performance metrics (latency)
- 🎯 Accuracy metrics (% correct)
- ⚠️ False positive/negative rates
- ✅/❌ Pass/Fail status

---

## 📊 Interpretasi Hasil

### Performance

- **PASS**: P95 latency < 40ms
- **FAIL**: P95 latency ≥ 40ms
- **Tip**: Jika gagal, periksa cache configuration

### Accuracy

- **PASS**: Accuracy ≥ 90% DAN False Positive ≤ 10%
- **FAIL**: Accuracy < 90% ATAU False Positive > 10%
- **Tip**: Jika banyak false positive, periksa UA patterns di `data/ua/`

### False Positives

- **0%**: Perfect! Tidak ada legitimate user yang diblokir
- **1-10%**: Acceptable range
- **>10%**: Perlu tuning threshold atau pattern

---

## 🔧 Tuning Recommendations

### Jika False Positive tinggi:

1. Periksa pattern di `data/ua/seo.json` dan `data/ua/crawler.json`
2. Naikkan threshold di `.env`:
   ```
   THRESHOLD_HUMAN=40  # dari 30
   THRESHOLD_SUSPICIOUS=70  # dari 60
   ```

### Jika False Negative tinggi:

1. Tambah pattern bot di `data/ua/`
2. Tambah ASN datacenter di `data/asn/datacenter.json`
3. Turunkan threshold di `.env`

### Jika Latency tinggi:

1. Periksa cache hit rate: `curl http://localhost:3000/admin/cache/stats`
2. Naikkan cache size di `.env`:
   ```
   IP_CACHE_SIZE=20000  # dari 10000
   RESULT_CACHE_SIZE=10000  # dari 5000
   ```

---

## 📈 Monitoring Continuous

Untuk monitoring berkelanjutan, gunakan endpoint analytics:

```bash
# Lihat statistik real-time
curl http://localhost:3000/admin/analytics

# Lihat cache performance
curl http://localhost:3000/admin/cache/stats
```

---

## 🎯 Target Metrics

| Metric                 | Target | Excellent |
| ---------------------- | ------ | --------- |
| Accuracy               | ≥ 90%  | ≥ 95%     |
| False Positive         | ≤ 10%  | ≤ 5%      |
| False Negative         | ≤ 10%  | ≤ 5%      |
| P95 Latency (uncached) | < 40ms | < 20ms    |
| P95 Latency (cached)   | < 10ms | < 5ms     |

---

## 💡 Tips

1. **Jalankan test berkala** setelah update data atau threshold
2. **Monitor analytics** untuk melihat real-world performance
3. **Adjust threshold** berdasarkan traffic pattern Anda
4. **Update data** (VPN, Tor, UA patterns) secara berkala
