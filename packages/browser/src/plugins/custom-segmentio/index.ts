import { Plugin } from '../../core/plugin'
import { Context } from '../../core/context'
import { fetch } from '../../lib/fetch'
import { Analytics } from '../../core/analytics'

// Define all possible event types
type SegmentEventType =
  | 'track'
  | 'page'
  | 'identify'
  | 'group'
  | 'alias'
  | 'screen'

interface CustomSegmentioSettings {
  writeKey: string
  apiHost: string
  endpoints?: {
    [key in SegmentEventType]?: string
  }
}

async function sendEvent(
  ctx: Context,
  settings: CustomSegmentioSettings
): Promise<Response> {
  // Clean the host - remove protocol if exists and any trailing slashes
  const cleanHost = settings.apiHost
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')

  // Get the event type and determine the endpoint
  const eventType = ctx.event.type as SegmentEventType
  let endpoint: string

  // Use configured endpoints if available
  if (settings.endpoints?.[eventType]) {
    endpoint = settings.endpoints[eventType]!.replace(/^\//, '') // Remove leading slash if present
    console.log(`Using custom endpoint for ${eventType}:`, endpoint)
  } else {
    // Fall back to default endpoints if no custom ones provided
    const defaultEndpointMap: Record<SegmentEventType, string> = {
      track: 't',
      page: 'p',
      identify: 'i',
      group: 'g',
      alias: 'a',
      screen: 's',
    }
    endpoint = defaultEndpointMap[eventType] || 't'
    console.log(`Using default endpoint for ${eventType}:`, endpoint)
  }

  // Construct URL using the same protocol as the current page
  const protocol = window.location.protocol
  const url = `${protocol}//${cleanHost}/${endpoint}`

  // Add writeKey to event data
  const eventData = {
    ...ctx.event,
    writeKey: settings.writeKey,
  }

  console.log('=== Request Debug ===')
  console.log('1. URL:', url)
  console.log('2. Protocol:', protocol)
  console.log('3. Clean Host:', cleanHost)
  console.log('4. Endpoint:', endpoint)
  console.log('5. Event Type:', eventType)
  console.log('6. Event Data:', JSON.stringify(eventData, null, 2))
  console.log('7. Headers:', {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${settings.writeKey}`,
    Accept: 'application/json',
  })
  console.log('===================')

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.writeKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(eventData),
    })

    if (!response.ok) {
      console.error(
        `HTTP error! status: ${response.status}`,
        await response.text()
      )
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Parse and handle enriched response
    const enrichedResponse = await response.json()
    console.log('Enriched response:', enrichedResponse)

    if (enrichedResponse.data) {
      // Merge enriched data back into context
      ctx.event.context = {
        ...ctx.event.context,
        ...enrichedResponse.data.context,
      }
      console.log('Updated context with enriched data:', ctx.event.context)
    }

    return response
  } catch (error) {
    console.error(`Failed to send ${eventType} event:`, error)
    throw error
  }
}

export function customSegmentio(settings: CustomSegmentioSettings): Plugin {
  // Clean the host on plugin initialization
  const cleanHost = settings.apiHost
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')

  // Get endpoints from integration settings
  const endpoints = (window as any).analytics?._loadOptions?.integrations?.[
    'Custom Segment.io'
  ]?.endpoints

  const pluginSettings = {
    writeKey: settings.writeKey,
    apiHost: cleanHost,
    endpoints,
  }

  console.log('Plugin settings:', pluginSettings)

  const handler = (ctx: Context, type: string) => {
    return sendEvent(ctx, pluginSettings)
      .then(() => ctx)
      .catch((error) => {
        console.error(`${type} event failed:`, error)
        throw error
      })
  }

  return {
    name: 'Custom Segment.io',
    type: 'destination',
    version: '1.0.0',

    isLoaded: () => true,
    load: () => {
      console.log(
        'Custom Segment.io plugin loading with settings:',
        pluginSettings
      )
      return Promise.resolve()
    },

    track: (ctx: Context) => {
      console.log('Track event received:', ctx.event)
      return handler(ctx, 'Track')
    },
    page: (ctx: Context) => {
      console.log('Page event received:', ctx.event)
      return handler(ctx, 'Page')
    },
    identify: (ctx: Context) => {
      console.log('Identify event received:', ctx.event)
      return handler(ctx, 'Identify')
    },
    group: (ctx: Context) => {
      console.log('Group event received:', ctx.event)
      return handler(ctx, 'Group')
    },
    alias: (ctx: Context) => {
      console.log('Alias event received:', ctx.event)
      return handler(ctx, 'Alias')
    },
  }
}

export async function loadCustomSegmentio(
  analytics: Analytics,
  settings: CustomSegmentioSettings
): Promise<void> {
  try {
    await analytics.register(customSegmentio(settings))
  } catch (err) {
    console.error('Failed to register custom segmentio plugin:', err)
  }
}
