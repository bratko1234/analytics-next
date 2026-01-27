import { backoff } from '@segment/analytics-core'
import type { Context } from '../../app/context'
import { NodeEmitter } from '../../app/emitter'
import { HTTPClient, HTTPClientRequest } from '../../lib/http-client'

function sleep(timeoutInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeoutInMs))
}

type SegmentEventType =
  | 'track'
  | 'page'
  | 'identify'
  | 'group'
  | 'alias'
  | 'screen'

export interface BratraxPublisherProps {
  host?: string
  path?: string
  flushInterval: number
  flushAt: number
  maxRetries: number
  writeKey: string
  httpRequestTimeout?: number
  disable?: boolean
  httpClient: HTTPClient
  endpoints?: {
    [key in SegmentEventType]?: string
  }
}

/**
 * The Publisher is responsible for sending individual events to the Bratrax API.
 * Unlike the standard Segment publisher, this sends each event immediately to individual endpoints.
 */
export class BratraxPublisher {
  private _maxRetries: number
  private _host: string
  private _httpRequestTimeout: number
  private _emitter: NodeEmitter
  private _disable: boolean
  private _httpClient: HTTPClient
  private _writeKey: string
  private _customEndpoints?: { [key in SegmentEventType]?: string }

  // Default endpoint mapping - matches browser version with /vidtao/ prefix
  private readonly defaultEndpointMap: Record<SegmentEventType, string> = {
    track: 'vidtao/track',
    page: 'vidtao/page',
    identify: 'vidtao/identify',
    group: 'vidtao/group',
    alias: 'vidtao/alias',
    screen: 'vidtao/screen',
  }

  constructor(
    {
      host,
      maxRetries,
      writeKey,
      httpRequestTimeout,
      httpClient,
      disable,
      endpoints,
    }: BratraxPublisherProps,
    emitter: NodeEmitter
  ) {
    this._emitter = emitter
    this._maxRetries = maxRetries
    // Clean the host - remove protocol and trailing slashes
    this._host = (host ?? 'https://api.bratrax.com')
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
    this._httpRequestTimeout = httpRequestTimeout ?? 10000
    this._disable = Boolean(disable)
    this._httpClient = httpClient
    this._writeKey = writeKey
    this._customEndpoints = endpoints
  }

  flush(_pendingItemsCount?: number): void {
    // No-op - we send events immediately, no batching
    // This method is kept for compatibility but does nothing since events are sent immediately
  }

  /**
   * Sends the event immediately to the appropriate endpoint.
   * @param ctx - Context containing a Segment event.
   * @returns a promise that resolves with the context after the event has been delivered.
   */
  async enqueue(ctx: Context): Promise<Context> {
    if (this._disable) {
      return ctx
    }

    try {
      await this.sendEvent(ctx)
      return ctx
    } catch (error) {
      ctx.setFailedDelivery({ reason: error })
      return ctx
    }
  }

  /**
   * Get the endpoint for a specific event type
   * Uses custom endpoints if provided, otherwise falls back to defaults
   */
  private getEndpoint(eventType: string): string {
    const type = eventType as SegmentEventType

    // Use custom endpoint if provided
    if (this._customEndpoints?.[type]) {
      return this._customEndpoints[type]!.replace(/^\//, '') // Remove leading slash if present
    }

    // Fall back to default endpoint
    return this.defaultEndpointMap[type] || 'vidtao/track'
  }

  /**
   * Send an individual event to its specific endpoint
   */
  private async sendEvent(ctx: Context): Promise<void> {
    const eventType = ctx.event.type as string
    const endpoint = this.getEndpoint(eventType)
    const url = `https://${this._host}/${endpoint}`

    // Prepare event data with writeKey
    const eventData = {
      ...ctx.event,
      writeKey: this._writeKey,
    }

    const maxAttempts = this._maxRetries + 1
    let currentAttempt = 0

    while (currentAttempt < maxAttempts) {
      currentAttempt++

      let requestedRetryTimeout: number | undefined
      let failureReason: unknown

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'bratrax-analytics-node/latest',
          Authorization: `Bearer ${this._writeKey}`,
          Accept: 'application/json',
        }

        const request: HTTPClientRequest = {
          url,
          method: 'POST',
          headers,
          body: JSON.stringify(eventData),
          httpRequestTimeout: this._httpRequestTimeout,
        }

        this._emitter.emit('http_request', {
          body: request.body,
          method: request.method,
          url: request.url,
          headers: request.headers,
        })

        const response = await this._httpClient.makeRequest(request)

        if (response.status >= 200 && response.status < 300) {
          // Successfully sent event
          return
        } else if (response.status === 400) {
          // Request malformed - don't retry
          throw new Error(`[${response.status}] ${response.statusText}`)
        } else if (response.status === 429) {
          // Rate limited
          if (response.headers && 'x-ratelimit-reset' in response.headers) {
            const rateLimitResetTimestamp = parseInt(
              response.headers['x-ratelimit-reset'],
              10
            )
            if (isFinite(rateLimitResetTimestamp)) {
              requestedRetryTimeout = rateLimitResetTimestamp - Date.now()
            }
          }
          failureReason = new Error(
            `[${response.status}] ${response.statusText}`
          )
        } else {
          // Treat other errors as transient and retry
          failureReason = new Error(
            `[${response.status}] ${response.statusText}`
          )
        }
      } catch (err) {
        // Network errors get thrown, retry them
        failureReason = err
      }

      // Final attempt failed
      if (currentAttempt === maxAttempts) {
        throw failureReason
      }

      // Retry after attempt-based backoff
      await sleep(
        requestedRetryTimeout
          ? requestedRetryTimeout
          : backoff({
              attempt: currentAttempt,
              minTimeout: 25,
              maxTimeout: 1000,
            })
      )
    }
  }
}
