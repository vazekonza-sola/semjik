# Quick Test Guide for BotBlocker API with Supabase

## Prerequisites

1. Supabase project created
2. SQL migrations run (6 tables)
3. User created with subscription
4. API key generated
5. `.env` configured with Supabase credentials

## Test Flow

### 1. Test API Key Validation

**Valid API Key:**

```bash
curl -X POST http://localhost:3000/api/detect \
  -H "X-API-Key: bbk_live_test1234567890abcdefghijklmn" \
  -H "Content-Type: application/json" \
  -d "{\"ip\":\"1.1.1.1\",\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\"}"
```

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "is_blocked": 0,
    "_quota": {
      "used": 1,
      "limit": 10000,
      "remaining": 9999
    }
  }
}
```

**Invalid API Key:**

```bash
curl -X POST http://localhost:3000/api/detect \
  -H "X-API-Key: invalid_key" \
  -H "Content-Type: application/json" \
  -d "{\"ip\":\"1.1.1.1\",\"userAgent\":\"Mozilla/5.0...\"}"
```

**Expected Response:**

```json
{
  "error": "Unauthorized",
  "message": "Invalid or revoked API key"
}
```

### 2. Test Quota Enforcement

**Simulate Quota Exceeded:**

```sql
-- In Supabase SQL Editor
UPDATE subscriptions
SET quota_used = quota_limit
WHERE user_id = 'YOUR_USER_ID';
```

**Then test API:**

```bash
curl -X POST http://localhost:3000/api/detect \
  -H "X-API-Key: your_key" \
  -d "{\"ip\":\"1.1.1.1\",\"userAgent\":\"Mozilla/5.0...\"}"
```

**Expected Response:**

```json
{
  "error": "Quota Exceeded",
  "message": "Quota exceeded. Used 10000 of 10000 requests."
}
```

### 3. Test Subscription Expiry

**Simulate Expired Subscription:**

```sql
UPDATE subscriptions
SET expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'YOUR_USER_ID';
```

**Expected Response:**

```json
{
  "error": "Subscription Expired",
  "message": "Subscription expired on 2/16/2026"
}
```

### 4. Test User Settings Integration

**Set Blacklist IP:**

```sql
UPDATE user_settings
SET blacklist_ips = '["1.1.1.1"]'::jsonb
WHERE user_id = 'YOUR_USER_ID';
```

**Test with blacklisted IP:**

```bash
curl -X POST http://localhost:3000/api/detect \
  -H "X-API-Key: your_key" \
  -d "{\"ip\":\"1.1.1.1\",\"userAgent\":\"Mozilla/5.0...\"}"
```

**Expected Response:**

```json
{
  "data": {
    "is_blocked": 1,
    "reason": "blacklisted_ip"
  }
}
```

**Set Whitelist IP:**

```sql
UPDATE user_settings
SET whitelist_ips = '["8.8.8.8"]'::jsonb
WHERE user_id = 'YOUR_USER_ID';
```

**Test with whitelisted IP:**

```bash
curl -X POST http://localhost:3000/api/detect \
  -H "X-API-Key: your_key" \
  -d "{\"ip\":\"8.8.8.8\",\"userAgent\":\"Mozilla/5.0...\"}"
```

**Expected Response:**

```json
{
  "data": {
    "is_blocked": 0,
    "reason": "whitelisted_ip"
  }
}
```

### 5. Test Country Filtering

**Allow only US traffic:**

```sql
UPDATE user_settings
SET allowed_countries = '["US"]'::jsonb
WHERE user_id = 'YOUR_USER_ID';
```

**Test with non-US IP:**

```bash
curl -X POST http://localhost:3000/api/detect \
  -H "X-API-Key: your_key" \
  -d "{\"ip\":\"1.1.1.1\",\"userAgent\":\"Mozilla/5.0...\"}"
```

**Expected Response:**

```json
{
  "data": {
    "is_blocked": 1,
    "reason": "country_not_allowed",
    "country": "AU"
  }
}
```

### 6. Verify Request Logging

**Check logs in Supabase:**

```sql
SELECT
  timestamp,
  ip_address,
  country,
  is_bot,
  is_blocked,
  reason
FROM request_logs
WHERE user_id = 'YOUR_USER_ID'
ORDER BY timestamp DESC
LIMIT 10;
```

### 7. Verify Quota Increment

**Check quota after each request:**

```sql
SELECT
  plan,
  quota_used,
  quota_limit,
  expires_at
FROM subscriptions
WHERE user_id = 'YOUR_USER_ID';
```

## Console Logs to Watch

When API is running, you should see:

```
[API Key] Validating key: bbk_live_test12...
[API Key] Found key for user: uuid-here
[API Key] ✅ Valid - Quota: 5/10000, Expires: 2/23/2026
[Quota] Incremented for subscription: sub-uuid
```

## Reset Test Data

**Reset quota:**

```sql
UPDATE subscriptions
SET quota_used = 0
WHERE user_id = 'YOUR_USER_ID';
```

**Reset expiry:**

```sql
UPDATE subscriptions
SET expires_at = NOW() + INTERVAL '7 days'
WHERE user_id = 'YOUR_USER_ID';
```

**Clear settings:**

```sql
UPDATE user_settings
SET
  whitelist_ips = '[]'::jsonb,
  blacklist_ips = '[]'::jsonb,
  allowed_countries = '[]'::jsonb
WHERE user_id = 'YOUR_USER_ID';
```

## Common Issues

**Error: "Missing Supabase credentials"**

- Check `.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

**Error: "relation does not exist"**

- Run SQL migrations in Supabase

**Quota not incrementing:**

- Check `increment_quota` function exists in Supabase
- Check console logs for errors

**Settings not applied:**

- Verify `user_settings` table has record for user
- Check JSON format is correct (use `'[]'::jsonb`)
