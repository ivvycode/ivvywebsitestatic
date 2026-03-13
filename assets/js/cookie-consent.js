/* Cookie Consent JS */
(function() {
  var STORAGE_KEY = 'ivvy_cookie_consent';
  var banner = document.getElementById('cookieConsent');
  if (!banner) return;

  var mainView = document.getElementById('cookieMain');
  var prefsView = document.getElementById('cookiePrefs');
  var analyticsCheck = document.getElementById('cookiePrefAnalytics');
  var marketingCheck = document.getElementById('cookiePrefMarketing');

  function getPrefs() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
  }

  function savePrefs(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    banner.style.display = 'none';
    if (prefs.analytics || prefs.marketing) loadGTM();
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'cookie_consent_update',
      cookie_consent_analytics: prefs.analytics,
      cookie_consent_marketing: prefs.marketing
    });
  }

  function loadGTM() {
    if (document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-TBQKMCP';
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
  }

  function showMain() {
    mainView.style.display = '';
    prefsView.style.display = 'none';
  }

  function showPrefs() {
    var p = getPrefs();
    if (p) {
      analyticsCheck.checked = p.analytics;
      marketingCheck.checked = p.marketing;
    }
    mainView.style.display = 'none';
    prefsView.style.display = '';
  }

  function acceptAll() {
    savePrefs({ essential: true, analytics: true, marketing: true });
  }

  function declineAll() {
    savePrefs({ essential: true, analytics: false, marketing: false });
  }

  // Check existing consent
  var stored = getPrefs();
  if (stored) {
    if (stored.analytics || stored.marketing) loadGTM();
  } else {
    banner.style.display = '';
  }

  // Button handlers
  document.getElementById('cookieAcceptAll').addEventListener('click', acceptAll);
  document.getElementById('cookieDeclineAll').addEventListener('click', declineAll);
  document.getElementById('cookieManage').addEventListener('click', showPrefs);
  document.getElementById('cookiePrefsAcceptAll').addEventListener('click', acceptAll);
  document.getElementById('cookieSavePrefs').addEventListener('click', function() {
    savePrefs({
      essential: true,
      analytics: analyticsCheck.checked,
      marketing: marketingCheck.checked
    });
  });
  document.getElementById('cookiePrefsCancel').addEventListener('click', function() {
    if (getPrefs()) {
      banner.style.display = 'none';
    } else {
      showMain();
    }
  });

  // Footer "Manage Cookies" button
  var openBtn = document.getElementById('openCookieSettings');
  if (openBtn) {
    openBtn.addEventListener('click', function() {
      banner.style.display = '';
      showPrefs();
    });
  }
})();
