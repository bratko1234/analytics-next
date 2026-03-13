// Helper function to generate session ID
var generateId = function () {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
    // Helper function to get or create session data
    var getSessionData = function () {
      let sessionId = sessionStorage.getItem("analytics_session_id");
      let sessionStart = sessionStorage.getItem("analytics_session_start");
      let sessionSequence = sessionStorage.getItem("analytics_session_sequence");
      if (!sessionId) {
        sessionId = generateId();
        sessionStart = Date.now();
        sessionSequence = 0;
        sessionStorage.setItem("analytics_session_id", sessionId);
        sessionStorage.setItem("analytics_session_start", sessionStart);
        sessionStorage.setItem("analytics_session_sequence", sessionSequence);
      }
      sessionSequence = parseInt(sessionSequence) + 1;
      sessionStorage.setItem("analytics_session_sequence", sessionSequence);
      return {
        id: sessionId,
        start: parseInt(sessionStart),
        sequence: sessionSequence,
        duration: Date.now() - parseInt(sessionStart),
      };
    };
    // Helper function to get user agent data
    var getUserAgentData = function () {
      if (navigator.userAgentData) {
        return {
          brands: navigator.userAgentData.brands,
          mobile: navigator.userAgentData.mobile,
          platform: navigator.userAgentData.platform,
        };
      }
      return null;
    };
    // Shopify Standard Events Tracking Script
    !(function () {
      var analytics = (window.analytics = window.analytics || []);
      if (!analytics.initialize)
        if (analytics.invoked) self.console && console.error && console.error("Bratrax snippet included twice.");
        else {
          analytics.invoked = !0;
          analytics.methods = [
            "trackSubmit",
            "trackClick",
            "trackLink",
            "trackForm",
            "pageview",
            "identify",
            "reset",
            "group",
            "track",
            "ready",
            "alias",
            "debug",
            "page",
            "once",
            "off",
            "on",
            "addSourceMiddleware",
            "addIntegrationMiddleware",
            "setAnonymousId",
            "addDestinationMiddleware",
          ];
    
          analytics.factory = function (e) {
            return function () {
              var t = Array.prototype.slice.call(arguments);
              t.unshift(e);
              analytics.push(t);
              return analytics;
            };
          };
          for (var e = 0; e < analytics.methods.length; e++) {
            var key = analytics.methods[e];
            analytics[key] = analytics.factory(key);
          }
          analytics.load = function (key, e) {
            var t = document.createElement("script");
            t.type = "text/javascript";
            t.async = !0;
            t.src = "https://storage.googleapis.com/bratrax-analytics-js/browser-umd.js";
            var n = document.getElementsByTagName("script")[0];
            n.parentNode.insertBefore(t, n);
            analytics._loadOptions = e;
          };
          // Configure analytics with Shopify-specific settings
          var options = {
            writeKey: "fgs56190-6fae-6040-b7d1-787796c0ctcc",
            apiHost: "api.bratrax.com",
            integrations: {
              "Segment.io": false,
              "Custom Segment.io": {
                apiHost: "api.bratrax.com",
                endpoints: {
                  identify: "/shopify/identify",
                  track: "/shopify/track",
                  page: "/shopify/page",
                },
              },
            },
          };
          analytics._writeKey = "fgs56190-6fae-6040-b7d1-787796c0ctcc";
          analytics.SNIPPET_VERSION = "4.15.3";
          // First load analytics
          analytics.load("fgs56190-6fae-6040-b7d1-787796c0ctcc", options);
          // Wait for analytics to be ready
          analytics.ready(function () {
            // Initialize Shopify standard event tracking
            initShopifyEventTracking();
          });
        }
    })();
    // Helper function to create base payload
    var createBasePayload = function (eventType) {
      const session = getSessionData();
      return {
        timestamp: new Date().toISOString(),
        type: eventType,
        event_id: generateId(),
        platform: "shopify",
        version: "1.0.0",
        raw_url_parameters: {},
        shopify: {
          shop_domain: "",
          hmac: null,
          topic: null,
        },
        session: session,
      };
    };
    function initShopifyEventTracking() {
      analytics.subscribe("page_viewed", (event) => {
        const basePayload = createBasePayload("page");
        const payload = {
          event_type: "Page Viewed",
          ...basePayload,
          properties: {
            path: event.context?.document?.location?.pathname || "",
            referrer: event.context?.document?.referrer || "",
            search: event.context?.document?.location?.search || "",
            title: event.context?.document?.title || "",
            url: event.context?.document?.location?.href || "",
            shop: event.context?.shop || "",
            ...event,
          },
        };
        self.analytics.page(payload);
      });
      analytics.subscribe("product_viewed", (event) => {
        try {
          const basePayload = createBasePayload("track");
          const payload = {
            event_type: "Product Viewed",
            ...basePayload,
            properties: event,
          };
          self.analytics.track("Product Viewed", payload);
        } catch (error) {
          console.error("Error processing product_viewed event:", error);
        }
      });
      analytics.subscribe("cart_viewed", (event) => {
        try {
          const basePayload = createBasePayload("track");
          const payload = {
            event_type: "Cart Viewed",
            ...basePayload,
            properties: event,
          };
          self.analytics.track("Cart Viewed", payload);
        } catch (error) {
          console.error("Error processing cart_viewed event:", error);
        }
      });
      analytics.subscribe("collection_viewed", (event) => {
        try {
          const basePayload = createBasePayload("track");
          const payload = {
            event_type: "Collection Viewed",
            ...basePayload,
            properties: event,
          };
          self.analytics.track("Collection Viewed", payload);
        } catch (error) {
          console.error("Error processing collection_viewed event:", error);
        }
      });
      analytics.subscribe("search_submitted", (event) => {
        try {
          const basePayload = createBasePayload("track");
          const payload = {
            event_type: "Search Submitted",
            ...basePayload,
            properties: event,
          };
          self.analytics.track("Search Submitted", payload);
        } catch (error) {
          console.error("Error processing search_submitted event:", error);
        }
      });
      analytics.subscribe("checkout_started", (event) => {
        const basePayload = createBasePayload("track");
        const payload = {
          event_type: "Checkout Started",
          ...basePayload,
          properties: event,
        };
        self.analytics.track("Checkout Started", payload);
      });
      analytics.subscribe("checkout_completed", (event) => {
        const basePayload = createBasePayload("track");
        const payload = {
          event_type: "Checkout Completed",
          ...basePayload,
          properties: event,
        };
        self.analytics.track("Checkout Completed", payload);
      });
      analytics.subscribe("product_added_to_cart", (event) => {
        const basePayload = createBasePayload("track");
        const payload = {
          event_type: "Product Added to Cart",
          ...basePayload,
          properties: event,
        };
        self.analytics.track("Product Added to Cart", payload);
      });
      analytics.subscribe("product_removed_from_cart", (event) => {
        const basePayload = createBasePayload("track");
        const payload = {
          event_type: "Product Removed from Cart",
          ...basePayload,
          properties: event,
        };
        self.analytics.track("Product Removed from Cart", payload);
      });
      analytics.subscribe("checkout_address_info_submitted", (event) => {
        const basePayload = createBasePayload("track");
        const payload = {
          event_type: "Checkout Address Info Submitted",
          ...basePayload,
          properties: event,
        };
        self.analytics.track("Checkout Address Info Submitted", payload);
      });
      analytics.subscribe("checkout_contact_info_submitted", (event) => {
        const basePayload = createBasePayload("track");
        const payload = {
          event_type: "Checkout Contact Info Submitted",
          ...basePayload,
          properties: event,
        };
        self.analytics.track("Checkout Contact Info Submitted", payload);
      });
      analytics.subscribe("checkout_shipping_info_submitted", (event) => {
        const basePayload = createBasePayload("track");
        const payload = {
          event_type: "Checkout Shipping Info Submitted",
          ...basePayload,
          properties: event,
        };
        self.analytics.track("Checkout Shipping Info Submitted", payload);
      });
      analytics.subscribe("payment_info_submitted", (event) => {
        const basePayload = createBasePayload("track");
        const payload = {
          event_type: "Payment Info Submitted",
          ...basePayload,
          properties: event,
        };
        self.analytics.track("Payment Info Submitted", payload);
      });
      analytics.subscribe("alert_displayed", (event) => {
        const basePayload = createBasePayload("track");
        const payload = {
          event_type: "Alert Displayed",
          ...basePayload,
          properties: event,
        };
        self.analytics.track("Alert Displayed", payload);
      });
      analytics.subscribe("ui_extension_errored", (event) => {
        const basePayload = createBasePayload("track");
        const payload = {
          event_type: "UI Extension Error",
          ...basePayload,
          properties: event,
        };
        self.analytics.track("UI Extension Error", payload);
      });
    }