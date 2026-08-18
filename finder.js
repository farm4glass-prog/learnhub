/* ============================================================
   FIND YOUR EVENT — Farm4Glass
   Self-contained. No imports, no Firebase. Plain <script> tag.

   TO UPDATE EVENTS LATER: edit the EVENTS array below only.
   Every event name here is taken from DECA's official
   2026-2027 competitive events list (deca.org/compete).
   Roleplay + case study events only — no prepared/written
   events, no online simulations.
   ============================================================ */

(function () {
  'use strict';

  /* ---------------------------------------------------------
     1. EVENT DATABASE
     format:  'individual' | 'team'
     cluster: display label for the business area
     firstYear: true  -> only offered to first-year members
     --------------------------------------------------------- */

  var EVENTS = [
    /* --- Principles of Business Administration (first year) --- */
    { code:'PBM', name:'Principles of Business Management and Administration', format:'individual', cluster:'Business Management', firstYear:true,
      desc:'A first-year event covering core management and administration concepts, with a roleplay built on introductory business skills.' },
    { code:'PEN', name:'Principles of Entrepreneurship', format:'individual', cluster:'Entrepreneurship', firstYear:true,
      desc:'A first-year event on the basics of starting and running a business, from opportunity spotting to simple business planning.' },
    { code:'PFN', name:'Principles of Finance', format:'individual', cluster:'Finance', firstYear:true,
      desc:'A first-year event covering money management, credit, banking, and basic financial decision making.' },
    { code:'PHT', name:'Principles of Hospitality and Tourism', format:'individual', cluster:'Hospitality & Tourism', firstYear:true,
      desc:'A first-year event on hotels, restaurants, travel, and guest service fundamentals.' },
    { code:'PMK', name:'Principles of Marketing', format:'individual', cluster:'Marketing', firstYear:true,
      desc:'A first-year event covering promotion, selling, pricing, and the core marketing functions.' },

    /* --- Individual Series --- */
    { code:'ACT', name:'Accounting Applications Series', format:'individual', cluster:'Finance',
      desc:'Roleplays set in accounting: financial records, reporting, and the numbers behind business decisions.' },
    { code:'AAM', name:'Apparel and Accessories Marketing Series', format:'individual', cluster:'Marketing',
      desc:'Roleplays in the fashion and apparel industry — buying, visual merchandising, trends, and retail strategy.' },
    { code:'ASM', name:'Automotive Services Marketing Series', format:'individual', cluster:'Marketing',
      desc:'Roleplays in automotive sales and service marketing, from dealerships to repair and parts businesses.' },
    { code:'BFS', name:'Business Finance Series', format:'individual', cluster:'Finance',
      desc:'Roleplays in corporate finance: budgeting, cash flow, credit, risk, and financial analysis for a business.' },
    { code:'BSM', name:'Business Services Marketing Series', format:'individual', cluster:'Marketing',
      desc:'Roleplays marketing intangible services — consulting, tech, logistics, and other business-to-business work.' },
    { code:'ENT', name:'Entrepreneurship Series', format:'individual', cluster:'Entrepreneurship',
      desc:'Roleplays where you think like a small business owner solving real ownership problems on your own.' },
    { code:'FMS', name:'Food Marketing Series', format:'individual', cluster:'Marketing',
      desc:'Roleplays in grocery and food retail — merchandising, supplier relationships, pricing, and promotion.' },
    { code:'HLM', name:'Hotel and Lodging Management Series', format:'individual', cluster:'Hospitality & Tourism',
      desc:'Roleplays running a hotel: front desk operations, guest experience, staffing, and revenue.' },
    { code:'HRM', name:'Human Resources Management Series', format:'individual', cluster:'Business Management',
      desc:'Roleplays on hiring, training, employee relations, and workplace policy.' },
    { code:'MCS', name:'Marketing Communications Series', format:'individual', cluster:'Marketing',
      desc:'Roleplays in advertising, promotion, public relations, and brand communication.' },
    { code:'QSRM', name:'Quick Serve Restaurant Management Series', format:'individual', cluster:'Hospitality & Tourism',
      desc:'Roleplays managing fast-food and quick-service operations — speed, staffing, and consistency.' },
    { code:'RFSM', name:'Restaurant and Food Service Management Series', format:'individual', cluster:'Hospitality & Tourism',
      desc:'Roleplays managing full-service restaurants: menus, service standards, cost control, and staff.' },
    { code:'RMS', name:'Retail Merchandising Series', format:'individual', cluster:'Marketing',
      desc:'Roleplays running a retail store — merchandising, inventory, customer experience, and store promotion.' },
    { code:'SEM', name:'Sports and Entertainment Marketing Series', format:'individual', cluster:'Marketing',
      desc:'Roleplays marketing teams, athletes, venues, and entertainment properties.' },
    { code:'PFL', name:'Personal Financial Literacy', format:'individual', cluster:'Personal Finance',
      desc:'Two roleplays on personal money decisions — budgeting, saving, credit, insurance, and investing for yourself.' },

    /* --- Team Decision Making --- */
    { code:'BLTDM', name:'Business Law and Ethics Team Decision Making', format:'team', cluster:'Business Management',
      desc:'A two-person case study on legal and ethical business situations, argued out with a judge.' },
    { code:'BTDM', name:'Buying and Merchandising Team Decision Making', format:'team', cluster:'Marketing',
      desc:'A two-person case study on buying, product assortment, vendors, and merchandising strategy.' },
    { code:'ETDM', name:'Entrepreneurship Team Decision Making', format:'team', cluster:'Entrepreneurship',
      desc:'A two-person case study on launching, growing, or fixing a small business.' },
    { code:'FTDM', name:'Financial Services Team Decision Making', format:'team', cluster:'Finance',
      desc:'A two-person case study set in banking, lending, insurance, and financial services.' },
    { code:'HTDM', name:'Hospitality Services Team Decision Making', format:'team', cluster:'Hospitality & Tourism',
      desc:'A two-person case study on hotels, restaurants, and guest service operations.' },
    { code:'MTDM', name:'Marketing Management Team Decision Making', format:'team', cluster:'Marketing',
      desc:'A two-person case study on overall marketing strategy — positioning, campaigns, and growth.' },
    { code:'STDM', name:'Sports and Entertainment Marketing Team Decision Making', format:'team', cluster:'Marketing',
      desc:'A two-person case study marketing sports and entertainment properties.' },
    { code:'TTDM', name:'Travel and Tourism Team Decision Making', format:'team', cluster:'Hospitality & Tourism',
      desc:'A two-person case study on travel, tourism, destinations, and visitor experience.' }
  ];

  var BY_CODE = {};
  EVENTS.forEach(function (e) { BY_CODE[e.code] = e; });

  /* ---------------------------------------------------------
     2. QUESTIONS
     Each option carries `s` (scores) and `why` (the sentence
     used to explain the recommendation on the results page).
     `when` decides whether a question is shown at all.
     --------------------------------------------------------- */

  var QUESTIONS = [
    {
      id: 'experience',
      prompt: 'Is this your first year competing in DECA?',
      sub: 'This only affects whether Principles events show up — it will not lock you out of anything else.',
      options: [
        { id:'yes',    label:'Yes, this is my first year', desc:'I have not competed at a conference before.', s:{}, why:'this is your first year competing' },
        { id:'no',     label:'No, I have competed before', desc:'I have at least one conference behind me.', s:{}, why:'you have competed before' },
        { id:'unsure', label:"I'm not sure", desc:'Show me everything and let me decide.', s:{}, why:'you wanted to see the full range of events' }
      ]
    },

    {
      id: 'format',
      prompt: 'How would you prefer to compete?',
      options: [
        { id:'individual', label:'Individually', desc:'I want to compete on my own and be responsible for my own roleplay.', s:{}, why:'you want to compete on your own' },
        { id:'team',       label:'With a partner', desc:'I like brainstorming and solving problems with another person.', s:{}, why:'you want to compete with a partner' },
        { id:'either',     label:"I'm open to either", desc:"I'm not sure yet and want the quiz to help me decide.", s:{}, why:'you were open to either format' }
      ]
    },

    {
      id: 'lean',
      when: function (a) { return a.format === 'either'; },
      prompt: 'Which sounds more appealing?',
      options: [
        { id:'solo',  label:'Being completely responsible for my own presentation', desc:'The whole thing rises or falls on me.', s:{}, why:'you liked owning the whole presentation yourself' },
        { id:'duo',   label:'Brainstorming and solving a case with a partner', desc:'Two heads, one case study.', s:{}, why:'you liked working a case study with a partner' },
        { id:'both',  label:'I genuinely like both', desc:'Either format works for me.', s:{}, why:'you were comfortable in either format' }
      ]
    },

    {
      id: 'area',
      prompt: 'Which area of business interests you the most?',
      options: [
        { id:'marketing',    label:'Marketing & communications', desc:'Advertising, promotion, branding, social media.', s:{}, why:'you picked marketing as your strongest interest' },
        { id:'retail',       label:'Retail & merchandising', desc:'Stores, products, buying, visual merchandising.', s:{}, why:'you picked retail and merchandising as your strongest interest' },
        { id:'finance',      label:'Finance & accounting', desc:'Money, budgets, records, banking, investing.', s:{}, why:'you picked finance as your strongest interest' },
        { id:'entrepreneur', label:'Entrepreneurship', desc:'Starting, owning, and growing your own business.', s:{}, why:'you picked entrepreneurship as your strongest interest' },
        { id:'management',   label:'Business management', desc:'Running operations, leading people, law and ethics.', s:{}, why:'you picked business management as your strongest interest' },
        { id:'hospitality',  label:'Hospitality & tourism', desc:'Hotels, restaurants, travel, guest experience.', s:{}, why:'you picked hospitality and tourism as your strongest interest' },
        { id:'sports',       label:'Sports & entertainment', desc:'Teams, venues, events, entertainment brands.', s:{}, why:'you picked sports and entertainment as your strongest interest' },
        { id:'unsure',       label:"I'm not sure yet", desc:'Help me narrow it down.', s:{}, why:'you were still narrowing down your interest area' }
      ]
    },

    /* ---- follow-ups, one per area ---- */

    {
      id: 'sub_marketing',
      when: function (a) { return a.area === 'marketing'; },
      prompt: 'What part of marketing sounds most interesting?',
      options: [
        { id:'promo',   label:'Advertising, promotion, and social media', desc:'Campaigns, messaging, and getting attention.', s:{MCS:10, PMK:6, MTDM:6}, why:'advertising and promotion is the part of marketing you enjoy' },
        { id:'strategy',label:'Overall marketing strategy', desc:'Positioning a brand and planning where it goes next.', s:{MTDM:10, MCS:5, BSM:4, PMK:4}, why:'you are drawn to big-picture marketing strategy' },
        { id:'services',label:'Marketing services and B2B', desc:'Selling consulting, software, and services to other businesses.', s:{BSM:10, MTDM:4}, why:'you are interested in marketing services rather than physical products' },
        { id:'food',    label:'Food and grocery marketing', desc:'Supermarkets, suppliers, and food products.', s:{FMS:10, RMS:4, BTDM:3}, why:'food and grocery marketing caught your interest' },
        { id:'auto',    label:'Automotive marketing', desc:'Dealerships, service centers, and parts.', s:{ASM:10, MTDM:3}, why:'automotive marketing caught your interest' }
      ]
    },

    {
      id: 'sub_retail',
      when: function (a) { return a.area === 'retail'; },
      prompt: 'What sounds most interesting?',
      options: [
        { id:'store',   label:'Running a store day to day', desc:'Inventory, displays, staff, and customers.', s:{RMS:10, BTDM:5}, why:'you like the operations side of running a store' },
        { id:'fashion', label:'Fashion and apparel', desc:'Clothing, accessories, and trends.', s:{AAM:10, BTDM:5}, why:'fashion and apparel is where your interest sits' },
        { id:'buying',  label:'Buying and choosing what to sell', desc:'Vendors, assortment, and margins.', s:{BTDM:10, RMS:5, AAM:4}, why:'buying and merchandising decisions appeal to you' },
        { id:'promo',   label:'Marketing and promoting the store', desc:'Campaigns that bring people in.', s:{RMS:7, MCS:7, MTDM:4}, why:'you want to work on promoting retail rather than just running it' }
      ]
    },

    {
      id: 'sub_finance',
      when: function (a) { return a.area === 'finance'; },
      prompt: 'What sounds most interesting?',
      options: [
        { id:'business',label:'Making financial decisions for a business', desc:'Budgets, cash flow, and funding growth.', s:{BFS:10, PFN:5, FTDM:5}, why:'you want to make financial decisions on the business side' },
        { id:'banking', label:'Banking and financial services', desc:'Loans, insurance, and financial products.', s:{FTDM:10, BFS:5, PFN:4}, why:'banking and financial services is the corner of finance you like' },
        { id:'records', label:'Accounting and financial records', desc:'Statements, reporting, and keeping the books right.', s:{ACT:10, BFS:5, FTDM:3}, why:'accounting and financial records are what interest you most' },
        { id:'personal',label:'Personal money decisions', desc:'Budgeting, credit, saving, and investing for yourself.', s:{PFL:10, PFN:5, FTDM:3}, why:'you are most interested in personal financial decisions' }
      ]
    },

    {
      id: 'sub_entrepreneur',
      when: function (a) { return a.area === 'entrepreneur'; },
      prompt: 'Which sounds most like you?',
      options: [
        { id:'owner', label:'I want to think like a business owner', desc:'Solving the problems an owner actually faces.', s:{ENT:10, ETDM:8, PEN:5}, why:'you want to solve problems from an owner\'s seat' },
        { id:'ideas', label:'I like coming up with new ideas', desc:'Spotting gaps and opportunities.', s:{ENT:9, ETDM:8, PEN:6}, why:'you like generating new business ideas' },
        { id:'pitch', label:'I enjoy pitching and persuading', desc:'Selling the idea to the person across the table.', s:{ENT:9, ETDM:7, PEN:5}, why:'you enjoy pitching and persuading' }
      ]
    },

    {
      id: 'sub_management',
      when: function (a) { return a.area === 'management'; },
      prompt: 'Which sounds most interesting?',
      options: [
        { id:'people', label:'Managing employees', desc:'Hiring, training, and handling workplace situations.', s:{HRM:10, PBM:5, BLTDM:3}, why:'managing people is the part of business you gravitate to' },
        { id:'ops',    label:'Running operations and solving business problems', desc:'Keeping the machine working.', s:{PBM:8, HRM:6, BLTDM:4}, why:'you like operations and general problem solving' },
        { id:'law',    label:'Business law and ethical situations', desc:'Contracts, regulations, and doing the right thing.', s:{BLTDM:12, PBM:4, HRM:3}, why:'business law and ethics is what draws you in' },
        { id:'lead',   label:'Leadership and decision making', desc:'Being the one who calls it.', s:{PBM:7, HRM:6, BLTDM:5}, why:'you want to be the one making the call' }
      ]
    },

    {
      id: 'sub_hospitality',
      when: function (a) { return a.area === 'hospitality'; },
      prompt: 'Which industry interests you most?',
      options: [
        { id:'hotel',  label:'Hotels and lodging', desc:'Front desk, guest experience, and hotel revenue.', s:{HLM:10, HTDM:6, PHT:4}, why:'hotels and lodging is your industry of choice' },
        { id:'full',   label:'Full-service restaurants', desc:'Menus, service standards, and dining rooms.', s:{RFSM:10, HTDM:5, PHT:4}, why:'full-service restaurants are what interest you' },
        { id:'quick',  label:'Fast food and quick service', desc:'Speed, volume, and consistency.', s:{QSRM:10, RFSM:5, HTDM:4}, why:'quick-service restaurants are what interest you' },
        { id:'travel', label:'Travel and tourism', desc:'Destinations, tours, and visitor experience.', s:{TTDM:11, PHT:5, HTDM:4, HLM:3, RFSM:2}, why:'travel and tourism is where you want to compete' }
      ]
    },

    {
      id: 'sub_sports',
      when: function (a) { return a.area === 'sports'; },
      prompt: 'Which side of sports and entertainment appeals to you?',
      options: [
        { id:'team',   label:'Marketing a team or athlete', desc:'Ticket sales, sponsorship, and fan base.', s:{SEM:11, STDM:10}, why:'you want to market teams and athletes' },
        { id:'venue',  label:'Running events and venues', desc:'Concerts, tournaments, and the operation behind them.', s:{SEM:10, STDM:10, HTDM:3}, why:'you are drawn to the events and venues side' },
        { id:'brand',  label:'Entertainment brands and media', desc:'Studios, streaming, and entertainment properties.', s:{SEM:10, STDM:9, MCS:4}, why:'entertainment brands and media are your angle' }
      ]
    },

    {
      id: 'sub_unsure',
      when: function (a) { return a.area === 'unsure'; },
      prompt: 'Pick whichever of these you would actually enjoy doing.',
      sub: 'No wrong answer — this just points the recommendation somewhere.',
      options: [
        { id:'campaign', label:'Build a campaign that gets people talking', desc:'', s:{MCS:8, MTDM:7, PMK:5}, why:'building campaigns sounded like the most fun to you' },
        { id:'store',    label:'Fix a store that is losing customers', desc:'', s:{RMS:8, BTDM:6, AAM:4}, why:'turning around a struggling store sounded like the most fun to you' },
        { id:'numbers',  label:'Figure out why a business is losing money', desc:'', s:{BFS:8, ACT:6, FTDM:6, PFN:4}, why:'digging into the numbers sounded like the most fun to you' },
        { id:'launch',   label:'Launch something of your own', desc:'', s:{ENT:8, ETDM:7, PEN:5}, why:'launching your own thing sounded like the most fun to you' },
        { id:'people',   label:'Sort out a problem between employees', desc:'', s:{HRM:8, PBM:6, BLTDM:5}, why:'handling a people problem sounded like the most fun to you' },
        { id:'guest',    label:'Rescue a hotel or restaurant with bad reviews', desc:'', s:{HLM:7, RFSM:7, HTDM:6, QSRM:5, PHT:4}, why:'rescuing a hospitality business sounded like the most fun to you' }
      ]
    },

    /* ---- competition style, moderate weight, always asked ---- */

    {
      id: 'style',
      prompt: 'In the roleplay room, what is your strength?',
      options: [
        { id:'fast',    label:'Thinking fast on my feet', desc:'Give me ten minutes and I will figure it out live.', s:{MCS:3, ENT:3, RMS:3, SEM:3, QSRM:3, PMK:2, PEN:2, MTDM:2, ETDM:2}, why:'you think fast on your feet' },
        { id:'analyze', label:'Working through the details carefully', desc:'I want to break the problem down properly.', s:{ACT:4, BFS:4, BLTDM:3, FTDM:3, HRM:3, PFL:3, PFN:2}, why:'you prefer working a problem through carefully' },
        { id:'pitch',   label:'Presenting and persuading', desc:'I am at my best selling the idea.', s:{ENT:3, MCS:3, SEM:3, AAM:3, MTDM:3, ETDM:3, STDM:2}, why:'presenting and persuading is your strength' },
        { id:'organize',label:'Staying organized under pressure', desc:'I keep the structure straight when it gets messy.', s:{HLM:3, RFSM:3, HRM:3, PBM:3, BTDM:3, TTDM:3, HTDM:2}, why:'you stay organized under pressure' }
      ]
    }
  ];

  /* ---------------------------------------------------------
     3. STATE
     --------------------------------------------------------- */

  var answers = {};
  var order = [];       // ids of questions actually shown, in order
  var cursor = 0;
  var pending = null;   // option id selected but not yet confirmed
  var filters = { format: 'all', cluster: 'all' };

  function visibleQuestions() {
    return QUESTIONS.filter(function (q) { return !q.when || q.when(answers); });
  }

  function questionById(id) {
    for (var i = 0; i < QUESTIONS.length; i++) if (QUESTIONS[i].id === id) return QUESTIONS[i];
    return null;
  }

  /* ---------------------------------------------------------
     4. SCORING
     --------------------------------------------------------- */

  function eligible(ev) {
    // Principles events only for first-year (or unsure) members.
    if (ev.firstYear && answers.experience === 'no') return false;

    if (answers.format === 'individual' && ev.format !== 'individual') return false;
    if (answers.format === 'team' && ev.format !== 'team') return false;
    return true;
  }

  function score() {
    var totals = {}, reasons = {};
    EVENTS.forEach(function (ev) {
      if (!eligible(ev)) return;
      totals[ev.code] = 0;
      reasons[ev.code] = [];
    });

    // interest + style points from the answered options
    order.forEach(function (qid) {
      var q = questionById(qid);
      if (!q) return;
      var picked = null;
      q.options.forEach(function (o) { if (o.id === answers[qid]) picked = o; });
      if (!picked) return;

      Object.keys(picked.s || {}).forEach(function (code) {
        if (totals[code] === undefined) return;
        totals[code] += picked.s[code];
        if (picked.s[code] >= 6 && picked.why) reasons[code].push(picked.why);
      });
    });

    // format weight
    Object.keys(totals).forEach(function (code) {
      var ev = BY_CODE[code];
      if (answers.format === 'individual' || answers.format === 'team') {
        totals[code] += 6;
      } else if (answers.lean === 'solo') {
        totals[code] += ev.format === 'individual' ? 6 : 1;
      } else if (answers.lean === 'duo') {
        totals[code] += ev.format === 'team' ? 6 : 1;
      } else {
        totals[code] += 3;
      }
      // experience weight
      if (ev.firstYear && answers.experience === 'yes') totals[code] += 5;
      if (ev.firstYear && answers.experience === 'unsure') totals[code] += 1;
    });

    var ranked = Object.keys(totals)
      .map(function (code) { return { ev: BY_CODE[code], pts: totals[code], reasons: reasons[code] }; })
      .filter(function (r) { return r.pts > 0; })
      .sort(function (a, b) {
        if (b.pts !== a.pts) return b.pts - a.pts;
        return a.ev.name.localeCompare(b.ev.name);
      });

    return ranked;
  }

  function joinReasons(list) {
    var seen = [], out = [];
    list.forEach(function (r) { if (seen.indexOf(r) === -1) { seen.push(r); out.push(r); } });
    out = out.slice(0, 3);
    if (out.length === 0) return '';
    if (out.length === 1) return out[0];
    if (out.length === 2) return out[0] + ' and ' + out[1];
    return out[0] + ', ' + out[1] + ', and ' + out[2];
  }

  // The `why` on format/area options carries no score, so pull it straight
  // out of the answers instead of the per-event reason list.
  function answerWhy(qid) {
    var q = questionById(qid), w = '';
    if (!q || !answers[qid]) return '';
    q.options.forEach(function (o) { if (o.id === answers[qid]) w = o.why || ''; });
    return w;
  }

  function topWhy(result) {
    var parts = [];
    var areaWhy = answerWhy('area');
    if (areaWhy) parts.push(areaWhy);
    result.reasons.forEach(function (r) { parts.push(r); });
    var fmtWhy = answers.format === 'either' ? answerWhy('lean') : answerWhy('format');
    if (fmtWhy) parts.push(fmtWhy);

    var body = joinReasons(parts);
    var lead = body ? 'You told us ' + body + '. ' : '';
    var kind = result.ev.format === 'team'
      ? 'is a two-person case study event'
      : 'is an individual roleplay event';
    var tail = result.ev.code + ' ' + kind + ' in ' + result.ev.cluster.toLowerCase() +
               ', which lines up with all of that.';
    var extra = (answers.experience === 'yes' && result.ev.firstYear)
      ? ' It is also built for first-year members, so you would be competing against people at the same stage as you.'
      : '';
    return lead + tail + extra;
  }

  function otherWhy(result) {
    var body = joinReasons(result.reasons);
    return body ? 'It fits because ' + body + '.' : 'It scored close behind on your answers.';
  }

  /* ---------------------------------------------------------
     5. RENDERING
     --------------------------------------------------------- */

  var root, screens = {};

  function show(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle('f-active', k === name);
    });
    if (name !== 'chooser') {
      var top = root.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c];
    });
  }

  function startQuiz() {
    answers = {};
    order = [];
    cursor = 0;
    pending = null;
    order.push(visibleQuestions()[0].id);
    renderQuestion();
    show('quiz');
  }

  function renderQuestion() {
    var q = questionById(order[cursor]);
    var vis = visibleQuestions();
    var estimate = Math.max(vis.length, order.length);
    var pct = Math.round(((cursor) / estimate) * 100);

    var html = '';
    html += '<div class="f-quiz-top">';
    html += '<span class="f-step">Question ' + (cursor + 1) + ' of ' + estimate + '</span>';
    html += '<button class="f-btn-text" data-act="restart">Restart quiz</button>';
    html += '</div>';
    html += '<div class="f-progress-track"><div class="f-progress-fill" style="width:' + pct + '%"></div></div>';

    html += '<h3 class="f-question">' + esc(q.prompt) + '</h3>';
    if (q.sub) html += '<p class="f-question-sub">' + esc(q.sub) + '</p>';

    html += '<div class="f-options" role="radiogroup">';
    q.options.forEach(function (o) {
      var on = answers[q.id] === o.id;
      html += '<button class="f-option' + (on ? ' f-picked' : '') + '" role="radio" aria-checked="' + on + '" data-opt="' + esc(o.id) + '">';
      html += '<span class="f-check" aria-hidden="true"></span>';
      html += '<span><span class="f-option-label">' + esc(o.label) + '</span>';
      if (o.desc) html += '<span class="f-option-desc">' + esc(o.desc) + '</span>';
      html += '</span></button>';
    });
    html += '</div>';

    html += '<div class="f-nav-row">';
    html += '<div class="f-nav-left">';
    if (cursor > 0) html += '<button class="f-btn f-btn-ghost" data-act="back">Back</button>';
    html += '<button class="f-btn-text" data-act="home">Start over</button>';
    html += '</div>';
    html += '<button class="f-btn" data-act="next"' + (answers[q.id] ? '' : ' disabled') + '>Next</button>';
    html += '</div>';

    screens.quiz.innerHTML = html;
    // animate the bar after paint
    requestAnimationFrame(function () {
      var fill = screens.quiz.querySelector('.f-progress-fill');
      if (fill) fill.style.width = pct + '%';
    });
  }

  function pick(optId) {
    var q = questionById(order[cursor]);
    answers[q.id] = optId;

    // Answering a question can change which later questions apply,
    // so drop anything after this point and recompute on Next.
    order = order.slice(0, cursor + 1);
    renderQuestion();
  }

  function next() {
    var q = questionById(order[cursor]);
    if (!answers[q.id]) return;

    var vis = visibleQuestions();
    var idxInVis = -1;
    for (var i = 0; i < vis.length; i++) if (vis[i].id === q.id) idxInVis = i;

    if (idxInVis === -1 || idxInVis + 1 >= vis.length) {
      renderResults();
      show('results');
      return;
    }

    var nextId = vis[idxInVis + 1].id;
    cursor++;
    order[cursor] = nextId;
    renderQuestion();
  }

  function back() {
    if (cursor === 0) { show('chooser'); return; }
    cursor--;
    renderQuestion();
  }

  function renderResults() {
    var ranked = score();

    if (!ranked.length) {
      screens.results.innerHTML =
        '<h3 class="f-question">No match yet</h3>' +
        '<p class="f-lede">Something went wrong narrowing the list. Retake the quiz and we will try again.</p>' +
        '<button class="f-btn" data-act="restart">Retake quiz</button>';
      return;
    }

    var top = ranked[0];
    var others = ranked.slice(1, 4);

    var html = '';
    html += '<div class="f-top-match">';
    html += '<div class="f-top-label">Your top match</div>';
    html += '<h3 class="f-top-name">' + esc(top.ev.name) + '</h3>';
    html += '<div class="f-top-abbr">' + esc(top.ev.code) + '</div>';
    html += '<div class="f-pills">';
    html += '<span class="f-pill">' + (top.ev.format === 'team' ? '2-person team' : 'Individual') + '</span>';
    html += '<span class="f-pill">' + esc(top.ev.cluster) + '</span>';
    if (top.ev.firstYear) html += '<span class="f-pill">First year</span>';
    html += '</div>';
    html += '<div class="f-why-label">Why this may be a good fit</div>';
    html += '<p class="f-top-why">' + esc(topWhy(top)) + '</p>';
    html += '</div>';

    if (others.length) {
      html += '<h3 class="f-sub-head">Your other matches</h3>';
      html += '<div class="f-others">';
      others.forEach(function (r) {
        html += '<div class="f-other">';
        html += '<div class="f-other-head">';
        html += '<span class="f-other-name">' + esc(r.ev.name) + '</span>';
        html += '<span class="f-other-abbr">' + esc(r.ev.code) + '</span>';
        html += '<span class="f-meta">' + (r.ev.format === 'team' ? 'Team' : 'Individual') + ' &middot; ' + esc(r.ev.cluster) + '</span>';
        html += '</div>';
        html += '<p>' + esc(r.ev.desc) + '</p>';
        html += '<p class="f-other-why"><strong>Why it may fit:</strong> ' + esc(otherWhy(r)) + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '<div class="f-result-actions">';
    html += '<button class="f-btn" data-act="restart">Retake quiz</button>';
    html += '<button class="f-btn f-btn-ghost" data-act="browse">View all roleplay events</button>';
    html += '<button class="f-btn f-btn-ghost" data-act="home">Start over</button>';
    html += '</div>';

    html += '<p class="f-disclaimer">This is a starting point, not a ruling. Not every chartered association offers every event, and your chapter may have its own limits on who competes in what. Check with your advisor before you register.</p>';

    screens.results.innerHTML = html;
  }

  function renderBrowse() {
    var clusters = [];
    EVENTS.forEach(function (e) { if (clusters.indexOf(e.cluster) === -1) clusters.push(e.cluster); });
    clusters.sort();

    var list = EVENTS.filter(function (e) {
      if (filters.format !== 'all' && e.format !== filters.format) return false;
      if (filters.cluster !== 'all' && e.cluster !== filters.cluster) return false;
      return true;
    });

    var html = '';
    html += '<button class="f-btn-text" data-act="home">&larr; Back to Find Your Event</button>';
    html += '<h3 class="f-h2" style="margin-top:18px;">All roleplay events</h3>';
    html += '<p class="f-lede">Every DECA roleplay and case study event for 2026&ndash;2027. Prepared events, written events, and online simulations are not listed here.</p>';

    html += '<div class="f-filters">';
    html += '<button class="f-filter' + (filters.format === 'all' ? ' f-on' : '') + '" data-fmt="all">All formats</button>';
    html += '<button class="f-filter' + (filters.format === 'individual' ? ' f-on' : '') + '" data-fmt="individual">Individual</button>';
    html += '<button class="f-filter' + (filters.format === 'team' ? ' f-on' : '') + '" data-fmt="team">Team</button>';
    html += '</div>';

    html += '<div class="f-filters">';
    html += '<button class="f-filter' + (filters.cluster === 'all' ? ' f-on' : '') + '" data-clu="all">All areas</button>';
    clusters.forEach(function (c) {
      html += '<button class="f-filter' + (filters.cluster === c ? ' f-on' : '') + '" data-clu="' + esc(c) + '">' + esc(c) + '</button>';
    });
    html += '</div>';

    if (!list.length) {
      html += '<p class="f-empty">No events match those filters.</p>';
    } else {
      html += '<div class="f-event-grid">';
      list.forEach(function (e) {
        html += '<div class="f-event">';
        html += '<div class="f-event-abbr">' + esc(e.code) + '</div>';
        html += '<h4>' + esc(e.name) + '</h4>';
        html += '<p>' + esc(e.desc) + '</p>';
        html += '<div class="f-event-foot">';
        html += '<span class="f-chip">' + (e.format === 'team' ? '2 people' : 'Individual') + '</span>';
        html += '<span class="f-chip">' + esc(e.cluster) + '</span>';
        if (e.firstYear) html += '<span class="f-chip">First year</span>';
        html += '</div></div>';
      });
      html += '</div>';
    }

    html += '<button class="f-btn" data-act="start-roleplay">Take the quiz instead</button>';
    screens.browse.innerHTML = html;
  }

  /* ---------------------------------------------------------
     6. EVENT WIRING
     --------------------------------------------------------- */

  function init() {
    root = document.getElementById('finder');
    if (!root) return;

    screens.chooser = root.querySelector('#fScreenChooser');
    screens.quiz    = root.querySelector('#fScreenQuiz');
    screens.results = root.querySelector('#fScreenResults');
    screens.browse  = root.querySelector('#fScreenBrowse');
    screens.prepared= root.querySelector('#fScreenPrepared');
    if (!screens.chooser) return;

    root.addEventListener('click', function (e) {
      var optBtn = e.target.closest('[data-opt]');
      if (optBtn) { pick(optBtn.getAttribute('data-opt')); return; }

      var fmtBtn = e.target.closest('[data-fmt]');
      if (fmtBtn) { filters.format = fmtBtn.getAttribute('data-fmt'); renderBrowse(); return; }

      var cluBtn = e.target.closest('[data-clu]');
      if (cluBtn) { filters.cluster = cluBtn.getAttribute('data-clu'); renderBrowse(); return; }

      var act = e.target.closest('[data-act]');
      if (!act) return;
      var a = act.getAttribute('data-act');

      if (a === 'start-roleplay') startQuiz();
      else if (a === 'start-prepared') show('prepared');
      else if (a === 'next') next();
      else if (a === 'back') back();
      else if (a === 'restart') startQuiz();
      else if (a === 'home') show('chooser');
      else if (a === 'browse') { renderBrowse(); show('browse'); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
