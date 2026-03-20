(function() {
  var LOGO_SVG = '<svg viewBox="0 0 80 72" fill="none"><path d="M40 4L74 68H6L40 4Z" stroke="currentColor" stroke-width="5" fill="none"/><path d="M40 28L56 60H32L40 28Z" fill="currentColor" opacity="0.5"/></svg>';
  var overlay = null;
  var isMinimized = false;

  function detectPageType() {
    var url = window.location.href;
    var body = document.body.textContent || '';
    if (body.match(/reservation\s+(complete|confirmed)/i) || url.includes('confirmation')) return 'confirmation';
    if (url.includes('cart') || url.includes('checkout') || body.match(/review.*reservation/i)) return 'cart';
    if (document.querySelectorAll('input[name="firstName"], input[name="email"], input[type="email"]').length > 0) return 'form';
    if (document.querySelectorAll('[data-component="SiteMarker"], .campsite-button, [class*="site-card"], [class*="availability"]').length > 0) return 'grid';
    return 'unknown';
  }

  function detectAvailability() {
    var sites = document.querySelectorAll('[data-component="SiteMarker"], .campsite-button, [class*="site-card"], button[class*="site"]');
    var available = 0, total = 0;
    sites.forEach(function(site) {
      total++;
      var text = site.textContent || '';
      var isReserved = site.classList.contains('reserved') || site.classList.contains('disabled') || site.getAttribute('aria-disabled') === 'true' || text.match(/reserved|unavailable|closed/i);
      if (!isReserved) available++;
    });
    return { available: available, total: total };
  }

  function createOverlay() {
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'alphacamper-overlay';
    var dot = document.createElement('div');
    dot.className = 'ac-dot';
    overlay.appendChild(dot);
    var content = document.createElement('div');
    content.className = 'ac-content';
    overlay.appendChild(content);
    overlay.addEventListener('click', function() {
      if (isMinimized) { isMinimized = false; overlay.classList.remove('minimized'); updateOverlay(); }
    });
    document.body.appendChild(overlay);
    updateOverlay();
  }

  function updateOverlay() {
    if (!overlay || isMinimized) return;
    var content = overlay.querySelector('.ac-content');
    content.textContent = '';
    var pageType = detectPageType();

    // Header
    var header = document.createElement('div');
    header.className = 'ac-header';
    header.innerHTML = LOGO_SVG + ' Alphacamper';
    content.appendChild(header);

    // Minimize
    var minBtn = document.createElement('button');
    minBtn.className = 'ac-minimize';
    minBtn.textContent = '\u2715';
    minBtn.addEventListener('click', function(e) { e.stopPropagation(); isMinimized = true; overlay.classList.add('minimized'); });
    content.appendChild(minBtn);

    if (pageType === 'confirmation') {
      var s = document.createElement('div');
      s.className = 'ac-success';
      s.textContent = 'You got it! \uD83C\uDF89';
      content.appendChild(s);
      return;
    }

    // Step
    var stepText, infoText, showFill = false, hint = null;
    if (pageType === 'grid') {
      var avail = detectAvailability();
      stepText = 'Step 1: Pick an available site';
      infoText = avail.total > 0 ? avail.available + ' of ' + avail.total + ' sites available' : 'Scanning for available sites...';
      hint = 'Click an available site to continue';
    } else if (pageType === 'form') {
      stepText = 'Step 2: Forms ready to fill';
      infoText = 'Click below to auto-fill your details';
      showFill = true;
      hint = 'Or press Ctrl+Shift+F';
    } else if (pageType === 'cart') {
      stepText = 'Step 3: Confirm and pay';
      infoText = 'Almost there! Review your reservation and click Checkout.';
    } else {
      stepText = 'Alphacamper is ready';
      infoText = 'Navigate to a campsite page to get started';
    }

    var step = document.createElement('div');
    step.className = 'ac-step';
    step.textContent = stepText;
    content.appendChild(step);

    var info = document.createElement('div');
    info.className = 'ac-info';
    info.textContent = infoText;
    content.appendChild(info);

    if (showFill) {
      var btn = document.createElement('button');
      btn.className = 'ac-btn';
      btn.textContent = 'Fill Forms';
      btn.addEventListener('click', async function(e) {
        e.stopPropagation();
        btn.textContent = 'Filling...';
        btn.disabled = true;
        var profile = await new Promise(function(resolve) { chrome.storage.local.get('profile', function(r) { resolve(r.profile); }); });
        if (!profile || !profile.firstName) {
          var err = document.createElement('div');
          err.className = 'ac-result error';
          err.textContent = 'No profile saved. Set up your profile first.';
          content.appendChild(err);
          btn.textContent = 'Fill Forms';
          btn.disabled = false;
          return;
        }
        if (typeof fillBookingForms === 'function') {
          var result = await fillBookingForms(profile);
          var resultEl = document.createElement('div');
          resultEl.className = 'ac-result';
          resultEl.textContent = 'Filled ' + result.filled + '/' + result.total + ' fields';
          content.appendChild(resultEl);
        }
        btn.textContent = 'Fill Forms';
        btn.disabled = false;
      });
      content.appendChild(btn);
    }

    if (hint) {
      var h = document.createElement('div');
      h.className = 'ac-info';
      h.style.marginTop = '8px';
      h.style.textAlign = 'center';
      h.textContent = hint;
      content.appendChild(h);
    }
  }

  var lastUrl = window.location.href;
  var urlObserver = new MutationObserver(function() {
    if (window.location.href !== lastUrl) { lastUrl = window.location.href; setTimeout(updateOverlay, 500); }
  });
  urlObserver.observe(document.body, { childList: true, subtree: true });
  setTimeout(createOverlay, 1000);
  console.log('[Alphacamper] Overlay content script loaded');
})();
