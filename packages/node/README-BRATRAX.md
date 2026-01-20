# @bratrax/analytics-node

Custom Node.js analytics library for tracking backend events to Bratrax API.

## Installation

```bash
npm install @bratrax/analytics-node
# or
yarn add @bratrax/analytics-node
```

## Quick Start

```typescript
import { Analytics } from '@bratrax/analytics-node'

// Initialize analytics
const analytics = new Analytics({
  writeKey: 'vidtao-test-write-key'
})

// Track events
analytics.track({
  userId: 'user123',
  event: 'Payment Processed',
  properties: {
    amount: 99.99,
    currency: 'USD',
    paymentMethod: 'stripe'
  }
})

// Identify users
analytics.identify({
  userId: 'user123',
  traits: {
    email: 'user@example.com',
    plan: 'premium',
    createdAt: new Date()
  }
})

// Group users
analytics.group({
  userId: 'user123',
  groupId: 'company456',
  traits: {
    name: 'Acme Inc',
    plan: 'enterprise'
  }
})

// Page views
analytics.page({
  userId: 'user123',
  name: 'Dashboard',
  properties: {
    section: 'admin'
  }
})
```

## Configuration

The library sends data to `https://api.bratrax.com/vidtao/batch` by default. You can customize the endpoint:

```typescript
const analytics = new Analytics({
  writeKey: 'your-write-key',
  host: 'https://custom-api.bratrax.com',
  path: '/custom/batch',
  flushAt: 20,           // Flush after 20 events (default: 15)
  flushInterval: 5000,   // Flush every 5 seconds (default: 10000)
  maxRetries: 3          // Retry failed requests 3 times
})
```

## Usage in Express

```typescript
import express from 'express'
import { Analytics } from '@bratrax/analytics-node'

const app = express()
const analytics = new Analytics({ writeKey: 'your-key' })

app.post('/signup', async (req, res) => {
  const { userId, email } = req.body
  
  analytics.identify({
    userId,
    traits: { email }
  })
  
  analytics.track({
    userId,
    event: 'User Signed Up',
    properties: { source: 'web' }
  })
  
  res.json({ success: true })
})
```

## Usage in AWS Lambda

```typescript
import { Analytics } from '@bratrax/analytics-node'

export const handler = async (event) => {
  const analytics = new Analytics({
    writeKey: 'your-key',
    flushAt: 1  // Flush immediately in Lambda
  })
  
  // Track event and wait for it to complete
  await new Promise((resolve) => {
    analytics.track({
      userId: event.userId,
      event: 'Lambda Function Executed'
    }, resolve)
  })
  
  return { statusCode: 200 }
}
```

## Flushing Events

Events are batched and sent automatically. You can manually flush or flush before shutdown:

```typescript
// Flush all pending events
await analytics.flush()

// Flush and close (use before shutting down your app)
await analytics.closeAndFlush()
```

## Error Handling

```typescript
analytics.on('error', (err) => {
  console.error('Analytics error:', err)
})

analytics.on('http_request', (req) => {
  console.log('Sending request:', req.url)
})
```

## API Methods

- `track()` - Track user actions
- `identify()` - Identify users with traits
- `page()` - Track page views
- `screen()` - Track screen views (mobile)
- `group()` - Associate users with groups
- `alias()` - Link user identities

## License

MIT

