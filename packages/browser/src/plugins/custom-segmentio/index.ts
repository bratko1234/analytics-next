import { Plugin } from '../../core/plugin'
import { Analytics } from '../../core/analytics'
import { Context } from '../../core/context'
import { fetch } from '../../lib/fetch'

interface CustomSegmentioSettings {
  writeKey: string
  apiHost: string
}

async function sendEvent(
  event: any,
  settings: CustomSegmentioSettings
): Promise<Response> {
  return fetch(`https://${settings.apiHost}/v1/t`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: settings.writeKey,
    },
    body: JSON.stringify(event),
  })
}

export function customSegmentio(settings: CustomSegmentioSettings): Plugin {
  return {
    name: 'Custom Segment.io',
    type: 'destination',
    version: '1.0.0',
    isLoaded: () => true,
    load: () => Promise.resolve(),
    track: (ctx: Context) => sendEvent(ctx.event, settings).then(() => ctx),
    page: (ctx: Context) => sendEvent(ctx.event, settings).then(() => ctx),
    identify: (ctx: Context) => sendEvent(ctx.event, settings).then(() => ctx),
    group: (ctx: Context) => sendEvent(ctx.event, settings).then(() => ctx),
    alias: (ctx: Context) => sendEvent(ctx.event, settings).then(() => ctx),
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
