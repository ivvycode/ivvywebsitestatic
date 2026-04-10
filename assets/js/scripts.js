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
      }, { threshold: 0.15 });
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

    // Scroll-color-text: animate text color from dark-green (or white) to primary green on scroll
    var scrollColorEls = document.querySelectorAll('.scroll-color-text');
    if (scrollColorEls.length) {
      var DARK_GREEN = [16, 54, 32];
      var WHITE = [255, 255, 255];
      var PRIMARY = [153, 204, 82];
      var OFFSET = 150;
      function updateScrollColors() {
        scrollColorEls.forEach(function(el) {
          var rect = el.getBoundingClientRect();
          var start = window.innerHeight - OFFSET;
          var end = window.innerHeight * 0.66;
          var range = start - end;
          if (range <= 0) return;
          var p = Math.min(1, Math.max(0, (start - rect.top) / range));
          var from = el.classList.contains('scroll-color-text--from-white') ? WHITE : DARK_GREEN;
          var r = Math.round(from[0] + (PRIMARY[0] - from[0]) * p);
          var g = Math.round(from[1] + (PRIMARY[1] - from[1]) * p);
          var b = Math.round(from[2] + (PRIMARY[2] - from[2]) * p);
          var colorVal = 'rgb(' + r + ',' + g + ',' + b + ')';
          el.style.setProperty('color', colorVal, 'important');
          el.style.setProperty('-webkit-text-fill-color', colorVal, 'important');
          if (el.classList.contains('scroll-color-text--underline')) {
            var underlineEl = el.querySelector('.scroll-color-underline');
            if (!underlineEl) {
              underlineEl = document.createElement('span');
              underlineEl.className = 'scroll-color-underline';
              underlineEl.style.cssText = 'position:absolute;left:0;bottom:0;height:5px;background:var(--ivvy-primary);border-radius:9999px;transform-origin:left;width:100%;';
              el.style.position = 'relative';
              el.style.display = 'inline';
              el.style.paddingBottom = '8px';
              el.appendChild(underlineEl);
            }
            underlineEl.style.transform = 'scaleX(' + p + ')';
          }
        });
      }
      window.addEventListener('scroll', updateScrollColors, { passive: true });
      updateScrollColors();
    }

    // Product Suite card scroll-reveal animation
    var productCards = document.querySelectorAll('.product-suite__card');
    if (productCards.length) {
      var pcObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var cards = entry.target.parentElement.querySelectorAll('.product-suite__card');
            cards.forEach(function(card, i) {
              setTimeout(function() { card.classList.add('animate-visible'); }, i * 60);
            });
            pcObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      if (productCards[0]) pcObs.observe(productCards[0]);
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
        if (t) { var y = t.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: y, behavior: 'smooth' }); }
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

    // Image-layout testimonial slider (arrows + dots)
    var imgSlides = document.querySelectorAll('.testimonial__slide--image');
    var tDots = document.querySelectorAll('.testimonial__dot');
    var prevArrow = document.querySelector('.testimonial__arrow--prev');
    var nextArrow = document.querySelector('.testimonial__arrow--next');
    if (imgSlides.length > 1) {
      var imgIdx = 0, imgTimer;
      function showImg(i) {
        imgSlides.forEach(function(s) { s.classList.remove('testimonial__slide--active'); });
        tDots.forEach(function(d) { d.classList.remove('testimonial__dot--active'); });
        imgSlides[i].classList.add('testimonial__slide--active');
        if (tDots[i]) tDots[i].classList.add('testimonial__dot--active');
        imgIdx = i;
        clearInterval(imgTimer);
        imgTimer = setInterval(function() { showImg((imgIdx + 1) % imgSlides.length); }, 6000);
      }
      tDots.forEach(function(d) { d.addEventListener('click', function() { showImg(parseInt(this.dataset.index)); }); });
      if (prevArrow) prevArrow.addEventListener('click', function() { showImg((imgIdx - 1 + imgSlides.length) % imgSlides.length); });
      if (nextArrow) nextArrow.addEventListener('click', function() { showImg((imgIdx + 1) % imgSlides.length); });
      imgTimer = setInterval(function() { showImg((imgIdx + 1) % imgSlides.length); }, 6000);
    }

    // Venue page testimonial slider
    var vpSlides = document.querySelectorAll('.testimonial-slide');
    var vpDots = document.querySelectorAll('.testimonial-slider__dot');
    if (vpSlides.length > 1) {
      var vpIdx = 0, vpTimer;
      function showVp(i) {
        vpSlides.forEach(function(s) { s.classList.remove('testimonial-slide--active'); });
        vpDots.forEach(function(d) { d.classList.remove('testimonial-slider__dot--active'); });
        vpSlides[i].classList.add('testimonial-slide--active');
        if (vpDots[i]) { vpDots[i].classList.add('testimonial-slider__dot--active'); }
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

// Agent tab switcher
function switchAgentTab(id) {
  document.querySelectorAll('.agent-tab').forEach(function(btn) {
    btn.classList.toggle('agent-tab--active', btn.getAttribute('data-agent') === id);
  });
  document.querySelectorAll('.agent-panel').forEach(function(panel) {
    var isActive = panel.id === 'agent-' + id;
    panel.style.display = isActive ? '' : 'none';
    panel.classList.toggle('agent-panel--active', isActive);
  });
}

// Scroll-progress underline animation
(function() {
  var els = document.querySelectorAll('.intro__underline-animate');
  if (els.length) {
    var dark = [16, 54, 32];
    var pri = [153, 204, 82];
    function onScroll() {
      els.forEach(function(el) {
        var rect = el.getBoundingClientRect();
        var start = window.innerHeight - 150;
        var end = window.innerHeight * 0.66;
        var range = start - end;
        if (range <= 0) return;
        var p = Math.min(1, Math.max(0, (start - rect.top) / range));
        el.style.setProperty('--underline-progress', p);
        var r = Math.round(dark[0] + (pri[0] - dark[0]) * p);
        var g = Math.round(dark[1] + (pri[1] - dark[1]) * p);
        var b = Math.round(dark[2] + (pri[2] - dark[2]) * p);
        el.style.color = 'rgb(' + r + ',' + g + ',' + b + ')';
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ==========================================================================
  // Reading Progress Bar (article detail pages)
  // ==========================================================================
  var progressBar = document.getElementById('progressBar');
  if (progressBar) {
    var updateProgress = function() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) { progressBar.style.width = '0%'; return; }
      var pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
      progressBar.style.width = pct + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }
  // ==========================================================================
  // Article Share Buttons
  // ==========================================================================
  document.querySelectorAll('.article-share__btn[data-share]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var container = btn.closest('.article-share');
      var shareTitle = encodeURIComponent(container.getAttribute('data-title') || '');
      var shareUrl = encodeURIComponent(container.getAttribute('data-url') || window.location.href);
      var type = btn.getAttribute('data-share');
      if (type === 'linkedin') {
        window.open('https://www.linkedin.com/shareArticle?mini=true&url=' + shareUrl + '&title=' + shareTitle, '_blank', 'noopener');
      } else if (type === 'twitter') {
        window.open('https://twitter.com/intent/tweet?text=' + shareTitle + '&url=' + shareUrl, '_blank', 'noopener');
      } else if (type === 'facebook') {
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + shareUrl, '_blank', 'noopener');
      } else if (type === 'copy') {
        navigator.clipboard.writeText(decodeURIComponent(shareUrl));
      }
    });
  });

  // ==========================================================================
  // Articles Search & Filter (client-side)
  // ==========================================================================
  var articlesGrid = document.getElementById('articlesGrid');
  if (articlesGrid) {
    var searchInput = document.getElementById('articleSearch');
    var categoryBtns = document.querySelectorAll('#categoryFilters .articles-filters__btn');
    var tagChip = document.getElementById('tagChip');
    var tagChipLabel = document.getElementById('tagChipLabel');
    var tagChipClear = document.getElementById('tagChipClear');
    var emptyState = document.getElementById('articlesEmpty');
    var featuredHeroSection = document.querySelector('.featured-articles-section');
    var cards = Array.prototype.slice.call(articlesGrid.querySelectorAll('.article-card'));
    var paginationEl = document.getElementById('articlesPagination');
    var prevBtn = document.getElementById('paginationPrev');
    var nextBtn = document.getElementById('paginationNext');
    var pageInfo = document.getElementById('paginationInfo');

    var ARTICLES_PER_PAGE = 12;
    var currentPage = 0;
    var activeCategory = '';
    var activeTag = '';
    var searchTerm = '';

    // Read ?tag= from URL
    var urlParams = new URLSearchParams(window.location.search);
    var tagParam = urlParams.get('tag');
    if (tagParam) {
      activeTag = tagParam.toLowerCase();
      tagChipLabel.textContent = 'Tag: ' + tagParam;
      tagChip.style.display = '';
    }

    // Hide the featured card from grid initially (no filters)
    var featuredCards = articlesGrid.querySelectorAll('[data-is-featured]');
    if (featuredCards.length && !activeTag) {
      featuredCards.forEach(function(fc) { fc.style.display = 'none'; });
    }

    function filterArticles() {
      var hasFilters = !!(searchTerm || activeCategory || activeTag);

      // Show/hide featured hero based on filters
      if (featuredHeroSection) {
        featuredHeroSection.style.display = hasFilters ? 'none' : '';
      }

      // Collect visible cards
      var visibleCards = [];
      cards.forEach(function(card) {
        var title = card.getAttribute('data-title') || '';
        var cat = card.getAttribute('data-category') || '';
        var tags = card.getAttribute('data-tags') || '';
        var isFeatured = card.hasAttribute('data-is-featured');

        // Hide featured from grid when no filters active
        if (isFeatured && !hasFilters) {
          card.style.display = 'none';
          return;
        }

        var matchSearch = !searchTerm || title.indexOf(searchTerm) !== -1 || tags.indexOf(searchTerm) !== -1;
        var matchCat = !activeCategory || cat === activeCategory;
        var matchTag = !activeTag || (',' + tags + ',').indexOf(',' + activeTag + ',') !== -1;

        if (matchSearch && matchCat && matchTag) {
          visibleCards.push(card);
        } else {
          card.style.display = 'none';
        }
      });

      // Paginate visible cards
      var totalPages = Math.ceil(visibleCards.length / ARTICLES_PER_PAGE);
      if (currentPage >= totalPages) currentPage = Math.max(0, totalPages - 1);
      var start = currentPage * ARTICLES_PER_PAGE;
      var end = start + ARTICLES_PER_PAGE;

      visibleCards.forEach(function(card, i) {
        card.style.display = (i >= start && i < end) ? '' : 'none';
      });

      emptyState.style.display = visibleCards.length === 0 ? '' : 'none';
      articlesGrid.style.display = visibleCards.length === 0 ? 'none' : '';

      // Update pagination UI
      if (totalPages > 1) {
        paginationEl.style.display = '';
        pageInfo.textContent = 'Page ' + (currentPage + 1) + ' of ' + totalPages;
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage >= totalPages - 1;
      } else {
        paginationEl.style.display = 'none';
      }
    }

    searchInput.addEventListener('input', function() {
      searchTerm = this.value.toLowerCase().trim();
      currentPage = 0;
      filterArticles();
    });

    categoryBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        categoryBtns.forEach(function(b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeCategory = btn.getAttribute('data-category') || '';
        currentPage = 0;
        filterArticles();
      });
    });

    tagChipClear.addEventListener('click', function() {
      activeTag = '';
      tagChip.style.display = 'none';
      var u = new URL(window.location);
      u.searchParams.delete('tag');
      history.replaceState(null, '', u);
      currentPage = 0;
      filterArticles();
    });

    prevBtn.addEventListener('click', function() {
      if (currentPage > 0) { currentPage--; filterArticles(); window.scrollTo({ top: articlesGrid.offsetTop - 100, behavior: 'smooth' }); }
    });

    nextBtn.addEventListener('click', function() {
      currentPage++; filterArticles(); window.scrollTo({ top: articlesGrid.offsetTop - 100, behavior: 'smooth' });
    });

    // Initial filter
    filterArticles();
  }

  // ==========================================================================
  // Special Section Carousels (dot navigation)
  // ==========================================================================
  document.querySelectorAll('[data-carousel-dots]').forEach(function(dotsContainer) {
    var carouselName = dotsContainer.getAttribute('data-carousel-dots');
    var grid = document.querySelector('[data-carousel="' + carouselName + '"]');
    if (!grid) return;

    var items = grid.querySelectorAll('[data-carousel-item]');
    var perPage = 3;
    var totalPages = Math.ceil(items.length / perPage);
    if (totalPages < 1) return;

    var currentPage = 0;

    function renderDots() {
      dotsContainer.innerHTML = '';
      for (var i = 0; i < totalPages; i++) {
        var dot = document.createElement('button');
        dot.className = 'special-carousel__dot' + (i === currentPage ? ' special-carousel__dot--active' : '');
        dot.setAttribute('aria-label', 'Go to page ' + (i + 1));
        dot.addEventListener('click', (function(p) { return function() { goTo(p); }; })(i));
        dotsContainer.appendChild(dot);
      }
    }

    function goTo(page) {
      var start = page * perPage;
      // Fade-out
      grid.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      grid.style.opacity = '0';
      grid.style.transform = 'translateX(-20px)';
      setTimeout(function() {
        items.forEach(function(item, idx) {
          item.style.display = (idx >= start && idx < start + perPage) ? '' : 'none';
        });
        // Reset position off-screen right, then animate in
        grid.style.transition = 'none';
        grid.style.transform = 'translateX(20px)';
        // Force reflow
        void grid.offsetWidth;
        grid.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        grid.style.opacity = '1';
        grid.style.transform = 'translateX(0)';
      }, 300);
      currentPage = page;
      renderDots();
    }

    goTo(0);
  });
})();
