// src/lib/csp-detection.ts

import { getLegacyAJSPath } from './parse-cdn'
import { loadScript } from './load-script'

export function isAnalyticsCSPError(
  event: SecurityPolicyViolationEvent
): boolean {
  return (
    event.disposition !== 'report' && event.blockedURI.includes('cdn.segment')
  )
}

export async function loadAjsClassicFallback(
  customUrl?: string
): Promise<HTMLScriptElement> {
  console.warn(
    'Your CSP policy is missing permissions required in order to run Analytics.js 2.0',
    'https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/upgrade-to-ajs2/#using-a-strict-content-security-policy-on-the-page'
  )
  console.warn('Reverting to Analytics.js 1.0')

  // Use the custom URL if provided, otherwise fall back to getLegacyAJSPath
  const src = customUrl || getLegacyAJSPath()
  return loadScript(src)
}
