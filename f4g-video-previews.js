/* =========================================================================
   FARM4GLASS — LANDING PAGE VIDEO PREVIEWS
   Self-contained. Builds its own section, injects its own CSS.
   No changes needed in index.html except the script tag, and no changes
   at all to style.css.

   INSTALL
   -------
   Add this line before </body> in index.html:

       <script src="f4g-video-previews.js"></script>

   The section inserts itself into #landingPage just above the Features
   bento, so it sits between the scrolling marquee and "Everything you
   need, in one barn."

   EDIT THE VIDEOS
   ---------------
   Only the CONFIG block below. `id` is the YouTube video ID — for
   youtube.com/watch?v=AbC123xyz the id is AbC123xyz. Thumbnails are
   pulled from YouTube automatically, so there is nothing to upload.
   Nothing plays until a visitor clicks a card.

   MOVE THE SECTION
   ----------------
   Change INSERT_BEFORE to any selector inside #landingPage. Some options:
     '#features'  (default — after the marquee)
     '#about'     (after the Features bento)
     '#story'     (after the About panel)
   ========================================================================= */

(function () {
  'use strict';

  /* ---------------- CONFIG ---------------- */

  var INSERT_BEFORE = '#features';

  var TAG     = 'Watch a lesson';
  var HEADING = 'See how we teach,<br>before you sign up.';
  var LEDE    = 'A few lessons straight out of the courses. No account needed to watch.';

  var VIDEOS = [
    {
      id: 'euQy6Z422bs',
      title: 'Unit 12: Marketing',
      course: 'Marketing Cluster Exam',
      length: '3 min'
    },
    {
      id: 'BNhKDelvgsg',
      title: 'Corporate Challenges',
      course: 'Corporate Challenges',
      length: '4 min'
    },
    {
      id: '6sAJrMWJOik',
      title: 'Guest Speaker Video',
      course: 'Principles of Business Management Events',
      length: '6 min'
    }
  ];

  /* ---------------- STYLES ---------------- */

  var CSS = [
    '#videoPreviews { padding: 0 6% 110px; max-width: 1280px; margin: 0 auto; background: transparent; }',
    '#videoPreviews .f4gv-lede { color: #3d5f80; font-size: 17px; line-height: 1.7; max-width: 620px; margin: 14px auto 0; }',

    '.f4gv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; max-width: 1180px; margin: 0 auto; }',

    '.f4gv-card { position: relative; overflow: hidden; display: block; width: 100%; padding: 0; text-align: left;',
    '  background: rgba(255,255,255,.85); backdrop-filter: blur(12px);',
    '  border: 1px solid rgba(255,255,255,.9); border-radius: 26px;',
    '  box-shadow: 0 16px 44px rgba(15,95,140,.13); cursor: pointer; font-family: inherit;',
    '  transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s, background .3s; }',
    '.f4gv-card:hover { transform: translateY(-8px); box-shadow: 0 30px 70px rgba(15,95,140,.24); background: rgba(255,255,255,.96); }',
    '.f4gv-card:focus-visible { outline: 3px solid var(--blue, #167db5); outline-offset: 3px; }',
    '.f4gv-card::before { content: ""; position: absolute; left: 0; top: 0; height: 4px; width: 0; z-index: 3;',
    '  background: linear-gradient(90deg, var(--blue, #167db5), var(--blue-light, #38bdf8));',
    '  transition: width .45s cubic-bezier(.2,.8,.2,1); }',
    '.f4gv-card:hover::before { width: 100%; }',

    '.f4gv-thumb { position: relative; display: block; aspect-ratio: 16 / 9;',
    '  background: #0a1a2b center / cover no-repeat; }',
    '.f4gv-play { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);',
    '  width: 58px; height: 58px; border-radius: 50%; background: rgba(255,255,255,.94);',
    '  display: grid; place-items: center; box-shadow: 0 12px 28px rgba(10,26,43,.4);',
    '  transition: transform .25s cubic-bezier(.2,.8,.2,1); }',
    '.f4gv-card:hover .f4gv-play { transform: translate(-50%,-50%) scale(1.09); }',
    '.f4gv-play svg { margin-left: 3px; }',
    '.f4gv-len { position: absolute; right: 12px; bottom: 12px; background: rgba(10,26,43,.86);',
    '  color: #fff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }',

    '.f4gv-meta { display: block; padding: 26px 28px 28px; }',
    '.f4gv-course { display: block; font-size: 13px; font-weight: 900; letter-spacing: .1em;',
    '  text-transform: uppercase; color: var(--blue, #167db5); margin-bottom: 10px; }',
    '.f4gv-title { display: block; font-size: 20px; font-weight: 800; line-height: 1.3;',
    '  letter-spacing: -.02em; color: #0a1a2b; }',

    '.f4gv-foot { text-align: center; margin-top: 34px; }',

    '.f4gv-modal { position: fixed; inset: 0; z-index: 9500; display: grid; place-items: center;',
    '  padding: 22px; background: rgba(10,26,43,.86); backdrop-filter: blur(6px);',
    '  opacity: 0; transition: opacity .22s ease; }',
    '.f4gv-modal.on { opacity: 1; }',
    '.f4gv-frame { width: min(1000px, 100%); aspect-ratio: 16 / 9; border-radius: 22px;',
    '  overflow: hidden; background: #000; box-shadow: 0 30px 80px rgba(0,0,0,.5); }',
    '.f4gv-frame iframe { width: 100%; height: 100%; border: 0; display: block; }',
    '.f4gv-close { position: absolute; top: 20px; right: 22px; background: rgba(255,255,255,.16);',
    '  color: #fff; border: none; border-radius: 999px; font-family: inherit; font-size: 14px;',
    '  font-weight: 700; padding: 11px 22px; cursor: pointer; transition: background .16s ease; }',
    '.f4gv-close:hover { background: rgba(255,255,255,.3); }',

    '@media (max-width: 900px) { .f4gv-grid { grid-template-columns: 1fr; } }',
    '@media (max-width: 700px) {',
    '  #videoPreviews { padding-left: 20px; padding-right: 20px; padding-bottom: 68px; }',
    '  #videoPreviews .f4gv-lede { font-size: 16px; }',
    '  .f4gv-card { border-radius: 20px; }',
    '  .f4gv-meta { padding: 22px 24px 24px; }',
    '  .f4gv-title { font-size: 18px; }',
    '  .f4gv-frame { border-radius: 16px; }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  .f4gv-card, .f4gv-play, .f4gv-modal, .f4gv-card::before { transition: none; }',
    '}'
  ].join('\n');

  var PLAY_SVG =
    '<svg width="21" height="23" viewBox="0 0 20 22" aria-hidden="true">' +
    '<path d="M0 1.6C0 .4 1.3-.3 2.3.3l16.4 9.4c1 .6 1 2 0 2.6L2.3 21.7c-1 .6-2.3-.1-2.3-1.3V1.6z" ' +
    'fill="#167db5"/></svg>';

  /* ---------------- BUILD ---------------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function build() {
    var landing = document.getElementById('landingPage');
    if (!landing || document.getElementById('videoPreviews')) return;

    var style = document.createElement('style');
    style.id = 'f4gv-css';
    style.textContent = CSS;
    document.head.appendChild(style);

    var cards = VIDEOS.map(function (v) {
      return '<button class="f4gv-card" data-vid="' + esc(v.id) + '" ' +
        'aria-label="Play video: ' + esc(v.title) + '">' +
        '<span class="f4gv-thumb" style="background-image:url(https://i.ytimg.com/vi/' +
        encodeURIComponent(v.id) + '/hqdefault.jpg)">' +
        '<span class="f4gv-play">' + PLAY_SVG + '</span>' +
        (v.length ? '<span class="f4gv-len">' + esc(v.length) + '</span>' : '') +
        '</span>' +
        '<span class="f4gv-meta">' +
        (v.course ? '<span class="f4gv-course">' + esc(v.course) + '</span>' : '') +
        '<span class="f4gv-title">' + esc(v.title) + '</span>' +
        '</span></button>';
    }).join('');

    var section = document.createElement('section');
    section.id = 'videoPreviews';
    section.className = 'reveal';
    section.innerHTML =
      '<div class="section-head center">' +
      '<div class="section-tag">' + esc(TAG) + '</div>' +
      '<h2>' + HEADING + '</h2>' +
      '<p class="f4gv-lede">' + esc(LEDE) + '</p>' +
      '</div>' +
      '<div class="f4gv-grid">' + cards + '</div>' +
      '<div class="f4gv-foot">' +
      '<button class="btn-primary" id="f4gvCta">Get Started Free &rarr;</button>' +
      '</div>';

    var anchor = landing.querySelector(INSERT_BEFORE);
    if (anchor && anchor.parentNode === landing) landing.insertBefore(section, anchor);
    else landing.appendChild(section);

    // The inline reveal observer in index.html has already run by now, so
    // this section gets its own.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      io.observe(section);
    } else {
      section.classList.add('in');
    }

    section.addEventListener('click', function (e) {
      var c = e.target.closest('.f4gv-card');
      if (c) { open(c.getAttribute('data-vid')); return; }
      if (e.target.closest('#f4gvCta')) {
        var login = document.getElementById('landingLogin');
        if (login) login.click();
      }
    });
  }

  /* ---------------- LIGHTBOX ---------------- */

  var modal = null;

  function open(id) {
    if (modal) close();
    modal = document.createElement('div');
    modal.className = 'f4gv-modal';
    modal.innerHTML =
      '<button class="f4gv-close">Close</button>' +
      '<div class="f4gv-frame"><iframe src="https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(id) + '?autoplay=1&rel=0" title="Farm4Glass lesson preview" ' +
      'allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { modal.classList.add('on'); });

    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.classList.contains('f4gv-close')) close();
    });
    document.addEventListener('keydown', onKey);
    modal.querySelector('.f4gv-close').focus();
  }

  function onKey(e) { if (e.key === 'Escape') close(); }

  function close() {
    if (!modal) return;
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = '';
    var m = modal;
    modal = null;
    m.classList.remove('on');
    setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 220);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
