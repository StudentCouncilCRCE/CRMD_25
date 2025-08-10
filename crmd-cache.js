// ========== CRMD SHARED CACHE UTILITY ==========
// This script manages asset caching across all pages for instant navigation

(function() {
  'use strict';

  // ========== CACHE CONFIGURATION ==========
  const CACHE_CONFIG = {
    VERSION: 'v1.0',
    KEY: 'crmd-assets-cache',
    TIMESTAMP_KEY: 'crmd-cache-timestamp',
    DURATION: 24 * 60 * 60 * 1000, // 24 hours
    BATCH_SIZE: 6,
    BATCH_DELAY: 200
  };

  // ========== CACHE UTILITIES ==========
  window.CRMDCache = {
    // Check if cache is fresh and valid
    isFresh: function() {
      const timestamp = localStorage.getItem(CACHE_CONFIG.TIMESTAMP_KEY);
      const version = localStorage.getItem(CACHE_CONFIG.KEY + '-version');
      
      if (!timestamp || !version || version !== CACHE_CONFIG.VERSION) {
        return false;
      }
      
      const age = Date.now() - parseInt(timestamp);
      return age < CACHE_CONFIG.DURATION;
    },

    // Mark assets as cached
    markCached: function() {
      localStorage.setItem(CACHE_CONFIG.TIMESTAMP_KEY, Date.now().toString());
      localStorage.setItem(CACHE_CONFIG.KEY + '-version', CACHE_CONFIG.VERSION);
      localStorage.setItem(CACHE_CONFIG.KEY, 'true');
    },

    // Clear cache (useful for debugging or forced refresh)
    clear: function() {
      localStorage.removeItem(CACHE_CONFIG.TIMESTAMP_KEY);
      localStorage.removeItem(CACHE_CONFIG.KEY + '-version');
      localStorage.removeItem(CACHE_CONFIG.KEY);
    },

    // Get cache status for debugging
    getStatus: function() {
      return {
        isFresh: this.isFresh(),
        timestamp: localStorage.getItem(CACHE_CONFIG.TIMESTAMP_KEY),
        version: localStorage.getItem(CACHE_CONFIG.KEY + '-version'),
        cached: localStorage.getItem(CACHE_CONFIG.KEY)
      };
    }
  };

  // ========== COMPLETE ASSET MANIFEST ==========
  // All assets across the entire CRMD website
  window.CRMD_ASSETS = {
    // Core files that are always needed
    core: [
      "Assests/favicon.ico",
      "style.css",
      "Fonts/kodex/Kodex-Regular.ttf",
      "Fonts/kodex/Kodex-Regular.otf"
    ],

    // Index page assets
    index: [
      "Assests/chess_bg_desktop.webp",
      "Assests/chess_bg_mobile.webp",
      "Assests/king_desktop.webp",
      "Assests/king_mobile.webp", 
      "Assests/king_desktop_fade.webp",
      "Assests/king_mobile_fade.webp",
      "Assests/crmd_landing_desktop_title.webp",
      "Assests/crmd_landing_mobile_title.webp",
      "Assests/crmd_landing_desktop_hand.webp",
      "Assests/Crmd_load.webp"
    ],

    // About page assets
    about: [
      "Assests/crmd_desktop_bg.webp",
      "Assests/crmd_mobile_bg.webp",
      "Assests/crmd_desktop_hand.webp",
      "Assests/crmd_mobile_hand.webp",
      "Assests/CRMD_Poster_bg.webp"
      // Note: CRMD_Poster_filed_map.webp may not exist - removed to prevent 404s
    ],

    // Rules page uses CRMD_Poster_bg.webp (already in about)
    rules: [],

    // Contact page uses CRMD_Poster_bg.webp (already in about)
    contact: [],

    // Testimonials page assets
    testimonials: [
      "Assests/Images/Afroz.webp",
      "Assests/Images/Al Qadri.webp",
      "Assests/Images/Arnab Goswami.webp",
      "Assests/Images/Dolly thakore.webp",
      "Assests/Images/Madhur bhandarkar.webp",
      "Assests/Images/Mahesh bhatt.webp"
    ],

    // Sponsors page assets
    sponsors: [
      "Assests/sponsors/al-qadri.webp",
      "Assests/sponsors/balaji.webp", 
      "Assests/sponsors/evepaper.webp",
      "Assests/sponsors/ishtikutum.webp",
      "Assests/sponsors/klaw-snacks.webp",
      "Assests/sponsors/lemonx.webp",
      "Assests/sponsors/mod.webp",
      "Assests/sponsors/negative.webp",
      "Assests/sponsors/no-escape.webp",
      "Assests/sponsors/nutri-snack-box.webp",
      "Assests/sponsors/panaa.webp",
      "Assests/sponsors/sizzle-and-sip.webp",
      "Assests/sponsors/sky-breeze.webp",
      "Assests/sponsors/smaaash.webp",
      "Assests/sponsors/stylish.webp",
      "Assests/sponsors/the-pulp.webp",
      "Assests/sponsors/total-sports&fitness.webp",
      "Assests/sponsors/valencia.webp",
      "Assests/sponsors/zenforest.webp"
    ],

    // Get all assets as a single array
    getAll: function() {
      return [
        ...this.core,
        ...this.index,
        ...this.about,
        ...this.rules,
        ...this.contact,
        ...this.testimonials,
        ...this.sponsors
      ];
    },

    // Get device-optimized assets (prioritize current device)
    getOptimized: function(isDesktop = window.innerWidth > 768) {
      const allAssets = this.getAll();
      
      // Separate device-specific and universal assets
      const deviceSpecific = [];
      const otherDevice = [];
      const universal = [];

      allAssets.forEach(asset => {
        if (asset.includes('desktop') || asset.includes('mobile')) {
          if ((isDesktop && asset.includes('desktop')) || 
              (!isDesktop && asset.includes('mobile'))) {
            deviceSpecific.push(asset);
          } else {
            otherDevice.push(asset);
          }
        } else {
          universal.push(asset);
        }
      });

      // Return prioritized list: universal + current device + other device
      return [...universal, ...deviceSpecific, ...otherDevice];
    }
  };

  // ========== ADVANCED PRELOADER ==========
  window.CRMDPreloader = {
    // Preload all assets with progress tracking
    preloadAll: function(assets, onProgress, onComplete, onError) {
      return new Promise((resolve, reject) => {
        let loaded = 0;
        let failed = 0;
        const total = assets.length;
        const loadedAssets = [];
        const failedAssets = [];

        if (total === 0) {
          resolve({ loaded: [], failed: [] });
          return;
        }

        let currentBatch = 0;

        function loadBatch() {
          const start = currentBatch * CACHE_CONFIG.BATCH_SIZE;
          const end = Math.min(start + CACHE_CONFIG.BATCH_SIZE, total);
          
          for (let i = start; i < end; i++) {
            this.loadAsset(assets[i], i);
          }
          
          currentBatch++;
          if (end < total) {
            setTimeout(() => loadBatch.call(this), CACHE_CONFIG.BATCH_DELAY);
          }
        }

        this.loadAsset = function(url, index) {
          if (url.endsWith('.css')) {
            this.loadStylesheet(url);
          } else if (url.endsWith('.ttf') || url.endsWith('.otf')) {
            this.loadFont(url);
          } else {
            this.loadImage(url);
          }
        };

        this.loadImage = function(url) {
          const img = new Image();
          
          img.onload = () => {
            loaded++;
            loadedAssets.push(url);
            this.checkProgress();
          };

          img.onerror = () => {
            failed++;
            failedAssets.push(url);
            this.checkProgress();
          };

          img.src = url;
        };

        this.loadStylesheet = function(url) {
          // For preloading, just mark as loaded quickly
          setTimeout(() => {
            loaded++;
            loadedAssets.push(url);
            this.checkProgress();
          }, 30);
        };

        this.loadFont = function(url) {
          // For preloading, just mark as loaded quickly
          setTimeout(() => {
            loaded++;
            loadedAssets.push(url);
            this.checkProgress();
          }, 20);
        };

        this.checkProgress = function() {
          const progress = Math.round((loaded / total) * 100);
          
          if (onProgress) {
            onProgress(loaded, total, progress);
          }

          if (loaded + failed === total) {
            const result = {
              loaded: loadedAssets,
              failed: failedAssets,
              total: total,
              successRate: Math.round((loaded / total) * 100)
            };

            if (onComplete) {
              onComplete(result);
            }

            if (loaded > 0) {
              resolve(result);
            } else {
              const error = new Error("All assets failed to load");
              if (onError) onError(error);
              reject(error);
            }
          }
        };

        // Start loading
        loadBatch.call(this);
      });
    }
  };

  // ========== INSTANT NAVIGATION ==========
  // Enhance navigation links for instant page transitions
  window.CRMDNavigation = {
    // Initialize instant navigation
    init: function() {
      if (!window.CRMDCache.isFresh()) {
        return; // Only enable instant nav if assets are cached
      }

      // Find all navigation links
      const navLinks = document.querySelectorAll('a[href$=".html"]');
      
      navLinks.forEach(link => {
        link.addEventListener('click', this.handleNavClick.bind(this));
        
        // Preload on hover for even faster navigation
        link.addEventListener('mouseenter', this.preloadPage.bind(this));
      });
    },

    // Handle navigation clicks
    handleNavClick: function(event) {
      const href = event.target.closest('a').href;
      const isGoingToHome = href.includes('index.html') || href.endsWith('/');
      
      // Add smooth transition effect
      if (document.body.style.opacity !== '0') {
        event.preventDefault();
        
        // Quick fade out
        document.body.style.transition = 'opacity 0.2s ease';
        document.body.style.opacity = '0';
        
        // Navigate after fade
        setTimeout(() => {
          window.location.href = href;
        }, isGoingToHome ? 300 : 200); // Slightly longer delay for home page
      }
    },

    // Preload page on hover
    preloadPage: function(event) {
      const href = event.target.closest('a').href;
      
      // Create invisible link to trigger browser preload
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  };

  // ========== PAGE LOAD OPTIMIZATION ==========
  // Optimize page load based on cache status
  document.addEventListener('DOMContentLoaded', function() {
    // Enable smooth transitions
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.3s ease';

    // Check if this is the home page
    const isHomePage = window.location.pathname.endsWith('index.html') || 
                      window.location.pathname === '/' ||
                      window.location.pathname.endsWith('/');

    // Initialize instant navigation if cache is fresh AND not on home page
    if (window.CRMDCache.isFresh() && !isHomePage) {
      console.log('✓ CRMD Assets cached - enabling instant navigation (non-home page)');
      window.CRMDNavigation.init();
    }

    // Expose cache utilities to global scope for debugging
    if (window.location.search.includes('debug')) {
      console.log('CRMD Cache Status:', window.CRMDCache.getStatus());
      window.clearCRMDCache = window.CRMDCache.clear;
    }
  });

})();
