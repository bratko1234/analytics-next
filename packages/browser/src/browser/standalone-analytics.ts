import { AnalyticsBrowser } from '.'
import { embeddedWriteKey } from '../lib/embedded-write-key'
import { AnalyticsSnippet } from './standalone-interface'
import {
  getGlobalAnalytics,
  setGlobalAnalytics,
} from '../lib/global-analytics-helper'

// Import your custom plugin
import { customSegmentio } from '../plugins/custom-segmentio'

// Interface for install options
interface InstallOptions {
  integrations?: {
    [key: string]:
      | boolean
      | {
          apiHost?: string
          writeKey?: string
        }
  }
}

// Extend the Window interface
declare global {
  interface Window {
    analytics: any
  }
}

function getWriteKey(): string | undefined {
  if (embeddedWriteKey()) {
    return embeddedWriteKey()
  }

  const analytics = getGlobalAnalytics()
  if (analytics?._writeKey) {
    return analytics._writeKey
  }

  const regex = /http.*\/analytics\.js\/v1\/([^/]*)(\/platform)?\/analytics.*/
  const scripts = Array.prototype.slice.call(
    document.querySelectorAll('script')
  )
  let writeKey: string | undefined = undefined

  for (const s of scripts) {
    const src = s.getAttribute('src') ?? ''
    const result = regex.exec(src)

    if (result && result[1]) {
      writeKey = result[1]
      break
    }
  }

  if (!writeKey && document.currentScript) {
    const script = document.currentScript as HTMLScriptElement
    const src = script.src

    const result = regex.exec(src)

    if (result && result[1]) {
      writeKey = result[1]
    }
  }

  return writeKey
}

export async function install(installOptions?: InstallOptions): Promise<void> {
  const writeKey = getWriteKey()
  // console.log('Write key:', writeKey)
  // Merge provided options with existing options
  const existingOptions = getGlobalAnalytics()?._loadOptions ?? {}
  const options = {
    ...existingOptions,
    ...installOptions,
    integrations: {
      ...existingOptions.integrations,
      ...installOptions?.integrations,
    },
  }

  if (!writeKey) {
    console.error(
      'Failed to load Write Key. Make sure to use the latest version of the Segment snippet, which can be found in your source settings.'
    )
    return
  }
  const analytics = await AnalyticsBrowser.standalone(writeKey, options)

  // Only register the custom plugin if it's enabled in options
  if (options.integrations?.['Custom Segment.io'] !== false) {
    await analytics.register(
      customSegmentio({
        writeKey: writeKey,
        apiHost: 'api.bratrax.com',
      })
    )
  }
  setGlobalAnalytics(analytics as AnalyticsSnippet)
  window.analytics = analytics
}
