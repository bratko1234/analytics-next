(function() {
  'use strict';

  // Configuration
  const WRITE_KEY = '22h31546-a5e4-47a8-bc89-741538fr4971';
  const CDN_URL = 'https://storage.googleapis.com/bratrax-analytics-js/browser-umd.js';
  
  // Initialize window.analytics with write key BEFORE loading the script
  // This is required because the SDK looks for the write key when it loads
  window.analytics = window.analytics || [];
  window.analytics._writeKey = WRITE_KEY;
  window.analytics._loadOptions = {
    integrations: {
      'Segment.io': false,
      'Custom Segment.io': {
        apiHost: 'https://api.bratrax.com',
        endpoints: {
          identify: '/leadbyte/identify',
          track: '/leadbyte/track',
          page: '/leadbyte/page',
        },
      },
    },
  };
  
  // Load the analytics script
  function loadAnalyticsScript() {
    const script = document.createElement('script');
    script.src = CDN_URL;
    script.async = true;
    
    // Initialize analytics when script loads
    script.onload = function() {
      initializeAnalytics();
    };
    
    document.head.appendChild(script);
  }

  // Initialize analytics after script loads
  function initializeAnalytics() {
    if (!window.analytics) {
      console.error('Analytics script failed to load');
      return;
    }

    // Wait for analytics to be ready (it auto-initializes with the options we set earlier)
    window.analytics.ready(function() {
      console.log('Analytics ready');
      
      // Get the anonymousId
      const anonymousId = window.analytics.user().anonymousId();
      console.log('Anonymous ID:', anonymousId);
      
      // Populate the c3 hidden field
      populateC3Field(anonymousId);
      
      // Track initial page view
      trackPageView();
      
      // Set up URL change monitoring
      setupUrlChangeTracking();
    });
  }

  // Populate the c3 hidden form field with anonymousId
  function populateC3Field(anonymousId) {
    // Try multiple times in case the form loads after analytics
    let attempts = 0;
    const maxAttempts = 20; // Try for 10 seconds (20 * 500ms)
    
    const interval = setInterval(function() {
      attempts++;
      
      // Look for c3 field - try multiple selectors
      const c3Field = document.querySelector('input[data-at-value="--ANONYMOUS-ID--"]') ||  // Add this line first
                      document.querySelector('input[value="--ANONYMOUS-ID--"]');

      
      if (c3Field) {
        c3Field.value = anonymousId;
        console.log('✓ Populated c1 field with anonymousId:', anonymousId);
        
        // Trigger change event in case Alchemer listens to it
        const event = new Event('change', { bubbles: true });
        c3Field.dispatchEvent(event);
        
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.warn('⚠ Could not find c3 field after', maxAttempts, 'attempts');
        clearInterval(interval);
      }
    }, 500);
  }

  // Track page view
  function trackPageView() {
    if (!window.analytics) return;
    
    const pagePath = window.location.pathname + window.location.search + window.location.hash;
    
    window.analytics.page({
      name: 'Alchemer Survey Page',
      path: pagePath,
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      search: window.location.search,
      hash: window.location.hash,
    });
    
    console.log('📊 Page view tracked:', pagePath);
  }

  // Monitor URL changes (for single-page survey navigation and query parameter changes)
  function setupUrlChangeTracking() {
    let lastUrl = window.location.href;
    
    // Check for URL changes every 500ms
    // This catches route changes AND query parameter changes
    const urlCheckInterval = setInterval(function() {
      const currentUrl = window.location.href;
      
      if (currentUrl !== lastUrl) {
        console.log('🔄 URL changed:', lastUrl, '→', currentUrl);
        lastUrl = currentUrl;
        trackPageView();
      }
    }, 500);
    
    // Also listen to popstate events (back/forward navigation)
    window.addEventListener('popstate', function() {
      console.log('⬅ Popstate event detected');
      trackPageView();
    });
    
    // Listen to hashchange events
    window.addEventListener('hashchange', function() {
      console.log('# Hash changed');
      trackPageView();
    });
  }

  // Start loading the analytics script
  loadAnalyticsScript();
  
})();
