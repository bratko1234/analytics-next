import { fetch } from '../../lib/fetch'
import { RateLimitError } from './ratelimit-error'

export type Dispatcher = (url: string, body: object) => Promise<unknown>

export type StandardDispatcherConfig = {
  keepalive?: boolean
  writeKey?: string // Add writeKey to config
}

export default function (config?: StandardDispatcherConfig): {
  dispatch: Dispatcher
} {
  function dispatch(url: string, body: object): Promise<unknown> {
    console.log('Dispatching to URL:', url)
    console.log('Event data:', body)

    return fetch(url, {
      keepalive: config?.keepalive,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${config?.writeKey}`,
        Accept: 'application/json',
      },
      method: 'post',
      body: JSON.stringify({
        ...body,
        writeKey: config?.writeKey, // Include writeKey in payload
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Response error:', {
          status: res.status,
          statusText: res.statusText,
          error: errorText,
        })

        if (res.status >= 500) {
          throw new Error(`Server error: ${res.status} - ${errorText}`)
        }

        if (res.status === 429) {
          const retryTimeoutStringSecs = res.headers?.get('x-ratelimit-reset')
          const retryTimeoutMS = retryTimeoutStringSecs
            ? parseInt(retryTimeoutStringSecs) * 1000
            : 5000
          throw new RateLimitError(
            `Rate limit exceeded: ${res.status}`,
            retryTimeoutMS
          )
        }

        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`)
      }

      const responseText = await res.text()
      console.log('Response:', responseText)
      return responseText
    })
  }

  return {
    dispatch,
  }
}
