/* eslint-disable @typescript-eslint/no-floating-promises */
import { getGlobalAnalytics } from '../lib/global-analytics-helper'
import { setGlobalCDNUrl } from '../lib/parse-cdn'
import { setVersionType } from '../lib/version-type'

const CUSTOM_CDN = 'https://api.bratrax.com'

// Add this declaration at the top of the file
declare global {
  interface Window {
    AnalyticsNext: any
    analytics: any
  }
}

if (process.env.IS_WEBPACK_BUILD) {
  if (process.env.ASSET_PATH) {
    // @ts-ignore
    __webpack_public_path__ = process.env.ASSET_PATH
  } else {
    // Always use custom CDN
    setGlobalCDNUrl(CUSTOM_CDN)
    // @ts-ignore
    __webpack_public_path__ = `${CUSTOM_CDN}/analytics-next/bundles/`
  }
}

setVersionType('web')

import { install } from './standalone-analytics'
import '../lib/csp-detection'
import { shouldPolyfill } from '../lib/browser-polyfill'
import { RemoteMetrics } from '../core/stats/remote-metrics'
import { embeddedWriteKey } from '../lib/embedded-write-key'
import {
  loadAjsClassicFallback,
  isAnalyticsCSPError,
} from '../lib/csp-detection'
import { setGlobalAnalyticsKey } from '../lib/global-analytics-helper'
import { customSegmentio } from '../plugins/custom-segmentio'

interface InitializationOptions {
  integrations: {
    [key: string]:
      | boolean
      | {
          apiHost?: string
          writeKey?: string
        }
  }
}

let ajsIdentifiedCSP = false

const sendErrorMetrics = (tags: string[]) => {
  // this should not be instantiated at the root, or it will break ie11.
  const metrics = new RemoteMetrics()
  metrics.increment('analytics_js.invoke.error', [
    ...tags,
    `wk:${embeddedWriteKey()}`,
  ])
}

function onError(err?: unknown) {
  console.error('[analytics.js]', 'Failed to load Analytics.js', err)
  sendErrorMetrics([
    'type:initialization',
    ...(err instanceof Error
      ? [`message:${err?.message}`, `name:${err?.name}`]
      : []),
  ])
}

document.addEventListener('securitypolicyviolation', (e) => {
  if (ajsIdentifiedCSP || !isAnalyticsCSPError(e)) {
    return
  }
  ajsIdentifiedCSP = true
  sendErrorMetrics(['type:csp'])

  const fallbackUrl = `${CUSTOM_CDN}/analytics.js/v1/${embeddedWriteKey()}/analytics.classic.js`
  loadAjsClassicFallback(fallbackUrl).catch(console.error)
})

/**
 * Attempts to run a promise and catch both sync and async errors.
 **/
async function attempt<T>(promise: () => Promise<T>) {
  try {
    const result = await promise()
    return result
  } catch (err) {
    onError(err)
  }
}

const globalAnalyticsKey = (
  document.querySelector(
    'script[data-global-segment-analytics-key]'
  ) as HTMLScriptElement
)?.dataset.globalSegmentAnalyticsKey

if (globalAnalyticsKey) {
  setGlobalAnalyticsKey(globalAnalyticsKey)
}

async function modifiedInstall() {
  console.log('Starting modifiedInstall')
  try {
    const writeKey = embeddedWriteKey() || ''

    // Clean the API host
    const cleanHost = CUSTOM_CDN.replace(/^(https?:\/\/)?(.*?)\/*$/, '$2')

    // Configure options with proper settings
    const initOptions: InitializationOptions = {
      integrations: {
        'Segment.io': false as boolean,
        'Custom Segment.io': {
          apiHost: cleanHost,
          writeKey: writeKey,
        },
      },
    }

    // Install with options
    await install(initOptions)
    console.log('install completed')

    const analytics = getGlobalAnalytics()
    if (!analytics) {
      throw new Error('Analytics not initialized properly')
    }

    console.log('Global analytics object:', analytics)

    // Register the plugin only once
    if (
      typeof analytics.register === 'function' &&
      !analytics.queue?.plugins?.find?.((p) => p.name === 'Custom Segment.io')
    ) {
      console.log('Registering custom plugin')
      await analytics.register(
        customSegmentio({
          writeKey: writeKey,
          apiHost: cleanHost,
        })
      )
      console.log('Custom Segment.io plugin registered.')
    }

    // Set global references
    if (typeof window !== 'undefined') {
      window.analytics = analytics
      window.AnalyticsNext = analytics
      console.log('Window analytics object updated')
    }

    return analytics
  } catch (error) {
    console.error('Error in modifiedInstall:', error)
    throw error
  }
}

// Handle polyfill if needed
if (shouldPolyfill()) {
  const script = document.createElement('script')
  script.setAttribute(
    'src',
    'https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.7.0/polyfill.min.js'
  )

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () =>
      document.body.appendChild(script)
    )
  } else {
    document.body.appendChild(script)
  }

  script.onload = function (): void {
    attempt(modifiedInstall)
  }
} else {
  attempt(modifiedInstall)
}

// Make analytics available globally
export { Analytics } from '../core/analytics'

// Ensure window is defined before setting AnalyticsNext
if (typeof window !== 'undefined') {
  window.AnalyticsNext = window.analytics
}
