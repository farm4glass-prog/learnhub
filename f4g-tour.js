/* =========================================================================
   FARM4GLASS — FIRST-LOGIN TOUR
   Self-contained. Injects its own CSS. No changes to style.css, and one
   script tag in index.html.

   INSTALL
   -------
   Add this line before </body> in index.html, AFTER script.js:

       <script src="f4g-tour.js"></script>

   It starts itself: it watches #portal, and the first time a student
   lands in the portal it runs the tour. It runs once per person and then
   never again unless they replay it.

   OPTIONAL — tie it to the Firebase uid instead of the email on screen.
   Anywhere in script.js after sign-in:

       F4GTour.maybeStart(user.uid);

   Calling that disables the auto-start for the session, so there is no
   chance of it firing twice.

   OTHER CONTROLS
   --------------
       F4GTour.start();              // replay now (e.g. a Profile button)
       F4GTour.reset();              // clear the "seen" flag, for testing
       F4GTour.hasSeen();            // true / false

   HOW IT ANCHORS
   --------------
   Each step points at your existing sidebar buttons by id (#nav-dashboard,
   #nav-courses, and so on), with a text match as backup. On phones the
   sidebar is off-canvas, so steps show as centred cards instead — the copy
   still walks through everything in order.
   ========================================================================= */

