/* eslint-disable @typescript-eslint/no-floating-promises */
import { getGlobalAnalytics } from '../lib/global-analytics-helper'
import { setGlobalCDNUrl } from '../lib/parse-cdn'
import { setVersionType } from '../lib/version-type'

const CUSTOM_CDN = 'https://analytics-service-h75vmxqcmq-uc.a.run.app'

// Add this declaration at the top of the file
declare global {
  interface Window {
    AnalyticsNext: any
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

// Import the custom plugin
import { customSegmentio } from '../plugins/custom-segmentio'

let ajsIdentifiedCSP = false

const sendErrorMetrics = (tags: string[]) => {
  // this should not be instantied at the root, or it will break ie11.
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
    await install()
    console.log('install completed')
    const analytics = getGlobalAnalytics()
    console.log('Global analytics object:', analytics)
    if (analytics && typeof analytics.register === 'function') {
      console.log('Registering custom plugin')
      await analytics.register(
        customSegmentio({
          writeKey: embeddedWriteKey() || '',
          apiHost: CUSTOM_CDN,
        })
      )
      console.log('Custom Segment.io plugin registered.')
      window.analytics = analytics
      console.log('Window analytics object updated')
    } else {
      console.error(
        'Analytics object not found or register method not available'
      )
      console.log(
        'Analytics object structure:',
        JSON.stringify(analytics, null, 2)
      )
    }
  } catch (error) {
    console.error('Error in modifiedInstall:', error)
  }
}

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
window.AnalyticsNext = window.analytics
