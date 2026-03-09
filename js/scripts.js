/* ==========================================================================
   iVvy Complete Website - Static JavaScript
   ========================================================================== */

// ==========================================================================
// Load Header and Footer Partials
// Note: This requires the site to be served via HTTP (not file://)
// For local development, use a local server like: npx serve static-site
// ==========================================================================
// Detect path prefix for subdirectory pages (e.g., integrations/, customers/)
function getPathPrefix() {
  var path = window.location.pathname;
  // Count how many directory levels deep we are from root
  // e.g., /integrations/xero.html → 1 level deep → prefix "../"
  // e.g., /customers/tfe.html → 1 level deep → prefix "../"
  // e.g., /index.html → 0 levels → prefix ""
  var segments = path.replace(/^\//, '').split('/');
  // segments for /integrations/xero.html → ["integrations", "xero.html"]
  var depth = segments.length - 1; // subtract the filename
  if (depth <= 0) return '';
  var prefix = '';
  for (var i = 0; i < depth; i++) prefix += '../';
  return prefix;
}

// Rewrite internal links in injected HTML to use correct relative paths
function rewritePartialLinks(html, prefix) {
  if (!prefix) return html;
  // Rewrite href="somepage.html" (not href="http", href="https", href="#", href="mailto:", href="/")
  html = html.replace(/(href|src)="(?!https?:\/\/|mailto:|tel:|#|\/\/)([^"]+)"/g, function(match, attr, url) {
    // Don't prefix if already has ../
    if (url.startsWith('../') || url.startsWith('./')) return match;
    return attr + '="' + prefix + url + '"';
  });
  return html;
}

function loadPartials() {
  const headerPlaceholder = document.getElementById('header-placeholder');
  const footerPlaceholder = document.getElementById('footer-placeholder');
  
  // If no placeholders, partials are already inline - just return resolved promise
  if (!headerPlaceholder && !footerPlaceholder) {
    return Promise.resolve();
  }
  
  const prefix = getPathPrefix();
  const promises = [];
  
  if (headerPlaceholder) {
    promises.push(
      fetch(prefix + 'partials/header.html')
        .then(response => {
          if (!response.ok) throw new Error('Failed to load header');
          return response.text();
        })
        .then(html => {
          headerPlaceholder.outerHTML = rewritePartialLinks(html, prefix);
        })
        .catch(err => {
          console.error('Error loading header:', err);
          headerPlaceholder.innerHTML = createFallbackHeader(prefix);
        })
    );
  }
  
  if (footerPlaceholder) {
    promises.push(
      fetch(prefix + 'partials/footer.html')
        .then(response => {
          if (!response.ok) throw new Error('Failed to load footer');
          return response.text();
        })
        .then(html => {
          footerPlaceholder.outerHTML = rewritePartialLinks(html, prefix);
        })
        .catch(err => {
          console.error('Error loading footer:', err);
          footerPlaceholder.innerHTML = createFallbackFooter(prefix);
        })
    );
  }
  
  return Promise.all(promises);
}

// Fallback header for when fetch fails (file:// protocol)
function createFallbackHeader(prefix) {
  prefix = prefix || '';
  return `
    <header class="header">
      <div class="container">
        <div class="header__inner">
          <a href="${prefix}index.html" class="header__logo">
            <img src="${prefix}images/ivvy-logo.svg" alt="iVvy" width="100" height="32">
          </a>
          <nav class="nav">
            <div class="nav__item"><a href="${prefix}index.html" class="nav__link">Home</a></div>
            <div class="nav__item"><a href="${prefix}event-management.html" class="nav__link">Products</a></div>
            <div class="nav__item"><a href="${prefix}customers.html" class="nav__link">Customers</a></div>
            <div class="nav__item"><a href="${prefix}about.html" class="nav__link">About</a></div>
          </nav>
          <div class="header__cta">
            <div class="login-dropdown">
              <button class="header__login login-dropdown__trigger">Login <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>
              <div class="login-dropdown__menu">
                <div class="login-dropdown__menu-inner">
                  <a href="https://www.ivvy.com.au/accounts/login" target="_blank" class="login-dropdown__item">Login (AU)</a>
                  <a href="https://www.ivvy.co.uk/accounts/login" target="_blank" class="login-dropdown__item">Login (EU)</a>
                  <a href="https://www.ivvy.com/accounts/login" target="_blank" class="login-dropdown__item">Login (US)</a>
                </div>
              </div>
            </div>
            <a href="${prefix}request-demo.html" class="btn btn--primary">Request Demo</a>
          </div>
        </div>
      </div>
    </header>
  `;
}

