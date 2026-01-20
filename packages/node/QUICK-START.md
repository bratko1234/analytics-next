# Quick Start Guide - @bratrax/analytics-node

## 1. Build and Publish the Package

### Easy Way (Automated):

**Windows:**
```bash
cd analytics-next/packages/node
.\build-standalone.bat
```

**Linux/Mac:**
```bash
cd analytics-next/packages/node
chmod +x build-standalone.sh
./build-standalone.sh
```

### Manual Way:

```bash
# Navigate to package directory
cd analytics-next/packages/node

# Build dependencies first
cd ../generic-utils && npm install && npm run build
cd ../core && npm install && npm run build
cd ../node

# Install and build
npm install
npm run build

# Login to npm (first time only)
npm login

# Publish to npm
npm publish --access public
```

## 2. Install in Your Backend Applications

```bash
# In your backend project
npm install @bratrax/analytics-node
```

## 3. Initialize Analytics

Create an analytics instance (singleton pattern recommended):

```javascript
// analytics.js
import { Analytics } from '@bratrax/analytics-node'

const analytics = new Analytics({
  writeKey: 'vidtao-test-write-key'
})

// Optional: Add error handling
analytics.on('error', (err) => {
  console.error('Analytics error:', err)
})

export default analytics
```

## 4. Track Events

### Track User Actions

```javascript
import analytics from './analytics'

// Track any backend event
analytics.track({
  userId: 'user_123',
  event: 'Payment Processed',
  properties: {
    amount: 99.99,
    currency: 'USD',
    plan: 'premium'
  }
})
```

### Identify Users

```javascript
// When user signs up or logs in
analytics.identify({
  userId: 'user_123',
  traits: {
    email: 'user@example.com',
    name: 'John Doe',
    plan: 'premium',
    createdAt: new Date()
  }
})
```

### Track Page Views (if needed)

```javascript
analytics.page({
  userId: 'user_123',
  name: 'Dashboard',
  properties: {
    section: 'admin'
  }
})
```

## 5. Common Use Cases

### Express.js API

```javascript
import express from 'express'
import analytics from './analytics'

const app = express()

app.post('/api/signup', async (req, res) => {
  const { userId, email, name } = req.body
  
  // Identify the user
  analytics.identify({
    userId,
    traits: { email, name }
  })
  
  // Track signup event
  analytics.track({
    userId,
    event: 'User Signed Up',
    properties: { source: 'web' }
  })
  
  res.json({ success: true })
})
```

### Webhook Handler

```javascript
app.post('/webhooks/stripe', (req, res) => {
  const event = req.body
  
  analytics.track({
    userId: event.customer,
    event: 'Payment Received',
    properties: {
      amount: event.amount,
      currency: event.currency,
      paymentMethod: event.payment_method
    }
  })
  
  res.json({ received: true })
})
```

### Background Jobs

```javascript
async function processSubscription(userId, plan) {
  // Process subscription logic...
  
  analytics.track({
    userId,
    event: 'Subscription Upgraded',
    properties: {
      newPlan: plan,
      timestamp: new Date()
    }
  })
}
```

## 6. Graceful Shutdown

Always flush events before your app shuts down:

```javascript
// At the top of your main file
import analytics from './analytics'

async function gracefulShutdown() {
  console.log('Flushing analytics...')
  await analytics.closeAndFlush()
  console.log('Analytics flushed')
  process.exit(0)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
```

## 7. Backend API Endpoint

Ensure your backend handles the analytics data at:

**Endpoint:** `POST https://api.bratrax.com/vidtao/batch`

**Expected Request:**
```json
{
  "batch": [
    {
      "type": "track",
      "userId": "user_123",
      "event": "Payment Processed",
      "properties": { ... },
      "timestamp": "2024-01-19T10:00:00.000Z",
      "context": { ... }
    }
  ],
  "writeKey": "vidtao-test-write-key",
  "sentAt": "2024-01-19T10:00:01.000Z"
}
```

**Expected Response:**
- `200-299`: Success
- `400`: Bad request (won't retry)
- `429`: Rate limited (will retry)
- `500+`: Server error (will retry)

## 8. Testing

Test the integration:

```javascript
// test-analytics.js
import analytics from './analytics'

// Test identify
analytics.identify({
  userId: 'test_user',
  traits: { email: 'test@example.com' }
})

// Test track
analytics.track({
  userId: 'test_user',
  event: 'Test Event',
  properties: { test: true }
})

// Wait for events to flush
setTimeout(async () => {
  await analytics.closeAndFlush()
  console.log('Test completed')
  process.exit(0)
}, 2000)
```

Run:
```bash
node test-analytics.js
```

Check your backend logs to verify events are received at `/vidtao/batch`.

## 9. Environment-Specific Configuration

```javascript
// config/analytics.js
import { Analytics } from '@bratrax/analytics-node'

const analytics = new Analytics({
  writeKey: process.env.ANALYTICS_WRITE_KEY || 'vidtao-test-write-key',
  host: process.env.ANALYTICS_HOST || 'https://api.bratrax.com',
  disable: process.env.NODE_ENV === 'test' // Disable in tests
})

export default analytics
```

## 10. Common Events to Track

```javascript
// User Events
analytics.track({ userId, event: 'User Registered' })
analytics.track({ userId, event: 'User Login' })
analytics.track({ userId, event: 'User Logout' })

// Payment Events
analytics.track({ userId, event: 'Payment Processed' })
analytics.track({ userId, event: 'Subscription Upgraded' })
analytics.track({ userId, event: 'Subscription Cancelled' })

// Webhook Events
analytics.track({ userId, event: 'Webhook Received' })
analytics.track({ userId, event: 'Email Sent' })
analytics.track({ userId, event: 'API Key Created' })

// Business Events
analytics.track({ userId, event: 'Feature Used' })
analytics.track({ userId, event: 'Export Completed' })
analytics.track({ userId, event: 'Integration Connected' })
```

## Troubleshooting

### Events not appearing?

1. Check your backend logs for incoming requests to `/vidtao/batch`
2. Verify the `writeKey` matches
3. Ensure `analytics.closeAndFlush()` is called before shutdown
4. Check for errors: `analytics.on('error', console.error)`

### Build errors?

1. Make sure you're in the correct directory
2. Run `yarn install` first
3. Delete `dist/` and rebuild

### Need help?

See `IMPLEMENTATION-SUMMARY.md` for detailed architecture information.

---

**That's it!** You now have custom backend analytics that sends events to your own API endpoint, just like your browser implementation. 🎉

