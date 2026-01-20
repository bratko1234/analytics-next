/**
 * Example usage of @bratrax/analytics-node
 * 
 * This file demonstrates how to use the custom analytics package
 * in your Node.js backend applications.
 */

// Import the Analytics class
// const { Analytics } = require('@bratrax/analytics-node')

// Or with ES6 imports:
// import { Analytics } from '@bratrax/analytics-node'

// Initialize analytics with your write key
const analytics = new Analytics({
  writeKey: 'vidtao-test-write-key',
  // Optional: customize endpoints
  // host: 'https://api.bratrax.com',
  // path: '/vidtao/batch',
  // flushAt: 15,
  // flushInterval: 10000,
})

// Listen for errors
analytics.on('error', (err) => {
  console.error('Analytics error:', err)
})

// Example 1: Track a backend event (e.g., payment processed)
analytics.track({
  userId: 'user_123',
  event: 'Payment Processed',
  properties: {
    amount: 99.99,
    currency: 'USD',
    paymentMethod: 'stripe',
    subscriptionPlan: 'premium'
  }
})

// Example 2: Identify a user with traits
analytics.identify({
  userId: 'user_123',
  traits: {
    email: 'user@example.com',
    name: 'John Doe',
    plan: 'premium',
    createdAt: new Date().toISOString()
  }
})

// Example 3: Group a user with an organization
analytics.group({
  userId: 'user_123',
  groupId: 'company_456',
  traits: {
    name: 'Acme Corporation',
    employees: 50,
    plan: 'enterprise'
  }
})

// Example 4: Track page views (if needed for backend)
analytics.page({
  userId: 'user_123',
  name: 'API Documentation',
  properties: {
    section: 'getting-started',
    referrer: 'google.com'
  }
})

// Example 5: Webhook event tracking
function handleWebhook(webhookData) {
  analytics.track({
    userId: webhookData.userId,
    event: 'Webhook Received',
    properties: {
      webhookType: webhookData.type,
      source: webhookData.source,
      timestamp: new Date().toISOString()
    }
  })
}

// Example 6: User registration flow
async function registerUser(userData) {
  const userId = userData.id
  
  // Identify the new user
  analytics.identify({
    userId,
    traits: {
      email: userData.email,
      name: userData.name,
      signupSource: userData.source
    }
  })
  
  // Track registration event
  analytics.track({
    userId,
    event: 'User Registered',
    properties: {
      source: userData.source,
      plan: 'free'
    }
  })
  
  return { success: true }
}

// Example 7: Express.js integration
// const express = require('express')
// const app = express()

// app.post('/api/signup', async (req, res) => {
//   const { userId, email } = req.body
//   
//   analytics.identify({
//     userId,
//     traits: { email }
//   })
//   
//   analytics.track({
//     userId,
//     event: 'User Signed Up',
//     properties: { source: 'web' }
//   })
//   
//   res.json({ success: true })
// })

// Example 8: Flushing before shutdown
async function gracefulShutdown() {
  console.log('Flushing analytics events...')
  await analytics.closeAndFlush()
  console.log('Analytics events flushed successfully')
  process.exit(0)
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

console.log('Analytics initialized and ready to track events!')
console.log('Events will be sent to: https://api.bratrax.com/vidtao/batch')

