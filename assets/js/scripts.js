/* ==========================================================================
   iVvy Static Site - Optimised JavaScript
   Combined scripts.js + cookie-consent.js for single network request
   ========================================================================== */

(function() {
  'use strict';

  // ==========================================================================
  // Cookie Consent (runs immediately for banner visibility)
  // ==========================================================================
  var STORAGE_KEY = 'ivvy_cookie_consent';
  var banner = document.getElementById('cookieConsent');
  var trackingLoadScheduled = false;
  var trackingLoaded = false;
  var trackingDelayTimer = null;

  function getPrefs() {
    try { var s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; }
    catch(e) { return null; }
  }

  function loadScriptOnce(src) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function hasTrackingConsent(prefs) {
    return !!(prefs && (prefs.analytics || prefs.marketing));
  }

  function loadGTM() {
    if (trackingLoaded) return;
    trackingLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
    loadScriptOnce('https://www.googletagmanager.com/gtm.js?id=GTM-TBQKMCP');
  }

  function scheduleTrackingLoad(prefs) {
    if (!hasTrackingConsent(prefs) || trackingLoaded || trackingLoadScheduled) return;

    trackingLoadScheduled = true;

    var interactionEvents = ['pointerdown', 'keydown', 'touchstart'];

    function clearTrackingListeners() {
      interactionEvents.forEach(function(eventName) {
        window.removeEventListener(eventName, onFirstInteraction, { passive: true });
      });
      if (trackingDelayTimer) {
        clearTimeout(trackingDelayTimer);
        trackingDelayTimer = null;
      }
    }

    function onFirstInteraction() {
      clearTrackingListeners();
      trackingLoadScheduled = false;
      loadGTM();
    }

    interactionEvents.forEach(function(eventName) {
      window.addEventListener(eventName, onFirstInteraction, { once: true, passive: true });
    });

    trackingDelayTimer = setTimeout(function() {
      clearTrackingListeners();
      trackingLoadScheduled = false;
      loadGTM();
    }, 10000);
  }

  function savePrefs(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    if (banner) banner.style.display = 'none';
    scheduleTrackingLoad(prefs);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'cookie_consent_update', cookie_consent_analytics: prefs.analytics, cookie_consent_marketing: prefs.marketing });
  }

  // Check consent immediately (no DOMContentLoaded needed for localStorage)
  var stored = getPrefs();
  if (stored) {
    scheduleTrackingLoad(stored);
  } else if (banner) {
    banner.style.display = '';
  }

  // Bind cookie buttons after DOM ready
  function initCookieButtons() {
    if (!banner) return;
    var mainView = document.getElementById('cookieMain');
    var prefsView = document.getElementById('cookiePrefs');
    var analyticsCheck = document.getElementById('cookiePrefAnalytics');
    var marketingCheck = document.getElementById('cookiePrefMarketing');

    function acceptAll() { savePrefs({ essential: true, analytics: true, marketing: true }); }
    function declineAll() { savePrefs({ essential: true, analytics: false, marketing: false }); }

    var el;
    if (el = document.getElementById('cookieAcceptAll')) el.addEventListener('click', acceptAll);
    if (el = document.getElementById('cookieDeclineAll')) el.addEventListener('click', declineAll);
    if (el = document.getElementById('cookieManage')) el.addEventListener('click', function() {
      var p = getPrefs();
      if (p && analyticsCheck) { analyticsCheck.checked = p.analytics; marketingCheck.checked = p.marketing; }
      mainView.style.display = 'none'; prefsView.style.display = '';
    });
    if (el = document.getElementById('cookiePrefsAcceptAll')) el.addEventListener('click', acceptAll);
    if (el = document.getElementById('cookieSavePrefs')) el.addEventListener('click', function() {
      savePrefs({ essential: true, analytics: analyticsCheck.checked, marketing: marketingCheck.checked });
    });
    if (el = document.getElementById('cookiePrefsCancel')) el.addEventListener('click', function() {
      if (getPrefs()) { banner.style.display = 'none'; } else { mainView.style.display = ''; prefsView.style.display = 'none'; }
    });
    if (el = document.getElementById('openCookieSettings')) el.addEventListener('click', function() {
      banner.style.display = '';
      var p = getPrefs();
      if (p && analyticsCheck) { analyticsCheck.checked = p.analytics; marketingCheck.checked = p.marketing; }
      mainView.style.display = 'none'; prefsView.style.display = '';
    });
  }

  // ==========================================================================
  // Mobile Menu
  // ==========================================================================
  function initMobileMenu() {
    var toggle = document.querySelector('.mobile-toggle');
    var menu = document.querySelector('.mobile-menu');
    if (!toggle || !menu) return;

    var menuIcon = toggle.querySelector('.icon-menu');
    var closeIcon = toggle.querySelector('.icon-close');

    toggle.addEventListener('click', function() {
      var active = menu.classList.toggle('active');
      if (menuIcon) menuIcon.style.display = active ? 'none' : 'block';
      if (closeIcon) closeIcon.style.display = active ? 'block' : 'none';
      document.body.style.overflow = active ? 'hidden' : '';
    });

    menu.querySelectorAll('.mobile-menu__item').forEach(function(item) {
      var link = item.querySelector('.mobile-menu__link');
      if (link && item.querySelector('.mobile-menu__submenu')) {
        link.addEventListener('click', function(e) { e.preventDefault(); item.classList.toggle('active'); });
      }
    });

    // Login dropdown
    menu.querySelectorAll('.login-dropdown--mobile .login-dropdown__trigger').forEach(function(trigger) {
      trigger.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        var dd = trigger.closest('.login-dropdown');
        document.querySelectorAll('.login-dropdown.open').forEach(function(d) { if (d !== dd) d.classList.remove('open'); });
        dd.classList.toggle('open');
      });
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.login-dropdown')) {
        document.querySelectorAll('.login-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
      }
    });
  }

  // ==========================================================================
  // Header Scroll Effect (throttled with rAF)
  // ==========================================================================
  function initHeaderScroll() {
    var header = document.querySelector('.header');
    if (!header) return;
    var scrolled = false;
    var ticking = false;

    window.addEventListener('scroll', function() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function() {
          var isScrolled = window.pageYOffset > 10;
          if (isScrolled !== scrolled) {
            scrolled = isScrolled;
            header.classList.toggle('header--scrolled', scrolled);
          }
          ticking = false;
        });
      }
    }, { passive: true });
  }

  // ==========================================================================
  // Hero Rotating Words (removed — headline is now static)
  // ==========================================================================
  function initRotatingWords() {
    // No-op: rotating text removed in favour of static headline
  }


  // ==========================================================================
  // Parallax (throttled)
  // ==========================================================================
  function initParallax() {
    var img = document.querySelector('.hero__bg-image');
    if (!img) return;
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function() {
          img.style.transform = 'translateY(' + (window.pageYOffset * 0.3) + 'px)';
          ticking = false;
        });
      }
    }, { passive: true });
  }

  // ==========================================================================
  // Deferred non-critical features
  // ==========================================================================
  function initDeferred() {
    // Animated counters
    var counters = document.querySelectorAll('[data-counter]');
    if (counters.length) {
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var target = parseInt(el.dataset.counter, 10);
            var suffix = el.dataset.suffix || '';
            var prefix = el.dataset.prefix || '';
            var start = 0, inc = target / 125; // ~2s at 60fps
            (function step() {
              start += inc;
              if (start < target) { el.textContent = prefix + Math.floor(start) + suffix; requestAnimationFrame(step); }
              else { el.textContent = prefix + target + suffix; }
            })();
            obs.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function(c) { obs.observe(c); });
    }

    // Scroll animations
    var animEls = document.querySelectorAll('.animate-on-scroll');
    if (animEls.length) {
      var sObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) { entry.target.classList.add('animate-slide-up'); sObs.unobserve(entry.target); }
        });
      }, { threshold: 0.1 });
      animEls.forEach(function(el) { el.style.opacity = '0'; sObs.observe(el); });
    }

    // Integration filter
    var catBtns = document.querySelectorAll('.category-btn');
    var intCards = document.querySelectorAll('.integration-card');
    if (catBtns.length && intCards.length) {
      catBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          catBtns.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var cat = btn.dataset.category;
          intCards.forEach(function(card) { card.style.display = (cat === 'all' || card.dataset.categories.includes(cat)) ? 'flex' : 'none'; });
        });
      });
    }

    // Smooth scroll anchors
    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        var t = document.querySelector(this.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Form validation
    document.querySelectorAll('form').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        var valid = true;
        form.querySelectorAll('[required]').forEach(function(f) {
          if (!f.value.trim()) { valid = false; f.style.borderColor = '#ef4444'; } else { f.style.borderColor = ''; }
        });
        form.querySelectorAll('input[type="email"]').forEach(function(f) {
          if (f.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value)) { valid = false; f.style.borderColor = '#ef4444'; }
        });
        if (!valid) e.preventDefault();
      });
    });

    // Trust logos hover pause
    document.querySelectorAll('.trust-logos__track').forEach(function(t) {
      t.addEventListener('mouseenter', function() { t.style.animationPlayState = 'paused'; });
      t.addEventListener('mouseleave', function() { t.style.animationPlayState = 'running'; });
    });

    // Venue slider
    var slider = document.querySelector('.venue-types__slider');
    var prev = document.querySelector('.venue-slider__prev');
    var next = document.querySelector('.venue-slider__next');
    if (slider && prev && next) {
      function scrollAmt() {
        var card = slider.querySelector('.venue-card');
        if (!card) return 374;
        return card.offsetWidth + (parseInt(getComputedStyle(slider).gap) || 24);
      }
      prev.addEventListener('click', function() {
        if (slider.scrollLeft <= 0) {
          slider.scrollTo({ left: slider.scrollWidth - slider.clientWidth, behavior: 'smooth' });
        } else {
          slider.scrollBy({ left: -scrollAmt(), behavior: 'smooth' });
        }
      });
      next.addEventListener('click', function() {
        if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 2) {
          slider.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          slider.scrollBy({ left: scrollAmt(), behavior: 'smooth' });
        }
      });
    }

    // Testimonial slider (homepage)
    var tSlides = document.querySelectorAll('.testimonial__slide');
    var tNav = document.querySelectorAll('.testimonial__nav-item');
    if (tSlides.length > 0) {
      var tIdx = 0, tTimer;
      function showT(i) {
        tSlides.forEach(function(s) { s.classList.remove('testimonial__slide--active'); });
        tNav.forEach(function(d) { d.classList.remove('testimonial__nav-item--active'); });
        tSlides[i].classList.add('testimonial__slide--active');
        if (tNav[i]) tNav[i].classList.add('testimonial__nav-item--active');
        tIdx = i;
        clearInterval(tTimer);
        tTimer = setInterval(function() { showT((tIdx + 1) % tSlides.length); }, 6000);
      }
      tNav.forEach(function(item) { item.addEventListener('click', function() { showT(parseInt(this.dataset.index)); }); });
      tTimer = setInterval(function() { showT((tIdx + 1) % tSlides.length); }, 6000);
    }

    // Venue page testimonial slider
    var vpSlides = document.querySelectorAll('.testimonial-slide');
    var vpDots = document.querySelectorAll('.testimonial-slider__dot');
    if (vpSlides.length > 1) {
      var vpIdx = 0, vpTimer;
      function showVp(i) {
        vpSlides.forEach(function(s) { s.classList.remove('testimonial-slide--active'); });
        vpDots.forEach(function(d) { d.classList.remove('testimonial-slider__dot--active', 'testimonial-slider__dot--pill'); d.textContent = ''; });
        vpSlides[i].classList.add('testimonial-slide--active');
        if (vpDots[i]) { vpDots[i].classList.add('testimonial-slider__dot--active', 'testimonial-slider__dot--pill'); vpDots[i].textContent = vpDots[i].dataset.company || ''; }
        vpIdx = i;
        clearInterval(vpTimer);
        vpTimer = setInterval(function() { showVp((vpIdx + 1) % vpSlides.length); }, 6000);
      }
      vpDots.forEach(function(d) { d.addEventListener('click', function() { showVp(parseInt(this.dataset.dot)); }); });
      vpTimer = setInterval(function() { showVp((vpIdx + 1) % vpSlides.length); }, 6000);
    }

    // Lite YouTube
    document.querySelectorAll('.lite-youtube').forEach(function(el) {
      el.addEventListener('click', function() {
        var id = el.getAttribute('data-videoid');
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&modestbranding=1&rel=0&showinfo=0';
        iframe.title = el.getAttribute('data-title') || 'Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        el.innerHTML = '';
        el.appendChild(iframe);
      });
    });
  }

  // ==========================================================================
  // Boot
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initHeaderScroll();
    initCookieButtons();
    initRotatingWords();
    initParallax();

    // Defer non-critical work
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initDeferred);
    } else {
      setTimeout(initDeferred, 200);
    }
  });
})();
