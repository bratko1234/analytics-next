# Alchemer Survey Analytics Integration

This guide explains how to integrate the Bratrax Analytics SDK into your Alchemer surveys.

## What It Does

The `alchemer-init.js` script:

1. ✅ **Loads the analytics SDK** from your CDN
2. ✅ **Tracks page views** on initial load and every URL change (routes + query params)
3. ✅ **Populates the hidden field** (by default `c3` or `data-at-value="--CLICK-ID--"`) with the user's `anonymousId` for tracking survey responses

## Installation

### Step 1: Add the Script to Your Alchemer Survey

1. Log in to **Alchemer**
2. Go to your **Survey**
3. Navigate to **Settings → Layout**
4. Find the **Header/Footer** section
5. In the **Header HTML** section, add:

```html
<script>
  // Paste the entire contents of alchemer-init.js here
  (function() {
    'use strict';
    
    const WRITE_KEY = 'ccc3s5c1-2e7b-4c18-12ee-1dd53d90skse';
    const CDN_URL = 'https://storage.googleapis.com/bratrax-analytics-js/browser-umd.js';
    
    // ... rest of the script
  })();
</script>
```

Or load it from an external URL if you host it:

```html
<script src="https://your-cdn.com/alchemer-init.js"></script>
```

### Step 2: Add the Hidden Field

The script automatically looks for a hidden field using these selectors (in order):
1. `input[data-at-value="--CLICK-ID--"]` ← **Most common in Alchemer**
2. `input[name="c3"]`
3. `input[id="c3"]`

**If your Alchemer survey already has a field with `data-at-value="--CLICK-ID--"`, you're done!**

**Otherwise, to add a hidden field manually:**
1. In your Alchemer survey, add a **Hidden Value** question
2. Set the **Field Name** to: `c3`
3. Leave the **Default Value** empty (the script will populate it)
4. Save

### Step 3: Test the Integration

1. **Preview your survey** in Alchemer
2. **Open DevTools** (F12) → Console tab
3. You should see:
   ```
   Analytics ready
   Anonymous ID: ajs-user-abc123...
   ✓ Populated c3 field with anonymousId: ajs-user-abc123...
   📊 Page view tracked: /survey/12345?page=1
   ```
4. **Check Network tab** - you should see requests to:
   - `https://api.bratrax.com/vidtao/page`

## What Gets Tracked

### Initial Page Load
When someone opens the survey:
```json
{
  "name": "Alchemer Survey Page",
  "path": "/survey/12345",
  "url": "https://yoursurvey.alchemer.com/s3/12345/Survey",
  "title": "Customer Satisfaction Survey",
  "referrer": "https://google.com"
}
```

### Page/Question Navigation
When they move to the next page or question changes the URL:
```json
{
  "name": "Alchemer Survey Page",
  "path": "/survey/12345?page=2",
  "url": "https://yoursurvey.alchemer.com/s3/12345/Survey?page=2",
  ...
}
```

### Form Submission
The `c3` field will contain the `anonymousId`, allowing you to:
- Link survey responses to analytics events
- Track which anonymous users completed the survey
- Connect survey data with their website behavior

## Customization

### Change the Field Name

If your field isn't called `c3`, update line 87:

```javascript
// Change from:
const c3Field = document.querySelector('input[name="c3"]') || ...

// To:
const c3Field = document.querySelector('input[name="YOUR_FIELD_NAME"]') || ...
```

### Add Additional Tracking

You can extend the script to track custom events:

```javascript
// After line 140, add:
window.analytics.track({
  event: 'Survey Started',
  properties: {
    surveyId: '12345',
    surveyName: 'Customer Satisfaction'
  }
});
```

### Track Survey Completion

Add this to the **Thank You** page footer:

```html
<script>
if (window.analytics) {
  window.analytics.track({
    event: 'Survey Completed',
    properties: {
      surveyId: '12345',
      completedAt: new Date().toISOString()
    }
  });
}
</script>
```

## Troubleshooting

### "Failed to load Write Key" Error

If you see this error, it means the write key wasn't available when the SDK loaded. **This is now fixed** in the updated script - make sure you're using the latest version from `alchemer-init.js` which sets `window.analytics._writeKey` BEFORE loading the SDK.

### Hidden Field Not Found

If the console shows "Could not find field after 20 attempts", check:

1. **Check for data-at-value**: Run this in console:
   ```javascript
   document.querySelector('input[data-at-value="--CLICK-ID--"]')
   ```
   If this returns `null`, the field doesn't exist with that selector.

2. **Inspect all input fields**: 
   ```javascript
   // Run this in console to see all input fields:
   Array.from(document.querySelectorAll('input')).forEach(i => 
     console.log('Name:', i.name, 'ID:', i.id, 'Type:', i.type, 'data-at-value:', i.getAttribute('data-at-value'))
   )
   ```

3. **Add a custom field**: If your survey doesn't have the expected field, add a **Hidden Value** question with name `c3`

4. **Update the selector**: If your field has a different attribute, update line 87-92 in the script

### Analytics Not Loading

Check:
1. **CDN URL**: Make sure `https://storage.googleapis.com/bratrax-analytics-js/browser-umd.js` is accessible
2. **Console errors**: Look for any error messages
3. **Network tab**: Check if the script is being loaded

### No Page Events

Make sure:
1. **Analytics is ready**: Check console for "Analytics ready" message
2. **Network tab**: Look for POST requests to `api.bratrax.com/vidtao/page`
3. **Backend is running**: Your API must be available

## Data Flow

```
Survey Loaded
    ↓
alchemer-init.js executes
    ↓
Loads browser-umd.js from CDN
    ↓
Initializes Analytics
    ↓
Gets anonymousId (e.g., "ajs-user-abc123")
    ↓
Populates c3 field with anonymousId
    ↓
Tracks initial page view → POST to api.bratrax.com/vidtao/page
    ↓
User navigates (URL changes)
    ↓
Tracks new page view → POST to api.bratrax.com/vidtao/page
    ↓
User submits survey
    ↓
c3 field (with anonymousId) is submitted with form data
```

## Linking Survey Responses to Analytics

In your backend, when you receive survey responses:

```javascript
// Survey response includes c3 field
const surveyResponse = {
  responseId: '12345',
  c3: 'ajs-user-abc123',  // anonymousId from analytics
  answers: { ... }
}

// You can now query analytics events for this anonymous user
const userEvents = await getAnalyticsEvents({
  anonymousId: surveyResponse.c3
})

// Link survey responses to their browsing behavior
```

## Testing Checklist

- [ ] Script loads without errors
- [ ] Console shows "Analytics ready"
- [ ] Console shows "Anonymous ID: ajs-user-..."
- [ ] Console shows "✓ Populated c3 field with anonymousId"
- [ ] Console shows "📊 Page view tracked"
- [ ] Network tab shows POST to `api.bratrax.com/vidtao/page`
- [ ] c3 field has a value when you inspect it
- [ ] URL changes trigger new page events

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify the c3 field selector matches your Alchemer form
3. Ensure your analytics backend is running and accessible

---

**The script is production-ready and can be deployed to any Alchemer survey!** 🚀