(function () {
  'use strict';

  var KEY_PREFIX = 'f4g_tour_v1_';
  var MOBILE_MAX = 768;       // matches the portal's sidebar breakpoint
  var manualMode = false;     // set true once maybeStart/start is called by hand

  /* ---------------- Steps ---------------- */

  var STEPS = [
    {
      welcome: true,
      title: 'Welcome to the barn',
      body: 'Here is a quick walk through everything on Farm4Glass. It takes about thirty seconds, and you can leave whenever you like.'
    },
    {
      title: 'Dashboard',
      body: 'Pick up where you left off. Your streak, your badges, your total XP, and the animal you are working towards all live here.',
      sel: ['#nav-dashboard'],
      text: ['dashboard']
    },
    {
      title: 'Courses',
      body: 'Every course on Farm4Glass. Open a unit to switch between the video, the practice questions and the article.',
      sel: ['#nav-courses'],
      text: ['courses']
    },
    {
      title: 'Leaderboard',
      body: 'See who is at the top on XP, streaks and lessons, and how your chapter is doing.',
      sel: ['#nav-leaderboard'],
      text: ['leaderboard']
    },
    {
      title: 'Profile',
      body: 'Set your events, your association and your chapter. If your chapter or association partners with us, enter your partnership code here to unlock the extra features.',
      sel: ['#nav-profile'],
      text: ['profile']
    },
    {
      title: 'Study Planner',
      body: 'Tell it what you are studying for and when your conference is. It builds the plan around your events and the time you actually have.',
      sel: ['#nav-planner'],
      text: ['study planner', 'planner']
    },
    {
      title: 'Practice Roleplays',
      body: 'Roleplay prompts sorted by instructional area for your event. Work through them out loud and on the clock.',
      sel: ['#nav-roleplays'],
      text: ['practice roleplays', 'roleplays']
    },
    {
      title: 'Analytics',
      body: 'How your DECA prep is going, unit by unit, plus the areas worth putting your next hour into.',
      sel: ['#nav-analytics'],
      text: ['analytics']
    },
    {
      title: 'Calendar',
      body: 'Your association calendar alongside the DECA Inc. dates and deadlines.',
      sel: ['#nav-calendar'],
      text: ['calendar']
    },
    {
      title: 'Blog',
      body: 'Articles, updates and tips from the Farm4Glass team.',
      sel: ['#nav-blog'],
      text: ['blog']
    },
    {
      finish: true,
      title: 'That is the tour',
      body: 'Start on the Dashboard, or head straight into Courses. Set your events on your Profile first and the Study Planner will have everything it needs.'
    }
  ];

  /* ---------------- Styles ---------------- */

  var CSS = [
    '.f4gt-root { position: fixed; inset: 0; z-index: 9600; font-family: inherit; }',
    '.f4gt-scrim { position: fixed; inset: 0; background: rgba(10,26,43,.62);',
    '  opacity: 0; transition: opacity .24s ease; }',
    '.f4gt-root.is-on .f4gt-scrim { opacity: 1; }',

    '.f4gt-spot { position: fixed; border-radius: 999px; pointer-events: none;',
    '  box-shadow: 0 0 0 9999px rgba(10,26,43,.62);',
    '  outline: 2.5px solid var(--blue-light, #38bdf8); outline-offset: 3px;',
    '  transition: top .28s cubic-bezier(.2,.8,.2,1), left .28s cubic-bezier(.2,.8,.2,1),',
    '    width .28s cubic-bezier(.2,.8,.2,1), height .28s cubic-bezier(.2,.8,.2,1); }',

    '.f4gt-card { position: fixed; width: min(350px, calc(100vw - 32px));',
    '  background: rgba(255,255,255,.97); backdrop-filter: blur(12px);',
    '  color: #0a1a2b; border: 1px solid rgba(255,255,255,.95); border-radius: 24px;',
    '  padding: 26px 26px 20px; box-shadow: 0 26px 64px rgba(10,26,43,.34);',
    '  opacity: 0; transform: translateY(8px); transition: opacity .2s ease, transform .2s ease; }',
    '.f4gt-root.is-on .f4gt-card { opacity: 1; transform: none; }',
    '.f4gt-card.is-center { top: 50%; left: 50%; transform: translate(-50%, -50%);',
    '  width: min(420px, calc(100vw - 32px)); }',
    '.f4gt-root.is-on .f4gt-card.is-center { transform: translate(-50%, -50%); }',

    '.f4gt-count { font-size: 11.5px; font-weight: 800; letter-spacing: .1em;',
    '  text-transform: uppercase; color: var(--blue, #167db5); margin: 0 0 8px; }',
    '.f4gt-title { font-family: inherit; font-size: 22px; font-weight: 900;',
    '  letter-spacing: -.025em; line-height: 1.15; margin: 0 0 10px; color: #0a1a2b; }',
    '.f4gt-body { font-size: 14.5px; line-height: 1.65; margin: 0 0 20px; color: #3d5f80; }',

    '.f4gt-bar { display: flex; align-items: center; gap: 8px; }',
    '.f4gt-dots { display: flex; gap: 5px; margin-right: auto; }',
    '.f4gt-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(15,95,140,.22); }',
    '.f4gt-dot.on { background: var(--blue, #167db5); }',

    '.f4gt-btn { font-family: inherit; font-size: 13.5px; font-weight: 700;',
    '  border: none; border-radius: 999px; padding: 11px 22px; cursor: pointer;',
    '  transition: transform .14s cubic-bezier(.2,.8,.2,1), background .2s, color .2s, box-shadow .2s; }',
    '.f4gt-btn:focus-visible { outline: 2.5px solid var(--blue, #167db5); outline-offset: 2px; }',
    '.f4gt-btn:active { transform: translateY(1px) scale(.985); }',
    '.f4gt-next { background: linear-gradient(135deg, #167db5, #0f5f8c); color: #fff;',
    '  box-shadow: 0 12px 26px rgba(15,95,140,.3); }',
    '.f4gt-next:hover { background: linear-gradient(135deg, #1f92cf, #12699a); }',
    '.f4gt-back { background: rgba(15,95,140,.08); color: #3d5f80; }',
    '.f4gt-back:hover { background: rgba(15,95,140,.15); }',
    '.f4gt-skip { position: absolute; top: 14px; right: 14px; background: transparent;',
    '  color: #7f9ab4; font-size: 12.5px; font-weight: 700; padding: 7px 10px; }',
    '.f4gt-skip:hover { color: #0a1a2b; }',

    '@media (max-width: ' + MOBILE_MAX + 'px) {',
    '  .f4gt-spot { display: none !important; }',
    '  .f4gt-card { left: 16px !important; right: 16px; width: auto; }',
    '  .f4gt-card.is-center { left: 50% !important; right: auto; }',
    '  .f4gt-title { font-size: 20px; }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  .f4gt-scrim, .f4gt-card, .f4gt-spot, .f4gt-btn { transition: none; }',
    '}'
  ].join('\n');

  /* ---------------- State ---------------- */

  var root = null, scrim = null, spot = null, card = null;
  var i = 0, target = null, lastFocus = null, currentKey = null;

  function injectCSS() {
    if (document.getElementById('f4gt-css')) return;
    var s = document.createElement('style');
    s.id = 'f4gt-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function onScreen(el) {
    var r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    if (r.right < 8 || r.left > window.innerWidth - 8) return false;  // off-canvas sidebar
    var st = getComputedStyle(el);
    return st.visibility !== 'hidden' && st.display !== 'none' && st.opacity !== '0';
  }

  function findTarget(step) {
    if (window.innerWidth <= MOBILE_MAX) return null;
    var j, el;
    if (step.sel) {
      for (j = 0; j < step.sel.length; j++) {
        el = document.querySelector(step.sel[j]);
        if (el && onScreen(el)) return el;
      }
    }
    if (step.text) {
      var cands = document.querySelectorAll('#portal .nav-btn, #portal .sidebar button');
      for (j = 0; j < cands.length; j++) {
        var t = (cands[j].textContent || '').trim().toLowerCase();
        if (!t || t.length > 28) continue;
        for (var k = 0; k < step.text.length; k++) {
          if (t === step.text[k] && onScreen(cands[j])) return cands[j];
        }
      }
    }
    return null;
  }

  function place() {
    if (!root) return;

    if (!target) {
      spot.style.display = 'none';
      card.classList.add('is-center');
      card.style.top = '';
      card.style.left = '';
      return;
    }

    var r = target.getBoundingClientRect();
    spot.style.display = 'block';
    spot.style.top = (r.top - 5) + 'px';
    spot.style.left = (r.left - 6) + 'px';
    spot.style.width = (r.width + 12) + 'px';
    spot.style.height = (r.height + 10) + 'px';

    card.classList.remove('is-center');
    var cw = card.offsetWidth || 350;
    var ch = card.offsetHeight || 210;
    var gap = 20;
    var left, top;

    if (window.innerWidth - r.right > cw + gap + 12) {
      left = r.right + gap;
      top = r.top + r.height / 2 - ch / 2;
    } else if (r.left > cw + gap + 12) {
      left = r.left - cw - gap;
      top = r.top + r.height / 2 - ch / 2;
    } else if (window.innerHeight - r.bottom > ch + gap) {
      left = r.left + r.width / 2 - cw / 2;
      top = r.bottom + gap;
    } else {
      left = r.left + r.width / 2 - cw / 2;
      top = r.top - ch - gap;
    }

    left = Math.max(14, Math.min(left, window.innerWidth - cw - 14));
    top = Math.max(14, Math.min(top, window.innerHeight - ch - 14));
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }

  function render() {
    var step = STEPS[i];
    target = findTarget(step);

    if (target && target.scrollIntoView) {
      try { target.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { }
    }

    var dots = '';
    for (var d = 0; d < STEPS.length; d++) {
      dots += '<span class="f4gt-dot' + (d === i ? ' on' : '') + '"></span>';
    }

    var isLast = i === STEPS.length - 1;
    card.innerHTML =
      '<button class="f4gt-btn f4gt-skip" data-act="skip">' +
      (isLast ? 'Close' : 'Skip tour') + '</button>' +
      (step.welcome || step.finish
        ? ''
        : '<p class="f4gt-count">Step ' + i + ' of ' + (STEPS.length - 2) + '</p>') +
      '<h3 class="f4gt-title">' + step.title + '</h3>' +
      '<p class="f4gt-body">' + step.body + '</p>' +
      '<div class="f4gt-bar"><div class="f4gt-dots">' + dots + '</div>' +
      (i > 0 ? '<button class="f4gt-btn f4gt-back" data-act="back">Back</button>' : '') +
      '<button class="f4gt-btn f4gt-next" data-act="next">' +
      (step.welcome ? 'Show me around' : isLast ? 'Start learning' : 'Next') +
      '</button></div>';

    requestAnimationFrame(place);
    var nextBtn = card.querySelector('[data-act="next"]');
    if (nextBtn) nextBtn.focus();
  }

  function onClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'skip') return end();
    if (act === 'back') { i = Math.max(0, i - 1); return render(); }
    if (i >= STEPS.length - 1) return end();
    i++;
    render();
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); end(); }
    else if (e.key === 'ArrowRight' && i < STEPS.length - 1) { i++; render(); }
    else if (e.key === 'ArrowLeft' && i > 0) { i--; render(); }
  }

  function start(key) {
    if (root) return;
    injectCSS();
    i = 0;
    currentKey = key || currentKey || 'guest';
    lastFocus = document.activeElement;

    root = document.createElement('div');
    root.className = 'f4gt-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Farm4Glass tour');

    scrim = document.createElement('div');
    scrim.className = 'f4gt-scrim';
    spot = document.createElement('div');
    spot.className = 'f4gt-spot';
    spot.style.display = 'none';
    card = document.createElement('div');
    card.className = 'f4gt-card is-center';

    root.appendChild(scrim);
    root.appendChild(spot);
    root.appendChild(card);
    document.body.appendChild(root);

    card.addEventListener('click', onClick);
    scrim.addEventListener('click', end);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);

    render();
    requestAnimationFrame(function () { root.classList.add('is-on'); });
  }

  function end() {
    if (!root) return;
    markSeen(currentKey);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place, true);
    root.classList.remove('is-on');
    var r = root;
    root = null;
    setTimeout(function () { if (r && r.parentNode) r.parentNode.removeChild(r); }, 240);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { } }
  }

  function markSeen(key) {
    try { localStorage.setItem(KEY_PREFIX + (key || 'guest'), 'done'); } catch (e) { }
  }

  function seen(key) {
    try { return !!localStorage.getItem(KEY_PREFIX + (key || 'guest')); } catch (e) { return false; }
  }

  /* ---------------- Auto-start ----------------
     Watches #portal. The moment it stops being .hidden, the student is
     signed in, so we wait for the dashboard to render and then run.
     A key is built from whatever identifies them: the Firebase uid if
     script.js exposes one, otherwise the email printed on the Profile
     tab, otherwise a shared "guest" key on this device.                */

  function autoKey() {
    try {
      if (window.currentUser && window.currentUser.uid) return window.currentUser.uid;
      if (window.user && window.user.uid) return window.user.uid;
    } catch (e) { }
    var el = document.getElementById('profileEmail');
    var t = el ? (el.textContent || '').trim() : '';
    if (t && t.indexOf('@') > 0) return t.toLowerCase();
    return 'guest';
  }

  function watchPortal() {
    var portal = document.getElementById('portal');
    if (!portal) return;

    var fired = false;
    function check() {
      if (fired || manualMode) return;
      if (portal.classList.contains('hidden')) return;
      fired = true;
      setTimeout(function () {
        if (manualMode) return;
        var key = autoKey();
        if (!seen(key)) start(key);
      }, 1400);
    }

    new MutationObserver(check).observe(portal, {
      attributes: true,
      attributeFilter: ['class']
    });
    check();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchPortal);
  } else {
    watchPortal();
  }

  /* ---------------- Public API ---------------- */

  window.F4GTour = {
    start: function (key) { manualMode = true; start(key); },
    maybeStart: function (key, delayMs) {
      manualMode = true;
      var k = key || autoKey();
      if (seen(k)) return false;
      setTimeout(function () { start(k); }, typeof delayMs === 'number' ? delayMs : 900);
      return true;
    },
    reset: function (key) {
      try { localStorage.removeItem(KEY_PREFIX + (key || autoKey())); } catch (e) { }
    },
    hasSeen: function (key) { return seen(key || autoKey()); }
  };
})();