// Fallback footer for when fetch fails
function createFallbackFooter(prefix) {
  prefix = prefix || '';
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer__bottom">
          <p class="footer__copyright">© 2026 iVvy. All rights reserved.</p>
          <div class="footer__legal">
            <a href="${prefix}pdfs/POL-IT-Privacy-2025-09-25.pdf" target="_blank" class="footer__legal-link">Privacy</a>
            <a href="${prefix}credit-terms.html" class="footer__legal-link">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

// ==========================================================================
// SEO: Inject JSON-LD, Twitter Cards, and Canonical Tags
// ==========================================================================
function injectSEOEnhancements() {
  var head = document.head;
  var title = document.title || 'iVvy';
  var descMeta = document.querySelector('meta[name="description"]');
  var description = descMeta ? descMeta.getAttribute('content') : '';
  var url = window.location.href;
  var origin = window.location.origin;

  // JSON-LD Organization + WebSite schema (on every page)
  var jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': origin + '/#organization',
        'name': 'iVvy',
        'url': origin,
        'logo': origin + '/images/ivvy-logo.svg',
        'sameAs': [
          'https://www.linkedin.com/company/ivvy/',
          'https://twitter.com/ivvy',
          'https://www.facebook.com/ivvyevents/',
          'https://www.youtube.com/@ivaborevents'
        ]
      },
      {
        '@type': 'WebSite',
        '@id': origin + '/#website',
        'name': 'iVvy',
        'url': origin,
        'publisher': { '@id': origin + '/#organization' }
      },
      {
        '@type': 'WebPage',
        'name': title,
        'description': description,
        'url': url,
        'isPartOf': { '@id': origin + '/#website' }
      }
    ]
  };

  // Add BreadcrumbList for subpages
  var path = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '');
  if (path && path !== 'index') {
    var segments = path.split('/');
    var breadcrumbs = [{ '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': origin + '/index.html' }];
    if (segments.length === 2) {
      // e.g., integrations/xero
      var hubName = segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
      breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': hubName, 'item': origin + '/' + segments[0] + '.html' });
      breadcrumbs.push({ '@type': 'ListItem', 'position': 3, 'name': title.split(' | ')[0] || title });
    } else {
      breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': title.split(' | ')[0] || title });
    }
    jsonLd['@graph'].push({
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs
    });
  }

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(jsonLd);
  head.appendChild(script);

  // Twitter Card meta tags (only if not already present)
  if (!document.querySelector('meta[name="twitter:card"]')) {
    var twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@ivvy' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description }
    ];
    twitterTags.forEach(function(tag) {
      var meta = document.createElement('meta');
      meta.setAttribute('name', tag.name);
      meta.setAttribute('content', tag.content);
      head.appendChild(meta);
    });
  }

  // Canonical tag - ensure absolute URL using current origin
  var existingCanonical = document.querySelector('link[rel="canonical"]');
  if (existingCanonical) {
    var href = existingCanonical.getAttribute('href');
    if (href && !href.startsWith('http')) {
      existingCanonical.href = origin + (href.startsWith('/') ? '' : '/') + href;
    }
  } else {
    var canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = url.split('?')[0].split('#')[0];
    head.appendChild(canonical);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  
  // Inject SEO enhancements immediately
  injectSEOEnhancements();
  
  // Load partials first, then initialize other scripts
  loadPartials().then(function() {
    initMobileMenu();
    initHeaderScrollEffect();
  });



  // ==========================================================================
  // Mobile Menu Toggle
  // ==========================================================================
  function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuIcon = document.querySelector('.icon-menu');
    const closeIcon = document.querySelector('.icon-close');
    
    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', function() {
        mobileMenu.classList.toggle('active');
        if (menuIcon && closeIcon) {
          menuIcon.style.display = mobileMenu.classList.contains('active') ? 'none' : 'block';
          closeIcon.style.display = mobileMenu.classList.contains('active') ? 'block' : 'none';
        }
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
      });
    }
    
    // Mobile submenu toggle
    const mobileMenuItems = document.querySelectorAll('.mobile-menu__item');
    mobileMenuItems.forEach(function(item) {
      const link = item.querySelector('.mobile-menu__link');
      if (link && item.querySelector('.mobile-menu__submenu')) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          item.classList.toggle('active');
        });
      }
    });
    
    // Login dropdown - mobile uses click toggle, desktop uses hover (handled via CSS)
    document.querySelectorAll('.login-dropdown--mobile .login-dropdown__trigger').forEach(function(trigger) {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var dropdown = trigger.closest('.login-dropdown');
        document.querySelectorAll('.login-dropdown.open').forEach(function(d) {
          if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
      });
    });
    
    // Close mobile login dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.login-dropdown')) {
        document.querySelectorAll('.login-dropdown.open').forEach(function(d) {
          d.classList.remove('open');
        });
      }
    });
  }
  
  // ==========================================================================
  // Header Scroll Effect
  // ==========================================================================
  function initHeaderScrollEffect() {
    const header = document.querySelector('.header');
    
    if (header) {
      window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 10) {
          header.classList.add('header--scrolled');
        } else {
          header.classList.remove('header--scrolled');
        }
      }, { passive: true });
    }
  }
  
  // (Duplicate mobile menu code removed – handled by initMobileMenu above)
  
  // ==========================================================================
  // Hero Rotating Words (above the fold – run immediately)
  // ==========================================================================
  const rotatingWords = ['increase conversions', 'make decisions', 'get more done, faster'];
  let currentWordIndex = 0;
  const rotatingTextEl = document.querySelector('.hero__title-highlight');
  
  if (rotatingTextEl) {
    setInterval(function() {
      rotatingTextEl.style.opacity = '0';
      rotatingTextEl.style.transform = 'translateY(10px)';
      
      setTimeout(function() {
        currentWordIndex = (currentWordIndex + 1) % rotatingWords.length;
        rotatingTextEl.textContent = rotatingWords[currentWordIndex];
        rotatingTextEl.style.opacity = '1';
        rotatingTextEl.style.transform = 'translateY(0)';
      }, 300);
    }, 3000);
  }
  
  // ==========================================================================
  // Parallax Effect for Hero (above the fold – run immediately)
  // ==========================================================================
  const heroImage = document.querySelector('.hero__bg-image');
  
  if (heroImage) {
    window.addEventListener('scroll', function() {
      const scrolled = window.pageYOffset;
      heroImage.style.transform = 'translateY(' + (scrolled * 0.3) + 'px)';
    }, { passive: true });
  }

  // ==========================================================================
  // Defer all non-critical JS to idle time
  // ==========================================================================
  var deferInit = function() {
    // Animated Counter
    function animateCounter(element, target, duration) {
      let start = 0;
      const increment = target / (duration / 16);
      function updateCounter() {
        start += increment;
        if (start < target) {
          element.textContent = Math.floor(start);
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target;
        }
      }
      updateCounter();
    }
    
    var counters = document.querySelectorAll('[data-counter]');
    if (counters.length > 0) {
      var counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var target = parseInt(entry.target.dataset.counter, 10);
            animateCounter(entry.target, target, 2000);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function(counter) { counterObserver.observe(counter); });
    }
    
    // Scroll Animations
    var animateOnScroll = document.querySelectorAll('.animate-on-scroll');
    if (animateOnScroll.length > 0) {
      var scrollObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
            scrollObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      animateOnScroll.forEach(function(el) {
        el.style.opacity = '0';
        scrollObserver.observe(el);
      });
    }
    
    // Integration Category Filter
    var categoryBtns = document.querySelectorAll('.category-btn');
    var integrationCards = document.querySelectorAll('.integration-card');
    if (categoryBtns.length > 0 && integrationCards.length > 0) {
      categoryBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          categoryBtns.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var category = btn.dataset.category;
          integrationCards.forEach(function(card) {
            card.style.display = (category === 'all' || card.dataset.categories.includes(category)) ? 'flex' : 'none';
          });
        });
      });
    }
    
    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    
    // Form Validation
    document.querySelectorAll('form').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        var isValid = true;
        form.querySelectorAll('[required]').forEach(function(field) {
          if (!field.value.trim()) { isValid = false; field.style.borderColor = '#ef4444'; }
          else { field.style.borderColor = ''; }
        });
        form.querySelectorAll('input[type="email"]').forEach(function(field) {
          if (field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
            isValid = false; field.style.borderColor = '#ef4444';
          }
        });
        if (!isValid) e.preventDefault();
      });
    });
    
    // Trust Logos - Pause on Hover
    var trustLogosTrack = document.querySelector('.trust-logos__track');
    if (trustLogosTrack) {
      trustLogosTrack.addEventListener('mouseenter', function() { trustLogosTrack.style.animationPlayState = 'paused'; });
      trustLogosTrack.addEventListener('mouseleave', function() { trustLogosTrack.style.animationPlayState = 'running'; });
    }
    
    // Venue Card Slider Navigation
    var venueSlider = document.querySelector('.venue-types__slider');
    var prevBtn = document.querySelector('.venue-slider__prev');
    var nextBtn = document.querySelector('.venue-slider__next');
    if (venueSlider && prevBtn && nextBtn) {
      var cardWidth = 374;
      prevBtn.addEventListener('click', function() { venueSlider.scrollBy({ left: -cardWidth, behavior: 'smooth' }); });
      nextBtn.addEventListener('click', function() { venueSlider.scrollBy({ left: cardWidth, behavior: 'smooth' }); });
    }
    
    // Testimonial Slider
    var testimonialSlides = document.querySelectorAll('.testimonial__slide');
    var testimonialDots = document.querySelectorAll('.testimonial__dot');
    var testimonialPrev = document.querySelector('.testimonial__prev');
    var testimonialNext = document.querySelector('.testimonial__next');
    if (testimonialSlides.length > 0) {
      var currentTestimonial = 0;
      var testimonialInterval;
      function showTestimonial(index) {
        testimonialSlides.forEach(function(s) { s.classList.remove('testimonial__slide--active'); });
        testimonialDots.forEach(function(d) { d.classList.remove('testimonial__dot--active'); });
        testimonialSlides[index].classList.add('testimonial__slide--active');
        if (testimonialDots[index]) testimonialDots[index].classList.add('testimonial__dot--active');
        currentTestimonial = index;
        clearInterval(testimonialInterval);
        testimonialInterval = setInterval(function() {
          showTestimonial((currentTestimonial + 1) % testimonialSlides.length);
        }, 6000);
      }
      if (testimonialPrev) testimonialPrev.addEventListener('click', function() {
        showTestimonial((currentTestimonial - 1 + testimonialSlides.length) % testimonialSlides.length);
      });
      if (testimonialNext) testimonialNext.addEventListener('click', function() {
        showTestimonial((currentTestimonial + 1) % testimonialSlides.length);
      });
      testimonialDots.forEach(function(dot) {
        dot.addEventListener('click', function() { showTestimonial(parseInt(this.dataset.index)); });
      });
      testimonialInterval = setInterval(function() {
        showTestimonial((currentTestimonial + 1) % testimonialSlides.length);
      }, 6000);
    }
  };

  // Use requestIdleCallback to defer non-critical JS, falling back to setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(deferInit);
  } else {
    setTimeout(deferInit, 200);
  }
  // Lite YouTube - click to load iframe
  document.querySelectorAll('.lite-youtube').forEach(function(el) {
    el.addEventListener('click', function() {
      var videoId = el.getAttribute('data-videoid');
      var title = el.getAttribute('data-title') || 'Video';
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&modestbranding=1&rel=0&showinfo=0';
      iframe.title = title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      el.innerHTML = '';
      el.appendChild(iframe);
    });
  });

  console.log('iVvy Static Site Scripts Loaded');
});
