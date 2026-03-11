/* ==========================================================================
   iVvy Static Site - Minimal JavaScript
   No partial loading needed - header/footer are baked in at build time
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {

  initMobileMenu();
  initHeaderScrollEffect();

  // ==========================================================================
  // Hero Rotating Words (homepage only)
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
  // Parallax Effect for Hero
  // ==========================================================================
  const heroImage = document.querySelector('.hero__bg-image');

  if (heroImage) {
    window.addEventListener('scroll', function() {
      const scrolled = window.pageYOffset;
      heroImage.style.transform = 'translateY(' + (scrolled * 0.3) + 'px)';
    }, { passive: true });
  }

  // ==========================================================================
  // Defer non-critical JS to idle time
  // ==========================================================================
  var deferInit = function() {
    // Animated Counter
    function animateCounter(element, target, duration) {
      let start = 0;
      const suffix = element.dataset.suffix || '';
      const prefix = element.dataset.prefix || '';
      const increment = target / (duration / 16);
      function updateCounter() {
        start += increment;
        if (start < target) {
          element.textContent = prefix + Math.floor(start) + suffix;
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = prefix + target + suffix;
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

    // Trust Logos - ensure auto-scroll runs (with JS fallback if CSS animation is unavailable)
    var trustLogoTracks = document.querySelectorAll('.trust-logos__track');
    if (trustLogoTracks.length > 0) {
      trustLogoTracks.forEach(function(track) {
        track.style.willChange = 'transform';

        var computed = window.getComputedStyle(track);
        var hasCssAnimation = computed.animationName && computed.animationName !== 'none';

        if (hasCssAnimation) {
          track.style.animationPlayState = 'running';
          track.addEventListener('mouseenter', function() { track.style.animationPlayState = 'paused'; });
          track.addEventListener('mouseleave', function() { track.style.animationPlayState = 'running'; });
          return;
        }

        var offset = 0;
        var speed = 0.35;
        var rafId = null;

        function loop() {
          var halfWidth = track.scrollWidth / 2;
          if (halfWidth <= 0) {
            rafId = requestAnimationFrame(loop);
            return;
          }

          offset -= speed;
          if (Math.abs(offset) >= halfWidth) offset = 0;
          track.style.transform = 'translateX(' + offset + 'px)';
          rafId = requestAnimationFrame(loop);
        }

        function pauseFallback() {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        }

        function resumeFallback() {
          if (!rafId) rafId = requestAnimationFrame(loop);
        }

        resumeFallback();
        track.addEventListener('mouseenter', pauseFallback);
        track.addEventListener('mouseleave', resumeFallback);
      });
    }

    // Venue Card Slider Navigation - scroll one card at a time (matches React Embla carousel)
    var venueSlider = document.querySelector('.venue-types__slider');
    var prevBtn = document.querySelector('.venue-slider__prev');
    var nextBtn = document.querySelector('.venue-slider__next');
    if (venueSlider && prevBtn && nextBtn) {
      function getCardScrollAmount() {
        var firstCard = venueSlider.querySelector('.venue-card');
        if (!firstCard) return 374;
        var style = window.getComputedStyle(venueSlider);
        var gap = parseInt(style.gap) || 24;
        return firstCard.offsetWidth + gap;
      }
      prevBtn.addEventListener('click', function() { venueSlider.scrollBy({ left: -getCardScrollAmount(), behavior: 'smooth' }); });
      nextBtn.addEventListener('click', function() { venueSlider.scrollBy({ left: getCardScrollAmount(), behavior: 'smooth' }); });
    }

    // Testimonial Slider
    var testimonialSlides = document.querySelectorAll('.testimonial__slide');
    var testimonialNavItems = document.querySelectorAll('.testimonial__nav-item');
    if (testimonialSlides.length > 0) {
      var currentTestimonial = 0;
      var testimonialInterval;
      function showTestimonial(index) {
        testimonialSlides.forEach(function(s) { s.classList.remove('testimonial__slide--active'); });
        testimonialNavItems.forEach(function(d) { d.classList.remove('testimonial__nav-item--active'); });
        testimonialSlides[index].classList.add('testimonial__slide--active');
        if (testimonialNavItems[index]) testimonialNavItems[index].classList.add('testimonial__nav-item--active');
        currentTestimonial = index;
        clearInterval(testimonialInterval);
        testimonialInterval = setInterval(function() {
          showTestimonial((currentTestimonial + 1) % testimonialSlides.length);
        }, 6000);
      }
      testimonialNavItems.forEach(function(item) {
        item.addEventListener('click', function() { showTestimonial(parseInt(this.dataset.index)); });
      });
      testimonialInterval = setInterval(function() {
        showTestimonial((currentTestimonial + 1) % testimonialSlides.length);
      }, 6000);
    }

    // Venue Page Testimonial Slider (hotels)
    var vpSlides = document.querySelectorAll('.testimonial-slide');
    var vpDots = document.querySelectorAll('.testimonial-slider__dot');
    var vpPrev = document.getElementById('sliderPrev');
    var vpNext = document.getElementById('sliderNext');
    if (vpSlides.length > 1) {
      var vpCurrent = 0;
      var vpTimer;
      function showVpSlide(idx) {
        vpSlides.forEach(function(s) { s.classList.remove('testimonial-slide--active'); });
        vpDots.forEach(function(d) { d.classList.remove('testimonial-slider__dot--active'); });
        vpSlides[idx].classList.add('testimonial-slide--active');
        if (vpDots[idx]) vpDots[idx].classList.add('testimonial-slider__dot--active');
        vpCurrent = idx;
        clearInterval(vpTimer);
        vpTimer = setInterval(function() { showVpSlide((vpCurrent + 1) % vpSlides.length); }, 6000);
      }
      if (vpPrev) vpPrev.addEventListener('click', function() { showVpSlide((vpCurrent - 1 + vpSlides.length) % vpSlides.length); });
      if (vpNext) vpNext.addEventListener('click', function() { showVpSlide((vpCurrent + 1) % vpSlides.length); });
      vpDots.forEach(function(dot) { dot.addEventListener('click', function() { showVpSlide(parseInt(this.dataset.dot)); }); });
      vpTimer = setInterval(function() { showVpSlide((vpCurrent + 1) % vpSlides.length); }, 6000);
    }
  };

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

  // Login dropdown - mobile click toggle
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
      if (window.pageYOffset > 10) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    }, { passive: true });
  }
}
