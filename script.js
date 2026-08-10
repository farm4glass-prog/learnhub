import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import {
  initializeAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut,
  browserLocalPersistence, browserSessionPersistence, browserPopupRedirectResolver
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, orderBy, query, limit
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app-check.js";
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-ai.js";

// ========================= FIREBASE =========================
const firebaseConfig = {
  apiKey: "AIzaSyBbx0tdGbQBeUmWnTMHdipSLPrp6zo6n6c",
  authDomain: "farm4glass-142b7.firebaseapp.com",
  projectId: "farm4glass-142b7",
  storageBucket: "farm4glass-142b7.firebasestorage.app",
  messagingSenderId: "1080688954531",
  appId: "1:1080688954531:web:334be5bdfae4d338e74316",
  measurementId: "G-27SR58HRSZ"
};

const ADMIN_EMAILS = ["farm4glass@gmail.com"];

function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email);
}

const app = initializeApp(firebaseConfig);

// ========================= APP CHECK =========================
// App Check is required by Firebase AI Logic (used by the Prepared Event AI tab).
// Register the site under Firebase console > Security > App Check with reCAPTCHA v3
// and paste the site key below. The site key is public — safe to commit.
//
// Leaving this blank turns App Check OFF. The rest of the site works normally;
// only the Prepared Event AI tab is disabled. Registering a PLACEHOLDER key is
// worse than none at all — reCAPTCHA returns 400s and, if App Check enforcement
// is on for Firestore, every read fails as "Missing or insufficient permissions".
//
// On localhost, the debug flag prints a token in the console; register it under
// App Check > Apps > Manage debug tokens.
const RECAPTCHA_V3_SITE_KEY = "";

if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

let appCheckReady = false;
if (RECAPTCHA_V3_SITE_KEY && !RECAPTCHA_V3_SITE_KEY.startsWith("YOUR_")) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    appCheckReady = true;
  } catch (e) {
    console.error("App Check failed to initialize:", e);
  }
} else {
  console.warn(
    "App Check is off — no reCAPTCHA v3 site key set in script.js. " +
    "Everything works except Prepared Event AI, which needs it."
  );
}

const auth = initializeAuth(app, {
  persistence: [browserLocalPersistence, browserSessionPersistence],
  popupRedirectResolver: browserPopupRedirectResolver
});
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ========================= ICONS (inline SVG, no emoji) =========================
// Every icon is a small stroke-based SVG string. Rendered via .icon-svg wrapper.
const ICONS = {
  play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/></svg>`,
  quiz: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h.01M8 13h.01M8 17h.01"/><path d="M12 9h5M12 13h5M12 17h5"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  clipboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h6"/></svg>`,
  monitor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.9-.5-1.4 0-1.1.9-2 2-2h2.3A4.2 4.2 0 0 0 21 12c0-5-4-9-9-9z"/><circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.3-2-1-3 2 1 3 3 3 6a6 6 0 0 1-12 0c0-4 2-5 4-10z"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18"/><path d="M5 4h11l-2 4 2 4H5"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,3 14.7,9.2 21.5,9.8 16.4,14.3 17.9,21 12,17.4 6.1,21 7.6,14.3 2.5,9.8 9.3,9.2"/></svg>`,
  award: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M9 13.5 7 22l5-3 5 3-2-8.5"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 4H4v2a4 4 0 0 0 4 4"/><path d="M16 4h4v2a4 4 0 0 1-4 4"/><path d="M10 15h4v3h-4z"/><path d="M8 21h8"/></svg>`,
  medal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M9 10 6 3M15 10l3-7M9 4h6"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 11,14 9,22 21,10 13,10" fill="currentColor" stroke="none"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>`,
  bookmarkFilled: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 6 8 7 8-7"/></svg>`,
  timer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2h4"/><path d="M12 14 15 11"/><circle cx="12" cy="14" r="8"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>`,
  file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 21h16"/></svg>`,
  external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`
};

function icon(name) {
  return `<span class="icon-svg">${ICONS[name] || ""}</span>`;
}

// Map course "group" to an icon (used for course cards + featured/pasture rows)
const GROUP_ICONS = {
  "cluster": "book",
  "role-play": "users",
  "prepared event": "clipboard",
  "online simulation": "monitor",
  "branding": "palette"
};
function groupIcon(group) {
  return GROUP_ICONS[group] || "book";
}

// ========================= COURSE CATEGORIES =========================
// Filter buttons on the Course Catalog, in the order they appear.
// Add a category here and it shows up as a filter — even before a course
// exists for it (students get a "coming soon" message instead of nothing).
const COURSE_CATEGORIES = [
  "Cluster Exams",
  "Principles of Business Administration Events",
  "Individual Series Events",
  "Team Decision Making Events",
  "Personal Financial Literacy Event",
  "Business Operations Research Events",
  "Project Management Events",
  "Entrepreneurship Events",
  "Integrated Marketing Campaign Events",
  "Professional Selling and Consulting Events",
  "Stock Market Game",
  "Virtual Business Challenge",
  "Branding & Design"
];

// Maps existing course IDs to a category. Kept here rather than in
// courses.json so it works whether courses load from the file or from
// Firestore. A course doc with its own "category" field wins over this map.
const COURSE_CATEGORY_BY_ID = {
  "marketing": "Cluster Exams",
  "finance": "Cluster Exams",
  "hospitality": "Cluster Exams",
  "business-admin-core": "Cluster Exams",
  "business-management": "Cluster Exams",
  "entrepreneurship-cluster": "Cluster Exams",
  "pfl-cluster": "Cluster Exams",
  "principles": "Principles of Business Administration Events",
  "individual-series": "Individual Series Events",
  "team-decision": "Team Decision Making Events",
  "pfl-event": "Personal Financial Literacy Event",
  "business-research": "Business Operations Research Events",
  "project-management": "Project Management Events",
  "entrepreneurship-events": "Entrepreneurship Events",
  "integrated-marketing": "Integrated Marketing Campaign Events",
  "virtual-business": "Virtual Business Challenge",
  "stock-market": "Stock Market Game",
  "branding-basics": "Branding & Design"
};

// Fallback for courses an admin adds later without a category.
const GROUP_CATEGORY_FALLBACK = {
  "cluster": "Cluster Exams",
  "branding": "Branding & Design",
  "online simulation": "Virtual Business Challenge"
};

function courseCategory(course) {
  if (!course) return "";
  return course.category
    || COURSE_CATEGORY_BY_ID[course.id]
    || GROUP_CATEGORY_FALLBACK[course.group]
    || "";
}

// Progress helper used by the dashboard and the catalog.
function courseProgress(course) {
  const done = (userData?.completedLessons || []).filter(id => course.lessons.some(l => l.id === id)).length;
  const total = course.lessons.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

// ========================= UNITS =========================
// A course still stores a flat "lessons" array — that's what Firestore has,
// what the admin editor writes, and what the practice exam pools from. A UNIT
// is a view over that array: the video, the article, and the practice quiz
// that all belong to the same topic, grouped so students see one row per unit
// instead of three.
//
// Lessons are matched into a unit by their ID. Both naming schemes work:
//   marketing-u1-video / marketing-u1-quiz / marketing-u1-article  -> marketing-u1
//   marketing-video-1712345 / marketing-quiz-1712345               -> marketing-1712345

function unitKeyFor(lesson) {
  const id = String(lesson?.id || "");
  let m = id.match(/^(.*)-(?:video|quiz|article)$/);
  if (m) return m[1];
  m = id.match(/^(.*)-(?:video|quiz|article)-(\d+)$/);
  if (m) return `${m[1]}-${m[2]}`;
  return id;
}

// "Unit 1: Business Law — Practice Quiz" -> "Unit 1: Business Law"
function stripUnitSuffix(title) {
  return String(title || "")
    .replace(/\s*[\u2014\u2013-]\s*(Practice Quiz|Quiz|Article|Reading|PDF)\s*$/i, "")
    .trim();
}

function buildUnits(course) {
  const map = new Map();

  (course?.lessons || []).forEach(lesson => {
    const key = unitKeyFor(lesson);
    if (!map.has(key)) {
      map.set(key, { key, courseId: course.id, video: null, article: null, quiz: null, lessons: [] });
    }
    const unit = map.get(key);
    unit.lessons.push(lesson);
    if (lesson.type === "quiz") unit.quiz = lesson;
    else if (lesson.type === "article") unit.article = lesson;
    else unit.video = lesson;
  });

  const units = [...map.values()];
  units.forEach((unit, i) => {
    const source = unit.video || unit.article || unit.quiz;
    unit.title = stripUnitSuffix(source?.title) || `Unit ${i + 1}`;
    const numbered = unit.title.match(/^Unit\s+(\d+)/i);
    unit.number = numbered ? numbered[1] : String(i + 1);
    unit.xp = unit.lessons.reduce((sum, l) => sum + (l.xp || 0), 0);
  });

  return units;
}

function findUnit(courseId, unitKey) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;
  return buildUnits(course).find(u => u.key === unitKey) || null;
}

// Which tab a given lesson lives on inside its unit.
function tabForLesson(lesson) {
  if (!lesson) return "video";
  if (lesson.type === "quiz") return "practice";
  if (lesson.type === "article") return "article";
  return "video";
}

function unitPartDone(lesson) {
  return !!lesson && (userData?.completedLessons || []).includes(lesson.id);
}

// ========================= FARM ANIMALS =========================
const ANIMALS = [
  { name: "Chick",    tagline: "Just hatched! Every champion starts somewhere.",           xpNeeded: 100,  level: 1 },
  { name: "Duckling",        tagline: "Finding your footing and building confidence.",                  xpNeeded: 250,  level: 2 },
  { name: "Sheep",         tagline: "Growing steadily through consistent practice.",              xpNeeded: 500,  level: 3 },
  { name: "Pig",         tagline: "Climbing the competition mountain!",  xpNeeded: 900,  level: 4 },
  { name: "Bee",          tagline: "Busy bee grinding in DECA!",          xpNeeded: 1500, level: 5 },
  { name: "Cow",         tagline: "Mooo-ving up in the DECA world!",      xpNeeded: 2500, level: 6 },
  { name: "Goat",     tagline: "The farm's greatest of all time!",         xpNeeded: Infinity, level: 7 }
];

function getAnimalForXP(xp) {
  let current = ANIMALS[0];
  let idx = 0;
  for (let i = 0; i < ANIMALS.length - 1; i++) {
    if (xp >= ANIMALS[i].xpNeeded) { current = ANIMALS[i + 1]; idx = i + 1; }
  }
  return { ...current, index: idx };
}

// ========================= BADGES =========================
const BADGES = [
  { id: "first-hay-bale", name: "First Hay Bale",   desc: "Complete your first lesson",           icon: "flag",   check: (u) => u.completedLessons?.length >= 1 },
  { id: "barn-burner",    name: "Barn Burner",      desc: "Reach a 3-day streak",                 icon: "flame",  check: (u) => u.streak >= 3 },
  { id: "monthly-moo",    name: "Monthly Moo",      desc: "Earn 500 XP",                          icon: "star",   check: (u) => u.xp >= 500 },
  { id: "top-rooster",    name: "Top Rooster",      desc: "Complete 10 lessons",                  icon: "award",  check: (u) => u.completedLessons?.length >= 10 },
  { id: "harvest-hero",   name: "Harvest Hero",     desc: "Finish an entire course",               icon: "trophy", check: (u, courses) => checkCourseComplete(u, courses) },
  { id: "field-hand",     name: "Field Hand",       desc: "Complete your first quiz",             icon: "quiz",   check: (u) => u.completedQuizzes >= 1 },
  { id: "ranch-legend",   name: "Ranch Legend",     desc: "Earn 1000 XP",                         icon: "medal",  check: (u) => u.xp >= 1000 },
  { id: "top-of-pasture", name: "Top of the Pasture", desc: "Reach a 7-day streak",                icon: "zap",    check: (u) => u.streak >= 7 },
];

function checkCourseComplete(userData, courses) {
  if (!courses || !userData.completedLessons) return false;

  return courses.some(course =>
    course.lessons.length > 0 &&
    course.lessons.every(lesson =>
      userData.completedLessons.includes(lesson.id)
    )
  );
}

// ========================= DECA ASSOCIATIONS (High School) =========================
const DECA_ASSOCIATIONS = [
  "Alabama DECA", "Alaska DECA", "Arizona DECA", "Arkansas DECA", "California DECA",
  "Colorado DECA", "Connecticut DECA", "Delaware DECA", "District of Columbia DECA",
  "Florida DECA", "Georgia DECA", "Guam DECA", "Hawaii DECA", "Idaho DECA",
  "Illinois DECA", "Indiana DECA", "Iowa DECA", "Kansas DECA", "Kentucky DECA",
  "Louisiana DECA", "Maine DECA", "Maryland DECA", "Massachusetts DECA", "Michigan DECA",
  "Minnesota DECA", "Mississippi DECA", "Missouri DECA", "Montana DECA", "Nebraska DECA",
  "Nevada DECA", "New Hampshire DECA", "New Jersey DECA", "New Mexico DECA", "New York DECA",
  "North Carolina DECA", "North Dakota DECA", "Ohio DECA", "Oklahoma DECA", "Oregon DECA",
  "Pennsylvania DECA", "Puerto Rico DECA", "Rhode Island DECA", "South Carolina DECA",
  "South Dakota DECA", "Tennessee DECA", "Texas DECA", "Utah DECA", "Vermont DECA",
  "Virgin Islands DECA", "Virginia DECA", "Washington DECA", "West Virginia DECA",
  "Wisconsin DECA", "Wyoming DECA", "DECA Germany"
];

// ========================= DECA COMPETITIVE EVENTS =========================
// Used by the dropdowns on the Profile page. Grouped so the <select> can show
// optgroups. DECA revises its event list most years — when that happens, edit
// these three constants and nothing else needs to change.

const DECA_ROLEPLAY_EVENTS = {
  "Principles of Business Administration": [
    "Principles of Business Management and Administration (PBM)",
    "Principles of Entrepreneurship (PEN)",
    "Principles of Finance (PFN)",
    "Principles of Hospitality and Tourism (PHT)",
    "Principles of Marketing (PMK)"
  ],
  "Individual Series": [
    "Accounting Applications Series (ACT)",
    "Apparel and Accessories Marketing Series (AAM)",
    "Automotive Services Marketing Series (ASM)",
    "Business Finance Series (BFS)",
    "Business Services Marketing Series (BSM)",
    "Entrepreneurship Series (ENT)",
    "Food Marketing Series (FMS)",
    "Hotel and Lodging Management Series (HLM)",
    "Human Resources Management Series (HRM)",
    "Marketing Communications Series (MCS)",
    "Quick Serve Restaurant Management Series (QSRM)",
    "Restaurant and Food Service Management Series (RFSM)",
    "Retail Merchandising Series (RMS)",
    "Sports and Entertainment Marketing Series (SEM)"
  ],
  "Team Decision Making": [
    "Business Law and Ethics (BLTDM)",
    "Buying and Merchandising (BTDM)",
    "Entrepreneurship (ETDM)",
    "Financial Services (FTDM)",
    "Hospitality Services (HTDM)",
    "Marketing Management (MTDM)",
    "Sports and Entertainment Marketing (STDM)",
    "Travel and Tourism (TTDM)"
  ],
  "Personal Financial Literacy": [
    "Personal Financial Literacy (PFL)"
  ],
  "Professional Selling and Consulting": [
    "Financial Consulting (FCE)",
    "Hospitality and Tourism Professional Selling (HTPS)",
    "Professional Selling (PSE)"
  ]
};

const DECA_WRITTEN_EVENTS = {
  "Business Operations Research": [
    "Business Services Operations Research (BOR)",
    "Buying and Merchandising Operations Research (BMOR)",
    "Finance Operations Research (FOR)",
    "Hospitality and Tourism Operations Research (HTOR)",
    "Sports and Entertainment Marketing Operations Research (SEOR)"
  ],
  "Entrepreneurship": [
    "Business Growth Plan (EBG)",
    "Franchise Business Plan (EFB)",
    "Independent Business Plan (EIB)",
    "Innovation Plan (EIP)",
    "International Business Plan (IBP)",
    "Start-Up Business Plan (ESB)"
  ],
  "Integrated Marketing Campaign": [
    "Integrated Marketing Campaign — Event (IMCE)",
    "Integrated Marketing Campaign — Product (IMCP)",
    "Integrated Marketing Campaign — Service (IMCS)"
  ],
  "Project Management": [
    "Business Solutions Project (PMBS)",
    "Career Development Project (PMCD)",
    "Community Awareness Project (PMCA)",
    "Community Giving Project (PMCG)",
    "Financial Literacy Project (PMFL)",
    "Sales Project (PMSP)"
  ]
};

const DECA_CLUSTER_EXAMS = [
  "Business Administration Core",
  "Business Management and Administration",
  "Entrepreneurship",
  "Finance",
  "Hospitality and Tourism",
  "Marketing",
  "Personal Financial Literacy"
];

// Builds <option> markup, with <optgroup> when the source is grouped.
function eventOptionsHtml(source, selectedValue, placeholder) {
  const opt = v =>
    `<option value="${v.replace(/"/g, "&quot;")}" ${v === selectedValue ? "selected" : ""}>${v}</option>`;

  const head = `<option value="" ${!selectedValue ? "selected" : ""}>${placeholder}</option>`;

  if (Array.isArray(source)) return head + source.map(opt).join("");

  return head + Object.entries(source).map(([group, items]) =>
    `<optgroup label="${group}">${items.map(opt).join("")}</optgroup>`
  ).join("");
}

// ========================= KPI FALLBACK SET =========================
// The full Marketing Career Cluster PI list lives in kpis.json. This small
// hand-written set is only used if that file can't be loaded at all.
const KPI_SEED = [
  {
    id: "channels-of-distribution",
    title: "Explain the concept of channels of distribution",
    cluster: "Marketing",
    explanation: "A channel of distribution is the path a product takes from producer to final consumer, and it can involve any number of intermediaries such as wholesalers, agents, and retailers, or it can be direct with no intermediaries at all.",
    example: "A clothing brand sells directly to consumers through its own website (a direct/zero-level channel) while also selling through department stores (an indirect channel with a retailer as the intermediary).",
    judgeExpectations: "Judges want to hear that you understand who is involved in getting the product from the business to the customer, and that you can explain why a business would choose a particular channel (cost, control, reach, speed).",
    commonMistakes: "Competitors often confuse 'channels of distribution' with 'physical distribution' (the actual transportation/logistics) or forget to mention that a channel can be direct with zero intermediaries.",
    sampleAnswer: "\"Our business uses an indirect channel of distribution — we manufacture the product, sell it to a regional wholesaler, who then sells it to local retailers, who sell it to the final customer. We chose this channel because it lets us reach more customers than we could on our own, even though it means we give up some control over how the product is presented at retail.\""
  },
  {
    id: "business-ethics",
    title: "Describe the nature of business ethics",
    cluster: "Business Management + Administration",
    explanation: "Business ethics refers to the moral principles and standards that guide behavior in the business world, covering how a company treats employees, customers, competitors, and the community, beyond what the law strictly requires.",
    example: "A company voluntarily recalls a product at significant cost after discovering a minor safety defect, even though it wasn't legally required to, because leadership decided customer safety came first.",
    judgeExpectations: "Judges look for the ability to distinguish ethical behavior from merely legal behavior, and to explain why ethical conduct matters for long-term reputation and trust, not just short-term profit.",
    commonMistakes: "A common mistake is only talking about what's illegal instead of what's unethical — ethics is broader than the law. Competitors also sometimes give a vague answer without a concrete example.",
    sampleAnswer: "\"In this situation, I'd want to make sure our decision reflects strong business ethics — even though nothing here breaks the law, being transparent with the customer about the mistake builds trust and protects our reputation long-term, which matters more than the short-term cost.\""
  },
  {
    id: "marketing-information-management",
    title: "Explain the concept of marketing-information management",
    cluster: "Marketing",
    explanation: "Marketing-information management is the ongoing process of gathering, analyzing, and using data about customers, competitors, and the market to make better business decisions.",
    example: "A coffee shop tracks which drinks sell best by time of day using its point-of-sale data, then adjusts staffing and promotions around those patterns.",
    judgeExpectations: "Judges want you to connect data collection to a specific decision — not just 'the business collects data,' but how that data changes what the business actually does.",
    commonMistakes: "Competitors often describe collecting data (surveys, sales reports) but never explain what decision that data informed, which misses the 'management' part of the concept.",
    sampleAnswer: "\"We'd use marketing-information management by tracking customer purchase data and running short surveys after checkout. If the data shows a certain product consistently underperforms in a specific region, we can adjust our regional marketing mix instead of guessing.\""
  },
  {
    id: "technology-in-selling",
    title: "Describe the use of technology in the selling function",
    cluster: "Marketing",
    explanation: "Technology in selling covers tools like customer relationship management (CRM) software, digital presentations, and mobile point-of-sale systems that help salespeople manage relationships and close sales more efficiently.",
    example: "A sales rep uses a CRM to track every past conversation with a client, so they can follow up with personalized details instead of starting from scratch each time.",
    judgeExpectations: "Judges expect a specific technology and a clear benefit — efficiency, personalization, or better customer tracking — rather than just saying 'businesses use technology to sell more.'",
    commonMistakes: "Vague answers like 'they use computers' without naming a real tool or explaining the benefit are the most common mistake here.",
    sampleAnswer: "\"I'd recommend using a CRM system so our sales team can log every customer interaction. That way, when a customer calls back, whoever answers can see their order history immediately and offer more relevant recommendations, which builds trust and speeds up the sale.\""
  },
  {
    id: "concept-of-insurance",
    title: "Explain the concept of insurance",
    cluster: "Finance / Personal Financial Literacy",
    explanation: "Insurance is a risk-management tool where a person or business pays a premium to an insurer in exchange for financial protection against a specified loss, spreading risk across many policyholders.",
    example: "A homeowner pays a monthly premium so that if their house is damaged in a fire, the insurance company covers the repair costs instead of the homeowner paying entirely out of pocket.",
    judgeExpectations: "Judges want you to explain the risk-transfer idea (premium now in exchange for protection against a larger potential loss later), not just 'insurance protects you.'",
    commonMistakes: "Competitors often skip explaining premiums entirely or confuse insurance with savings, missing that insurance is about pooling and transferring risk.",
    sampleAnswer: "\"Insurance lets us transfer the financial risk of something bad happening — like a fire or an accident — to an insurance company. We pay a smaller, predictable premium regularly, so that if something rare but expensive happens, we're not stuck paying the full cost ourselves.\""
  },
  {
    id: "managerial-accounting",
    title: "Discuss the nature of managerial accounting",
    cluster: "Finance",
    explanation: "Managerial accounting is the process of preparing financial reports and data for internal use — helping managers plan, control costs, and make operational decisions — as opposed to financial accounting, which is for external stakeholders.",
    example: "A factory manager uses a cost report showing the cost per unit produced to decide whether to keep running an older machine or invest in a newer, more efficient one.",
    judgeExpectations: "Judges want you to contrast managerial accounting (internal, decision-focused) with financial accounting (external, compliance-focused), and tie it to an actual internal decision.",
    commonMistakes: "A common mistake is describing financial statements meant for investors (like an annual report) instead of internal reports meant for managers.",
    sampleAnswer: "\"As the manager, I'd use managerial accounting reports — specifically a cost-per-unit breakdown — to decide whether raising prices or cutting costs makes more sense. This is different from our financial statements, which are for our external investors and lenders.\""
  },
  {
    id: "effective-communications",
    title: "Explain the nature of effective communications",
    cluster: "Communications / Business Administration Core",
    explanation: "Effective communication means a message is clearly understood as intended by the sender, which requires clarity, the right channel, active listening, and feedback to confirm understanding.",
    example: "A manager giving instructions confirms understanding by asking the employee to repeat back the key steps, catching a misunderstanding before it causes an error.",
    judgeExpectations: "Judges want you to mention two-way communication (feedback/confirmation), not just 'saying things clearly.' Bonus points for naming barriers to communication and how to overcome them.",
    commonMistakes: "Competitors often define communication as one-directional (just sending a message) and forget that effective communication requires confirming the receiver understood correctly.",
    sampleAnswer: "\"To make sure this instruction is communicated effectively, I'd explain it clearly, choose an appropriate channel — maybe a quick meeting instead of just an email for something urgent — and then ask the team to summarize back what they heard, so I can catch any misunderstanding immediately.\""
  },
  {
    id: "need-for-financial-information",
    title: "Describe the need for financial information",
    cluster: "Finance",
    explanation: "Businesses and individuals need financial information to track performance, make informed decisions, satisfy legal/tax requirements, and communicate financial health to stakeholders like investors, lenders, and owners.",
    example: "A small business owner reviews monthly income statements to catch a decline in profit margin early, before it becomes a bigger cash-flow problem.",
    judgeExpectations: "Judges want multiple reasons (decision-making, compliance, communicating to stakeholders) rather than just one, and ideally a specific example of a decision that financial information supports.",
    commonMistakes: "Competitors often only mention 'to pay taxes' and miss the broader decision-making and stakeholder-communication purposes.",
    sampleAnswer: "\"We need financial information for a few reasons: to track whether we're actually profitable, to meet legal reporting and tax requirements, and to show lenders or investors that we're a sound business worth funding or continuing to support.\""
  },
  {
    id: "customer-relationship-management",
    title: "Explain the concept of customer relationship management",
    cluster: "Marketing",
    explanation: "Customer relationship management (CRM) is the ongoing process businesses use to build and maintain positive, long-term relationships with customers in order to increase loyalty and repeat business.",
    example: "A retailer's loyalty program tracks purchase history and sends personalized discount offers on items a customer buys often, encouraging repeat visits.",
    judgeExpectations: "Judges want the connection between CRM activities and the goal of customer loyalty/retention — not just 'being nice to customers.'",
    commonMistakes: "A common mistake is describing customer service (handling a single complaint) instead of the longer-term relationship-building strategy CRM actually describes.",
    sampleAnswer: "\"I'd build our customer relationship management around a loyalty program that tracks what each customer buys, so we can send them personalized offers. This keeps customers coming back because they feel like the business understands their preferences, not just treated as a one-time sale.\""
  },
  {
    id: "positioning-products-services",
    title: "Describe factors used by businesses to position products/services",
    cluster: "Marketing",
    explanation: "Positioning is how a business shapes the way a product is perceived relative to competitors, using factors like price, quality, features, target market, and brand image to carve out a distinct place in the customer's mind.",
    example: "A coffee brand positions itself as the 'premium, ethically-sourced' option, charging a higher price and emphasizing sourcing transparency, rather than competing purely on low price.",
    judgeExpectations: "Judges want at least two or three specific positioning factors (not just 'price') and ideally a clear example of how those factors differentiate the business from competitors.",
    commonMistakes: "Competitors often name only price or only quality and don't explain how that factor differentiates the business from a specific type of competitor.",
    sampleAnswer: "\"We'd position our product around quality and brand image rather than price — emphasizing premium ingredients and ethical sourcing lets us stand apart from lower-cost competitors and justify a higher price point to the customers who value that.\""
  }
];

// ========================= GLOBALS =========================
let currentUser = null;
let userData = null;
let courses = [];
let coursesLoaded = false;
let currentCourseId = null;
let currentLesson = null;
let currentUnitKey = null;
let currentUnitTab = "video";
let quizState = {};
let lbMode = "xp";
let adminSelectedCourseId = null;
let adminActiveSubTab = "courses";
let kpis = [];
let kpisLoaded = false;
let selectedKPIId = null;
let kpiActiveCategory = "Marketing";
let calendarEvents = [];
let calendarEventsLoaded = false;
let adminEditingEventId = null;
let blogs = [];
let blogsLoaded = false;
let adminEditingBlogId = null;
let examState = null;
let examTimerInterval = null;

// ========================= LOGIN =========================
async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error("Popup sign-in failed, falling back to redirect:", e);
    if (/popup|cancelled|closed|blocked|Database/i.test(e.message || "")) {
      await signInWithRedirect(auth, provider);
    } else {
      alert(e.message);
    }
  }
}

getRedirectResult(auth).catch(e => console.error("Redirect sign-in failed:", e));

document.getElementById("landingLogin")?.addEventListener("click", loginWithGoogle);
document.getElementById("heroLogin")?.addEventListener("click", loginWithGoogle);
document.getElementById("aboutLogin")?.addEventListener("click", loginWithGoogle);

// Bound once here, not inside renderSidebar(). renderSidebar runs on every XP
// change, and re-binding there stacked up a new listener each time — one click
// then fired signOut several times over.
document.getElementById("logoutBtn")?.addEventListener("click", () => signOut(auth));

// ========================= AUTH STATE =========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    document.getElementById("nav-admin")?.classList.toggle("hidden", !isAdmin(user));

    document.getElementById("landingPage")?.classList.add("hidden");
    document.getElementById("portal")?.classList.remove("hidden");

    // Everything that reads Firestore starts here, not at page load.
    startDataLoads();

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName || "DECA Student",
          email: user.email,
          photoURL: user.photoURL || "",
          chapter: "",
          association: "",
          xp: 0,
          streak: 0,
          bestStreak: 0,
          lastActiveDate: "",
          completedLessons: [],
          completedQuizzes: 0,
          earnedBadges: [],
          quizScores: {},
          bookmarkedLessons: [],
          bookmarkedKPIs: [],
          examAttempts: [],
          preparedEventReviews: []
        });
      }

      const fresh = await getDoc(userRef);
      userData = fresh.data();
      // Fill in defaults locally for accounts created before these fields existed
      userData.association = userData.association || "";
      userData.bookmarkedLessons = userData.bookmarkedLessons || [];
      userData.bookmarkedKPIs = userData.bookmarkedKPIs || [];
      userData.examAttempts = userData.examAttempts || [];
      userData.preparedEventReviews = userData.preparedEventReviews || [];

      await updateStreak(userRef);
      renderAll();
    } catch (e) {
      console.error("Failed to load user data:", e);
      showLoadError(
        "We couldn't load your profile data. This is usually a Firestore permissions issue — check the browser console for the exact error, and double-check your Firestore Security Rules allow this user to read/write their own document."
      );
    }
  } else {
    currentUser = null;
    userData = null;
    if (examTimerInterval) { clearInterval(examTimerInterval); examTimerInterval = null; }
    document.getElementById("portal")?.classList.add("hidden");
    document.getElementById("landingPage")?.classList.remove("hidden");
  }
});

// ========================= ERROR DISPLAY =========================
function showLoadError(message) {
  const grid = document.getElementById("courseGrid");
  if (grid) {
    grid.innerHTML = `<div class="lb-loading">${icon("alert")} ${message}</div>`;
  }
  const dash = document.getElementById("featuredCourses");
  if (dash) {
    dash.innerHTML = `<div class="lb-loading">${icon("alert")} ${message}</div>`;
  }
}

// ========================= STREAK =========================
async function updateStreak(userRef) {
  const today = new Date().toISOString().slice(0, 10);
  const last = userData.lastActiveDate || "";
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let newStreak = userData.streak || 0;
  if (last === today) return; // already counted today

  if (last === yesterday) {
    newStreak += 1;
  } else if (last !== today) {
    newStreak = 1;
  }

  const bestStreak = Math.max(newStreak, userData.bestStreak || 0);
  await updateDoc(userRef, { streak: newStreak, bestStreak, lastActiveDate: today });
  userData.streak = newStreak;
  userData.bestStreak = bestStreak;
  userData.lastActiveDate = today;

  if ([3, 7, 14, 30, 50, 100].includes(newStreak)) {
    setTimeout(() => {
      f4gNotice(`${newStreak} day streak`, "That consistency is the whole game. Keep going.");
      f4gBurst(120, window.innerHeight - 90, 22, 150);
    }, 900);
  }
}

// ========================= DATA LOADS =========================
// These all read Firestore, and Firestore rules require a signed-in user.
// Calling them at page load fired them BEFORE Firebase finished restoring the
// session, so every one came back "Missing or insufficient permissions".
// onAuthStateChanged calls startDataLoads() instead, once there's a real user.
let dataLoadsStarted = false;
function startDataLoads() {
  if (dataLoadsStarted) return;
  dataLoadsStarted = true;
  loadCourses();
  loadKPIs();
  loadCalendarEvents();
  loadBlogs();
  loadRubrics();
}

// This one touches no network, so it can run immediately.
populateAssociationsDatalist();

// ========================= COURSES LOAD =========================
// Courses live in the "courses" collection in Firestore so admin edits are
// saved permanently for every user. courses.json seeds the database the first
// time (see adminSeedCourses) or acts as an offline fallback.
async function loadCourses() {
  try {
    const snap = await getDocs(collection(db, "courses"));
    if (!snap.empty) {
      courses = snap.docs.map((d, i) => normalizeCourse(d.data(), i));
      coursesLoaded = true;
      renderCourseGrid();
      renderFeaturedCourses();
      renderPlannerForm();
      if (document.getElementById("admin")?.classList.contains("active")) renderAdminPanel();
      return;
    }
  } catch (e) {
    console.error("Failed to load courses from Firestore:", e);
  }

  try {
    const r = await fetch("courses.json");
    if (!r.ok) throw new Error(`courses.json returned ${r.status}`);
    const data = await r.json();
    courses = data.map(normalizeCourse);
    coursesLoaded = true;
    renderCourseGrid();
    renderFeaturedCourses();
    renderPlannerForm();
  } catch (err) {
    console.error("Failed to load courses:", err);
    showLoadError(
      "We couldn't load the course catalog. Check that courses.json exists and that Firestore rules allow reading the 'courses' collection."
    );
  }
}

function normalizeCourse(course, courseIndex = 0) {
  return {
    color: [
      "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"
    ][courseIndex % 6],
    level: "Beginner",
    duration: "Self-paced",
    ...course,
    lessons: (course.lessons || []).map((lesson, lessonIndex) => ({
      id: lesson.id || `${course.id}-lesson-${lessonIndex + 1}`,
      xp: lesson.xp || 25,
      duration: lesson.duration || "10 min",
      ...lesson
    }))
  };
}

// ========================= KPI LOAD =========================
// The full DECA Marketing Career Cluster PI list lives in kpis.json (static,
// free to serve). Firestore's "kpis" collection holds ONLY admin changes —
// edited study notes, brand-new PIs, and { id, hidden: true } markers — so
// student page loads cost almost no Firestore reads.
// Every PI file the site loads. Add a cluster by dropping its JSON next to
// index.html and adding the filename here — nothing else needs to change.
const KPI_FILES = ["kpis.json", "kpis-finance.json"];

async function loadKPIs() {
  let base = [];

  const files = await Promise.all(KPI_FILES.map(async name => {
    try {
      const r = await fetch(name);
      if (!r.ok) throw new Error(`${name} returned ${r.status}`);
      return await r.json();
    } catch (e) {
      console.error(`Failed to load ${name}:`, e);
      return [];
    }
  }));

  // The Business Administration Core is shared across clusters, so the same PI
  // code shows up in several files. Merge on the code rather than the id: keep
  // one entry, prefer whichever copy actually has study notes, and collect
  // every cluster it appears in.
  const byCode = new Map();
  files.flat().forEach(k => {
    if (!k || !k.id) return;
    const key = k.code || k.id;
    const prev = byCode.get(key);
    if (!prev) { byCode.set(key, { ...k, appearsIn: [...(k.appearsIn || [])] }); return; }

    const prevHasNotes = !!(prev.explanation || prev.sampleAnswer);
    const nextHasNotes = !!(k.explanation || k.sampleAnswer);
    const merged = (!prevHasNotes && nextHasNotes) ? { ...prev, ...k } : { ...k, ...prev };
    merged.appearsIn = [...new Set([...(prev.appearsIn || []), ...(k.appearsIn || [])])];
    byCode.set(key, merged);
  });

  base = [...byCode.values()];
  if (!base.length) base = KPI_SEED;

  let overrides = [];
  try {
    const snap = await getDocs(collection(db, "kpis"));
    overrides = snap.docs.map(d => d.data());
  } catch (e) {
    console.error("Failed to load KPI overrides from Firestore:", e);
  }

  const byId = new Map(base.map(k => [k.id, k]));
  overrides.forEach(o => {
    if (!o || !o.id) return;
    if (o.hidden) byId.delete(o.id);
    else byId.set(o.id, { ...(byId.get(o.id) || {}), ...o });
  });

  kpis = [...byId.values()];
  kpisLoaded = true;
  renderKPIList();
  if (document.getElementById("admin")?.classList.contains("active")) renderAdminPanel();
}

// ========================= RENDER ALL =========================
function renderAll() {
  if (!userData) return;
  renderSidebar();
  renderDashboard();
  renderCourseGrid();
  renderProfile();
  renderLeaderboard();
  renderPlannerForm();
  if (isAdmin(currentUser)) renderAdminPanel();
}

// ========================= SIDEBAR =========================
function renderSidebar() {
  const animal = getAnimalForXP(userData.xp);

  let prevXP = 0;
  if (animal.index > 0) prevXP = ANIMALS[animal.index - 1].xpNeeded;
  const tierXP = animal.xpNeeded === Infinity ? 999 : animal.xpNeeded - prevXP;
  const fill = animal.xpNeeded === Infinity ? 100 : Math.min(100, ((userData.xp - prevXP) / tierXP) * 100);

  document.getElementById("saName").textContent = animal.name;
  document.getElementById("saXp").textContent = `${userData.xp} / ${animal.xpNeeded === Infinity ? "MAX" : animal.xpNeeded} XP`;
  document.getElementById("saFill").style.width = fill + "%";
}

// ========================= DASHBOARD =========================
function renderDashboard() {
  const animal = getAnimalForXP(userData.xp);
  const next = ANIMALS[Math.min(animal.index + 1, ANIMALS.length - 1)];

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Good Afternoon" : "Evenin";
  const name = (userData.displayName || "Farmer").split(" ")[0];
  document.getElementById("dashGreeting").textContent = `${greeting}, ${name}! `;

  // Stats (animated roll-up)
  f4gCountUp(document.getElementById("statXP"), userData.xp);
  f4gCountUp(document.getElementById("statStreak"), userData.streak, 600);
  document.getElementById("statAnimalName").textContent = animal.name;
  f4gCountUp(document.getElementById("statLessons"), (userData.completedLessons || []).length, 600);

  // Animal card
  document.getElementById("acName").textContent = animal.name;
  document.getElementById("acTagline").textContent = `"${animal.tagline}"`;
  document.getElementById("acLevel").textContent = `Level ${animal.level}`;
  document.getElementById("acNextName").textContent = next.name;
  document.getElementById("acXP").textContent = userData.xp;

  let prevXP = animal.index > 0 ? ANIMALS[animal.index - 1].xpNeeded : 0;
  const tierXP = animal.xpNeeded === Infinity ? 999 : animal.xpNeeded - prevXP;
  const fill = animal.xpNeeded === Infinity ? 100 : Math.min(100, ((userData.xp - prevXP) / tierXP) * 100);
  document.getElementById("acXPBar").style.width = fill + "%";
  document.getElementById("acXPNeeded").textContent =
    animal.xpNeeded === Infinity ? "MAX LEVEL!" : `${animal.xpNeeded - userData.xp} XP to evolve`;

  renderFeaturedCourses();
  renderStreakWidget();
  renderBadgesWidget();
}

function renderFeaturedCourses() {
  const container = document.getElementById("featuredCourses");
  if (!container || !courses.length) return;

  const withLessons = courses.filter(c => c.lessons.length > 0);
  const scored = withLessons.map(c => ({ course: c, ...courseProgress(c) }));

  const started = scored.filter(r => r.done > 0);
  const inProgress = started.filter(r => r.pct < 100).sort((a, b) => b.pct - a.pct);
  const finished = started.filter(r => r.pct === 100);
  const show = [...inProgress, ...finished].slice(0, 5);

  // Heading above this list (the Dashboard's "Courses" title).
  const heading = document.querySelector("#dashboard .dash-left .section-title");

  if (!show.length) {
    // Nothing started yet — suggest the courses with the most content.
    const picks = [...scored].sort((a, b) => b.total - a.total).slice(0, 4);
    if (heading) heading.textContent = "Start here";

    container.innerHTML = picks.length
      ? `<div class="page-sub" style="margin:-6px 0 14px;">You haven't started a course yet. These are good places to begin.</div>`
      : `<div class="admin-empty-state">No courses available yet — check back soon.</div>`;

    picks.forEach(r => container.appendChild(pastureRow(r.course, r.pct, true)));
    return;
  }

  if (heading) heading.textContent = inProgress.length ? "Continue where you left off" : "Your courses";
  container.innerHTML = "";
  show.forEach(r => container.appendChild(pastureRow(r.course, r.pct, false)));
}

// One row in the dashboard course list.
function pastureRow(course, pct, isSuggestion) {
  const unitCount = buildUnits(course).length;
  const row = document.createElement("div");
  row.className = "pasture-row";
  row.onclick = () => openCourse(course.id);
  row.innerHTML = `
    <div class="pasture-icon" style="background:${course.color}22;color:${course.color};">${icon(groupIcon(course.group))}</div>
    <div class="pasture-info">
      <div class="pasture-title">${course.title}</div>
      <div class="pasture-pct">${isSuggestion ? `${unitCount} units · not started` : `${pct}% complete`}</div>
      <div class="pasture-bar-outer">
        <div class="pasture-bar-inner" style="width:${pct}%;background:${course.color || "#22c55e"};"></div>
      </div>
    </div>
    <div class="pasture-arrow">${isSuggestion ? "Start ›" : "›"}</div>
  `;
  return row;
}

function renderStreakWidget() {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon
  const container = document.getElementById("streakDays");
  if (!container) return;
  container.innerHTML = "";

  days.forEach((d, i) => {
    const isToday = i === todayIdx;
    const done = userData.streak > 0 && i <= todayIdx;
    const div = document.createElement("div");
    div.className = "streak-day";
    div.innerHTML = `
      <div class="streak-circle ${isToday ? "today" : done ? "done" : ""}">${d[0]}</div>
      <div class="streak-day-label">${d}</div>
    `;
    container.appendChild(div);
  });

  document.getElementById("streakNum").textContent = userData.streak;
  document.getElementById("bestStreakBadge").textContent = `Best: ${userData.bestStreak || 0}d`;
  document.getElementById("streakMsg").textContent =
    userData.streak > 0 ? `${userData.streak} day streak! Keep it up! ` : "Start your streak today! ";
}

function renderBadgesWidget() {
  const container = document.getElementById("dashBadges");
  if (!container) return;
  container.innerHTML = "";

  const earned = userData.earnedBadges || [];
  const unlocked = checkNewBadges();
  const all = [...earned, ...unlocked.filter(b => !earned.includes(b))];

  BADGES.forEach(badge => {
    const has = all.includes(badge.id);
    const div = document.createElement("div");
    div.className = "badge-item";
    div.innerHTML = `
      <div class="badge-icon-wrap ${has ? "unlocked" : "locked"}">${icon(badge.icon)}</div>
      <div class="badge-name">${badge.name}</div>
    `;
    container.appendChild(div);
  });

  const earnedCount = all.filter(id => BADGES.find(b => b.id === id)).length;
  document.getElementById("badgeMsg").style.display = earnedCount > 0 ? "none" : "block";
}

// ========================= COURSE GRID =========================
function renderCourseGrid() {
  const container = document.getElementById("courseGrid");
  if (!container) return;

  if (!coursesLoaded) {
    container.innerHTML = `<div class="lb-loading">Loading courses... </div>`;
    return;
  }

  if (!courses.length) {
    container.innerHTML = `<div class="lb-loading">No courses found. </div>`;
    return;
  }

  const filterContainer = document.getElementById("categoryFilters");
  if (filterContainer && filterContainer.children.length === 0) {
    // Fixed category list, plus anything an admin-added course introduces.
    const extras = courses
      .map(courseCategory)
      .filter(cat => cat && !COURSE_CATEGORIES.includes(cat));
    const cats = ["All Courses", ...COURSE_CATEGORIES, ...new Set(extras)];
    cats.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "cat-btn" + (cat === "All Courses" ? " active" : "");
      btn.textContent = cat;
      btn.onclick = () => {
        document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        filterCourses();
      };
      filterContainer.appendChild(btn);
    });
  }

  renderFilteredCourses(courses);
}

window.filterCourses = function() {
  const q = document.getElementById("courseSearch")?.value.toLowerCase() || "";
  const activeCat = document.querySelector(".cat-btn.active")?.textContent || "All Courses";
  const filtered = courses.filter(c => {
    const matchCat = activeCat === "All Courses" || courseCategory(c) === activeCat;
    const matchQ = c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  renderFilteredCourses(filtered);
};

function renderFilteredCourses(list) {
  const container = document.getElementById("courseGrid");
  if (!container) return;
  container.innerHTML = "";

  list.forEach(course => {
    const completed = (userData?.completedLessons || []).filter(id => course.lessons.some(l => l.id === id)).length;
    const pct = course.lessons.length
      ? Math.round((completed / course.lessons.length) * 100)
      : 0;
    const unitCount = buildUnits(course).length;

    const card = document.createElement("div");
    card.className = "course-card-new";
    card.onclick = () => openCourse(course.id);
    card.innerHTML = `
      <div class="cc-body">
        <div class="cc-icon" style="background:${course.color}22;color:${course.color};">${icon(groupIcon(course.group))}</div>
        <div class="cc-title">${course.title}</div>
        <div class="cc-desc">${course.description}</div>
        <div class="cc-meta">
          <span> ${unitCount} ${unitCount === 1 ? "unit" : "units"}</span>
          <span> ${course.duration || "Self-paced"}</span>
        </div>
        <div class="cc-progress-bar">
          <div class="cc-progress-fill" style="width:${pct}%;background:${course.color};"></div>
        </div>
        <div class="cc-footer">
          <span class="cc-pct">${pct}% complete</span>
          <span class="cc-start">${pct > 0 ? "Continue" : "Start Learning"} ›</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  if (list.length === 0) {
    const activeCat = document.querySelector(".cat-btn.active")?.textContent || "All Courses";
    const q = document.getElementById("courseSearch")?.value.trim() || "";
    container.innerHTML = q
      ? `<div class="lb-loading">No courses match "${q}".</div>`
      : `<div class="lb-loading">No courses in ${activeCat} yet — we're building them out. Check back soon.</div>`;
  }
}

// ========================= OPEN COURSE (unit list) =========================
// One row per unit. Everything inside a unit — video, practice questions,
// article — opens together in the unit view, behind a tab bar.
window.openCourse = function(id) {
  currentCourseId = id;
  currentUnitKey = null;
  const course = courses.find(c => c.id === id);
  if (!course) return;

  const bookmarked = userData?.bookmarkedLessons || [];
  showTab("lessonView");

  const units = buildUnits(course);

  const examQuestionCount = course.lessons
    .filter(l => l.type === "quiz")
    .reduce((sum, l) => sum + (l.questions?.length || 0), 0);

  const container = document.getElementById("lessonViewContent");
  container.innerHTML = `
    <div class="lesson-view-wrap">
      <div class="lv-back" onclick="showTab('courses')">← Back to Courses</div>
      <div class="lv-header">
        <h1>${course.title}</h1>
        <div class="lv-desc">${course.description}</div>
      </div>
      ${courseIsComplete(course) ? `
        <div class="cert-cta">
          <div>
            <div class="cert-cta-title">${icon("award")} Course complete</div>
            <div class="cert-cta-desc">You've finished every unit in ${course.title}. Grab your certificate.</div>
          </div>
          <button class="btn-primary" onclick="downloadCertificate('${course.id}')">Download Certificate →</button>
        </div>
      ` : ""}
      ${examQuestionCount >= 10 ? `
        <div class="exam-cta">
          <div>
            <div class="exam-cta-title">${icon("timer")} Practice Exam</div>
            <div class="exam-cta-desc">Take a full timed exam pulled from all ${examQuestionCount} practice questions in this course.</div>
          </div>
          <button class="btn-primary" onclick="openExamSetup('${course.id}')">Take Practice Exam →</button>
        </div>
      ` : ""}
      <div class="lessons-list">
        ${units.map(unit => unitRowHtml(course, unit, bookmarked)).join("")
          || `<div class="admin-empty-state">No units in this course yet — check back soon.</div>`}
      </div>
    </div>
  `;
};

function unitRowHtml(course, unit, bookmarked) {
  const parts = [
    { key: "video",    label: "Video",             lesson: unit.video },
    { key: "practice", label: "Practice questions", lesson: unit.quiz },
    { key: "article",  label: "Article",            lesson: unit.article }
  ];

  const allDone = unit.lessons.length > 0 && unit.lessons.every(l => unitPartDone(l));
  const bookmarkTarget = (unit.video || unit.quiz || unit.article)?.id || "";
  const isBookmarked = bookmarked.includes(bookmarkTarget);

  const chips = parts.map(p => {
    if (!p.lesson) return `<span class="unit-chip missing">${p.label}</span>`;
    return `<span class="unit-chip ${unitPartDone(p.lesson) ? "done" : ""}">${
      unitPartDone(p.lesson) ? icon("check") : ""
    }${p.label}</span>`;
  }).join("");

  return `
    <div class="lesson-row unit-row ${allDone ? "done" : ""}" onclick="openUnit('${course.id}', '${unit.key}')">
      <div class="lr-status ${allDone ? "completed" : "pending"}">${allDone ? "✓" : unit.number}</div>
      <div class="lr-info">
        <div class="lr-title">${unit.title}</div>
        <div class="unit-chips">${chips}</div>
      </div>
      <button class="bookmark-btn ${isBookmarked ? "active" : ""}" onclick="event.stopPropagation(); toggleLessonBookmark('${bookmarkTarget}')" title="${isBookmarked ? "Remove bookmark" : "Bookmark this unit"}">${icon(isBookmarked ? "bookmarkFilled" : "bookmark")}</button>
      <span class="lr-xp">+${unit.xp} XP</span>
      <span class="lr-arrow">›</span>
    </div>
  `;
}

// ========================= UNIT VIEW (tabbed) =========================
window.openUnit = function(courseId, unitKey, tab) {
  const course = courses.find(c => c.id === courseId);
  const unit = findUnit(courseId, unitKey);
  if (!course || !unit) return;

  currentCourseId = courseId;
  currentUnitKey = unitKey;

  // Land on the first tab that actually has something in it.
  const available = ["video", "practice", "article"].filter(t => unitLessonForTab(unit, t));
  currentUnitTab = tab && available.includes(tab) ? tab : (available[0] || "video");

  showTab("lessonView");

  document.getElementById("lessonViewContent").innerHTML = `
    <div class="unit-view-wrap">
      <div class="lv-back" onclick="openCourse('${course.id}')">← ${course.title}</div>
      <div class="unit-view-head">
        <h1>${unit.title}</h1>
        <div class="unit-view-meta">${unit.lessons.length} ${unit.lessons.length === 1 ? "part" : "parts"} · ${unit.xp} XP total</div>
      </div>
      <div class="unit-tabs" id="unitTabs" role="tablist"></div>
      <div class="unit-pane" id="unitPane"></div>
    </div>
  `;

  renderUnitTabs();
  renderUnitPane();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

function unitLessonForTab(unit, tab) {
  if (tab === "practice") return unit.quiz;
  if (tab === "article") return unit.article;
  return unit.video;
}

window.switchUnitTab = function(tab) {
  currentUnitTab = tab;
  renderUnitTabs();
  renderUnitPane();
};

function renderUnitTabs() {
  const bar = document.getElementById("unitTabs");
  const unit = findUnit(currentCourseId, currentUnitKey);
  if (!bar || !unit) return;

  const tabs = [
    { key: "video",    label: "Video",              iconName: "play" },
    { key: "practice", label: "Practice questions", iconName: "quiz" },
    { key: "article",  label: "Article",            iconName: "file" }
  ];

  bar.innerHTML = tabs.map(t => {
    const lesson = unitLessonForTab(unit, t.key);
    const done = unitPartDone(lesson);
    return `
      <button class="unit-tab ${t.key === currentUnitTab ? "active" : ""} ${lesson ? "" : "empty"}"
              role="tab" aria-selected="${t.key === currentUnitTab}"
              onclick="switchUnitTab('${t.key}')">
        ${icon(done ? "check" : t.iconName)}<span>${t.label}</span>
      </button>
    `;
  }).join("");
}

function renderUnitPane() {
  const pane = document.getElementById("unitPane");
  const course = courses.find(c => c.id === currentCourseId);
  const unit = findUnit(currentCourseId, currentUnitKey);
  if (!pane || !course || !unit) return;

  if (currentUnitTab === "practice") {
    if (!unit.quiz) {
      pane.innerHTML = emptyPaneHtml("Practice questions for this unit are coming soon.");
      return;
    }
    currentLesson = unit.quiz;
    openQuiz(course, unit.quiz, true);
    return;
  }

  if (currentUnitTab === "article") {
    if (!unit.article || !unit.article.url) {
      pane.innerHTML = emptyPaneHtml("The reading for this unit hasn't been added yet.");
      return;
    }
    currentLesson = unit.article;
    pane.innerHTML = unitArticleHtml(unit.article);
    return;
  }

  if (!unit.video || !unit.video.url) {
    pane.innerHTML = emptyPaneHtml("The video for this unit hasn't been added yet.");
    return;
  }
  currentLesson = unit.video;
  pane.innerHTML = unitVideoHtml(unit.video);
}

function emptyPaneHtml(message) {
  return `<div class="admin-empty-state">${message}</div>`;
}

function youtubeIdFromUrl(url) {
  const raw = String(url || "");
  if (raw.includes("v=")) return raw.split("v=")[1].split("&")[0];
  if (raw.includes("youtu.be/")) return raw.split("youtu.be/")[1].split("?")[0];
  return raw.split("/").pop().split("?")[0];
}

function unitVideoHtml(lesson) {
  const isCompleted = unitPartDone(lesson);
  const videoId = youtubeIdFromUrl(lesson.url);

  return `
    <div class="video-container">
      <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
    </div>
    <div class="vl-info">
      <div class="vl-meta">Video lesson · ${lesson.duration} · +${lesson.xp} XP on completion</div>
      <button class="complete-btn" id="completeBtn" onclick="completeLesson('${lesson.id}', ${lesson.xp})" ${isCompleted ? "disabled" : ""}>
        ${isCompleted ? "✓ Completed" : "Mark as Complete (+" + lesson.xp + " XP)"}
      </button>
    </div>
  `;
}

// PDF articles. iOS Safari refuses to render a PDF inside <object>, so the
// open/download buttons sit ABOVE the viewer — on a phone they're the real
// way in, not a fallback.
function unitArticleHtml(lesson) {
  const isCompleted = unitPartDone(lesson);
  const url = lesson.url;

  return `
    <div class="unit-pdf-actions">
      <a class="unit-pdf-link" href="${url}" target="_blank" rel="noopener">${icon("external")} Open in new tab</a>
      <a class="unit-pdf-link" href="${url}" download>${icon("download")} Download PDF</a>
    </div>
    <object class="unit-pdf" data="${url}" type="application/pdf">
      <div class="admin-empty-state">Your browser can't show the PDF inline — use the buttons above to read it.</div>
    </object>
    <div class="vl-info">
      <div class="vl-meta">Article · ${lesson.duration} · +${lesson.xp} XP on completion</div>
      <button class="complete-btn" id="completeBtn" onclick="completeLesson('${lesson.id}', ${lesson.xp})" ${isCompleted ? "disabled" : ""}>
        ${isCompleted ? "✓ Completed" : "Mark as Read (+" + lesson.xp + " XP)"}
      </button>
    </div>
  `;
}

// ========================= OPEN LESSON =========================
// Kept for bookmarks and analytics links — it now routes into the unit view
// and selects the right tab instead of opening a bare lesson page.
window.openLesson = function(courseId, lessonId) {
  const course = courses.find(c => c.id === courseId);
  const lesson = course?.lessons.find(l => l.id === lessonId);
  if (!course || !lesson) return;
  currentLesson = lesson;
  openUnit(courseId, unitKeyFor(lesson), tabForLesson(lesson));
};

// ========================= COMPLETE LESSON =========================
window.completeLesson = async function(lessonId, xp) {
  if (!currentUser || !userData) return;
  const already = (userData.completedLessons || []).includes(lessonId);
  if (already) return;

  try {
    const userRef = doc(db, "users", currentUser.uid);
    const newXP = userData.xp + xp;
    const oldAnimal = getAnimalForXP(userData.xp);
    const newAnimal = getAnimalForXP(newXP);

    const completed = [...(userData.completedLessons || []), lessonId];
    const type = currentLesson?.type === "article" ? "article" : "video";
    const activityLog = [...(userData.activityLog || []), { date: new Date().toISOString().slice(0, 10), xp, lessonId, type }].slice(-300);
    await updateDoc(userRef, {
      xp: newXP,
      completedLessons: completed,
      activityLog
    });

    userData.xp = newXP;
    userData.completedLessons = completed;
    userData.activityLog = activityLog;

    showXPToast(xp);

    if (newAnimal.index > oldAnimal.index) {
      setTimeout(() => showLevelUpModal(newAnimal), 800);
    }

    await checkAndAwardBadges();

    renderSidebar();
    const btn = document.querySelector("#completeBtn");
    if (btn) { btn.disabled = true; btn.textContent = "✓ Completed"; }
    if (currentUnitKey) renderUnitTabs();
    renderDashboard();
  } catch (e) {
    console.error("Failed to save lesson completion:", e);
    alert("Couldn't save your progress — check the console for details.");
  }
};

// ========================= QUIZ ENGINE =========================
// The quiz renders into the unit's tab pane when it's opened from a unit, and
// into the full lesson view otherwise (which is what the practice exam and any
// direct link still use).
function quizMount() {
  if (quizState.inUnit) {
    return document.getElementById("unitPane") || document.getElementById("lessonViewContent");
  }
  return document.getElementById("lessonViewContent");
}

function openQuiz(course, lesson, inUnit) {
  quizState = {
    course, lesson,
    questions: lesson.questions || [],
    current: 0,
    score: 0,
    answered: false,
    inUnit: !!inUnit
  };

  if (!quizState.questions.length) {
    const mount = quizMount();
    if (!mount) return;
    mount.innerHTML = quizState.inUnit
      ? emptyPaneHtml("This quiz doesn't have any questions yet. Check back soon!")
      : `<div class="quiz-wrap">
           <div class="quiz-back" onclick="openCourse('${course.id}')">← ${course.title}</div>
           <div class="admin-empty-state">This quiz doesn't have any questions yet. Check back soon!</div>
         </div>`;
    return;
  }

  renderQuizQuestion();
}

function renderQuizQuestion() {
  const { questions, current, lesson, course } = quizState;
  const q = questions[current];
  const pct = Math.round((current / questions.length) * 100);
  const mount = quizMount();
  if (!mount) return;

  const header = `
    <div class="quiz-header">
      ${quizState.inUnit ? "" : `<h2>${lesson.title}</h2>`}
      <div class="quiz-progress-row">
        <span>Question ${current + 1} of ${questions.length}</span>
        <span>Score: ${quizState.score}/${current}</span>
      </div>
      <div class="quiz-pbar-outer"><div class="quiz-pbar-inner" style="width:${pct}%"></div></div>
    </div>
  `;

  const card = `
    <div class="quiz-question-card">
      <div class="question-text">${q.q}</div>
      <div class="options-list">
        ${q.options.map((opt, i) => `
          <button class="option-btn" onclick="selectAnswer(${i})">${opt}</button>
        `).join("")}
      </div>
      <div class="explanation-box" id="explanationBox">${q.explanation || ""}</div>
      <button class="next-btn" id="nextBtn" onclick="nextQuestion()">
        ${current + 1 === questions.length ? "See Results" : "Next Question →"}
      </button>
    </div>
  `;

  mount.innerHTML = quizState.inUnit
    ? header + card
    : `<div class="quiz-wrap">
         <div class="quiz-back" onclick="openCourse('${course.id}')">← ${course.title}</div>
         ${header}${card}
       </div>`;
}

window.selectAnswer = function(idx) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = quizState.questions[quizState.current];
  const btns = document.querySelectorAll(".option-btn");
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) btn.classList.add("correct");
    else if (i === idx) btn.classList.add("wrong");
  });

  if (idx === q.answer) {
    quizState.score++;
    f4gBurstFrom(btns[idx], 14);
  }

  const expBox = document.getElementById("explanationBox");
  if (expBox) expBox.classList.add("show");
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.classList.add("show");
};

window.nextQuestion = function() {
  quizState.current++;
  quizState.answered = false;
  if (quizState.current >= quizState.questions.length) {
    renderQuizResults();
  } else {
    renderQuizQuestion();
  }
};

async function renderQuizResults() {
  const { score, questions, lesson, course } = quizState;
  const pct = Math.round((score / questions.length) * 100);
  const passed = pct >= 60;
  const xpEarned = passed ? lesson.xp : Math.round(lesson.xp * 0.3);

  const mount = quizMount();
  const results = `
    <div class="quiz-results">
      <div class="results-title">${pct === 100 ? "Perfect Score!" : pct >= 80 ? "Great Job!" : pct >= 60 ? "Good Work!" : "Keep Studying!"}</div>
      <div class="results-score">${score} / ${questions.length} correct (${pct}%)</div>
      <div class="results-xp">+${xpEarned} XP Earned </div>
      <div class="results-btns">
        <button class="btn-primary" onclick="retakeQuiz()">Retake Quiz</button>
        <button class="btn-primary" onclick="openCourse('${course.id}')">Back to Course</button>
      </div>
    </div>
  `;
  if (mount) mount.innerHTML = quizState.inUnit ? results : `<div class="quiz-wrap">${results}</div>`;

  if (pct >= 80) {
    const card = document.querySelector(".quiz-results");
    if (card) f4gBurstFrom(card, pct === 100 ? 40 : 26);
  }

  if (!userData) return;
  const already = (userData.completedLessons || []).includes(lesson.id);

  try {
    const userRef = doc(db, "users", currentUser.uid);
    const newXP = userData.xp + xpEarned;
    const oldAnimal = getAnimalForXP(userData.xp);
    const newAnimal = getAnimalForXP(newXP);

    const updates = {
      xp: newXP,
      completedQuizzes: (userData.completedQuizzes || 0) + 1,
      [`quizScores.${lesson.id}`]: pct,
      activityLog: [...(userData.activityLog || []), { date: new Date().toISOString().slice(0, 10), xp: xpEarned, lessonId: lesson.id, type: "quiz", score: pct }].slice(-300)
    };

    if (!already && passed) {
      updates.completedLessons = [...(userData.completedLessons || []), lesson.id];
      userData.completedLessons = updates.completedLessons;
    }

    await updateDoc(userRef, updates);
    userData.xp = newXP;
    userData.completedQuizzes = (userData.completedQuizzes || 0) + 1;
    userData.activityLog = updates.activityLog;
    userData.quizScores = { ...(userData.quizScores || {}), [lesson.id]: pct };

    showXPToast(xpEarned);
    if (newAnimal.index > oldAnimal.index) {
      setTimeout(() => showLevelUpModal(newAnimal), 800);
    }
    await checkAndAwardBadges();
    renderSidebar();
    if (currentUnitKey) renderUnitTabs();
    renderDashboard();
  } catch (e) {
    console.error("Failed to save quiz results:", e);
  }
}

window.retakeQuiz = function() {
  quizState.current = 0;
  quizState.score = 0;
  quizState.answered = false;
  renderQuizQuestion();
};

// ========================= BADGES CHECK =========================
function checkNewBadges() {
  if (!userData || !courses) return [];
  return BADGES.filter(b => b.check(userData, courses)).map(b => b.id);
}

async function checkAndAwardBadges() {
  if (!currentUser || !userData) return;
  const earned = userData.earnedBadges || [];
  const shouldHave = checkNewBadges();
  const newOnes = shouldHave.filter(id => !earned.includes(id));
  if (!newOnes.length) return;

  try {
    const updated = [...earned, ...newOnes];
    await updateDoc(doc(db, "users", currentUser.uid), { earnedBadges: updated });
    userData.earnedBadges = updated;

    const badge = BADGES.find(b => b.id === newOnes[0]);
    if (badge) {
      setTimeout(() => {
        document.getElementById("badgeModalIcon").innerHTML = ICONS[badge.icon] || "";
        document.getElementById("badgeModalName").textContent = badge.name;
        document.getElementById("badgeModalDesc").textContent = badge.desc;
        document.getElementById("badgeModal").classList.remove("hidden");
        f4gBurst(window.innerWidth / 2, window.innerHeight / 2, 36, 210);
      }, 1200);
    }
  } catch (e) {
    console.error("Failed to award badges:", e);
  }
}

// ========================= LEADERBOARD =========================
async function renderLeaderboard() {
  const container = document.getElementById("leaderboardList");
  if (!container) return;

  try {
    const q = query(collection(db, "users"), orderBy(lbMode === "lessons" ? "xp" : lbMode, "desc"), limit(20));
    const snap = await getDocs(q);
    const users = [];
    snap.forEach(d => users.push({ id: d.id, ...d.data() }));

    if (lbMode === "lessons") {
      users.sort((a, b) => (b.completedLessons?.length || 0) - (a.completedLessons?.length || 0));
    }

    container.innerHTML = "";
    users.forEach((u, i) => {
      const isYou = u.id === currentUser?.uid;
      const rankClass = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
      const val = lbMode === "xp" ? (u.xp || 0) : lbMode === "streak" ? (u.streak || 0) : (u.completedLessons?.length || 0);
      const unit = lbMode === "xp" ? "XP" : lbMode === "streak" ? "days" : "lessons";
      const animal = getAnimalForXP(u.xp || 0);
      const rankContent = i === 0 ? icon("trophy") : i === 1 ? icon("medal") : i === 2 ? icon("award") : `#${i+1}`;

      const row = document.createElement("div");
      row.className = `lb-row${isYou ? " you" : ""}`;
      row.innerHTML = `
        <div class="lb-rank ${rankClass}">${rankContent}</div>
        <div class="lb-avatar">${animal.name}</div>
        <div class="lb-info">
          <div class="lb-name">${u.displayName || "DECA Student"}${isYou ? " (You)" : ""}</div>
          <div class="lb-chapter">${u.chapter || "No chapter set"} · ${animal.name}</div>
        </div>
        <div>
          <div class="lb-val">${val.toLocaleString()}</div>
          <div class="lb-unit">${unit}</div>
        </div>
      `;
      container.appendChild(row);
    });

    if (users.length === 0) {
      container.innerHTML = '<div class="lb-loading">No data yet. Be the first!</div>';
    }
  } catch (e) {
    container.innerHTML = `<div class="lb-loading">Couldn't load rankings — check Firestore rules.</div>`;
    console.error(e);
  }
}

window.switchLbTab = function(mode, el) {
  lbMode = mode;
  document.querySelectorAll(".lb-tab").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  renderLeaderboard();
};

// ========================= PERFORMANCE ANALYTICS =========================
function renderAnalytics() {
  const container = document.getElementById("analyticsContent");
  if (!container || !userData) return;

  const quizScores = userData.quizScores || {};
  const scoreEntries = Object.entries(quizScores);
  const avgScore = scoreEntries.length
    ? Math.round(scoreEntries.reduce((s, [, v]) => s + v, 0) / scoreEntries.length)
    : null;

  const courseRows = courses.map(course => {
    const completed = (userData.completedLessons || []).filter(id => course.lessons.some(l => l.id === id)).length;
    const pct = course.lessons.length ? Math.round((completed / course.lessons.length) * 100) : 0;
    const quizUnits = course.lessons.filter(l => l.type === "quiz" && quizScores[l.id] != null);
    return { course, pct, completed, quizUnits };
  }).filter(r => r.completed > 0 || r.quizUnits.length > 0);

  const log = userData.activityLog || [];
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const xpThatDay = log.filter(e => e.date === d).reduce((s, e) => s + (e.xp || 0), 0);
    days.push({ date: d, xp: xpThatDay });
  }
  const maxXp = Math.max(1, ...days.map(d => d.xp));

  const recommendations = buildRecommendations(courseRows, quizScores, log);

  container.innerHTML = `
    <div class="analytics-grid">
      <div class="stat-card"><div class="stat-value">${userData.xp}</div><div class="stat-label">Total XP</div></div>
      <div class="stat-card"><div class="stat-value">${(userData.completedLessons || []).length}</div><div class="stat-label">Lessons Done</div></div>
      <div class="stat-card"><div class="stat-value">${avgScore != null ? avgScore + "%" : "—"}</div><div class="stat-label">Avg Quiz Score</div></div>
      <div class="stat-card"><div class="stat-value">${userData.streak}</div><div class="stat-label">Day Streak</div></div>
    </div>

    <div class="widget" style="margin-bottom:24px;">
      <div class="widget-header"><span>XP — Last 7 Days</span></div>
      <div class="analytics-xp-chart">
        ${days.map(d => `
          <div class="analytics-xp-bar-wrap">
            <div class="analytics-xp-bar" style="height:${Math.max(4, (d.xp / maxXp) * 80)}px;" title="${d.xp} XP"></div>
            <div class="analytics-xp-label">${new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })}</div>
          </div>
        `).join("")}
      </div>
    </div>

    <h2 class="section-title">Recommended Next Steps</h2>
    ${recommendations.map(r => `
      <div class="rec-card">
        ${icon(r.icon)}
        <div>
          <div class="rec-card-title">${r.title}</div>
          <div class="rec-card-desc">${r.desc}</div>
          ${r.action ? `<button class="admin-btn-sm" style="margin-top:10px;" onclick="${r.action.call}">${r.action.label} →</button>` : ""}
        </div>
      </div>
    `).join("") || `<div class="admin-empty-state">Complete a few lessons to unlock personalized recommendations.</div>`}

    <h2 class="section-title" style="margin-top:28px;">Course Breakdown</h2>
    ${courseRows.map(r => `
      <div class="analytics-course-row">
        <div class="analytics-course-head">
          <span>${r.course.title}</span>
          <span>${r.pct}% complete</span>
        </div>
        <div class="pasture-bar-outer"><div class="pasture-bar-inner" style="width:${r.pct}%;background:${r.course.color};"></div></div>
        ${r.quizUnits.length ? `
          <div class="analytics-unit-list">
            ${r.quizUnits.map(l => {
              const score = quizScores[l.id];
              const cls = score >= 80 ? "good" : score >= 60 ? "mid" : "low";
              return `<div class="analytics-unit-row">${stripUnitSuffix(l.title)}<span class="analytics-score-pill ${cls}">${score}%</span></div>`;
            }).join("")}
          </div>
        ` : ""}
      </div>
    `).join("") || `<div class="admin-empty-state">No course activity yet — head to Courses to get started.</div>`}
  `;
}

// Each recommendation carries an `action`: the button label plus the call that
// takes the student straight there. Only IDs go inside the onclick — course and
// lesson titles can contain apostrophes and would break the attribute.
function buildRecommendations(courseRows, quizScores, log) {
  const recs = [];

  const weakUnits = [];
  courseRows.forEach(r => r.quizUnits.forEach(l => {
    if (quizScores[l.id] < 60) weakUnits.push({ course: r.course, lesson: l, score: quizScores[l.id] });
  }));
  weakUnits.sort((a, b) => a.score - b.score).slice(0, 3).forEach(w => {
    recs.push({
      icon: "target",
      title: `Retake "${stripUnitSuffix(w.lesson.title)}"`,
      desc: `You scored ${w.score}% on this unit's practice questions in ${w.course.title} — a quick retake could meaningfully boost your average.`,
      action: {
        label: "Retake Questions",
        call: `openLesson('${w.course.id}', '${w.lesson.id}')`
      }
    });
  });

  const recentLessonIds = new Set(log.slice(-15).map(e => e.lessonId));
  courseRows.forEach(r => {
    if (r.pct > 0 && r.pct < 100) {
      const touchedRecently = r.course.lessons.some(l => recentLessonIds.has(l.id));
      if (!touchedRecently) {
        recs.push({
          icon: "bulb",
          title: `Pick back up on ${r.course.title}`,
          desc: `You're ${r.pct}% through this course but haven't touched it recently — even one more unit keeps your progress moving.`,
          action: {
            label: "Continue Course",
            call: `openCourse('${r.course.id}')`
          }
        });
      }
    }
  });

  if (!userData.streak) {
    recs.push({
      icon: "flame",
      title: "Start a study streak today",
      desc: "Complete just one lesson today to start building a streak — consistency compounds fast.",
      action: { label: "Browse Courses", call: `showTab('courses')` }
    });
  }

  const untouched = courseRows.length ? courses.filter(c => c.lessons.length > 0 && !courseRows.some(r => r.course.id === c.id)) : courses.filter(c => c.lessons.length > 0);
  if (untouched.length && recs.length < 4) {
    const next = untouched[0];
    recs.push({
      icon: "book",
      title: `Try ${next.title}`,
      desc: "You haven't started this course yet — it's a good candidate for your next study session.",
      action: {
        label: `Start ${next.title}`,
        call: `openCourse('${next.id}')`
      }
    });
  }

  return recs.slice(0, 5);
}

// ========================= KPI VISUALS =========================
// Each performance indicator gets a banner keyed to its instructional area, so
// the detail pane opens on something visual instead of a wall of text. Same
// stroke-SVG language as the rest of the site — no emoji, no photos to host.
const KPI_ART = {
  promotion: { color: "#f59e0b", label: "Promotion", svg: `<path d="M3 11v4a1 1 0 0 0 1 1h3l7 4V6l-7 4H4a1 1 0 0 0-1 1z"/><path d="M18 8a5 5 0 0 1 0 8"/><path d="M21 5a9 9 0 0 1 0 14"/>` },
  distribution: { color: "#167db5", label: "Channel Management", svg: `<rect x="1" y="7" width="13" height="10" rx="1.5"/><path d="M14 10h4l3 3.5V17h-7z"/><circle cx="6" cy="18.5" r="2"/><circle cx="17" cy="18.5" r="2"/>` },
  selling: { color: "#059669", label: "Selling", svg: `<path d="M3 12l4-4 3 3 5-5"/><path d="M20 4h-5M20 4v5"/><path d="M3 20h18"/><path d="M7 20v-4M12 20v-7M17 20v-10"/>` },
  pricing: { color: "#38bdf8", label: "Pricing", svg: `<path d="M20.6 12.6 12 4H4v8l8.6 8.6a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8z"/><circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none"/>` },
  product: { color: "#8b5cf6", label: "Product/Service Management", svg: `<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>` },
  research: { color: "#167db5", label: "Marketing-Information Management", svg: `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m21 21-5.5-5.5"/><path d="M8 12v-2M10.5 12V8M13 12v-3"/>` },
  finance: { color: "#059669", label: "Finance", svg: `<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>` },
  law: { color: "#1e3a5f", label: "Business Law", svg: `<path d="M12 3v18M7 21h10"/><path d="M3 8h18M6 8l-3 6h6zM18 8l-3 6h6z"/>` },
  communication: { color: "#38bdf8", label: "Communication Skills", svg: `<path d="M14 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2v4l4-4h4a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z"/><path d="M18 8h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1v3l-3-3"/>` },
  customer: { color: "#f59e0b", label: "Customer Relations", svg: `<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M19.5 6.5a1.8 1.8 0 0 0-2.5 0 1.8 1.8 0 0 0-2.5 0c-.7.7-.7 1.9 0 2.6l2.5 2.4 2.5-2.4c.7-.7.7-1.9 0-2.6z"/>` },
  economics: { color: "#167db5", label: "Economics", svg: `<path d="M3 20h18"/><path d="m4 15 5-5 4 3 6-7"/><path d="M19 6h-4M19 6v4"/>` },
  growth: { color: "#8b5cf6", label: "Professional Development", svg: `<path d="M4 21V10h4v11M10 21V6h4v15M16 21V13h4v8"/><path d="M3 21h18"/>` },
  entrepreneurship: { color: "#f59e0b", label: "Entrepreneurship", svg: `<path d="M12 2c3.5 3 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 1.5-7 5-10z"/><path d="M9 17c-1.5 1.5-2 3.5-2 5 1.5 0 3.5-.5 5-2 1.5 1.5 3.5 2 5 2 0-1.5-.5-3.5-2-5"/>` },
  people: { color: "#059669", label: "Human Resources", svg: `<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/><path d="M18 8v6M15 11h6"/>` },
  operations: { color: "#1e3a5f", label: "Operations", svg: `<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>` },
  strategy: { color: "#8b5cf6", label: "Strategic Management", svg: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>` },
  info: { color: "#38bdf8", label: "Information Management", svg: `<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>` },
  default: { color: "#167db5", label: "Performance Indicator", svg: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/>` }
};

// Checked in order — first match wins, so put the specific ones first.
const KPI_ART_KEYWORDS = [
  [/promotion|advertis|public relations|sales promotion/i, "promotion"],
  [/channel|distribut|supply chain|logistic/i, "distribution"],
  [/\bselling\b|\bsales\b|professional selling/i, "selling"],
  [/pricing|price/i, "pricing"],
  [/product\/service|product management|branding/i, "product"],
  [/marketing-information|market research|marketing research/i, "research"],
  [/financial analysis|accounting|insurance|credit|investment|financial/i, "finance"],
  [/business law|legal|ethic|risk management/i, "law"],
  [/communicat/i, "communication"],
  [/customer relation/i, "customer"],
  [/econom/i, "economics"],
  [/emotional intelligence|professional development|career/i, "growth"],
  [/entrepreneur/i, "entrepreneurship"],
  [/human resource|staffing|talent/i, "people"],
  [/operation|quality management|safety|project management/i, "operations"],
  [/strategic management|market planning|selling strategy/i, "strategy"],
  [/information management|knowledge management|technology/i, "info"]
];

function kpiArtFor(k) {
  const haystack = `${k.area || ""} ${k.element || ""} ${k.standard || ""} ${k.cluster || ""} ${k.title || ""}`;
  for (const [re, key] of KPI_ART_KEYWORDS) {
    if (re.test(haystack)) return KPI_ART[key];
  }
  return KPI_ART.default;
}

// ========================= KPI DATABASE =========================
// Cluster filter buttons, built from whatever clusters the loaded data actually
// contains. A cluster string can be compound ("Marketing · Channel Management ·
// Tier 2"), so the filter keys off the first segment only.
function kpiPrimaryCluster(k) {
  return String(k.cluster || "").split("·")[0].split("/")[0].trim() || "Other";
}

function kpiCategories() {
  const found = [...new Set(kpis.map(kpiPrimaryCluster))].filter(Boolean).sort();
  return ["All KPIs", ...found];
}

window.filterKPIsByCategory = function(cat) {
  kpiActiveCategory = cat;
  selectedKPIId = null; // renderKPIList picks the first PI in the new filter
  renderKPIList();
  document.querySelector("#kpi .kpi-list")?.scrollTo({ top: 0 });
};

function renderKPIList() {
  const container = document.getElementById("kpiContent");
  if (!container) return;

  if (!kpisLoaded) {
    container.innerHTML = `<div class="admin-empty-state">Loading KPI database...</div>`;
    return;
  }

  const q = document.getElementById("kpiSearch")?.value.toLowerCase() || "";
  const bookmarked = userData?.bookmarkedKPIs || [];

  const cats = kpiCategories();
  if (!cats.includes(kpiActiveCategory)) kpiActiveCategory = "All KPIs";

  const filtersHtml = cats.map(cat => `
    <button class="cat-btn ${cat === kpiActiveCategory ? "active" : ""}" onclick="filterKPIsByCategory('${cat.replace(/'/g, "\\'")}')">
      ${cat === "All KPIs" ? cat : `${cat} KPIs`}
    </button>
  `).join("");

  const matches = kpis.filter(k => {
    const inCat = kpiActiveCategory === "All KPIs" || kpiPrimaryCluster(k) === kpiActiveCategory;
    const inSearch = `${k.title} ${k.cluster} ${k.code || ""} ${k.area || ""} ${k.tierShort || ""} ${k.levelName || ""}`
      .toLowerCase().includes(q);
    return inCat && inSearch;
  });

  // Instructional area first, then PI code, then title — so Channel Management
  // sits together, Pricing sits together, and so on.
  matches.sort((a, b) =>
    String(a.area || "").localeCompare(String(b.area || "")) ||
    String(a.code || "").localeCompare(String(b.code || "")) ||
    String(a.title || "").localeCompare(String(b.title || ""))
  );

  // 892 indicators is a lot of DOM for a school laptop — show a slice and let
  // search narrow it. Raise KPI_LIST_LIMIT to render more at once.
  const KPI_LIST_LIMIT = 250;
  const filtered = matches.slice(0, KPI_LIST_LIMIT);

  if (!selectedKPIId && filtered.length) selectedKPIId = filtered[0].id;

  const listHtml = filtered.map(k => `
    <button class="kpi-list-item ${k.id === selectedKPIId ? "active" : ""}" onclick="selectKPI('${k.id}')">
      ${k.title}
      <span class="kpi-cluster-tag">${k.cluster}</span>
      ${bookmarked.includes(k.id) ? `<span class="kpi-bookmark-dot">${icon("bookmarkFilled")}</span>` : ""}
    </button>
  `).join("") || `<div class="admin-empty-state">No matching performance indicators.</div>`;

  const moreHtml = matches.length > filtered.length
    ? `<div class="admin-empty-state">Showing ${filtered.length} of ${matches.length} — keep typing to narrow it down.</div>`
    : "";

  const selected = filtered.find(k => k.id === selectedKPIId) || filtered[0];

  container.innerHTML = `
    <div class="category-filters">${filtersHtml}</div>
    <div class="kpi-layout">
      <div class="kpi-list">${listHtml}${moreHtml}</div>
      <div class="kpi-detail" id="kpiDetail">${selected ? renderKPIDetailHtml(selected) : `<div class="admin-empty-state">Select a performance indicator.</div>`}</div>
    </div>
  `;
}

function renderKPIDetailHtml(k) {
  const isBookmarked = (userData?.bookmarkedKPIs || []).includes(k.id);
  const art = kpiArtFor(k);
  const section = (label, body) =>
    body ? `<div class="kpi-section"><h4>${label}</h4><p>${body}</p></div>` : "";

  const meta = [
    k.code,
    k.levelName ? `${k.levelName} (${k.level})` : "",
    k.tierShort
  ].filter(Boolean).join(" · ");

  const studyHtml = [
    section("Explanation", k.explanation),
    section("Real-World Example", k.example),
    section("Judge Expectations", k.judgeExpectations),
    section("Common Mistakes", k.commonMistakes),
    section("Sample Answer", k.sampleAnswer)
  ].join("");

  const bannerHtml = `
    <div style="display:flex;align-items:center;gap:18px;padding:22px 24px;margin-bottom:20px;border-radius:14px;
                background:linear-gradient(135deg, ${art.color}1f 0%, ${art.color}08 100%);
                border:1px solid ${art.color}33;">
      <div style="flex:0 0 auto;width:56px;height:56px;display:flex;align-items:center;justify-content:center;
                  border-radius:12px;background:${art.color}22;color:${art.color};">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor"
             stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${art.svg}</svg>
      </div>
      <div style="min-width:0;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${art.color};">
          ${k.area || art.label}
        </div>
        ${meta ? `<div style="font-size:13px;color:var(--muted);margin-top:4px;">${meta}</div>` : ""}
      </div>
    </div>
  `;

  return `
    <div class="kpi-detail-head">
      <span class="kpi-cluster-tag">${k.cluster}</span>
      <button class="bookmark-btn ${isBookmarked ? "active" : ""}" onclick="toggleKPIBookmark('${k.id}')" title="${isBookmarked ? "Remove bookmark" : "Bookmark this PI"}">${icon(isBookmarked ? "bookmarkFilled" : "bookmark")}</button>
    </div>
    ${bannerHtml}
    <h2>${k.title}</h2>
    ${section("Instructional Area", k.standard ? `${k.area} — ${k.standard}` : k.area)}
    ${section("Performance Element", k.element)}
    ${(k.appearsIn && k.appearsIn.length > 1) ? section("Also Tested In", k.appearsIn.join(" · ")) : ""}
    ${studyHtml || `<div class="kpi-section"><h4>Study Notes</h4><p>No study notes for this indicator yet. Add an explanation, real-world example, judge expectations, common mistakes, and a sample answer from the Admin tab.</p></div>`}
  `;
}

window.filterKPIs = function() {
  renderKPIList();
};

window.selectKPI = function(id) {
  selectedKPIId = id;
  renderKPIList();
};

// ========================= PROFILE =========================
function renderProfile() {
  if (!userData || !currentUser) return;

  const avatarEl = document.getElementById("profileAvatar");
  if (avatarEl) {
    if (currentUser.photoURL) {
      avatarEl.innerHTML = `<img src="${currentUser.photoURL}" alt="avatar">`;
    } else {
      avatarEl.textContent = (userData.displayName || "U")[0].toUpperCase();
    }
  }

  document.getElementById("profileName").textContent = userData.displayName || "DECA Student";
  document.getElementById("profileEmail").textContent = userData.email || "";
  const animal = getAnimalForXP(userData.xp);
  document.getElementById("profileLevel").textContent = `${animal.name} · ${userData.xp} XP`;

  f4gCountUp(document.getElementById("pStatXP"), userData.xp);
  f4gCountUp(document.getElementById("pStatStreak"), userData.streak, 600);
  f4gCountUp(document.getElementById("pStatLessons"), (userData.completedLessons || []).length, 600);
  f4gCountUp(document.getElementById("pStatBadges"), (userData.earnedBadges || []).length, 600);

  document.getElementById("editDisplayName").value = userData.displayName || "";
  document.getElementById("editChapter").value = userData.chapter || "";
  document.getElementById("editAssociation").value = userData.association || "";

  const rpSel = document.getElementById("editRoleplayEvent");
  const wrSel = document.getElementById("editWrittenEvent");
  const clSel = document.getElementById("editClusterExam");
  if (rpSel) rpSel.innerHTML = eventOptionsHtml(DECA_ROLEPLAY_EVENTS, userData.roleplayEvent || "", "Not competing in one");
  if (wrSel) wrSel.innerHTML = eventOptionsHtml(DECA_WRITTEN_EVENTS, userData.writtenEvent || "", "Not competing in one");
  if (clSel) clSel.innerHTML = eventOptionsHtml(DECA_CLUSTER_EXAMS, userData.clusterExam || "", "Not sure yet");

  const eventsEl = document.getElementById("profileEvents");
  if (eventsEl) {
    const picked = [
      userData.roleplayEvent && { label: "Roleplay", value: userData.roleplayEvent, iconName: "users" },
      userData.writtenEvent && { label: "Written", value: userData.writtenEvent, iconName: "clipboard" },
      userData.clusterExam && { label: "Cluster exam", value: userData.clusterExam, iconName: "book" }
    ].filter(Boolean);

    eventsEl.innerHTML = picked.length
      ? picked.map(p => `<span class="profile-event-chip" title="${p.label}">${icon(p.iconName)}${p.value}</span>`).join("")
      : `<span class="profile-event-empty">Set your events below so we can tailor your prep.</span>`;
  }

  renderProfileCertificates();
  renderProfileBookmarks();

  const badgeContainer = document.getElementById("profileBadges");
  if (badgeContainer) {
    badgeContainer.innerHTML = "";
    const earned = userData.earnedBadges || [];
    BADGES.forEach(badge => {
      const has = earned.includes(badge.id);
      const div = document.createElement("div");
      div.className = "badge-item-large";
      div.innerHTML = `
        <div class="badge-icon-lg ${has ? "unlocked" : "locked"}">${icon(badge.icon)}</div>
        <div class="badge-name-lg">${badge.name}</div>
      `;
      div.title = badge.desc;
      badgeContainer.appendChild(div);
    });
  }

  const cl = document.getElementById("completedLessonsList");
  if (cl) {
    cl.innerHTML = "";
    const completedIds = userData.completedLessons || [];
    if (completedIds.length === 0) {
      cl.innerHTML = '<div style="color:var(--muted);font-size:14px;">No lessons completed yet. Start learning!</div>';
    } else {
      completedIds.forEach(id => {
        const course = courses.find(c => c.lessons.some(l => l.id === id));
        const lesson = course?.lessons.find(l => l.id === id);
        if (!lesson) return;
        const div = document.createElement("div");
        div.className = "completed-item";
        div.innerHTML = `<span></span><span>${lesson.title}</span><span style="color:var(--muted);font-size:12px;margin-left:auto;">${course?.title}</span>`;
        cl.appendChild(div);
      });
    }
  }
}

window.saveProfile = async function() {
  if (!currentUser) return;
  const name = document.getElementById("editDisplayName").value.trim();
  const chapter = document.getElementById("editChapter").value.trim();
  const association = document.getElementById("editAssociation").value.trim();
  const roleplayEvent = document.getElementById("editRoleplayEvent")?.value || "";
  const writtenEvent = document.getElementById("editWrittenEvent")?.value || "";
  const clusterExam = document.getElementById("editClusterExam")?.value || "";
  if (!name) return alert("Display name can't be empty!");

  try {
    await updateDoc(doc(db, "users", currentUser.uid), {
      displayName: name, chapter, association, roleplayEvent, writtenEvent, clusterExam
    });
    userData.displayName = name;
    userData.chapter = chapter;
    userData.association = association;
    userData.roleplayEvent = roleplayEvent;
    userData.writtenEvent = writtenEvent;
    userData.clusterExam = clusterExam;

    renderSidebar();
    renderDashboard();
    renderProfile();
    alert("Profile saved!");
  } catch (e) {
    console.error("Failed to save profile:", e);
    alert("Couldn't save your profile — check the console for details.");
  }
};

function populateAssociationsDatalist() {
  const list = document.getElementById("associationList");
  if (!list) return;
  list.innerHTML = DECA_ASSOCIATIONS.map(a => `<option value="${a}"></option>`).join("");
}

// ========================= TABS =========================
window.showTab = function(tabName) {
  if (tabName === "admin" && !isAdmin(currentUser)) return;

  document.querySelectorAll(".tab-content").forEach(el => {
    el.classList.remove("active");
    el.classList.add("hidden");
  });
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  const el = document.getElementById(tabName);
  if (el) {
    el.classList.add("active");
    el.classList.remove("hidden");
  }

  const navBtn = document.getElementById(`nav-${tabName}`);
  if (navBtn) navBtn.classList.add("active");

  if (tabName === "leaderboard") renderLeaderboard();
  if (tabName === "profile") renderProfile();
  if (tabName === "courses") renderCourseGrid();
  if (tabName === "planner") renderPlannerForm();
  if (tabName === "analytics") renderAnalytics();
  if (tabName === "kpi") renderKPIList();
  if (tabName === "calendar") renderCalendarList();
  if (tabName === "blog") renderBlogList();
  if (tabName === "prepared") renderPreparedEventTab();
  if (tabName === "admin") renderAdminPanel();

  document.getElementById("sidebar")?.classList.remove("open");
};

// ========================= MOBILE SIDEBAR =========================
window.toggleSidebar = function() {
  document.getElementById("sidebar")?.classList.toggle("open");
};

// ========================= XP TOAST =========================
function showXPToast(xp) {
  const toast = document.getElementById("xpToast");
  if (!toast) return;
  toast.textContent = `+${xp} XP`;
  toast.classList.remove("hidden");
  f4gBurstFrom(toast, xp >= 40 ? 26 : 16);
  setTimeout(() => toast.classList.add("hidden"), 2500);
}

// ========================= LEVEL UP MODAL =========================
function showLevelUpModal(animal) {
  document.getElementById("modalEmoji").innerHTML = icon("zap");
  document.getElementById("modalAnimal").textContent = animal.name;
  document.getElementById("modalMsg").textContent = `You evolved into a ${animal.name}! Keep studying to evolve again!`;
  document.getElementById("levelUpModal").classList.remove("hidden");
  f4gBurst(window.innerWidth / 2, window.innerHeight / 2, 44, 240);
  setTimeout(() => f4gBurst(window.innerWidth / 2, window.innerHeight / 2, 30, 200), 260);
}

window.closeModal = function(id) {
  document.getElementById(id)?.classList.add("hidden");
};

// ========================================================================
// ========================= ADMIN PANEL =================================
// ========================================================================
// Everything below is only reachable by emails in ADMIN_EMAILS.

function renderAdminPanel() {
  const container = document.getElementById("adminContent");
  if (!container || !isAdmin(currentUser)) return;

  const subtabsHtml = `
    <div class="admin-subtabs">
      <button class="admin-subtab-btn ${adminActiveSubTab === "courses" ? "active" : ""}" onclick="adminSwitchSubTab('courses')">Courses</button>
      <button class="admin-subtab-btn ${adminActiveSubTab === "kpi" ? "active" : ""}" onclick="adminSwitchSubTab('kpi')">KPI Database</button>
      <button class="admin-subtab-btn ${adminActiveSubTab === "members" ? "active" : ""}" onclick="adminSwitchSubTab('members')">Members</button>
      <button class="admin-subtab-btn ${adminActiveSubTab === "calendar" ? "active" : ""}" onclick="adminSwitchSubTab('calendar')">Calendar</button>
      <button class="admin-subtab-btn ${adminActiveSubTab === "blog" ? "active" : ""}" onclick="adminSwitchSubTab('blog')">Blog</button>
      <button class="admin-subtab-btn ${adminActiveSubTab === "rubrics" ? "active" : ""}" onclick="adminSwitchSubTab('rubrics')">Rubrics</button>
    </div>
    <div id="adminSubtabBody"></div>
  `;
  container.innerHTML = subtabsHtml;

  if (adminActiveSubTab === "kpi") renderAdminKPISection();
  else if (adminActiveSubTab === "members") renderAdminMembersSection();
  else if (adminActiveSubTab === "calendar") renderAdminCalendarSection();
  else if (adminActiveSubTab === "blog") renderAdminBlogSection();
  else if (adminActiveSubTab === "rubrics") renderAdminRubricsSection();
  else renderAdminCoursesSection();
}

window.adminSwitchSubTab = function(tab) {
  adminActiveSubTab = tab;
  renderAdminPanel();
};

function renderAdminCoursesSection() {
  const body = document.getElementById("adminSubtabBody");
  if (!body) return;

  if (!coursesLoaded) {
    body.innerHTML = `<div class="admin-empty-state">Loading courses...</div>`;
    return;
  }

  if (!adminSelectedCourseId && courses.length) {
    adminSelectedCourseId = courses[0].id;
  }

  const courseListHtml = courses.map(c => {
    const n = buildUnits(c).length;
    return `
      <button class="admin-course-btn ${c.id === adminSelectedCourseId ? "active" : ""}" onclick="adminSelectCourse('${c.id}')">
        ${c.title}
        <span class="admin-course-sub">${n} ${n === 1 ? "unit" : "units"}</span>
      </button>
    `;
  }).join("");

  body.innerHTML = `
    <div class="admin-seed-banner">
      <div>Courses load from the database. If this is the first time setting this up, import <code>courses.json</code> into the database once.</div>
      <button class="admin-btn-sm" onclick="adminSeedCourses()">Import courses.json</button>
    </div>
    <div class="admin-layout">
      <div class="admin-course-list">${courseListHtml}</div>
      <div class="admin-panel-body" id="adminCourseEditor"></div>
    </div>
  `;

  renderAdminCourseEditor();
}

window.adminSelectCourse = function(id) {
  adminSelectedCourseId = id;
  renderAdminCoursesSection();
};

// ---- KPI Database admin management ----
let adminEditingKPIId = null;
let adminKpiQuery = "";

function adminKpiListHtml() {
  const filtered = kpis.filter(k =>
    `${k.title} ${k.cluster} ${k.code || ""}`.toLowerCase().includes(adminKpiQuery)
  );
  const shown = filtered.slice(0, 60);

  const blocks = shown.map(k => `
    <div class="admin-lesson-block">
      <div class="admin-lesson-head">
        <h4>${k.title}</h4>
        <div style="display:flex;gap:8px;">
          <button class="admin-btn-sm ghost" onclick="adminEditKPI('${k.id}')">Edit</button>
          <button class="admin-btn-sm danger" onclick="adminDeleteKPI('${k.id}')">${icon("trash")} Hide</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);">${k.code ? k.code + " · " : ""}${k.cluster}</div>
    </div>
  `).join("");

  const more = filtered.length > shown.length
    ? `<div class="admin-empty-state">Showing ${shown.length} of ${filtered.length} — search to narrow it down.</div>`
    : "";

  return (blocks + more) || `<div class="admin-empty-state">No performance indicators match that search.</div>`;
}

window.adminFilterKPIs = function() {
  adminKpiQuery = (document.getElementById("adminKpiSearch")?.value || "").toLowerCase();
  const el = document.getElementById("adminKpiList");
  if (el) el.innerHTML = adminKpiListHtml();
};

function renderAdminKPISection() {
  const body = document.getElementById("adminSubtabBody");
  if (!body) return;

  const editing = adminEditingKPIId ? kpis.find(k => k.id === adminEditingKPIId) : null;

  body.innerHTML = `
    <div class="admin-seed-banner">
      <div>${kpis.length} performance indicators are loaded from <code>kpis.json</code>. Editing one here saves your version to the database and it overrides the file — the file itself stays untouched.</div>
    </div>
    <div class="admin-layout">
      <div>
        <div class="admin-kpi-form">
          <input type="text" id="adminKpiSearch" placeholder="Search PIs by title, code, or cluster..." value="${adminKpiQuery.replace(/"/g, "&quot;")}" oninput="adminFilterKPIs()">
        </div>
        <div class="admin-course-list" id="adminKpiList">${adminKpiListHtml()}</div>
      </div>
      <div class="admin-panel-body">
        <h3 style="margin-bottom:16px;">${editing ? "Edit Performance Indicator" : "Add a New Performance Indicator"}</h3>
        <div class="admin-kpi-form">
          <input type="text" id="kpi-title" placeholder="PI title (e.g. Explain the nature of channels of distribution)" value="${editing ? editing.title.replace(/"/g, "&quot;") : ""}">
          <input type="text" id="kpi-cluster" placeholder="Cluster (e.g. Marketing · Channel Management · Tier 2 Marketing)" value="${editing ? editing.cluster.replace(/"/g, "&quot;") : ""}">
          <textarea id="kpi-explanation" rows="2" placeholder="Explanation">${editing ? (editing.explanation || "") : ""}</textarea>
          <textarea id="kpi-example" rows="2" placeholder="Real-world example">${editing ? (editing.example || "") : ""}</textarea>
          <textarea id="kpi-judge" rows="2" placeholder="Judge expectations">${editing ? (editing.judgeExpectations || "") : ""}</textarea>
          <textarea id="kpi-mistakes" rows="2" placeholder="Common mistakes">${editing ? (editing.commonMistakes || "") : ""}</textarea>
          <textarea id="kpi-sample" rows="3" placeholder="Sample answer">${editing ? (editing.sampleAnswer || "") : ""}</textarea>
          <div style="display:flex;gap:10px;">
            <button class="admin-btn-sm" onclick="adminSaveKPI()">${editing ? "Save Changes" : "Add Performance Indicator"}</button>
            ${editing ? `<button class="admin-btn-sm ghost" onclick="adminCancelEditKPI()">Cancel</button>` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

window.adminEditKPI = function(id) {
  adminEditingKPIId = id;
  renderAdminKPISection();
};

window.adminCancelEditKPI = function() {
  adminEditingKPIId = null;
  renderAdminKPISection();
};

window.adminSaveKPI = async function() {
  const title = document.getElementById("kpi-title").value.trim();
  const cluster = document.getElementById("kpi-cluster").value.trim();
  const explanation = document.getElementById("kpi-explanation").value.trim();
  const example = document.getElementById("kpi-example").value.trim();
  const judgeExpectations = document.getElementById("kpi-judge").value.trim();
  const commonMistakes = document.getElementById("kpi-mistakes").value.trim();
  const sampleAnswer = document.getElementById("kpi-sample").value.trim();

  if (!title || !cluster) return alert("Please fill in at least the title and cluster.");

  const id = adminEditingKPIId || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `kpi-${Date.now()}`;
  const existing = kpis.find(k => k.id === id) || {};
  const kpiDoc = { ...existing, id, title, cluster, explanation, example, judgeExpectations, commonMistakes, sampleAnswer };
  delete kpiDoc.hidden;

  try {
    await setDoc(doc(db, "kpis", id), kpiDoc);
    const idx = kpis.findIndex(k => k.id === id);
    if (idx >= 0) kpis[idx] = kpiDoc; else kpis.push(kpiDoc);
    adminEditingKPIId = null;
    renderAdminKPISection();
    renderKPIList();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

// "Delete" writes a hidden marker so the entry doesn't come back from kpis.json.
// To restore one, delete its document in the Firebase console.
window.adminDeleteKPI = async function(id) {
  if (!confirm("Hide this performance indicator from the KPI Database?")) return;
  try {
    await setDoc(doc(db, "kpis", id), { id, hidden: true });
    kpis = kpis.filter(k => k.id !== id);
    renderAdminKPISection();
    renderKPIList();
  } catch (e) {
    console.error(e);
    alert("Couldn't hide that PI — check the console.");
  }
};

// ========================= ADMIN: COURSE EDITOR (by unit) =========================
// One block per unit, with its three parts inside it: the video, the article
// PDF, and the practice questions. The article and the quiz are created the
// first time you save something into them, so a unit never carries an empty
// part that would show up as a dead tab for students.

function renderAdminCourseEditor() {
  const editor = document.getElementById("adminCourseEditor");
  if (!editor) return;
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) {
    editor.innerHTML = `<div class="admin-empty-state">Select a course to edit.</div>`;
    return;
  }

  const units = buildUnits(course);

  const unitsHtml = units.map(unit => {
    const v = unit.video;
    const a = unit.article;
    const q = unit.quiz;

    const videoHtml = `
      <div class="admin-unit-part">
        <div class="admin-unit-part-label">${icon("play")} Video</div>
        <div class="admin-field-row">
          <input type="text" id="v-title-${unit.key}" placeholder="Unit title (e.g. Unit 1: Business Law)" value="${(v ? v.title : unit.title).replace(/"/g, "&quot;")}">
          <input type="text" id="v-url-${unit.key}" placeholder="YouTube URL" value="${v ? (v.url || "") : ""}">
          <input type="number" id="v-xp-${unit.key}" placeholder="XP" style="max-width:90px;" value="${v ? v.xp : 25}">
          <button class="admin-btn-sm" onclick="adminSaveVideo('${unit.key}')">Save</button>
        </div>
      </div>
    `;

    const articleHtml = `
      <div class="admin-unit-part">
        <div class="admin-unit-part-label">${icon("file")} Article (PDF)</div>
        <div class="admin-field-row">
          <input type="text" id="art-url-${unit.key}" placeholder="PDF URL (e.g. pdfs/unit-1-business-law.pdf)" value="${a ? (a.url || "") : ""}">
          <input type="number" id="art-xp-${unit.key}" placeholder="XP" style="max-width:90px;" value="${a ? a.xp : 15}">
          <button class="admin-btn-sm" onclick="adminSaveArticle('${unit.key}')">Save</button>
          ${a ? `<button class="admin-btn-sm danger" onclick="adminDeleteLesson('${a.id}')">${icon("trash")}</button>` : ""}
        </div>
        <div style="font-size:12px;color:var(--muted);">Upload the PDF to a <code>pdfs/</code> folder in the site and paste the path here. Leave blank and students see no Article tab for this unit.</div>
      </div>
    `;

    const questionsHtml = q
      ? ((q.questions || []).map((question, qi) => `
          <div class="admin-question-card">
            <strong>Q${qi + 1}:</strong> ${question.q}
            <div style="margin-top:6px;font-size:13px;color:var(--muted);">
              ${question.options.map((o, oi) => `${oi === question.answer ? "✓ " : "· "}${o}`).join("<br>")}
            </div>
            <button class="admin-btn-sm danger" style="margin-top:8px;" onclick="adminDeleteQuestion('${unit.key}', ${qi})">${icon("trash")} Remove question</button>
          </div>
        `).join("") || `<div style="color:var(--muted);font-size:13px;margin-bottom:10px;">No practice questions yet.</div>`)
      : `<div style="color:var(--muted);font-size:13px;margin-bottom:10px;">No practice quiz on this unit yet — adding a question below creates one.</div>`;

    const practiceHtml = `
      <div class="admin-unit-part">
        <div class="admin-unit-part-label">${icon("quiz")} Practice questions</div>
        ${questionsHtml}
        <div class="admin-add-question-form">
          <textarea rows="2" placeholder="Question text" id="q-text-${unit.key}"></textarea>
          <div class="admin-option-inputs">
            <input type="text" placeholder="Option A" id="q-opt0-${unit.key}">
            <input type="text" placeholder="Option B" id="q-opt1-${unit.key}">
            <input type="text" placeholder="Option C" id="q-opt2-${unit.key}">
            <input type="text" placeholder="Option D" id="q-opt3-${unit.key}">
          </div>
          <div class="admin-field-row">
            <select id="q-answer-${unit.key}">
              <option value="0">Correct: Option A</option>
              <option value="1">Correct: Option B</option>
              <option value="2">Correct: Option C</option>
              <option value="3">Correct: Option D</option>
            </select>
          </div>
          <textarea rows="2" placeholder="Explanation (shown after answering)" id="q-exp-${unit.key}"></textarea>
          <button class="admin-btn-sm" onclick="adminAddQuestion('${unit.key}')">${icon("plus")} Add question</button>
        </div>
      </div>
    `;

    return `
      <div class="admin-lesson-block admin-unit-block" id="admin-unit-${unit.key}">
        <div class="admin-lesson-head">
          <h4>${unit.title}</h4>
          <button class="admin-btn-sm danger" onclick="adminDeleteUnit('${unit.key}')">${icon("trash")} Delete unit</button>
        </div>
        ${videoHtml}
        ${articleHtml}
        ${practiceHtml}
      </div>
    `;
  }).join("");

  editor.innerHTML = `
    <h3 style="margin-bottom:16px;">${course.title}</h3>
    ${unitsHtml || `<div class="admin-empty-state">No units yet. Add the first one below.</div>`}
    <div class="admin-lesson-block" style="border-style:dashed;">
      <h4 style="margin-bottom:10px;">${icon("plus")} Add a new unit</h4>
      <div class="admin-field-row">
        <input type="text" placeholder="Unit title (e.g. Unit 21: Marketing Math)" id="new-unit-title">
        <input type="text" placeholder="YouTube URL" id="new-unit-url">
        <input type="number" placeholder="XP (default 25)" id="new-unit-xp" style="max-width:120px;">
        <button class="admin-btn-sm" onclick="adminAddUnit('${course.id}')">${icon("plus")} Add unit</button>
      </div>
      <div style="font-size:12px;color:var(--muted);">A new unit starts with its video and an empty practice quiz. Add the PDF article and the questions from the unit block once it appears.</div>
    </div>
  `;
}

async function saveCourseLessons(courseId, lessons) {
  await setDoc(doc(db, "courses", courseId), { lessons }, { merge: true });
  const course = courses.find(c => c.id === courseId);
  if (course) course.lessons = lessons;
}

// Puts a newly created part right after the last existing part of its unit, so
// the flat lessons array stays grouped in reading order.
function insertIntoUnit(lessons, unitKey, newLesson) {
  let lastIdx = -1;
  lessons.forEach((l, i) => { if (unitKeyFor(l) === unitKey) lastIdx = i; });
  if (lastIdx === -1) return [...lessons, newLesson];
  return [...lessons.slice(0, lastIdx + 1), newLesson, ...lessons.slice(lastIdx + 1)];
}

window.adminSaveVideo = async function(unitKey) {
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) return;

  const title = document.getElementById(`v-title-${unitKey}`).value.trim();
  const url = document.getElementById(`v-url-${unitKey}`).value.trim();
  const xp = Number(document.getElementById(`v-xp-${unitKey}`).value) || 25;
  if (!title) return alert("Please give the unit a title.");

  let lessons = [...course.lessons];
  const existing = lessons.find(l => unitKeyFor(l) === unitKey && l.type !== "quiz" && l.type !== "article");

  if (existing) {
    existing.title = title;
    existing.url = url;
    existing.xp = xp;
  } else {
    lessons = insertIntoUnit(lessons, unitKey, {
      id: `${unitKey}-video`, title, type: "youtube", url, xp, duration: "10 min"
    });
  }

  try {
    await saveCourseLessons(course.id, lessons);
    renderAdminPanel();
    renderCourseGrid();
    renderFeaturedCourses();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

window.adminSaveArticle = async function(unitKey) {
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) return;

  const url = document.getElementById(`art-url-${unitKey}`).value.trim();
  const xp = Number(document.getElementById(`art-xp-${unitKey}`).value) || 15;

  let lessons = [...course.lessons];
  const existing = lessons.find(l => unitKeyFor(l) === unitKey && l.type === "article");

  if (!url) {
    if (!existing) return alert("Paste the PDF path first, then save.");
    if (!confirm("Clearing the URL removes the Article tab from this unit. Continue?")) return;
    lessons = lessons.filter(l => l.id !== existing.id);
  } else if (existing) {
    existing.url = url;
    existing.xp = xp;
  } else {
    const unit = buildUnits(course).find(u => u.key === unitKey);
    lessons = insertIntoUnit(lessons, unitKey, {
      id: `${unitKey}-article`,
      title: `${unit ? unit.title : "Unit"} — Article`,
      type: "article", url, xp, duration: "5 min"
    });
  }

  try {
    await saveCourseLessons(course.id, lessons);
    renderAdminPanel();
    renderCourseGrid();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

window.adminAddUnit = async function(courseId) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return;

  const title = document.getElementById("new-unit-title").value.trim();
  const url = document.getElementById("new-unit-url").value.trim();
  const xp = Number(document.getElementById("new-unit-xp").value) || 25;

  if (!title || !url) return alert("Please enter a title and a YouTube URL.");

  const unitKey = `${courseId}-u${Date.now()}`;
  const videoLesson = { id: `${unitKey}-video`, title, type: "youtube", url, xp, duration: "10 min" };
  const quizLesson = { id: `${unitKey}-quiz`, title: `${title} — Practice Quiz`, type: "quiz", xp, duration: "5 min", questions: [] };

  try {
    await saveCourseLessons(courseId, [...course.lessons, videoLesson, quizLesson]);
    renderAdminPanel();
    renderCourseGrid();
    renderFeaturedCourses();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

window.adminDeleteUnit = async function(unitKey) {
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) return;
  if (!confirm("Delete this whole unit — video, article, and practice questions? This cannot be undone.")) return;

  const newLessons = course.lessons.filter(l => unitKeyFor(l) !== unitKey);
  try {
    await saveCourseLessons(course.id, newLessons);
    renderAdminPanel();
    renderCourseGrid();
    renderFeaturedCourses();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

window.adminDeleteLesson = async function(lessonId) {
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) return;
  if (!confirm("Delete this part of the unit? This cannot be undone.")) return;

  const newLessons = course.lessons.filter(l => l.id !== lessonId);
  try {
    await saveCourseLessons(course.id, newLessons);
    renderAdminPanel();
    renderCourseGrid();
    renderFeaturedCourses();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

window.adminAddQuestion = async function(unitKey) {
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) return;

  const qText = document.getElementById(`q-text-${unitKey}`).value.trim();
  const opts = [0, 1, 2, 3].map(i => document.getElementById(`q-opt${i}-${unitKey}`).value.trim());
  const answer = Number(document.getElementById(`q-answer-${unitKey}`).value);
  const explanation = document.getElementById(`q-exp-${unitKey}`).value.trim();

  if (!qText || opts.some(o => !o)) return alert("Please fill in the question and all four options.");

  let lessons = [...course.lessons];
  let quiz = lessons.find(l => unitKeyFor(l) === unitKey && l.type === "quiz");

  if (!quiz) {
    const unit = buildUnits(course).find(u => u.key === unitKey);
    quiz = {
      id: `${unitKey}-quiz`,
      title: `${unit ? unit.title : "Unit"} — Practice Quiz`,
      type: "quiz", xp: 25, duration: "5 min", questions: []
    };
    lessons = insertIntoUnit(lessons, unitKey, quiz);
  }

  quiz.questions = [...(quiz.questions || []), { q: qText, options: opts, answer, explanation }];

  try {
    await saveCourseLessons(course.id, lessons);
    renderAdminPanel();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

window.adminDeleteQuestion = async function(unitKey, questionIndex) {
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) return;
  const quiz = course.lessons.find(l => unitKeyFor(l) === unitKey && l.type === "quiz");
  if (!quiz) return;

  quiz.questions = (quiz.questions || []).filter((_, i) => i !== questionIndex);

  try {
    await saveCourseLessons(course.id, course.lessons);
    renderAdminPanel();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

// One-time helper: pushes the bundled courses.json into Firestore.
window.adminSeedCourses = async function() {
  if (!isAdmin(currentUser)) return;
  if (!confirm("Import courses.json into the database? This will overwrite any Firestore course documents with the same IDs.")) return;

  try {
    const r = await fetch("courses.json");
    const data = await r.json();
    for (const raw of data) {
      const course = normalizeCourse(raw);
      await setDoc(doc(db, "courses", course.id), course);
    }
    alert("Courses imported! Reloading...");
    await loadCourses();
    renderAdminPanel();
  } catch (e) {
    console.error("Failed to seed courses:", e);
    alert("Import failed — check the console for details.");
  }
};

// ========================================================================
// ========================= STUDY PLANNER ================================
// ========================================================================
// Three paths, all driven off the events the student saved on their Profile:
//
//   exam      -> their cluster exam. Which video to watch, which practice
//                questions to run, sized to the days they actually have.
//                No PIs — those belong to the roleplay path.
//   roleplay  -> their roleplay event, mapped to its course. Each session
//                walks watch -> study these PIs -> run a practice roleplay.
//   prepared  -> their written event, mapped to its course. Each session is
//                one section of the entry to actually write.
//
// Nothing here calls a model. Roleplay scenarios come from a template bank,
// and prepared-event sections come from the rubric an admin entered under
// Admin > Rubrics whenever one exists — so a student is never handed an
// invented event format.

let plannerMode = null;

/* ---------- profile event -> course + PI cluster ---------- */

const PLANNER_CLUSTER_COURSE = {
  "business administration core": "business-admin-core",
  "business management and administration": "business-management",
  "entrepreneurship": "entrepreneurship-cluster",
  "finance": "finance",
  "hospitality and tourism": "hospitality",
  "marketing": "marketing",
  "personal financial literacy": "pfl-cluster"
};

// Roleplay event code -> the course it belongs to, and the cluster its PIs
// come from. DECA revises this list most years; edit here and nothing else
// needs to change.
const PLANNER_RP_EVENTS = {
  PBM:  { course: "principles",        cluster: "Business Management" },
  PEN:  { course: "principles",        cluster: "Entrepreneurship" },
  PFN:  { course: "principles",        cluster: "Finance" },
  PHT:  { course: "principles",        cluster: "Hospitality" },
  PMK:  { course: "principles",        cluster: "Marketing" },
  ACT:  { course: "individual-series", cluster: "Finance" },
  AAM:  { course: "individual-series", cluster: "Marketing" },
  ASM:  { course: "individual-series", cluster: "Marketing" },
  BFS:  { course: "individual-series", cluster: "Finance" },
  BSM:  { course: "individual-series", cluster: "Marketing" },
  ENT:  { course: "individual-series", cluster: "Entrepreneurship" },
  FMS:  { course: "individual-series", cluster: "Marketing" },
  HLM:  { course: "individual-series", cluster: "Hospitality" },
  HRM:  { course: "individual-series", cluster: "Business Management" },
  MCS:  { course: "individual-series", cluster: "Marketing" },
  QSRM: { course: "individual-series", cluster: "Hospitality" },
  RFSM: { course: "individual-series", cluster: "Hospitality" },
  RMS:  { course: "individual-series", cluster: "Marketing" },
  SEM:  { course: "individual-series", cluster: "Marketing" },
  BLTDM:{ course: "team-decision",     cluster: "Business Management" },
  BTDM: { course: "team-decision",     cluster: "Marketing" },
  ETDM: { course: "team-decision",     cluster: "Entrepreneurship" },
  FTDM: { course: "team-decision",     cluster: "Finance" },
  HTDM: { course: "team-decision",     cluster: "Hospitality" },
  MTDM: { course: "team-decision",     cluster: "Marketing" },
  STDM: { course: "team-decision",     cluster: "Marketing" },
  TTDM: { course: "team-decision",     cluster: "Hospitality" },
  PFL:  { course: "pfl-event",         cluster: "Personal Financial Literacy" },
  FCE:  { course: "professional-selling", cluster: "Finance" },
  HTPS: { course: "professional-selling", cluster: "Hospitality" },
  PSE:  { course: "professional-selling", cluster: "Marketing" }
};

// Written event code -> course + which section template to walk through.
const PLANNER_WRITTEN_EVENTS = {
  BOR:  { course: "business-research",         family: "research",         cluster: "Marketing" },
  BMOR: { course: "business-research",         family: "research",         cluster: "Marketing" },
  FOR:  { course: "business-research",         family: "research",         cluster: "Finance" },
  HTOR: { course: "business-research",         family: "research",         cluster: "Hospitality" },
  SEOR: { course: "business-research",         family: "research",         cluster: "Marketing" },
  EBG:  { course: "entrepreneurship-events",   family: "entrepreneurship", cluster: "Entrepreneurship" },
  EFB:  { course: "entrepreneurship-events",   family: "entrepreneurship", cluster: "Entrepreneurship" },
  EIB:  { course: "entrepreneurship-events",   family: "entrepreneurship", cluster: "Entrepreneurship" },
  EIP:  { course: "entrepreneurship-events",   family: "entrepreneurship", cluster: "Entrepreneurship" },
  IBP:  { course: "entrepreneurship-events",   family: "entrepreneurship", cluster: "Entrepreneurship" },
  ESB:  { course: "entrepreneurship-events",   family: "entrepreneurship", cluster: "Entrepreneurship" },
  IMCE: { course: "integrated-marketing",      family: "imc",              cluster: "Marketing" },
  IMCP: { course: "integrated-marketing",      family: "imc",              cluster: "Marketing" },
  IMCS: { course: "integrated-marketing",      family: "imc",              cluster: "Marketing" },
  PMBS: { course: "project-management",        family: "project",          cluster: "Business Management" },
  PMCD: { course: "project-management",        family: "project",          cluster: "Business Management" },
  PMCA: { course: "project-management",        family: "project",          cluster: "Marketing" },
  PMCG: { course: "project-management",        family: "project",          cluster: "Marketing" },
  PMFL: { course: "project-management",        family: "project",          cluster: "Personal Financial Literacy" },
  PMSP: { course: "project-management",        family: "project",          cluster: "Marketing" }
};

function plannerNorm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

// "Unit 2: Channel Management" -> "channel management"
function plannerUnitArea(title) {
  return plannerNorm(String(title || "").replace(/^unit\s*\d+\s*:?\s*/i, ""));
}

// Profile values are stored as "Retail Merchandising Series (RMS)".
function plannerEventCode(label) {
  return (String(label || "").match(/\(([^)]+)\)\s*$/) || [])[1] || "";
}

function plannerCourseById(id) {
  return courses.find(c => c.id === id) || null;
}

/* ---------- PI selection (roleplay only) ---------- */

function plannerKpiPool(clusterName) {
  const name = plannerNorm(clusterName);
  if (!name) return kpis;
  const matched = kpis.filter(k =>
    plannerNorm(`${k.cluster || ""} ${(k.appearsIn || []).join(" ")}`).includes(name)
  );
  // A thin match usually means the cluster is worded differently in the data
  // than in our map — better to plan from everything than from nothing.
  return matched.length >= 8 ? matched : kpis;
}

// Lower DECA level first (a Prerequisite PI is likelier to appear and is worth
// locking in early), then PIs that actually have study notes written.
const KPI_LEVEL_ORDER = { PQ: 0, CS: 1, SP: 2, SU: 3, MN: 4 };

function plannerRankedKpis(clusterName) {
  const pool = plannerKpiPool(clusterName);
  return [...pool].sort((a, b) => {
    const la = KPI_LEVEL_ORDER[String(a.level || "").toUpperCase()] ?? 2;
    const lb = KPI_LEVEL_ORDER[String(b.level || "").toUpperCase()] ?? 2;
    const na = (a.explanation || a.sampleAnswer) ? 0 : 1;
    const nb = (b.explanation || b.sampleAnswer) ? 0 : 1;
    return (la * 2 + na) - (lb * 2 + nb) ||
      String(a.code || "").localeCompare(String(b.code || "")) ||
      String(a.title || "").localeCompare(String(b.title || ""));
  });
}

// Hands out PIs area-first, then falls back to the next unused ranked PI, so
// a session is never short just because its area has no indicators left.
function plannerAllocator(ranked) {
  const used = new Set();
  const buckets = new Map();
  ranked.forEach(k => {
    const key = plannerNorm(k.area || k.element);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(k);
  });

  return function take(areaNames, n) {
    const out = [];
    const wanted = (areaNames || []).map(plannerNorm).filter(Boolean);

    wanted.forEach(w => {
      for (const [key, list] of buckets) {
        if (out.length >= n) break;
        if (key !== w && !key.includes(w) && !w.includes(key)) continue;
        for (const k of list) {
          if (out.length >= n) break;
          if (!used.has(k.id)) { used.add(k.id); out.push(k.id); }
        }
      }
    });

    for (const k of ranked) {
      if (out.length >= n) break;
      if (!used.has(k.id)) { used.add(k.id); out.push(k.id); }
    }
    return out;
  };
}

/* ---------- timeline ---------- */

function plannerTimeline(conferenceDate, daysPerWeek) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(conferenceDate + "T00:00:00");
  const daysUntil = Math.max(1, Math.round((target - today) / 86400000));
  const studyDays = Math.max(1, daysUntil - 1); // leave the day before free
  const slots = Math.max(1, Math.round((studyDays / 7) * daysPerWeek));
  return { today, daysUntil, studyDays, slots };
}

function plannerStampDates(sessions, timeline) {
  sessions.forEach((s, i) => {
    s.num = i + 1;
    const offset = Math.min(
      timeline.studyDays,
      Math.round(i * (timeline.studyDays / Math.max(1, sessions.length)))
    );
    s.date = new Date(timeline.today.getTime() + offset * 86400000).toISOString().slice(0, 10);
    s.week = Math.floor(offset / 7) + 1;
    s.done = false;
    s.rpOffset = 0;
  });
  return sessions;
}

/* ---------- roleplay scenario bank ---------- */

const RP_TEMPLATE_SETS = [
  {
    match: /promotion|advertis|public relations/i,
    items: [
      { role: "marketing coordinator", org: "a family-owned bakery opening a second location across town", judge: "owner", task: "The owner wants the new location busy from day one but has a small budget and no email list." },
      { role: "promotions assistant", org: "a minor league baseball team", judge: "director of promotions", task: "Weeknight attendance is half what weekend games draw, and the team wants seats filled Tuesday through Thursday." }
    ]
  },
  {
    match: /channel|distribut|supply chain|logistic/i,
    items: [
      { role: "operations associate", org: "a skincare brand that has only ever sold on its own website", judge: "vice president of sales", task: "A national retailer has offered shelf space, and leadership is split on whether it's worth the loss of control." },
      { role: "distribution analyst", org: "a regional snack manufacturer", judge: "distribution manager", task: "Two wholesalers are covering overlapping territory and both are asking for exclusivity." }
    ]
  },
  {
    match: /\bselling\b|\bsales\b|professional selling/i,
    items: [
      { role: "sales associate", org: "a locally owned running shoe store", judge: "store manager", task: "A customer keeps coming in, trying on shoes, then buying online for a few dollars less." },
      { role: "account representative", org: "a commercial cleaning company", judge: "sales manager", task: "A long-time client is comparing quotes from a cheaper competitor and wants your pricing justified." }
    ]
  },
  {
    match: /pricing|price/i,
    items: [
      { role: "pricing analyst", org: "a chain of three coffee shops near a college campus", judge: "district manager", task: "Supplier costs rose 18% this year and no price has changed since the shops opened." },
      { role: "assistant manager", org: "an independent bookstore", judge: "owner", task: "The owner wants a discount event but worries about training customers to wait for sales." }
    ]
  },
  {
    match: /product\/service|product management|branding/i,
    items: [
      { role: "product assistant", org: "a smoothie franchise", judge: "regional director", task: "Two menu items are 4% of sales and slow down every order — the director wants a recommendation on the menu mix." },
      { role: "brand associate", org: "a 40-year-old hardware store", judge: "owner", task: "A big-box competitor opened two miles away and the store needs to decide what it stands for." }
    ]
  },
  {
    match: /marketing-information|market research|marketing research|information management/i,
    items: [
      { role: "marketing research assistant", org: "a fitness studio chain", judge: "marketing director", task: "Memberships are cancelled at three months and nobody knows why — you've been asked how to find out." },
      { role: "data associate", org: "a meal-kit delivery startup", judge: "chief marketing officer", task: "The company collects enormous amounts of customer data and has never used any of it to make a decision." }
    ]
  },
  {
    match: /customer relation/i,
    items: [
      { role: "guest services lead", org: "a mid-size hotel", judge: "general manager", task: "Reviews are strong on cleanliness and weak on how guests are treated at check-in." },
      { role: "customer experience associate", org: "an online electronics retailer", judge: "operations manager", task: "Returns are handled well, but customers who return an item almost never buy again." }
    ]
  },
  {
    match: /financial analysis|accounting|financial|credit|investment|insurance/i,
    items: [
      { role: "finance intern", org: "a food truck operator planning a second truck", judge: "owner", task: "The owner is profitable on paper but keeps running short on cash before month end." },
      { role: "financial associate", org: "a nonprofit youth sports league", judge: "board treasurer", task: "The board wants to know whether the league can afford lower registration fees next season." }
    ]
  },
  {
    match: /business law|legal|ethic|risk management/i,
    items: [
      { role: "operations assistant", org: "a catering company", judge: "owner", task: "A supplier delivered spoiled product two hours before an event and the contract language is unclear." },
      { role: "management trainee", org: "a retail clothing chain", judge: "store director", task: "An employee has been posting about internal decisions online and there's no policy covering it." }
    ]
  },
  {
    match: /human resource|staffing|talent|professional development|emotional intelligence/i,
    items: [
      { role: "assistant manager", org: "a quick-serve restaurant", judge: "district manager", task: "Turnover is 90% a year and every new hire is trained by whoever happens to be on shift." },
      { role: "human resources assistant", org: "a landscaping company", judge: "operations director", task: "Two crew leads are in open conflict and it's affecting scheduling." }
    ]
  },
  {
    match: /operation|quality management|safety|project management/i,
    items: [
      { role: "operations associate", org: "a bike repair shop", judge: "owner", task: "Turnaround time has doubled during the busy season and customers are going elsewhere." },
      { role: "shift supervisor", org: "a grocery store", judge: "store manager", task: "Checkout lines back up every day between 4 and 6 p.m. on the same staffing as the rest of the day." }
    ]
  },
  {
    match: /econom|entrepreneur|strategic management|market planning/i,
    items: [
      { role: "business consultant", org: "a small tutoring company", judge: "founder", task: "The founder wants to expand into a neighboring city without checking whether the demand is there." },
      { role: "strategy intern", org: "a subscription board game company", judge: "chief executive officer", task: "Growth has flattened and leadership is deciding between a new product line and a new market." }
    ]
  }
];

const RP_TEMPLATES_GENERIC = [
  { role: "management trainee", org: "a mid-size retail business", judge: "store manager", task: "The manager wants your recommendation on a decision the business has been putting off." },
  { role: "business associate", org: "a growing local service company", judge: "owner", task: "The owner needs a clear explanation before committing to a change that affects the whole team." },
  { role: "assistant manager", org: "a regional franchise location", judge: "district manager", task: "The district manager wants to understand your reasoning before approving the plan." }
];

function plannerScenarioBank(area) {
  const set = RP_TEMPLATE_SETS.find(s => s.match.test(area || ""));
  return set ? set.items.concat(RP_TEMPLATES_GENERIC) : RP_TEMPLATES_GENERIC;
}

// Deliberately soft on specifics — DECA revises these, and a confidently wrong
// prep time is worse than telling a student to check.
function plannerRoleplayFormat(eventLabel) {
  const e = String(eventLabel || "");
  if (/TDM|Team Decision/i.test(e)) {
    return { label: "Team Decision Making", detail: "30 minutes of prep, a presentation with your partner, 7 performance indicators" };
  }
  if (/PSE|FCE|HTPS|Selling|Consulting/i.test(e)) {
    return { label: "Professional Selling / Consulting", detail: "no on-site prep — you build and rehearse this in advance" };
  }
  if (/^Principles|\(P[BEFHM]/i.test(e)) {
    return { label: "Principles event", detail: "10 minutes of prep, up to 10 minutes with the judge, 4 performance indicators" };
  }
  return { label: "Individual Series", detail: "10 minutes of prep, up to 10 minutes with the judge, 5 performance indicators" };
}

/* ---------- prepared event section templates ---------- */
// Only used when no rubric has been entered under Admin > Rubrics for this
// event. Anything entered there wins, because it came from the real guidelines.

const WRITTEN_SECTION_TEMPLATES = {
  research: [
    { section: "Executive Summary", goal: "A one-page overview of the whole entry — the problem, what you found, and what you're recommending.", checklist: ["Write this LAST, after everything else is done", "One page, no new information", "A judge who reads only this should understand your recommendation"] },
    { section: "Introduction", goal: "Describe the business or organization and state exactly what you set out to research and why.", checklist: ["Describe the business, its industry, and its customers", "State the research problem in one clear sentence", "Explain why this problem matters to the business"] },
    { section: "Research Methods", goal: "Explain how you gathered your data so a judge could repeat it.", checklist: ["Name your primary and secondary methods", "Give sample size and who you surveyed", "Attach the actual survey or interview questions to the appendix"] },
    { section: "Findings and Conclusions", goal: "Report what the data actually showed, then say what it means.", checklist: ["Use charts or tables — don't make a judge read raw numbers", "Separate what you found from what you concluded", "Tie each conclusion back to a specific finding"] },
    { section: "Proposed Strategic Plan", goal: "The recommendation itself: objectives, activities, timeline, budget, and how success gets measured.", checklist: ["Objectives must be specific and measurable", "Include a timeline and a real budget", "Say how the business will know if it worked"] },
    { section: "Bibliography", goal: "Cite every source you used, in the format your guidelines require.", checklist: ["Every statistic in the entry traces to a source here", "Use one consistent citation format"] },
    { section: "Appendix", goal: "Supporting exhibits — surveys, raw data, anything referenced in the body.", checklist: ["Every appendix item is referenced somewhere in the body", "Confirm whether appendix pages count toward your page limit"] }
  ],
  entrepreneurship: [
    { section: "Executive Summary", goal: "The whole plan in one page — the concept, the market, the money, and the ask.", checklist: ["Write this LAST", "State clearly what you're asking a reader to fund or approve", "No new information that isn't in the body"] },
    { section: "Introduction / Description of the Business", goal: "What the business is, what it sells, and what makes it different.", checklist: ["Describe the product or service concretely", "State the legal structure and ownership", "Name the specific problem the business solves"] },
    { section: "Analysis of the Business Situation", goal: "Industry, competition, target market, and a SWOT the judge can actually believe.", checklist: ["Define the target market with real demographics", "Name specific competitors, not 'other businesses'", "SWOT items should be evidence-backed"] },
    { section: "Planned Operation", goal: "How the business will actually run day to day, plus the marketing plan.", checklist: ["Cover organization, staffing, and location", "Include the full marketing mix", "Explain your channel of distribution"] },
    { section: "Financial Plan", goal: "Startup costs, projected income statement, and where the money comes from.", checklist: ["Show your assumptions, not just the totals", "Project at least the required number of years", "Include a break-even analysis"] },
    { section: "Conclusion", goal: "Close on the growth path and why this business is worth backing.", checklist: ["Restate the ask", "Be specific about what happens after year one"] },
    { section: "Bibliography", goal: "Cite every source behind your market and financial claims.", checklist: ["Every market statistic traces to a source", "One consistent citation format"] },
    { section: "Appendix", goal: "Supporting exhibits — financial detail, samples, research.", checklist: ["Everything here is referenced in the body", "Confirm whether these pages count toward your limit"] }
  ],
  imc: [
    { section: "Executive Summary", goal: "The campaign in one page — what you promoted, to whom, and what happened.", checklist: ["Write this LAST", "Include your headline result", "No new information"] },
    { section: "Description of the Product/Service/Event and Target Market", goal: "What you promoted and exactly who you were trying to reach.", checklist: ["Describe the client and the offering", "Define the target market with real data, not guesses", "Explain why this market was chosen"] },
    { section: "Campaign Objectives", goal: "What the campaign was supposed to achieve, stated so it can be measured.", checklist: ["Every objective has a number and a deadline", "Objectives connect to the target market you just defined"] },
    { section: "Campaign Schedule and Budget", goal: "When each activity ran and what it cost.", checklist: ["Show a real calendar or timeline", "Itemize the budget, including donated value", "Costs should tie to the activities listed next"] },
    { section: "Promotional Activities", goal: "What you actually did, with samples of the work.", checklist: ["Include samples of every major piece", "Explain the reasoning behind each channel choice", "Show the mix — not just social media"] },
    { section: "Evaluation and Recommendations", goal: "Measure against your objectives and say what you'd do differently.", checklist: ["Compare results directly to each stated objective", "Be honest about what underperformed", "Give the client concrete next steps"] },
    { section: "Bibliography", goal: "Cite your research sources.", checklist: ["Market data traces to a source", "One consistent format"] },
    { section: "Appendix", goal: "Campaign samples and supporting exhibits.", checklist: ["Everything is referenced in the body", "Confirm page-limit rules for appendices"] }
  ],
  project: [
    { section: "Executive Summary", goal: "The project in one page — why you ran it, what you did, and the result.", checklist: ["Write this LAST", "Lead with the impact", "No new information"] },
    { section: "Description of the Project", goal: "The rationale and the objectives — why this project, and what success looked like.", checklist: ["Explain the need with evidence, not assumption", "State measurable objectives up front", "Describe who the project served"] },
    { section: "Organization and Implementation", goal: "How the project was planned and carried out: roles, timeline, and budget.", checklist: ["Name who did what", "Include a real timeline and budget", "Describe the obstacles and how you handled them"] },
    { section: "Evaluation and Recommendations", goal: "Measure against your objectives and say what should happen next.", checklist: ["Compare results to each objective directly", "Include evidence of impact", "Give recommendations for continuing the project"] },
    { section: "Bibliography", goal: "Cite every source used.", checklist: ["Statistics trace to sources", "One consistent format"] },
    { section: "Appendix", goal: "Supporting exhibits and documentation.", checklist: ["Everything is referenced in the body", "Confirm page-limit rules for appendices"] }
  ]
};

// Rubric first, template second. A rubric an admin typed in came from the real
// guidelines; the template is only a starting scaffold.
function plannerWrittenSections(eventCode, family) {
  const rubric = rubrics.find(r =>
    (r.eventCode && eventCode && r.eventCode.toLowerCase() === eventCode.toLowerCase())
  );

  if (rubric && (rubric.rubricSections || []).length) {
    return {
      source: "rubric",
      eventName: rubric.eventName,
      sections: rubric.rubricSections.map(s => ({
        section: s.section,
        goal: s.criteria || "Write this section to the standard in your event's guidelines.",
        checklist: []
      }))
    };
  }

  if (rubric && (rubric.requiredText || []).length) {
    return {
      source: "rubric",
      eventName: rubric.eventName,
      sections: rubric.requiredText.map(t => ({
        section: t.phrase,
        goal: "This is required text for your event — it has to appear in the entry exactly as your guidelines word it.",
        checklist: t.points != null ? [`Missing this costs ${t.points} penalty points`] : []
      }))
    };
  }

  return {
    source: "template",
    eventName: "",
    sections: WRITTEN_SECTION_TEMPLATES[family] || WRITTEN_SECTION_TEMPLATES.project
  };
}

/* ---------- setup screen ---------- */

function renderPlannerForm() {
  const setup = document.getElementById("plannerSetup");
  if (!setup) return;

  const cluster = userData?.clusterExam || "";
  const roleplay = userData?.roleplayEvent || "";
  const written = userData?.writtenEvent || "";

  const card = (mode, label, value, blurb) => `
    <button class="pl-mode ${plannerMode === mode ? "active" : ""} ${value ? "" : "empty"}"
            onclick="${value ? `plannerPickMode('${mode}')` : `showTab('profile')`}">
      <span class="pl-mode-label">${label}</span>
      <span class="pl-mode-value">${value || "Not set — tap to add it on your Profile"}</span>
      <span class="pl-mode-blurb">${blurb}</span>
    </button>
  `;

  const saved = (userData?.studyPlans || {})[plannerMode];

  // The PI-per-session control only appears for roleplay — the exam and
  // written paths don't use performance indicators at all.
  const kpiFieldHtml = plannerMode === "roleplay" ? `
    <div class="form-group">
      <label>Performance Indicators Per Session</label>
      <select id="plannerKpiCount">
        ${[3,4,6,8].map(n => `<option value="${n}" ${String(saved?.kpisPerSession || 4) === String(n) ? "selected" : ""}>${n} PIs${n === 3 ? " — light" : n === 4 ? " — standard" : n === 6 ? " — heavy" : " — cram"}</option>`).join("")}
      </select>
    </div>` : "";

  const formHtml = plannerMode ? `
    <div class="widget planner-form-widget">
      <h3>${plannerMode === "exam" ? "Exam prep plan" : plannerMode === "roleplay" ? "Roleplay prep plan" : "Written entry plan"}</h3>
      <div class="form-group">
        <label>Conference / Test Date</label>
        <input type="date" id="plannerDate" value="${saved?.conferenceDate || ""}">
      </div>
      <div class="form-group">
        <label>Study Days Per Week</label>
        <select id="plannerDays">
          ${[2,3,4,5,6,7].map(n => `<option value="${n}" ${String(saved?.daysPerWeek || 3) === String(n) ? "selected" : ""}>${n} days</option>`).join("")}
        </select>
      </div>
      ${kpiFieldHtml}
      <button class="btn-primary" onclick="generateStudyPlan()">${saved ? "Rebuild My Plan" : "Build My Plan"}</button>
    </div>
  ` : "";

  setup.innerHTML = `
    <div class="pl-mode-label-row">What do you want to study for?</div>
    <div class="pl-modes">
      ${card("roleplay", "My Roleplay", roleplay, "Watch, study the PIs, then run a practice roleplay")}
      ${card("exam", "My Cluster Exam", cluster, "Which videos to watch and which questions to practice")}
      ${card("prepared", "My Prepared Event", written, "Write your entry one section at a time")}
    </div>
    ${formHtml}
  `;

  if (saved) renderPlanResults(saved);
  else document.getElementById("plannerResults").innerHTML = "";
}

window.plannerPickMode = function(mode) {
  plannerMode = mode;
  renderPlannerForm();
};

/* ---------- generation ---------- */

window.generateStudyPlan = async function() {
  if (!plannerMode) return;
  const conferenceDate = document.getElementById("plannerDate").value;
  const daysPerWeek = Number(document.getElementById("plannerDays")?.value) || 3;
  const kpisPerSession = Number(document.getElementById("plannerKpiCount")?.value) || 4;

  if (!conferenceDate) return alert("Pick your conference date first.");
  const timeline = plannerTimeline(conferenceDate, daysPerWeek);
  if (timeline.daysUntil < 1) return alert("That date has already passed — pick your next conference.");
  if (!kpisLoaded && plannerMode === "roleplay") {
    return alert("The performance indicator database is still loading — give it a second and try again.");
  }

  let plan;
  if (plannerMode === "exam") plan = buildExamPlan(timeline, conferenceDate, daysPerWeek);
  else if (plannerMode === "roleplay") plan = buildRoleplayPlan(timeline, conferenceDate, daysPerWeek, kpisPerSession);
  else plan = buildPreparedPlan(timeline, conferenceDate, daysPerWeek);

  if (typeof plan === "string") return alert(plan);

  renderPlanResults(plan);
  await plannerSavePlan(plan);
};

function buildExamPlan(timeline, conferenceDate, daysPerWeek) {
  const label = userData?.clusterExam || "";
  const courseId = PLANNER_CLUSTER_COURSE[plannerNorm(label)];
  const course = plannerCourseById(courseId);
  if (!course) return `We don't have a course for ${label} yet — check back once it's added.`;

  const units = buildUnits(course).filter(u => u.lessons.length);
  if (!units.length) return `${course.title} doesn't have any units yet — check back soon.`;

  const unitsPer = Math.max(1, Math.ceil(units.length / timeline.slots));

  const sessions = [];
  for (let i = 0; i < units.length; i += unitsPer) {
    const chunk = units.slice(i, i + unitsPer);
    sessions.push({
      kind: "unit",
      courseId: course.id,
      unitKeys: chunk.map(u => u.key),
      title: chunk.length === 1
        ? stripUnitSuffix(chunk[0].title)
        : `${stripUnitSuffix(chunk[0].title)} + ${chunk.length - 1} more`,
      kpiIds: []
    });
  }

  // Spare time goes into full timed exams rather than padded content.
  const spare = Math.max(0, timeline.slots - sessions.length - 1);
  for (let i = 0; i < Math.min(spare, 4); i++) {
    sessions.push({
      kind: "review", courseId: course.id,
      title: `Full practice exam #${i + 1}`, unitKeys: [], kpiIds: []
    });
  }

  sessions.push({ kind: "final", courseId: course.id, title: "Final review", unitKeys: [], kpiIds: [] });

  return {
    mode: "exam", conferenceDate, daysPerWeek,
    eventLabel: label, courseId: course.id, courseTitle: course.title,
    daysUntil: timeline.daysUntil,
    unitsCovered: units.length,
    sessions: plannerStampDates(sessions, timeline),
    generatedAt: new Date().toISOString()
  };
}

function buildRoleplayPlan(timeline, conferenceDate, daysPerWeek, kpisPerSession) {
  const label = userData?.roleplayEvent || "";
  const code = plannerEventCode(label);
  const map = PLANNER_RP_EVENTS[code];
  if (!map) return `We don't have ${label || "that event"} mapped yet — pick your roleplay event on your Profile.`;

  let course = plannerCourseById(map.course);
  let units = course ? buildUnits(course).filter(u => u.lessons.length) : [];
  let borrowedFrom = "";

  // Most roleplay courses have no lessons yet. Rather than showing an empty
  // plan, borrow the matching cluster course's units and say so.
  if (!units.length) {
    const fallbackId = PLANNER_CLUSTER_COURSE[plannerNorm(map.cluster)];
    const fallback = plannerCourseById(fallbackId);
    const fallbackUnits = fallback ? buildUnits(fallback).filter(u => u.lessons.length) : [];
    if (fallbackUnits.length) {
      borrowedFrom = fallback.title;
      course = fallback;
      units = fallbackUnits;
    }
  }

  const take = plannerAllocator(plannerRankedKpis(map.cluster));
  const sessions = [];

  if (units.length) {
    const unitsPer = Math.max(1, Math.ceil(units.length / Math.max(1, timeline.slots - 1)));
    for (let i = 0; i < units.length; i += unitsPer) {
      const chunk = units.slice(i, i + unitsPer);
      sessions.push({
        kind: "roleplay",
        courseId: course.id,
        unitKeys: chunk.map(u => u.key),
        area: stripUnitSuffix(chunk[0].title).replace(/^Unit\s*\d+\s*:?\s*/i, ""),
        title: chunk.length === 1 ? stripUnitSuffix(chunk[0].title) : `${stripUnitSuffix(chunk[0].title)} + ${chunk.length - 1} more`,
        kpiIds: take(chunk.map(u => plannerUnitArea(u.title)), kpisPerSession)
      });
    }
  } else {
    // No units anywhere — still give them PI blocks and roleplays.
    const count = Math.max(1, timeline.slots - 1);
    for (let i = 0; i < count; i++) {
      const ids = take([], kpisPerSession);
      if (!ids.length) break;
      const first = kpis.find(k => k.id === ids[0]);
      sessions.push({
        kind: "roleplay", courseId: course ? course.id : "", unitKeys: [],
        area: first?.area || "", title: first?.area || `Practice set ${i + 1}`,
        kpiIds: ids
      });
    }
  }

  sessions.push({ kind: "final", courseId: course ? course.id : "", title: "Timed dress rehearsal", unitKeys: [], kpiIds: [] });

  return {
    mode: "roleplay", conferenceDate, daysPerWeek, kpisPerSession,
    eventLabel: label, eventCode: code,
    courseId: course ? course.id : "", courseTitle: course ? course.title : "",
    borrowedFrom, clusterLabel: map.cluster, daysUntil: timeline.daysUntil,
    kpiCovered: sessions.reduce((n, s) => n + s.kpiIds.length, 0),
    kpiTotal: plannerKpiPool(map.cluster).length,
    sessions: plannerStampDates(sessions, timeline),
    generatedAt: new Date().toISOString()
  };
}

function buildPreparedPlan(timeline, conferenceDate, daysPerWeek) {
  const label = userData?.writtenEvent || "";
  const code = plannerEventCode(label);
  const map = PLANNER_WRITTEN_EVENTS[code];
  if (!map) return `We don't have ${label || "that event"} mapped yet — pick your written event on your Profile.`;

  const course = plannerCourseById(map.course);
  const units = course ? buildUnits(course).filter(u => u.lessons.length) : [];
  const built = plannerWrittenSections(code, map.family);

  // Writing sections aren't interchangeable with study days — group them when
  // time is short, and spend leftover slots on revision instead of filler.
  const writingSlots = Math.max(1, timeline.slots - 2);
  const perSession = Math.max(1, Math.ceil(built.sections.length / writingSlots));

  const sessions = [];
  for (let i = 0; i < built.sections.length; i += perSession) {
    const chunk = built.sections.slice(i, i + perSession);
    sessions.push({
      kind: "written",
      courseId: course ? course.id : "",
      unitKeys: units.length && sessions.length === 0 ? [units[0].key] : [],
      title: chunk.map(s => s.section).join(" + "),
      sections: chunk,
      kpiIds: []
    });
  }

  sessions.push({
    kind: "revise", courseId: course ? course.id : "", unitKeys: [], kpiIds: [],
    title: "Full read-through and revision",
    sections: []
  });
  sessions.push({
    kind: "check", courseId: course ? course.id : "", unitKeys: [], kpiIds: [],
    title: "Run it through the entry checker",
    sections: []
  });

  return {
    mode: "prepared", conferenceDate, daysPerWeek,
    eventLabel: label, eventCode: code,
    courseId: course ? course.id : "", courseTitle: course ? course.title : "",
    sectionSource: built.source, daysUntil: timeline.daysUntil,
    sessions: plannerStampDates(sessions, timeline),
    generatedAt: new Date().toISOString()
  };
}

/* ---------- persistence + interactions ---------- */

async function plannerSavePlan(plan) {
  if (!userData) return;
  userData.studyPlans = { ...(userData.studyPlans || {}), [plan.mode]: plan };
  if (!currentUser) return;
  try {
    await updateDoc(doc(db, "users", currentUser.uid), { studyPlans: userData.studyPlans });
  } catch (e) {
    console.error("Failed to save study plan:", e);
  }
}

function plannerCurrentPlan() {
  return (userData?.studyPlans || {})[plannerMode] || null;
}

window.plannerSetConfidence = async function(kpiId, level) {
  if (!userData) return;
  const map = { ...(userData.kpiConfidence || {}) };
  if (map[kpiId] === level) delete map[kpiId]; else map[kpiId] = level;
  userData.kpiConfidence = map;
  renderPlanResults(plannerCurrentPlan());
  if (!currentUser) return;
  try {
    await updateDoc(doc(db, "users", currentUser.uid), { kpiConfidence: map });
  } catch (e) {
    console.error("Failed to save PI confidence:", e);
  }
};

window.plannerToggleSession = async function(num) {
  const plan = plannerCurrentPlan();
  const session = plan?.sessions?.find(s => s.num === Number(num));
  if (!session) return;
  session.done = !session.done;
  renderPlanResults(plan);
  await plannerSavePlan(plan);
};

window.plannerCycleScenario = async function(num) {
  const plan = plannerCurrentPlan();
  const session = plan?.sessions?.find(s => s.num === Number(num));
  if (!session) return;
  session.rpOffset = (session.rpOffset || 0) + 1;
  renderPlanResults(plan);
  await plannerSavePlan(plan);
};

// The KPI list is capped and cluster-filtered, so widen the filter and seed the
// search first — otherwise the tab opens on a different indicator.
window.plannerOpenKPI = function(kpiId) {
  const k = kpis.find(x => x.id === kpiId);
  if (!k) return;
  kpiActiveCategory = "All KPIs";
  selectedKPIId = kpiId;
  showTab("kpi");
  const box = document.getElementById("kpiSearch");
  if (box) box.value = k.code || k.title;
  renderKPIList();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/* ---------- rendering ---------- */

function plannerDateLabel(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function plannerKpiChipHtml(kpiId) {
  const k = kpis.find(x => x.id === kpiId);
  if (!k) return "";
  const state = (userData?.kpiConfidence || {})[kpiId] || "";
  return `
    <div class="pl-kpi ${state}">
      <button class="pl-kpi-title" onclick="plannerOpenKPI('${kpiId}')" title="Open in the KPI Database">
        ${k.code ? `<span class="pl-kpi-code">${k.code}</span>` : ""}${k.title}
      </button>
      <div class="pl-conf">
        <button class="pl-conf-btn ${state === "solid" ? "on solid" : ""}" onclick="plannerSetConfidence('${kpiId}','solid')">Solid</button>
        <button class="pl-conf-btn ${state === "shaky" ? "on shaky" : ""}" onclick="plannerSetConfidence('${kpiId}','shaky')">Shaky</button>
      </div>
    </div>
  `;
}

function plannerUnitLinksHtml(plan, session, rewatch) {
  const links = (session.unitKeys || []).map(key => {
    const unit = findUnit(session.courseId, key);
    if (!unit) return "";
    return `
      ${unit.video ? `<button class="pl-link" onclick="openUnit('${session.courseId}','${unit.key}','video')">${icon("play")} ${stripUnitSuffix(unit.title)}${rewatch ? " — rewatch" : ""}</button>` : ""}
      ${unit.quiz ? `<button class="pl-link" onclick="openUnit('${session.courseId}','${unit.key}','practice')">${icon("quiz")} Practice questions</button>` : ""}
      ${unit.article ? `<button class="pl-link" onclick="openUnit('${session.courseId}','${unit.key}','article')">${icon("file")} Article</button>` : ""}
    `;
  }).join("");
  return links.trim() ? `<div class="pl-links">${links}</div>` : `<div class="pl-empty">No material for this unit yet — check back soon.</div>`;
}

function plannerRoleplayHtml(plan, session) {
  const bank = plannerScenarioBank(session.area);
  const t = bank[(session.num + (session.rpOffset || 0)) % bank.length];
  const fmt = plannerRoleplayFormat(plan.eventLabel);

  const pis = (session.kpiIds || []).map(id => kpis.find(k => k.id === id)).filter(Boolean);
  const expectations = pis.filter(k => k.judgeExpectations).slice(0, 3)
    .map(k => `<li>${k.judgeExpectations}</li>`).join("");

  return `
    <div class="pl-rp">
      <div class="pl-rp-meta">${fmt.label} — ${fmt.detail}. Confirm the current format in your event's guidelines.</div>
      <p class="pl-rp-scenario">
        You are a <strong>${t.role}</strong> at ${t.org}. ${t.task}
        The judge is the <strong>${t.judge}</strong> and will hear your recommendation.
      </p>
      <div class="pl-rp-label">Performance indicators you'll be scored on</div>
      <ul class="pl-rp-pis">${pis.map(k => `<li>${k.title}</li>`).join("")}</ul>
      <div class="pl-rp-label">Before you present</div>
      <ul class="pl-rp-check">
        ${expectations || `
          <li>Name each indicator out loud, define it, then apply it to this specific business.</li>
          <li>Give a concrete example — judges mark down answers that stay abstract.</li>`}
        <li>Close with one clear recommendation, then thank the judge.</li>
      </ul>
      <button class="admin-btn-sm ghost" onclick="plannerCycleScenario(${session.num})">Different scenario</button>
    </div>
  `;
}

function plannerWrittenHtml(session) {
  return (session.sections || []).map(s => `
    <div class="pl-written">
      <div class="pl-written-name">${s.section}</div>
      <p class="pl-written-goal">${s.goal}</p>
      ${(s.checklist || []).length ? `<ul class="pl-rp-check">${s.checklist.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
    </div>
  `).join("");
}

function plannerSessionBody(plan, session) {
  if (session.kind === "unit") {
    return `
      <div class="pl-block-label">${icon("play")} Watch &amp; practice</div>
      ${plannerUnitLinksHtml(plan, session, false)}
    `;
  }

  if (session.kind === "roleplay") {
    return `
      <div class="pl-step">Step 1 — Watch</div>
      ${plannerUnitLinksHtml(plan, session, false)}
      <div class="pl-step">Step 2 — Study these performance indicators</div>
      <div class="pl-kpis">${session.kpiIds.map(plannerKpiChipHtml).join("")}</div>
      <div class="pl-step">Step 3 — Run the practice roleplay out loud</div>
      ${plannerRoleplayHtml(plan, session)}
    `;
  }

  if (session.kind === "written") {
    return `
      <div class="pl-block-label">${icon("clipboard")} Write this section</div>
      ${plannerWrittenHtml(session)}
      ${(session.unitKeys || []).length ? `
        <div class="pl-block-label">${icon("play")} Course material</div>
        ${plannerUnitLinksHtml(plan, session, false)}` : ""}
    `;
  }

  if (session.kind === "review") {
    return `
      <div class="pl-block-label">${icon("timer")} Sit a full timed exam</div>
      <div class="pl-links">
        <button class="pl-link" onclick="openExamSetup('${session.courseId}')">${icon("timer")} Start practice exam</button>
      </div>
      <ul class="pl-rp-check">
        <li>Time yourself properly — pacing is half of what the exam tests.</li>
        <li>Afterward, reopen the unit behind every question you missed.</li>
      </ul>
    `;
  }

  if (session.kind === "revise") {
    return `
      <div class="pl-block-label">${icon("file")} Read it start to finish</div>
      <ul class="pl-rp-check">
        <li>Read the whole entry out loud — that's how you catch sentences that don't work.</li>
        <li>Write the Executive Summary now if you haven't, since everything else is finished.</li>
        <li>Check every heading against the exact wording in your guidelines.</li>
        <li>Give it to your advisor with enough time for them to actually read it.</li>
      </ul>
    `;
  }

  if (session.kind === "check") {
    return `
      <div class="pl-block-label">${icon("clipboard")} Mechanical check</div>
      <div class="pl-links">
        <button class="pl-link" onclick="showTab('prepared')">${icon("clipboard")} Open the entry checker</button>
      </div>
      <ul class="pl-rp-check">
        <li>Export as a PDF from Docs or Word so the page breaks match what a judge sees.</li>
        <li>Fix anything the checker flags, then run it once more.</li>
        <li>The checker catches formatting, not writing quality — your advisor still needs to read it.</li>
      </ul>
    `;
  }

  // final
  const isRp = plan.mode === "roleplay";
  return `
    <div class="pl-block-label">${icon("target")} The day before</div>
    <ul class="pl-rp-check">
      ${isRp ? `
        <li>Run one full roleplay under real timing, out loud, with someone playing the judge.</li>
        <li>Reread every PI you marked shaky — those are the ones that cost points.</li>
        <li>Pack your materials and confirm your event's report time.</li>`
      : `
        <li>Skim every unit title and say out loud what it covers — if you can't, reopen that unit.</li>
        <li>Redo the practice questions you got wrong, not the ones you got right.</li>
        <li>Sleep. A tired brain loses more points than one more hour of review gains.</li>`}
    </ul>
  `;
}

function plannerSessionHtml(plan, session) {
  return `
    <div class="pl-session ${session.done ? "done" : ""} ${session.kind === "final" ? "final" : ""}">
      <div class="pl-head">
        <div class="pl-num">${session.done ? icon("check") : session.num}</div>
        <div class="pl-head-info">
          <div class="pl-title">${session.title}</div>
          <div class="pl-date">${plannerDateLabel(session.date)}${session.kpiIds?.length ? ` · ${session.kpiIds.length} ${session.kpiIds.length === 1 ? "PI" : "PIs"}` : ""}</div>
        </div>
        <button class="admin-btn-sm ${session.done ? "ghost" : ""}" onclick="plannerToggleSession(${session.num})">
          ${session.done ? "Undo" : "Mark done"}
        </button>
      </div>
      ${plannerSessionBody(plan, session)}
    </div>
  `;
}

function renderPlanResults(plan) {
  const container = document.getElementById("plannerResults");
  if (!container) return;
  if (!plan || !plan.sessions || !plan.sessions.length) { container.innerHTML = ""; return; }

  const doneCount = plan.sessions.filter(s => s.done).length;
  const pct = Math.round((doneCount / plan.sessions.length) * 100);

  const shaky = plan.mode !== "roleplay" ? [] : Object.entries(userData?.kpiConfidence || {})
    .filter(([, v]) => v === "shaky")
    .map(([id]) => kpis.find(k => k.id === id))
    .filter(Boolean);

  const shakyHtml = shaky.length ? `
    <div class="widget pl-shaky">
      <div class="widget-header"><span>Needs another look</span><span class="widget-badge">${shaky.length}</span></div>
      <div class="pl-shaky-list">
        ${shaky.slice(0, 12).map(k => `<button class="pl-shaky-item" onclick="plannerOpenKPI('${k.id}')">${k.title}</button>`).join("")}
      </div>
      ${shaky.length > 12 ? `<div class="pl-empty">+ ${shaky.length - 12} more marked shaky.</div>` : ""}
    </div>` : "";

  const notes = [];
  if (plan.borrowedFrom) {
    notes.push(`<div class="planner-warning">${icon("alert")} Your event's own course doesn't have units yet, so this plan uses <strong>${plan.borrowedFrom}</strong> — the same material your event's exam draws from. It'll switch over automatically once the event course has content.</div>`);
  }
  if (plan.mode === "prepared" && plan.sectionSource === "template") {
    notes.push(`<div class="planner-warning">${icon("alert")} No rubric has been entered for ${plan.eventLabel} yet, so these sections come from a general template. Check them against your event's current guidelines — and once an admin adds the rubric under Admin &gt; Rubrics, rebuilding this plan will use the real one.</div>`);
  }
  if (plan.mode === "roleplay" && plan.kpiTotal && plan.kpiCovered < plan.kpiTotal) {
    notes.push(`<div class="planner-warning">${icon("alert")} This covers the ${plan.kpiCovered} highest-priority indicators out of ${plan.kpiTotal} in ${plan.clusterLabel}. Add a study day or raise PIs per session to cover more.</div>`);
  }

  const statsHtml = plan.mode === "prepared" ? `
    <div class="planner-summary-stat"><div class="val">${plan.daysUntil}</div><div class="lbl">Days Until Conference</div></div>
    <div class="planner-summary-stat"><div class="val">${plan.sessions.length}</div><div class="lbl">Work Sessions</div></div>
    <div class="planner-summary-stat"><div class="val">${plan.sessions.filter(s => s.kind === "written").length}</div><div class="lbl">Writing Blocks</div></div>
    <div class="planner-summary-stat"><div class="val">${plan.daysPerWeek}/wk</div><div class="lbl">Days Per Week</div></div>
  ` : plan.mode === "exam" ? `
    <div class="planner-summary-stat"><div class="val">${plan.daysUntil}</div><div class="lbl">Days Until Conference</div></div>
    <div class="planner-summary-stat"><div class="val">${plan.sessions.length}</div><div class="lbl">Sessions</div></div>
    <div class="planner-summary-stat"><div class="val">${plan.unitsCovered}</div><div class="lbl">Units Covered</div></div>
    <div class="planner-summary-stat"><div class="val">${plan.sessions.filter(s => s.kind === "review").length}</div><div class="lbl">Practice Exams</div></div>
  ` : `
    <div class="planner-summary-stat"><div class="val">${plan.daysUntil}</div><div class="lbl">Days Until Conference</div></div>
    <div class="planner-summary-stat"><div class="val">${plan.sessions.length}</div><div class="lbl">Sessions</div></div>
    <div class="planner-summary-stat"><div class="val">${plan.kpiCovered}</div><div class="lbl">PIs Covered</div></div>
    <div class="planner-summary-stat"><div class="val">${plan.daysPerWeek}/wk</div><div class="lbl">Days Per Week</div></div>
  `;

  const weeks = [...new Set(plan.sessions.map(s => s.week))];
  const weeksHtml = weeks.map(w => `
    <div class="pl-week-label">Week ${w}</div>
    ${plan.sessions.filter(s => s.week === w).map(s => plannerSessionHtml(plan, s)).join("")}
  `).join("");

  container.innerHTML = `
    <div class="planner-summary">
      <h3>${plan.eventLabel}</h3>
      <div class="pl-summary-sub">${plan.courseTitle ? `Built from ${plan.courseTitle}` : "Built from your performance indicators"}</div>
      <div class="planner-summary-grid">${statsHtml}</div>
      <div class="pl-progress-row"><span>${doneCount} of ${plan.sessions.length} sessions done</span><span>${pct}%</span></div>
      <div class="xp-bar-outer" style="margin-bottom:0;"><div class="xp-bar-inner" style="width:${pct}%"></div></div>
      ${notes.join("")}
    </div>
    ${shakyHtml}
    <div class="planner-weeks">${weeksHtml}</div>
  `;
}

// ========================================================================
// ========================= BOOKMARKS ====================================
// ========================================================================

window.toggleLessonBookmark = async function(lessonId) {
  if (!currentUser || !userData || !lessonId) return;
  const current = userData.bookmarkedLessons || [];
  const updated = current.includes(lessonId) ? current.filter(id => id !== lessonId) : [...current, lessonId];

  try {
    await updateDoc(doc(db, "users", currentUser.uid), { bookmarkedLessons: updated });
    userData.bookmarkedLessons = updated;
    if (currentCourseId && !currentUnitKey) openCourse(currentCourseId);
    renderProfileBookmarks();
  } catch (e) {
    console.error("Failed to update bookmark:", e);
  }
};

window.toggleKPIBookmark = async function(kpiId) {
  if (!currentUser || !userData) return;
  const current = userData.bookmarkedKPIs || [];
  const updated = current.includes(kpiId) ? current.filter(id => id !== kpiId) : [...current, kpiId];

  try {
    await updateDoc(doc(db, "users", currentUser.uid), { bookmarkedKPIs: updated });
    userData.bookmarkedKPIs = updated;
    renderKPIList();
    renderProfileBookmarks();
  } catch (e) {
    console.error("Failed to update bookmark:", e);
  }
};

function renderProfileBookmarks() {
  const container = document.getElementById("profileBookmarks");
  if (!container || !userData) return;

  const bookmarkedLessonIds = userData.bookmarkedLessons || [];
  const bookmarkedKPIIds = userData.bookmarkedKPIs || [];

  const lessonRows = bookmarkedLessonIds.map(id => {
    const course = courses.find(c => c.lessons.some(l => l.id === id));
    const lesson = course?.lessons.find(l => l.id === id);
    if (!lesson) return "";
    return `
      <div class="bookmark-row" onclick="openLesson('${course.id}', '${lesson.id}')">
        ${icon(lesson.type === "quiz" ? "quiz" : lesson.type === "article" ? "file" : "play")}
        <span>${stripUnitSuffix(lesson.title)}</span>
        <span class="bookmark-row-sub">${course.title}</span>
      </div>
    `;
  }).join("");

  const kpiRows = bookmarkedKPIIds.map(id => {
    const k = kpis.find(k => k.id === id);
    if (!k) return "";
    return `
      <div class="bookmark-row" onclick="showTab('kpi'); selectKPI('${k.id}')">
        ${icon("bookmarkFilled")}
        <span>${k.title}</span>
        <span class="bookmark-row-sub">${k.cluster}</span>
      </div>
    `;
  }).join("");

  if (!lessonRows && !kpiRows) {
    container.innerHTML = `<div class="admin-empty-state">Bookmark units and performance indicators to find them here.</div>`;
    return;
  }

  container.innerHTML = `
    ${lessonRows ? `<div class="bookmark-group-label">Units</div>${lessonRows}` : ""}
    ${kpiRows ? `<div class="bookmark-group-label">Performance Indicators</div>${kpiRows}` : ""}
  `;
}

// ========================================================================
// ========================= CERTIFICATES =================================
// ========================================================================
// A course counts as complete when every one of its parts — video, article,
// and practice questions across every unit — is marked done. The certificate
// is drawn on a canvas in the browser and downloaded as a PNG, so there's no
// library to load, no server to call, and nothing to store.

function courseIsComplete(course) {
  if (!course || !course.lessons.length) return false;
  const done = userData?.completedLessons || [];
  return course.lessons.every(l => done.includes(l.id));
}

function completedCourses() {
  return courses.filter(courseIsComplete);
}

// XP the student actually earned from this course's parts.
function courseXpEarned(course) {
  const done = userData?.completedLessons || [];
  return course.lessons
    .filter(l => done.includes(l.id))
    .reduce((sum, l) => sum + (l.xp || 0), 0);
}

function renderProfileCertificates() {
  const container = document.getElementById("profileCertificates");
  if (!container) return;

  const finished = completedCourses();
  if (!finished.length) {
    container.innerHTML = `<div class="admin-empty-state">Finish every unit in a course and its certificate shows up here.</div>`;
    return;
  }

  container.innerHTML = finished.map(c => `
    <div class="cert-row">
      ${icon("award")}
      <div class="cert-row-info">
        <div class="cert-row-title">${c.title}</div>
        <div class="cert-row-sub">${buildUnits(c).length} units · ${courseXpEarned(c)} XP earned</div>
      </div>
      <button class="admin-btn-sm" onclick="downloadCertificate('${c.id}')">${icon("download")} Download</button>
    </div>
  `).join("");
}

// ---- drawing -------------------------------------------------------------
const CERT_W = 2000;
const CERT_H = 1414;

function certWrap(ctx, text, font, maxWidth) {
  ctx.font = font;
  const words = String(text || "").split(" ");
  const lines = [];
  let line = "";

  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function certText(ctx, text, font, color, y, opts = {}) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  if (opts.spacing != null && "letterSpacing" in ctx) ctx.letterSpacing = `${opts.spacing}px`;
  ctx.fillText(text, CERT_W / 2, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
}

// The same barn used elsewhere on the site, as a pale watermark.
function certBarn(ctx, cx, cy, size, alpha) {
  const path = new Path2D("M3 21V11l4-3.5L12 4l5 3.5 4 3.5v10Z M10 21v-6.5h4V21 M10 14.5l4 6.5 M14 14.5l-4 6.5");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = "#0f5f8c";
  ctx.lineWidth = 1.1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(path);
  ctx.restore();
}

async function drawCertificate(canvas, data) {
  const ctx = canvas.getContext("2d");
  canvas.width = CERT_W;
  canvas.height = CERT_H;

  // Canvas won't use a webfont it hasn't been told to load, even when the page
  // is already using it — so ask for every weight/size we're about to draw.
  if (document.fonts && document.fonts.load) {
    try {
      await Promise.all([
        document.fonts.load("900 92px Montserrat"),
        document.fonts.load("800 72px Montserrat"),
        document.fonts.load("700 48px Montserrat"),
        document.fonts.load("600 30px Montserrat"),
        document.fonts.load("700 34px Montserrat")
      ]);
      await document.fonts.ready;
    } catch (e) {
      console.warn("Font preload for the certificate failed; falling back.", e);
    }
  }

  // paper
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  // gradient frame
  const frame = ctx.createLinearGradient(0, 0, CERT_W, CERT_H);
  frame.addColorStop(0, "#0a1a2b");
  frame.addColorStop(0.5, "#167db5");
  frame.addColorStop(1, "#38bdf8");
  ctx.fillStyle = frame;
  ctx.fillRect(0, 0, CERT_W, CERT_H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(26, 26, CERT_W - 52, CERT_H - 52);

  // hairline inner rule
  ctx.strokeStyle = "rgba(22,125,181,.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 58, CERT_W - 116, CERT_H - 116);

  certBarn(ctx, CERT_W / 2, 880, 620, 0.05);

  let y = 190;

  certText(ctx, "FARM4GLASS", "800 34px Montserrat, sans-serif", "#167db5", y, { spacing: 14 });
  y += 118;

  certText(ctx, "Certificate of Completion", "900 78px Montserrat, sans-serif", "#0a1a2b", y);
  y += 60;

  ctx.strokeStyle = "#167db5";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(CERT_W / 2 - 90, y);
  ctx.lineTo(CERT_W / 2 + 90, y);
  ctx.stroke();
  y += 108;

  certText(ctx, "This certifies that", "600 30px Montserrat, sans-serif", "#4a6c8c", y);
  y += 100;

  certWrap(ctx, data.name, "900 92px Montserrat, sans-serif", CERT_W - 420).slice(0, 2).forEach(line => {
    certText(ctx, line, "900 92px Montserrat, sans-serif", "#0a1a2b", y);
    y += 100;
  });
  y += 34;

  certText(ctx, "has completed every unit of", "600 30px Montserrat, sans-serif", "#4a6c8c", y);
  y += 88;

  certWrap(ctx, data.courseTitle, "700 56px Montserrat, sans-serif", CERT_W - 420).slice(0, 2).forEach(line => {
    certText(ctx, line, "700 56px Montserrat, sans-serif", "#167db5", y);
    y += 72;
  });

  // stats strip
  const statsY = CERT_H - 300;
  const cols = [
    { label: "UNITS COMPLETED", value: String(data.unitCount) },
    { label: "XP EARNED", value: data.xp.toLocaleString() },
    { label: "COMPLETED", value: data.date }
  ];
  const colW = (CERT_W - 520) / cols.length;

  cols.forEach((col, i) => {
    const cx = 260 + colW * i + colW / 2;
    ctx.textAlign = "center";
    ctx.font = "700 44px Montserrat, sans-serif";
    ctx.fillStyle = "#0a1a2b";
    ctx.fillText(col.value, cx, statsY);
    ctx.font = "700 22px Montserrat, sans-serif";
    ctx.fillStyle = "#4a6c8c";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "5px";
    ctx.fillText(col.label, cx, statsY + 44);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

    if (i < cols.length - 1) {
      ctx.strokeStyle = "rgba(22,125,181,.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(260 + colW * (i + 1), statsY - 40);
      ctx.lineTo(260 + colW * (i + 1), statsY + 54);
      ctx.stroke();
    }
  });

  certText(ctx, "Farm4Glass · farm4glass.com", "600 26px Montserrat, sans-serif", "#4a6c8c", CERT_H - 148);
  certText(ctx, "Farm4Glass is not endorsed by or affiliated with DECA Inc.", "600 20px Montserrat, sans-serif", "#8aa4bc", CERT_H - 104);
}

window.downloadCertificate = async function(courseId) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return;
  if (!courseIsComplete(course)) {
    return alert("Finish every unit in this course first — then the certificate unlocks.");
  }

  try {
    const canvas = document.createElement("canvas");
    await drawCertificate(canvas, {
      name: userData?.displayName || "DECA Student",
      courseTitle: course.title,
      unitCount: buildUnits(course).length,
      xp: courseXpEarned(course),
      date: new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    });

    canvas.toBlob(blob => {
      if (!blob) return alert("Couldn't build the certificate image — check the console.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Farm4Glass — ${course.title} Certificate.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, "image/png");

    f4gNotice("Certificate downloaded", `${course.title} — nice work finishing it.`);
  } catch (e) {
    console.error("Certificate failed:", e);
    alert("Couldn't build the certificate — check the browser console for the error.");
  }
};

// ========================================================================
// ========================= ADMIN: MEMBERS ===============================
// ========================================================================

async function renderAdminMembersSection() {
  const body = document.getElementById("adminSubtabBody");
  if (!body) return;
  body.innerHTML = `<div class="admin-empty-state">Loading members...</div>`;

  try {
    const snap = await getDocs(collection(db, "users"));
    const members = [];
    snap.forEach(d => members.push({ id: d.id, ...d.data() }));
    members.sort((a, b) => (b.xp || 0) - (a.xp || 0));

    body.innerHTML = `
      <div class="admin-panel-body">
        <h3 style="margin-bottom:16px;">${members.length} Members</h3>
        <div class="admin-members-table">
          <div class="admin-members-row admin-members-head">
            <span>Name</span><span>Email</span><span>Chapter</span><span>Association</span><span>XP</span>
          </div>
          ${members.map(m => `
            <div class="admin-members-row">
              <span>${m.displayName || "DECA Student"}</span>
              <span>${m.email || "—"}</span>
              <span>${m.chapter || "—"}</span>
              <span>${m.association || "—"}</span>
              <span>${m.xp || 0}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } catch (e) {
    console.error("Failed to load members:", e);
    body.innerHTML = `<div class="admin-empty-state">${icon("alert")} Couldn't load members — check Firestore rules allow the admin account to read the "users" collection.</div>`;
  }
}

// ========================================================================
// ========================= CALENDAR ======================================
// ========================================================================
// Events carry a start date and an optional end date, a free-text type, and
// an optional link. Older docs only had { date, type } — eventStart/eventEnd
// read through to those, so nothing already in Firestore needs migrating.
//
// REPLACES: everything from the old "CALENDAR" banner through the end of
// window.adminDeleteEvent. Nothing outside that block changes.
async function loadCalendarEvents() {
  try {
    const snap = await getDocs(collection(db, "calendarEvents"));
    calendarEvents = snap.docs.map(d => d.data());
    calendarEventsLoaded = true;
    if (document.getElementById("calendar")?.classList.contains("active")) renderCalendarList();
    if (adminActiveSubTab === "calendar" && document.getElementById("admin")?.classList.contains("active")) renderAdminCalendarSection();
  } catch (e) {
    console.error("Failed to load calendar events:", e);
    calendarEventsLoaded = true;
  }
}

// ---- shared helpers ------------------------------------------------------

// Old events stored a single "date". Read through it so they keep working.
function eventStart(e) {
  return e.startDate || e.date || "";
}
function eventEnd(e) {
  return e.endDate || eventStart(e);
}
function eventIsMultiDay(e) {
  const s = eventStart(e), en = eventEnd(e);
  return !!(s && en && en > s);
}

// Type is free text now. The two original values keep their own colours; a
// custom type falls back to a neutral pill so the calendar doesn't turn into
// a rainbow as admins invent categories.
const CALENDAR_BUILT_IN_TYPES = ["Conference", "Deadline"];
function eventTypeLabel(e) {
  const raw = String(e.type || "").trim();
  if (!raw) return "Event";
  const lower = raw.toLowerCase();
  if (lower === "conference") return "Conference";
  if (lower === "deadline") return "Deadline";
  return raw;
}
function eventTypeSlug(e) {
  const lower = String(e.type || "").trim().toLowerCase();
  if (lower === "conference") return "conference";
  if (lower === "deadline") return "deadline";
  return "custom";
}
// Every type an admin has actually used, so the next one autocompletes
// instead of drifting into "Comp" / "Competition" / "competition".
function knownEventTypes() {
  const used = calendarEvents.map(eventTypeLabel).filter(Boolean);
  return [...new Set([...CALENDAR_BUILT_IN_TYPES, ...used])].sort();
}

// Admin-entered text goes straight into innerHTML, so escape it. A stray
// apostrophe in an event title would otherwise break the markup around it.
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
// Only real http(s) links become buttons — no javascript: URLs in an href.
function safeUrl(u) {
  const raw = String(u || "").trim();
  return /^https?:\/\//i.test(raw) ? raw : "";
}

function fmtDay(iso) {
  return new Date(iso + "T00:00:00").getDate();
}
function fmtMonth(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short" });
}
function sameMonth(a, b) {
  return a.slice(0, 7) === b.slice(0, 7);
}
// "Mar 12", "Mar 12–14", or "Mar 30 – Apr 2"
function eventDateRangeLabel(e) {
  const s = eventStart(e), en = eventEnd(e);
  if (!s) return "";
  if (!eventIsMultiDay(e)) return `${fmtMonth(s)} ${fmtDay(s)}`;
  if (sameMonth(s, en)) return `${fmtMonth(s)} ${fmtDay(s)}–${fmtDay(en)}`;
  return `${fmtMonth(s)} ${fmtDay(s)} – ${fmtMonth(en)} ${fmtDay(en)}`;
}

// ---- student-facing list -------------------------------------------------

function renderCalendarList() {
  const container = document.getElementById("calendarContent");
  if (!container) return;
  if (!calendarEventsLoaded) {
    container.innerHTML = `<div class="admin-empty-state">Loading calendar...</div>`;
    return;
  }

  const myAssociation = userData?.association || "";
  const today = new Date().toISOString().slice(0, 10);
  const relevant = calendarEvents.filter(e => !e.association || e.association === myAssociation);

  // A conference that started yesterday and runs through Saturday is still
  // upcoming, not past — sort on the END date so multi-day events don't
  // disappear the morning after they begin.
  const upcoming = relevant
    .filter(e => eventEnd(e) >= today)
    .sort((a, b) => eventStart(a).localeCompare(eventStart(b)));
  const past = relevant
    .filter(e => eventEnd(e) < today)
    .sort((a, b) => eventEnd(b).localeCompare(eventEnd(a)));

  const renderEvent = (e) => {
    const s = eventStart(e);
    const en = eventEnd(e);
    const multi = eventIsMultiDay(e);
    const slug = eventTypeSlug(e);
    const link = safeUrl(e.link);
    const happeningNow = s <= today && en >= today;

    const dateBlock = multi
      ? `<div class="ced-month">${esc(fmtMonth(s))}</div>
         <div class="ced-day ced-day-range">${fmtDay(s)}–${sameMonth(s, en) ? fmtDay(en) : ""}</div>
         ${sameMonth(s, en) ? "" : `<div class="ced-through">${esc(fmtMonth(en))} ${fmtDay(en)}</div>`}`
      : `<div class="ced-month">${esc(fmtMonth(s))}</div>
         <div class="ced-day">${fmtDay(s)}</div>`;

    return `
      <div class="calendar-event-card ${slug}">
        <div class="calendar-event-date">${dateBlock}</div>
        <div class="calendar-event-info">
          <div class="calendar-event-title">${esc(e.title)}</div>
          <div class="calendar-event-meta">
            <span class="calendar-event-type ${slug}">${esc(eventTypeLabel(e))}</span>
            ${multi ? `<span>${esc(eventDateRangeLabel(e))}</span>` : ""}
            ${happeningNow ? `<span class="calendar-event-now">Happening now</span>` : ""}
            ${e.association ? `<span>${esc(e.association)}</span>` : `<span>All associations</span>`}
          </div>
          ${e.description ? `<div class="calendar-event-desc">${esc(e.description)}</div>` : ""}
          ${link ? `<a class="calendar-event-link" href="${esc(link)}" target="_blank" rel="noopener">${icon("external")} Learn more</a>` : ""}
        </div>
      </div>
    `;
  };

  container.innerHTML = `
    ${!userData?.association ? `<div class="planner-warning">${icon("alert")} Set your DECA association on your Profile to filter this calendar to events relevant to you.</div>` : ""}
    <h2 class="section-title" style="margin-top:20px;">Upcoming</h2>
    ${upcoming.length ? upcoming.map(renderEvent).join("") : `<div class="admin-empty-state">No upcoming events yet — check back soon.</div>`}
    ${past.length ? `
      <h2 class="section-title" style="margin-top:28px;">Past</h2>
      ${past.slice(0, 10).map(renderEvent).join("")}
    ` : ""}
  `;
}

// ---- admin ---------------------------------------------------------------

function renderAdminCalendarSection() {
  const body = document.getElementById("adminSubtabBody");
  if (!body) return;
  const editing = adminEditingEventId ? calendarEvents.find(e => e.id === adminEditingEventId) : null;
  const sorted = [...calendarEvents].sort((a, b) => eventStart(a).localeCompare(eventStart(b)));

  const listHtml = sorted.map(e => `
    <div class="admin-lesson-block">
      <div class="admin-lesson-head">
        <h4>${esc(e.title)} <span style="font-weight:600;color:var(--muted);font-size:12px;">— ${esc(eventDateRangeLabel(e))}</span></h4>
        <div style="display:flex;gap:8px;">
          <button class="admin-btn-sm ghost" onclick="adminEditEvent('${esc(e.id)}')">Edit</button>
          <button class="admin-btn-sm danger" onclick="adminDeleteEvent('${esc(e.id)}')">${icon("trash")} Delete</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);">
        ${esc(eventTypeLabel(e))} · ${esc(e.association || "All associations")}${safeUrl(e.link) ? " · has link" : ""}
      </div>
    </div>
  `).join("") || `<div class="admin-empty-state">No calendar events yet.</div>`;

  const typeOptions = knownEventTypes().map(t => `<option value="${esc(t)}"></option>`).join("");

  body.innerHTML = `
    <datalist id="eventTypeList">${typeOptions}</datalist>
    <div class="admin-layout">
      <div class="admin-course-list">${listHtml}</div>
      <div class="admin-panel-body">
        <h3 style="margin-bottom:16px;">${editing ? "Edit Event" : "Add a New Event"}</h3>
        <div class="admin-kpi-form">
          <input type="text" id="event-title" placeholder="Event title (e.g. NorCal CDC Registration Deadline)" value="${editing ? esc(editing.title) : ""}">

          <div class="admin-field-row">
            <label class="admin-inline-label">Starts
              <input type="date" id="event-start" value="${editing ? esc(eventStart(editing)) : ""}">
            </label>
            <label class="admin-inline-label">Ends <span class="admin-optional">optional</span>
              <input type="date" id="event-end" value="${editing && editing.endDate ? esc(editing.endDate) : ""}">
            </label>
          </div>
          <div class="admin-field-hint">Leave the end date blank for a single-day event.</div>

          <input type="text" id="event-type" list="eventTypeList" placeholder="Type (Conference, Deadline, or type your own)" value="${editing ? esc(eventTypeLabel(editing)) : "Conference"}">
          <div class="admin-field-hint">Pick from the list where you can — reusing a type keeps its colour and grouping consistent.</div>

          <input type="text" id="event-association" list="associationList" placeholder="Association (leave blank for all)" value="${editing ? esc(editing.association || "") : ""}">
          <input type="url" id="event-link" placeholder="Link for more info (optional — must start with https://)" value="${editing ? esc(editing.link || "") : ""}">
          <textarea id="event-desc" rows="2" placeholder="Description (optional)">${editing ? esc(editing.description || "") : ""}</textarea>

          <div style="display:flex;gap:10px;">
            <button class="admin-btn-sm" onclick="adminSaveEvent()">${editing ? "Save Changes" : "Add Event"}</button>
            ${editing ? `<button class="admin-btn-sm ghost" onclick="adminCancelEditEvent()">Cancel</button>` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

window.adminEditEvent = function(id) {
  adminEditingEventId = id;
  renderAdminCalendarSection();
};

window.adminCancelEditEvent = function() {
  adminEditingEventId = null;
  renderAdminCalendarSection();
};

window.adminSaveEvent = async function() {
  const title = document.getElementById("event-title").value.trim();
  const startDate = document.getElementById("event-start").value;
  const endDateRaw = document.getElementById("event-end").value;
  const type = document.getElementById("event-type").value.trim() || "Event";
  const association = document.getElementById("event-association").value.trim();
  const linkRaw = document.getElementById("event-link").value.trim();
  const description = document.getElementById("event-desc").value.trim();

  if (!title || !startDate) return alert("Please fill in at least a title and a start date.");
  if (endDateRaw && endDateRaw < startDate) {
    return alert("The end date is before the start date — swap them or clear the end date.");
  }
  if (linkRaw && !safeUrl(linkRaw)) {
    return alert("The link needs to start with https:// (or http://) so it opens correctly.");
  }

  const endDate = endDateRaw || null;
  const id = adminEditingEventId || `event-${Date.now()}`;
  const eventDoc = {
    id, title, startDate, endDate, type, association, description,
    link: linkRaw,
    // Kept in sync so anything still reading the old field — and any event
    // saved before this change — stays consistent.
    date: startDate
  };

  try {
    await setDoc(doc(db, "calendarEvents", id), eventDoc);
    const idx = calendarEvents.findIndex(e => e.id === id);
    if (idx >= 0) calendarEvents[idx] = eventDoc; else calendarEvents.push(eventDoc);
    adminEditingEventId = null;
    renderAdminCalendarSection();
    if (document.getElementById("calendar")) renderCalendarList();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

window.adminDeleteEvent = async function(id) {
  if (!confirm("Delete this calendar event?")) return;
  try {
    await deleteDoc(doc(db, "calendarEvents", id));
    calendarEvents = calendarEvents.filter(e => e.id !== id);
    renderAdminCalendarSection();
    if (document.getElementById("calendar")) renderCalendarList();
  } catch (e) {
    console.error(e);
    alert("Couldn't delete — check the console.");
  }
};

// ========================================================================
// ========================= BLOG ==========================================
// ========================================================================

async function loadBlogs() {
  try {
    const snap = await getDocs(collection(db, "blogs"));
    blogs = snap.docs.map(d => d.data()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    blogsLoaded = true;
    if (document.getElementById("blog")?.classList.contains("active")) renderBlogList();
    if (adminActiveSubTab === "blog" && document.getElementById("admin")?.classList.contains("active")) renderAdminBlogSection();
  } catch (e) {
    console.error("Failed to load blogs:", e);
    blogsLoaded = true;
  }
}

function youtubeEmbedId(url) {
  if (!url) return null;
  if (url.includes("v=")) return url.split("v=")[1].split("&")[0];
  if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0];
  return null;
}

// Admins usually paste a link to the PAGE an image sits on, not the image
// itself — a Drive "share" link or a Dropbox preview page. Those return HTML,
// not an image, so the <img> silently fails. Rewrite the common ones into
// direct-file URLs. Anything already ending in a real image extension is left
// alone.
function blogImageUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";

  const drive = raw.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([A-Za-z0-9_-]{20,})/);
  if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w1200`;

  if (raw.includes("dropbox.com")) return raw.replace(/[?&]dl=0/, "").replace("www.dropbox.com", "dl.dropboxusercontent.com");

  return raw;
}

// Short teaser for the card. Collapses whitespace and cuts on a word boundary.
function blogPreview(text, max = 220) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + "…";
}

// Full body: blank lines become paragraphs, single newlines become breaks.
function blogBodyHtml(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function renderBlogList() {
  const container = document.getElementById("blogContent");
  if (!container) return;

  if (!blogsLoaded) {
    container.innerHTML = `<div class="admin-empty-state">Loading posts...</div>`;
    return;
  }
  if (!blogs.length) {
    container.innerHTML = `<div class="admin-empty-state">No posts yet — check back soon!</div>`;
    return;
  }

  container.innerHTML = `
    <div class="blog-grid">
      ${blogs.map(post => {
        const cover = blogImageUrl(post.coverImage);
        return `
          <article class="blog-card">
            ${cover ? `<img class="blog-cover" src="${cover}" alt="${post.title}" onerror="this.style.display='none'">` : ""}
            <div class="blog-card-body">
              <div class="blog-meta">${post.authorName || "Farm4Glass Team"} · ${post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}</div>
              <h3>${post.title}</h3>
              <p>${blogPreview(post.body)}</p>
              <button class="admin-btn-sm" style="margin-top:12px;" onclick="openBlogPost('${post.id}')">Read More →</button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

// Full post, rendered in place of the grid inside the Blog tab.
window.openBlogPost = function(id) {
  const post = blogs.find(b => b.id === id);
  if (!post) return;

  const container = document.getElementById("blogContent");
  if (!container) return;

  const cover = blogImageUrl(post.coverImage);
  const ytId = youtubeEmbedId(post.videoUrl);

  container.innerHTML = `
    <div class="blog-post-view">
      <div class="lv-back" onclick="closeBlogPost()">← Back to Blog</div>
      ${cover ? `<img class="blog-cover" src="${cover}" alt="${post.title}" style="width:100%;border-radius:14px;margin-bottom:20px;" onerror="this.style.display='none'">` : ""}
      <h1 style="margin-bottom:8px;">${post.title}</h1>
      <div class="blog-meta" style="margin-bottom:24px;">${post.authorName || "Farm4Glass Team"} · ${post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}</div>
      <div class="blog-post-body">${blogBodyHtml(post.body)}</div>
      ${ytId ? `<div class="blog-video" style="margin-top:24px;"><iframe src="https://www.youtube.com/embed/${ytId}" allowfullscreen></iframe></div>` : ""}
      ${post.videoUrl && !ytId ? `<a class="blog-reel-link" href="${post.videoUrl}" target="_blank" rel="noopener">${icon("play")} Watch Reel ↗</a>` : ""}
    </div>
  `;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.closeBlogPost = function() {
  renderBlogList();
};

function renderAdminBlogSection() {
  const body = document.getElementById("adminSubtabBody");
  if (!body) return;

  const editing = adminEditingBlogId ? blogs.find(b => b.id === adminEditingBlogId) : null;

  const listHtml = blogs.map(post => `
    <div class="admin-lesson-block">
      <div class="admin-lesson-head">
        <h4>${post.title}</h4>
        <div style="display:flex;gap:8px;">
          <button class="admin-btn-sm ghost" onclick="adminEditBlog('${post.id}')">Edit</button>
          <button class="admin-btn-sm danger" onclick="adminDeleteBlog('${post.id}')">${icon("trash")} Delete</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);">${post.authorName || "Farm4Glass Team"}</div>
    </div>
  `).join("") || `<div class="admin-empty-state">No posts yet.</div>`;

  body.innerHTML = `
    <div class="admin-layout">
      <div class="admin-course-list">${listHtml}</div>
      <div class="admin-panel-body">
        <h3 style="margin-bottom:16px;">${editing ? "Edit Post" : "Write a New Post"}</h3>
        <div class="admin-kpi-form">
          <input type="text" id="blog-title" placeholder="Post title" value="${editing ? editing.title.replace(/"/g, "&quot;") : ""}">
          <input type="text" id="blog-author" placeholder="Author name" value="${editing ? (editing.authorName || "") : ""}">
          <input type="text" id="blog-cover" placeholder="Cover image URL (optional)" value="${editing ? (editing.coverImage || "") : ""}">
          <input type="text" id="blog-video" placeholder="Video/Reel URL (optional — YouTube embeds, others link out)" value="${editing ? (editing.videoUrl || "") : ""}">
          <textarea id="blog-body" rows="5" placeholder="Post content">${editing ? editing.body : ""}</textarea>
          <div style="display:flex;gap:10px;">
            <button class="admin-btn-sm" onclick="adminSaveBlog()">${editing ? "Save Changes" : "Publish Post"}</button>
            ${editing ? `<button class="admin-btn-sm ghost" onclick="adminCancelEditBlog()">Cancel</button>` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

window.adminEditBlog = function(id) {
  adminEditingBlogId = id;
  renderAdminBlogSection();
};

window.adminCancelEditBlog = function() {
  adminEditingBlogId = null;
  renderAdminBlogSection();
};

window.adminSaveBlog = async function() {
  const title = document.getElementById("blog-title").value.trim();
  const authorName = document.getElementById("blog-author").value.trim();
  const coverImage = document.getElementById("blog-cover").value.trim();
  const videoUrl = document.getElementById("blog-video").value.trim();
  const bodyText = document.getElementById("blog-body").value.trim();

  if (!title || !bodyText) return alert("Please fill in at least a title and post content.");

  const editing = adminEditingBlogId ? blogs.find(b => b.id === adminEditingBlogId) : null;
  const id = adminEditingBlogId || `blog-${Date.now()}`;
  const postDoc = {
    id, title, authorName, coverImage, videoUrl, body: bodyText,
    createdAt: editing ? editing.createdAt : new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "blogs", id), postDoc);
    const idx = blogs.findIndex(b => b.id === id);
    if (idx >= 0) blogs[idx] = postDoc; else blogs.unshift(postDoc);
    adminEditingBlogId = null;
    renderAdminBlogSection();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

window.adminDeleteBlog = async function(id) {
  if (!confirm("Delete this post?")) return;
  try {
    await deleteDoc(doc(db, "blogs", id));
    blogs = blogs.filter(b => b.id !== id);
    renderAdminBlogSection();
  } catch (e) {
    console.error(e);
    alert("Couldn't delete — check the console.");
  }
};

// ========================================================================
// ========================= PRACTICE EXAMS ===============================
// ========================================================================
// A full timed exam pooled from every practice question already entered for a
// course's units (via the admin Courses editor).

window.openExamSetup = function(courseId) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return;

  currentUnitKey = null;

  const pool = course.lessons
    .filter(l => l.type === "quiz")
    .flatMap(l => (l.questions || []).map(q => ({ ...q, sourceTitle: stripUnitSuffix(l.title) })));

  const maxQ = pool.length;
  const container = document.getElementById("lessonViewContent");
  showTab("lessonView");
  container.innerHTML = `
    <div class="exam-setup-wrap">
      <div class="lv-back" onclick="openCourse('${course.id}')">← ${course.title}</div>
      <div class="exam-setup-card">
        <h2>${icon("timer")} Practice Exam Setup</h2>
        <p class="page-sub">${maxQ} practice questions are available across every unit in this course.</p>
        <div class="form-group">
          <label>Number of Questions</label>
          <select id="exam-count">
            ${[...new Set([25, 50, 75, 100].filter(n => n < maxQ).concat(maxQ))].map(n =>
              `<option value="${n}" ${n === maxQ ? "selected" : ""}>${n} questions${n === maxQ ? " (all available)" : ""}</option>`
            ).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>Time Limit (minutes)</label>
          <input type="number" id="exam-minutes" min="5" max="180" value="${Math.max(10, Math.round(maxQ * 0.75))}">
        </div>
        <button class="btn-primary" onclick="startPracticeExam('${course.id}')">Start Exam →</button>
      </div>
    </div>
  `;
};

window.startPracticeExam = function(courseId) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return;

  const count = Number(document.getElementById("exam-count").value);
  const minutes = Number(document.getElementById("exam-minutes").value) || 30;

  const pool = course.lessons
    .filter(l => l.type === "quiz")
    .flatMap(l => (l.questions || []).map(q => ({ ...q, sourceTitle: stripUnitSuffix(l.title) })));

  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);

  examState = {
    course,
    questions: shuffled,
    current: 0,
    answers: new Array(shuffled.length).fill(null),
    secondsLeft: minutes * 60,
    submitted: false
  };

  if (examTimerInterval) clearInterval(examTimerInterval);
  examTimerInterval = setInterval(() => {
    if (!examState) return clearInterval(examTimerInterval);
    examState.secondsLeft--;
    updateExamTimerDisplay();
    if (examState.secondsLeft <= 0) {
      clearInterval(examTimerInterval);
      submitPracticeExam();
    }
  }, 1000);

  renderExamQuestion();
};

function updateExamTimerDisplay() {
  const el = document.getElementById("examTimer");
  if (!el || !examState) return;
  const m = Math.floor(Math.max(0, examState.secondsLeft) / 60);
  const s = Math.max(0, examState.secondsLeft) % 60;
  el.textContent = `${m}:${String(s).padStart(2, "0")}`;
  el.classList.toggle("exam-timer-low", examState.secondsLeft <= 60);
}

function renderExamQuestion() {
  if (!examState) return;
  const { questions, current, course, answers } = examState;
  const q = questions[current];
  const container = document.getElementById("lessonViewContent");

  container.innerHTML = `
    <div class="quiz-wrap">
      <div class="exam-header">
        <div class="quiz-progress-row">
          <span>Question ${current + 1} of ${questions.length}</span>
          <span class="exam-timer" id="examTimer">--:--</span>
        </div>
        <div class="quiz-pbar-outer"><div class="quiz-pbar-inner" style="width:${Math.round((current / questions.length) * 100)}%"></div></div>
      </div>
      <div class="quiz-question-card">
        <div class="question-text">${q.q}</div>
        <div class="options-list">
          ${q.options.map((opt, i) => `
            <button class="option-btn ${answers[current] === i ? "selected" : ""}" onclick="selectExamAnswer(${i})">${opt}</button>
          `).join("")}
        </div>
        <div class="exam-nav-row">
          <button class="admin-btn-sm ghost" onclick="examPrev()" ${current === 0 ? "disabled" : ""}>← Previous</button>
          ${current + 1 === questions.length
            ? `<button class="btn-primary" onclick="submitPracticeExam()">Submit Exam</button>`
            : `<button class="btn-primary" onclick="examNext()">Next →</button>`}
        </div>
      </div>
    </div>
  `;
  updateExamTimerDisplay();
}

window.selectExamAnswer = function(idx) {
  if (!examState) return;
  examState.answers[examState.current] = idx;
  renderExamQuestion();
};

window.examNext = function() {
  if (!examState) return;
  examState.current = Math.min(examState.current + 1, examState.questions.length - 1);
  renderExamQuestion();
};

window.examPrev = function() {
  if (!examState) return;
  examState.current = Math.max(examState.current - 1, 0);
  renderExamQuestion();
};

window.submitPracticeExam = async function() {
  if (!examState || examState.submitted) return;
  examState.submitted = true;
  if (examTimerInterval) clearInterval(examTimerInterval);

  const { questions, answers, course } = examState;
  const scored = questions.map((q, i) => ({ ...q, userAnswer: answers[i], correct: answers[i] === q.answer }));
  const numCorrect = scored.filter(s => s.correct).length;
  const pct = Math.round((numCorrect / questions.length) * 100);
  const xpEarned = Math.round(questions.length * 0.5 * (pct / 100));

  const container = document.getElementById("lessonViewContent");
  container.innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-results">
        <div class="results-title">${pct >= 80 ? "Great Job!" : pct >= 60 ? "Good Work!" : "Keep Studying!"}</div>
        <div class="results-score">${numCorrect} / ${questions.length} correct (${pct}%)</div>
        <div class="results-xp">+${xpEarned} XP Earned</div>
        <div class="results-btns">
          <button class="btn-primary" onclick="reviewExam()">Review Answers</button>
          <button class="btn-primary" onclick="openCourse('${course.id}')">Back to Course</button>
        </div>
      </div>
    </div>
  `;

  if (pct >= 80) {
    const card = document.querySelector(".quiz-results");
    if (card) f4gBurstFrom(card, 34);
  }

  if (currentUser && userData) {
    try {
      const attempt = {
        courseId: course.id, courseTitle: course.title,
        date: new Date().toISOString(), score: numCorrect, total: questions.length, pct
      };
      const attempts = [...(userData.examAttempts || []), attempt].slice(-50);
      const newXP = userData.xp + xpEarned;
      await updateDoc(doc(db, "users", currentUser.uid), { examAttempts: attempts, xp: newXP });
      userData.examAttempts = attempts;
      userData.xp = newXP;
      showXPToast(xpEarned);
      renderSidebar();
      await checkAndAwardBadges();
    } catch (e) {
      console.error("Failed to save exam attempt:", e);
    }
  }

  examState.scored = scored;
};

window.reviewExam = function() {
  if (!examState?.scored) return;
  const container = document.getElementById("lessonViewContent");
  container.innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-back" onclick="openCourse('${examState.course.id}')">← ${examState.course.title}</div>
      <h2 style="margin-bottom:16px;">Exam Review</h2>
      ${examState.scored.map((q, i) => `
        <div class="quiz-question-card" style="margin-bottom:16px;">
          <div style="font-size:12px;color:var(--muted);font-weight:700;margin-bottom:8px;">${q.sourceTitle}</div>
          <div class="question-text" style="font-size:16px;">${i + 1}. ${q.q}</div>
          <div class="options-list">
            ${q.options.map((opt, oi) => `
              <div class="option-btn" style="cursor:default;${oi === q.answer ? "border-color:var(--green);background:#dcfce7;color:#166534;" : oi === q.userAnswer ? "border-color:var(--red);background:#fee2e2;color:#991b1b;" : ""}">${opt}</div>
            `).join("")}
          </div>
          ${q.explanation ? `<div class="explanation-box show">${q.explanation}</div>` : ""}
        </div>
      `).join("")}
    </div>
  `;
};

/* =========================================================================
   PART 1 — CELEBRATION HELPERS (confetti, count-up, milestone notices)
   Geometric shapes only. No emoji anywhere.
   ========================================================================= */

const F4G_COLORS = ["#167db5", "#38bdf8", "#f59e0b", "#059669", "#1e3a5f"];

function f4gReduceMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Confetti burst from a point on screen.
function f4gBurst(x, y, count = 24, spread = 150) {
  if (f4gReduceMotion()) return;
  const layer = document.createElement("div");
  layer.className = "f4g-confetti";

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("i");
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist = spread * (0.45 + Math.random() * 0.8);

    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = F4G_COLORS[i % F4G_COLORS.length];
    piece.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--dy", `${Math.sin(angle) * dist + 110}px`);
    piece.style.setProperty("--rot", `${Math.round(Math.random() * 720 - 360)}deg`);
    piece.style.animationDelay = `${Math.random() * 0.09}s`;
    if (i % 3 === 0) piece.classList.add("round");
    if (i % 3 === 1) piece.classList.add("bar");

    layer.appendChild(piece);
  }

  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1500);
}
window.f4gBurst = f4gBurst;

// Confetti burst centered on an element.
function f4gBurstFrom(el, count = 24) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  f4gBurst(r.left + r.width / 2, r.top + r.height / 2, count);
}
window.f4gBurstFrom = f4gBurstFrom;

// Animated number roll-up for stat cards.
function f4gCountUp(el, to, dur = 800) {
  if (!el) return;
  const from = Number(String(el.textContent).replace(/[^\d.-]/g, "")) || 0;
  const target = Number(to) || 0;

  if (f4gReduceMotion() || from === target) {
    el.textContent = target.toLocaleString();
    return;
  }

  const start = performance.now();
  el.classList.add("f4g-ticking");

  function frame(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = target.toLocaleString();
      el.classList.remove("f4g-ticking");
    }
  }
  requestAnimationFrame(frame);
}
window.f4gCountUp = f4gCountUp;

// Small slide-in card for milestones (streaks, first review, etc).
function f4gNotice(title, sub = "", ms = 4200) {
  const el = document.createElement("div");
  el.className = "f4g-notice";
  el.innerHTML = `<div class="f4g-notice-title">${title}</div>${sub ? `<div class="f4g-notice-sub">${sub}</div>` : ""}`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 350);
  }, ms);
}
window.f4gNotice = f4gNotice;


/* =========================================================================
   PART 2 — PREPARED EVENT CHECKER
   -------------------------------------------------------------------------
   A student picks their event and uploads their written entry as a PDF. The
   PDF is read IN THE BROWSER with PDF.js — it is never uploaded anywhere, not
   to Firebase, not to Google, not to us. Nothing leaves the student's laptop.

   Every check here is deterministic: page count, word count, and whether
   required text (section headings, "Statement of Assurances", and so on) is
   actually present in the document. There is no guessing and no model, so a
   result is either right or it's a bug — it can never be a confident
   hallucination that costs a student points at a conference.

   Penalty point values shown come ONLY from what an admin typed into
   Admin > Rubrics. If no value was entered, the check says to confirm it in
   the current DECA guidelines rather than inventing a number.

   The AI review code is kept below but DORMANT — flip PE_AI_ENABLED to true
   once App Check and a valid model name are set up, and it comes back as a
   second, clearly-labelled opinion on top of these hard checks.

   Rubric doc shape (Firestore "rubrics" collection, one doc per event):
     {
       id, eventName, eventCode, category,
       pageLimit: number|null,
       wordLimit: number|null,
       requiredText:   [{ phrase, points }],   // points may be null
       penaltyRules:   [{ rule, points }],     // points may be null
       rubricSections: [{ section, criteria }],
       notes: "any extra guideline text pasted by an admin"
     }
   ========================================================================= */

let rubrics = [];
let rubricsLoaded = false;
let peSelectedEventId = null;
let peFile = null;
let peBusy = false;
let peResult = null;
let peResultEvent = null;
let adminEditingRubricId = null;
let peModel = null;

// Set to true only after App Check is configured AND PE_MODEL_NAME is verified
// against the current Firebase AI Logic model list. The checks above work
// regardless of this flag.
const PE_AI_ENABLED = false;
const PE_MODEL_NAME = "gemini-3-flash";

const PE_MAX_MB = 25;
const PDFJS_VERSION = "4.6.82";

// ---- load rubrics -------------------------------------------------------
// Called from startDataLoads(), never at page load — see the DATA LOADS
// section above for why.
async function loadRubrics() {
  try {
    const snap = await getDocs(collection(db, "rubrics"));
    rubrics = snap.docs.map(d => d.data());
  } catch (e) {
    console.error("Failed to load rubrics from Firestore:", e);
  }

  if (!rubrics.length) {
    try {
      const r = await fetch("rubrics.json");
      if (r.ok) rubrics = await r.json();
    } catch (e) {
      console.error("Failed to load rubrics.json:", e);
    }
  }

  rubrics.sort((a, b) => (a.eventName || "").localeCompare(b.eventName || ""));
  rubricsLoaded = true;

  if (document.getElementById("prepared")?.classList.contains("active")) renderPreparedEventTab();
  if (adminActiveSubTab === "rubrics" && document.getElementById("admin")?.classList.contains("active")) renderAdminRubricsSection();
}

// Enough entered to run the deterministic checks?
function rubricHasChecks(r) {
  return !!(r && (r.pageLimit || r.wordLimit || (r.requiredText && r.requiredText.length)));
}

// Enough entered for the (dormant) AI review?
function rubricIsReady(r) {
  return !!(r && ((r.rubricSections && r.rubricSections.length) || (r.penaltyRules && r.penaltyRules.length)));
}

// ---- PDF.js -------------------------------------------------------------
// Loaded on demand the first time someone runs a check, so it costs nothing
// for students who never open this tab.
let pdfjsPromise = null;
function loadPdfJs() {
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = (async () => {
    const base = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
    const lib = await import(`${base}/pdf.min.mjs`);
    lib.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`;
    return lib;
  })();
  return pdfjsPromise;
}

async function extractPdfText(file) {
  const pdfjs = await loadPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(it => it.str).join(" "));
  }

  return { pageCount: pdf.numPages, pages, text: pages.join("\n\n") };
}

// Matching is done on a flattened form so curly quotes, double spaces, line
// breaks mid-heading, and capitalization don't cause false misses.
function normalizeForMatch(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean ? clean.split(" ").length : 0;
}

// Looks for a penalty rule the admin already entered that covers this check,
// so the point value shown is always one they typed — never one we assumed.
function penaltyPointsFor(rubric, re) {
  const rule = (rubric.penaltyRules || []).find(p => re.test(p.rule || ""));
  return rule && rule.points != null ? rule.points : null;
}

// ---- the checks ---------------------------------------------------------
function buildEntryChecks(rubric, doc) {
  const checks = [];
  const words = countWords(doc.text);
  const normPages = doc.pages.map(normalizeForMatch);
  const normAll = normPages.join(" \n ");

  // A scanned/photographed entry has almost no extractable text. Say so
  // loudly rather than reporting every section as missing.
  const looksScanned = words < 40 && doc.pageCount > 0;
  if (looksScanned) {
    checks.push({
      label: "Text could not be read from this PDF",
      status: "warn",
      detail: `Only ${words} words were readable across ${doc.pageCount} ${doc.pageCount === 1 ? "page" : "pages"}. This usually means the entry was scanned or exported as images rather than text.`,
      fix: "Re-export straight from Google Docs or Word (File > Download > PDF) instead of scanning or screenshotting. Page count below is still accurate.",
      points: null
    });
  }

  // Page limit
  if (rubric.pageLimit) {
    const over = doc.pageCount - rubric.pageLimit;
    checks.push({
      label: `Page limit (${rubric.pageLimit} pages)`,
      status: over > 0 ? "fail" : "pass",
      detail: over > 0
        ? `Your entry is ${doc.pageCount} pages — ${over} over the limit.`
        : `Your entry is ${doc.pageCount} pages, within the ${rubric.pageLimit}-page limit.`,
      fix: over > 0 ? "Cut or condense until you're at or under the limit. Appendices usually count unless your guidelines say otherwise — check yours." : "",
      points: over > 0 ? penaltyPointsFor(rubric, /page limit|page maximum|exceed.*page|too many pages/i) : null
    });
  }

  // Word limit
  if (rubric.wordLimit && !looksScanned) {
    const over = words - rubric.wordLimit;
    checks.push({
      label: `Word limit (${rubric.wordLimit.toLocaleString()} words)`,
      status: over > 0 ? "fail" : "pass",
      detail: over > 0
        ? `Your entry is about ${words.toLocaleString()} words — roughly ${over.toLocaleString()} over.`
        : `Your entry is about ${words.toLocaleString()} words, within the limit.`,
      fix: over > 0 ? "This count comes from the text in the PDF, so it includes headings and captions. Trim the longest sections first." : "",
      points: over > 0 ? penaltyPointsFor(rubric, /word limit|word count|exceed.*word/i) : null
    });
  }

  // Required text (section headings, signed pages, and so on)
  (rubric.requiredText || []).forEach(item => {
    const needle = normalizeForMatch(item.phrase);
    if (!needle) return;

    const pageIdx = normPages.findIndex(p => p.includes(needle));
    const found = pageIdx >= 0 || normAll.includes(needle);

    checks.push({
      label: item.phrase,
      status: looksScanned ? "warn" : (found ? "pass" : "fail"),
      detail: looksScanned
        ? "Couldn't check — no readable text in this PDF."
        : (found
            ? `Found${pageIdx >= 0 ? ` on page ${pageIdx + 1}` : ""}.`
            : "Not found anywhere in the entry."),
      fix: (!found && !looksScanned)
        ? "Check the exact wording against your event's guidelines — this looks for the text as written, so a differently-worded heading won't match."
        : "",
      points: (!found && !looksScanned) ? (item.points ?? null) : null
    });
  });

  const fails = checks.filter(c => c.status === "fail");
  const warns = checks.filter(c => c.status === "warn");
  const knownPoints = fails.reduce((sum, c) => sum + (c.points ?? 0), 0);
  const unknownPoints = fails.some(c => c.points == null);

  return {
    checks,
    pageCount: doc.pageCount,
    wordCount: words,
    failCount: fails.length,
    warnCount: warns.length,
    knownPoints,
    unknownPoints,
    scanned: looksScanned,
    checkedAt: new Date().toISOString()
  };
}

// ---- file handling ------------------------------------------------------
window.peHandleFile = function(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    alert("Please upload your entry as a PDF. Export it from Google Docs or Word with File > Download > PDF.");
    input.value = "";
    return;
  }
  if (file.size > PE_MAX_MB * 1024 * 1024) {
    alert(`That PDF is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${PE_MAX_MB} MB — try exporting at a lower image quality.`);
    input.value = "";
    return;
  }

  peFile = file;
  peResult = null;
  renderPreparedEventTab();
};

window.peSelectEvent = function(id) {
  peSelectedEventId = id;
  peResult = null;
  renderPreparedEventTab();
};

window.peClearFile = function() {
  peFile = null;
  peResult = null;
  renderPreparedEventTab();
};

// ---- run the checks ------------------------------------------------------
window.checkPreparedEntry = async function() {
  const rubric = rubrics.find(r => r.id === peSelectedEventId);
  if (!rubric) return alert("Pick your event first.");
  if (!peFile) return alert("Upload your written entry as a PDF first.");
  if (!rubricHasChecks(rubric)) {
    return alert(`No checks have been set up for ${rubric.eventName} yet. An admin needs to add a page limit, a word limit, or required text under Admin > Rubrics.`);
  }

  peBusy = true;
  peResult = null;
  renderPreparedEventTab();

  try {
    const doc = await extractPdfText(peFile);
    peResult = buildEntryChecks(rubric, doc);
    peResultEvent = rubric;
    peBusy = false;
    renderPreparedEventTab();

    const banner = document.querySelector(".pe-score-banner");
    if (banner) f4gBurstFrom(banner, peResult.failCount === 0 ? 34 : 16);

    await savePreparedEventReview(rubric, peResult);
    await awardPreparedEventXP();
  } catch (e) {
    console.error("Prepared Event check failed:", e);
    peBusy = false;
    renderPreparedEventTab();
    alert("Couldn't read that PDF. If it's password-protected or damaged, try re-exporting it. The browser console has the exact error.");
  }
};

async function savePreparedEventReview(rubric, result) {
  if (!currentUser || !userData) return;
  try {
    // Store a compact record so the user doc stays small.
    const entry = {
      eventId: rubric.id,
      eventName: rubric.eventName,
      fileName: peFile ? peFile.name : "",
      date: new Date().toISOString(),
      pageCount: result.pageCount ?? 0,
      wordCount: result.wordCount ?? 0,
      failCount: result.failCount ?? 0,
      knownPoints: result.knownPoints ?? 0,
      unknownPoints: !!result.unknownPoints
    };
    const reviews = [...(userData.preparedEventReviews || []), entry].slice(-10);
    await updateDoc(doc(db, "users", currentUser.uid), { preparedEventReviews: reviews });
    userData.preparedEventReviews = reviews;
  } catch (e) {
    console.error("Couldn't save that check:", e);
  }
}

// One XP award per day so the tab can't be farmed.
async function awardPreparedEventXP() {
  if (!currentUser || !userData) return;
  const today = new Date().toISOString().slice(0, 10);
  if (userData.lastPreparedEventXPDate === today) return;

  const xp = 40;
  try {
    const newXP = userData.xp + xp;
    const oldAnimal = getAnimalForXP(userData.xp);
    const newAnimal = getAnimalForXP(newXP);
    const activityLog = [...(userData.activityLog || []), { date: today, xp, lessonId: "prepared-event-check", type: "review" }].slice(-300);

    await updateDoc(doc(db, "users", currentUser.uid), {
      xp: newXP,
      activityLog,
      lastPreparedEventXPDate: today
    });

    userData.xp = newXP;
    userData.activityLog = activityLog;
    userData.lastPreparedEventXPDate = today;

    showXPToast(xp);
    if (newAnimal.index > oldAnimal.index) setTimeout(() => showLevelUpModal(newAnimal), 800);
    await checkAndAwardBadges();
    renderSidebar();
  } catch (e) {
    console.error("Couldn't award check XP:", e);
  }
}

// ---- rendering -----------------------------------------------------------
function renderPreparedEventTab() {
  const container = document.getElementById("preparedContent");
  if (!container) return;

  if (!rubricsLoaded) {
    container.innerHTML = `<div class="admin-empty-state">Loading events...</div>`;
    return;
  }
  if (!rubrics.length) {
    container.innerHTML = `<div class="admin-empty-state">No events have been set up yet. An admin can add them under Admin &gt; Rubrics.</div>`;
    return;
  }

  // If they've set a written event on their profile, preselect the matching
  // rubric the first time they open this tab.
  if (!peSelectedEventId && userData?.writtenEvent) {
    const code = (userData.writtenEvent.match(/\(([^)]+)\)\s*$/) || [])[1];
    const guess = rubrics.find(r =>
      (code && r.eventCode && r.eventCode.toLowerCase() === code.toLowerCase()) ||
      userData.writtenEvent.toLowerCase().startsWith((r.eventName || "").toLowerCase())
    );
    if (guess) peSelectedEventId = guess.id;
  }

  const selected = rubrics.find(r => r.id === peSelectedEventId) || null;
  const ready = rubricHasChecks(selected);

  const optionsHtml = [`<option value="">Select your event...</option>`]
    .concat(rubrics.map(r =>
      `<option value="${r.id}" ${r.id === peSelectedEventId ? "selected" : ""}>${r.eventName}${rubricHasChecks(r) ? "" : " — checks not set up yet"}</option>`
    )).join("");

  const fileHtml = peFile
    ? `<div class="pe-file">
         ${icon("check")}
         <span>${peFile.name}</span>
         <span class="pe-file-size">${(peFile.size / 1048576).toFixed(1)} MB</span>
         <button class="admin-btn-sm ghost" onclick="peClearFile()">Remove</button>
       </div>`
    : "";

  const canRun = selected && ready && peFile && !peBusy;

  container.innerHTML = `
    <div class="pe-layout">
      <div>
        <div class="widget">
          <div class="widget-header"><span>Check your entry</span></div>

          <div class="form-group">
            <label>Your DECA Event</label>
            <select id="peEvent" onchange="peSelectEvent(this.value)">${optionsHtml}</select>
          </div>

          ${selected && !ready ? `<div class="planner-warning">${icon("alert")} No checks have been set up for ${selected.eventName} yet. An admin can add its page limit and required sections under Admin &gt; Rubrics.</div>` : ""}

          <div class="form-group">
            <label>Written Entry (PDF)</label>
            <div class="pe-drop" onclick="document.getElementById('peFileInput').click()">
              ${icon("clipboard")}
              <div class="pe-drop-title">Choose your PDF</div>
              <div class="pe-drop-sub">Up to ${PE_MAX_MB} MB · export from Docs or Word as PDF so page breaks match what a judge sees</div>
            </div>
            <input type="file" id="peFileInput" accept="application/pdf" style="display:none" onchange="peHandleFile(this)">
            ${fileHtml}
          </div>

          <button class="btn-primary" onclick="checkPreparedEntry()" ${canRun ? "" : "disabled style='opacity:.5;cursor:default;'"}>
            ${peBusy ? "Checking..." : "Check My Entry"}
          </button>

          ${peBusy ? `<div class="pe-thinking" style="margin-top:16px;"><span></span><span></span><span></span> Reading your PDF in this browser — usually a couple of seconds.</div>` : ""}

          <div class="pe-disclaimer">
            Your file stays on this device. It's read here in your browser and never uploaded — not to Farm4Glass, not to anyone.
          </div>
        </div>

        ${renderPreparedEventHistory()}
      </div>

      <div>${peResult ? renderPreparedEventResult() : renderPreparedEventPlaceholder(selected)}</div>
    </div>
  `;
}

function renderPreparedEventPlaceholder(selected) {
  return `
    <div class="widget">
      <div class="widget-header"><span>What gets checked</span></div>
      <div class="pe-list">
        <div class="pe-list-row">${icon("file")}<span>Page count, measured against ${selected && selected.pageLimit ? `the ${selected.pageLimit}-page limit for ${selected.eventName}` : "your event's page limit"}.</span></div>
        <div class="pe-list-row">${icon("search")}<span>Word count across the whole entry, including headings and captions.</span></div>
        <div class="pe-list-row">${icon("check")}<span>Whether required text is actually in the document — section headings, the Statement of Assurances, anything your guidelines demand by name.</span></div>
        <div class="pe-list-row">${icon("alert")}<span>Each miss comes back with the penalty points on file for it, and where in your entry to look.</span></div>
      </div>
      <div class="pe-disclaimer">
        These are mechanical checks, not a score. They catch the formatting mistakes that cost easy points — they can't tell you whether your writing is any good, and they don't check margins, fonts, or spacing. Always read the current DECA guidelines for your event yourself, and have your advisor review the entry before you submit.
      </div>
    </div>
  `;
}

function renderPreparedEventResult() {
  const r = peResult;
  const clean = r.failCount === 0 && r.warnCount === 0;

  const headline = clean
    ? "Everything checked out"
    : r.failCount === 0
      ? `${r.warnCount} thing${r.warnCount === 1 ? "" : "s"} to look at`
      : `${r.failCount} issue${r.failCount === 1 ? "" : "s"} found`;

  const pointsLine = r.failCount === 0
    ? ""
    : r.knownPoints > 0
      ? `<div class="pe-score-num">${r.knownPoints}${r.unknownPoints ? "+" : ""}</div>
         <div class="pe-score-label">penalty points at risk${r.unknownPoints ? " (some rules had no point value on file)" : ""}</div>`
      : `<div class="pe-score-label">Point values for these aren't on file — confirm them in your event's current guidelines.</div>`;

  const checksHtml = r.checks.map(c => `
    <div class="pe-flag ${c.status}">
      <div style="flex:1;">
        <div class="pe-flag-title">${c.label}</div>
        <div class="pe-flag-body">${c.detail || ""}</div>
        ${c.fix ? `<div class="pe-flag-fix"><strong>Fix:</strong> ${c.fix}</div>` : ""}
      </div>
      <span class="pe-flag-pts">${
        c.status === "pass" ? "OK"
        : c.points != null ? `-${c.points}`
        : c.status === "warn" ? "check"
        : "check guidelines"
      }</span>
    </div>
  `).join("");

  return `
    <div class="pe-score-banner ${clean ? "" : "flagged"}">
      <div class="pe-score-num" style="${r.failCount ? "display:none;" : ""}">${clean ? icon("check") : ""}</div>
      ${pointsLine}
      <div class="pe-score-label">${headline}</div>
      <div class="pe-score-note">
        ${r.pageCount} ${r.pageCount === 1 ? "page" : "pages"} · about ${r.wordCount.toLocaleString()} words.
        Count the pages yourself before you submit — a cover sheet added later changes this.
      </div>
    </div>

    <h2 class="section-title">Checks</h2>
    ${checksHtml || `<div class="admin-empty-state">No checks are set up for this event yet.</div>`}

    <div class="pe-disclaimer">
      Mechanical checks only — not an official score, and not a substitute for the current DECA guidelines for your event.
      They don't check margins, font size, spacing, or anything about the quality of your writing.
      Verify every formatting item yourself and have your advisor read the entry before you submit.
    </div>
  `;
}

function renderPreparedEventHistory() {
  const reviews = (userData?.preparedEventReviews || []).slice().reverse();
  if (!reviews.length) return "";

  return `
    <div class="widget" style="margin-top:20px;">
      <div class="widget-header"><span>Your Past Checks</span></div>
      ${reviews.map(rev => `
        <div class="pe-history-row">
          ${icon("clipboard")}
          <span>${rev.eventName}</span>
          <span class="pe-history-meta">${rev.failCount ?? 0} issue${(rev.failCount ?? 0) === 1 ? "" : "s"} · ${new Date(rev.date).toLocaleDateString()}</span>
        </div>
      `).join("")}
    </div>
  `;
}


/* =========================================================================
   PART 2b — AI REVIEW (DORMANT)
   -------------------------------------------------------------------------
   Left in place, wired to nothing, and gated behind PE_AI_ENABLED at the top
   of PART 2. Turning it on needs three things, in this order:
     1. Firebase App Check registered with a reCAPTCHA v3 site key, pasted
        into RECAPTCHA_V3_SITE_KEY near the top of this file.
     2. PE_MODEL_NAME verified against the current Firebase AI Logic model
        list — a name that doesn't exist fails at request time, not page load.
     3. PE_AI_ENABLED = true, plus a button in renderPreparedEventTab that
        calls analyzePreparedEvent().
   Until then the deterministic checks above are the whole feature, and they
   don't depend on any of it.
   ========================================================================= */

const PE_SYSTEM_INSTRUCTION = `
You are an experienced DECA advisor giving a high school student PRACTICE feedback
on a written/prepared event entry before they submit it. You are not an official
judge and you never claim to be.

Hard rules you must follow:
1. Judge the entry ONLY against the rubric text and penalty rules provided in the
   prompt. Do not apply rules from memory, from other years, or from other events.
2. NEVER invent a penalty point value. If a penalty rule provided to you has no
   point value attached, set "points" to null and say the student should confirm
   the value in the current DECA guidelines. Inventing a number could send a
   student into a conference with wrong information.
3. If you cannot tell from the PDF whether a rule is met (for example the file is
   missing a signed page, or formatting is ambiguous), use status "unclear"
   rather than guessing "fail".
4. Quote or point to specific locations in the entry ("page 4, the Methods
   section") so the student can find what you mean.
5. Be direct about problems but write like a supportive advisor, not a grader.
   Every criticism gets a concrete, actionable fix.
6. Do not use emoji.
7. Return JSON matching the provided schema and nothing else.
`.trim();

function getPreparedEventModel() {
  if (peModel) return peModel;

  const schema = Schema.object({
    properties: {
      overallSummary: Schema.string(),
      rubricFeedback: Schema.array({
        items: Schema.object({
          properties: {
            section: Schema.string(),
            level: Schema.string(),       // "Exceeds" | "Meets" | "Below" | "Little/No Value"
            whyThisLevel: Schema.string(),
            howToImprove: Schema.string()
          }
        })
      }),
      strengths: Schema.array({ items: Schema.string() }),
      topPriorities: Schema.array({ items: Schema.string() })
    }
  });

  const ai = getAI(app, { backend: new GoogleAIBackend() });
  peModel = getGenerativeModel(ai, {
    model: PE_MODEL_NAME,
    systemInstruction: PE_SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return peModel;
}

function buildPreparedEventPrompt(rubric) {
  const sections = (rubric.rubricSections || []).length
    ? rubric.rubricSections.map(s => `- ${s.section}: ${s.criteria}`).join("\n")
    : "(no rubric sections have been entered for this event yet)";

  return `
EVENT: ${rubric.eventName}${rubric.eventCode ? ` (${rubric.eventCode})` : ""}

RUBRIC SECTIONS AND CRITERIA FOR THIS EVENT:
${sections}

${rubric.notes ? `ADDITIONAL GUIDELINE NOTES:\n${rubric.notes}\n` : ""}
The attached PDF is the student's written entry. Page counts, word counts, and
required-section checks have already been done mechanically — do not repeat them
and do not comment on them. Focus only on the quality of the writing.

Do all of the following:
1. For each rubric section above, say which performance level the entry currently
   reads at and exactly what would move it up one level.
2. List genuine strengths — things the student should not change.
3. List the 3-5 highest-impact fixes, in priority order.
`.trim();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

window.analyzePreparedEvent = async function() {
  if (!PE_AI_ENABLED) return;
  const rubric = rubrics.find(r => r.id === peSelectedEventId);

  if (!appCheckReady) {
    return alert("This needs App Check turned on. Add your reCAPTCHA v3 site key to RECAPTCHA_V3_SITE_KEY at the top of script.js, then reload.");
  }
  if (!rubric) return alert("Pick your event first.");
  if (!peFile) return alert("Upload your written entry as a PDF first.");
  if (!rubricIsReady(rubric)) {
    return alert(`The rubric for ${rubric.eventName} hasn't been added yet. An admin needs to enter it under Admin > Rubrics.`);
  }

  try {
    const base64 = await fileToBase64(peFile);
    const model = getPreparedEventModel();
    const result = await model.generateContent([
      { inlineData: { mimeType: "application/pdf", data: base64 } },
      { text: buildPreparedEventPrompt(rubric) }
    ]);
    console.log("AI review:", JSON.parse(result.response.text()));
  } catch (e) {
    console.error("Prepared Event AI failed:", e);
  }
};


/* =========================================================================
   PART 3 — ADMIN: RUBRICS
   ========================================================================= */

function parsePenaltyLines(text) {
  return text.split("\n").map(s => s.trim()).filter(Boolean).map(line => {
    const [rule, pts] = line.split("||").map(s => (s || "").trim());
    const points = pts === "" || pts == null ? null : Number(pts);
    return { rule, points: Number.isFinite(points) ? points : null };
  });
}

// Required text lines, same "value || points" convention as the penalty rules.
function parseRequiredLines(text) {
  return text.split("\n").map(s => s.trim()).filter(Boolean).map(line => {
    const [phrase, pts] = line.split("||").map(s => (s || "").trim());
    const points = pts === "" || pts == null ? null : Number(pts);
    return { phrase, points: Number.isFinite(points) ? points : null };
  });
}

function parseSectionLines(text) {
  return text.split("\n").map(s => s.trim()).filter(Boolean).map(line => {
    const [section, criteria] = line.split("||").map(s => (s || "").trim());
    return { section, criteria: criteria || "" };
  });
}

function renderAdminRubricsSection() {
  const body = document.getElementById("adminSubtabBody");
  if (!body) return;

  const editing = adminEditingRubricId ? rubrics.find(r => r.id === adminEditingRubricId) : null;

  const listHtml = rubrics.map(r => `
    <div class="admin-lesson-block">
      <div class="admin-lesson-head">
        <h4>${r.eventName}</h4>
        <div style="display:flex;gap:8px;">
          <button class="admin-btn-sm ghost" onclick="adminEditRubric('${r.id}')">Edit</button>
          <button class="admin-btn-sm danger" onclick="adminDeleteRubric('${r.id}')">${icon("trash")} Delete</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);">
        ${r.category || ""} · ${r.pageLimit ? `${r.pageLimit}-page limit · ` : ""}${(r.requiredText || []).length} required · ${(r.penaltyRules || []).length} penalty rules
        ${rubricHasChecks(r) ? "" : " · <strong>no checks set up</strong>"}
      </div>
    </div>
  `).join("") || `<div class="admin-empty-state">No events yet.</div>`;

  const penaltyText = editing
    ? (editing.penaltyRules || []).map(p => `${p.rule}${p.points != null ? ` || ${p.points}` : ""}`).join("\n")
    : "";
  const sectionText = editing
    ? (editing.rubricSections || []).map(s => `${s.section} || ${s.criteria}`).join("\n")
    : "";
  const requiredText = editing
    ? (editing.requiredText || []).map(t => `${t.phrase}${t.points != null ? ` || ${t.points}` : ""}`).join("\n")
    : "";

  body.innerHTML = `
    <div class="admin-seed-banner">
      <div>Paste each event's limits and required text straight from the current DECA guidelines. The entry checker only ever tests what's entered here — an event with nothing entered stays locked for students, and a required phrase is matched on its exact wording.</div>
    </div>
    <div class="admin-layout">
      <div class="admin-course-list">${listHtml}</div>
      <div class="admin-panel-body">
        <h3 style="margin-bottom:16px;">${editing ? "Edit Event Rubric" : "Add an Event Rubric"}</h3>
        <div class="admin-kpi-form">
          <input type="text" id="rubric-name" placeholder="Event name (e.g. Business Growth Plan)" value="${editing ? editing.eventName.replace(/"/g, "&quot;") : ""}">
          <input type="text" id="rubric-code" placeholder="Event code (e.g. EBG)" value="${editing ? (editing.eventCode || "") : ""}">
          <input type="text" id="rubric-category" placeholder="Category (e.g. Entrepreneurship Written Event)" value="${editing ? (editing.category || "") : ""}">
          <input type="number" id="rubric-pagelimit" placeholder="Page limit (leave blank if none)" value="${editing && editing.pageLimit != null ? editing.pageLimit : ""}">
          <input type="number" id="rubric-wordlimit" placeholder="Word limit (leave blank if none)" value="${editing && editing.wordLimit != null ? editing.wordLimit : ""}">
          <textarea id="rubric-required" rows="7" placeholder="Text the entry MUST contain, one per line. Add penalty points after || if you know them:&#10;Statement of Assurances || 5&#10;Executive Summary&#10;Bibliography || 5&#10;&#10;Matched on exact wording (case and spacing don't matter), so use the heading as students actually type it.">${requiredText}</textarea>
          <textarea id="rubric-penalties" rows="7" placeholder="One penalty rule per line. Add the point value after || if you know it:&#10;Written entry exceeds the page limit || 5&#10;Statement of Assurances missing or unsigned || 5&#10;Sections not in the required order">${penaltyText}</textarea>
          <textarea id="rubric-sections" rows="9" placeholder="One rubric section per line, as:  Section name || what the judge is looking for&#10;Executive Summary || Concise overview of the whole entry; hooks the reader; states the ask">${sectionText}</textarea>
          <textarea id="rubric-notes" rows="3" placeholder="Any extra guideline notes (formatting, appendix rules, etc.)">${editing ? (editing.notes || "") : ""}</textarea>
          <div style="display:flex;gap:10px;">
            <button class="admin-btn-sm" onclick="adminSaveRubric()">${editing ? "Save Changes" : "Add Event"}</button>
            ${editing ? `<button class="admin-btn-sm ghost" onclick="adminCancelEditRubric()">Cancel</button>` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

window.adminEditRubric = function(id) {
  adminEditingRubricId = id;
  renderAdminRubricsSection();
};

window.adminCancelEditRubric = function() {
  adminEditingRubricId = null;
  renderAdminRubricsSection();
};

window.adminSaveRubric = async function() {
  const eventName = document.getElementById("rubric-name").value.trim();
  const eventCode = document.getElementById("rubric-code").value.trim();
  const category = document.getElementById("rubric-category").value.trim();
  const pageLimitRaw = document.getElementById("rubric-pagelimit").value.trim();
  const notes = document.getElementById("rubric-notes").value.trim();

  if (!eventName) return alert("Please enter an event name.");

  const id = adminEditingRubricId || eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `rubric-${Date.now()}`;
  const wordLimitRaw = document.getElementById("rubric-wordlimit").value.trim();

  const rubricDoc = {
    id, eventName, eventCode, category,
    pageLimit: pageLimitRaw === "" ? null : Number(pageLimitRaw),
    wordLimit: wordLimitRaw === "" ? null : Number(wordLimitRaw),
    requiredText: parseRequiredLines(document.getElementById("rubric-required").value),
    penaltyRules: parsePenaltyLines(document.getElementById("rubric-penalties").value),
    rubricSections: parseSectionLines(document.getElementById("rubric-sections").value),
    notes
  };

  try {
    await setDoc(doc(db, "rubrics", id), rubricDoc);
    const idx = rubrics.findIndex(r => r.id === id);
    if (idx >= 0) rubrics[idx] = rubricDoc; else rubrics.push(rubricDoc);
    rubrics.sort((a, b) => (a.eventName || "").localeCompare(b.eventName || ""));
    adminEditingRubricId = null;
    renderAdminRubricsSection();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

window.adminDeleteRubric = async function(id) {
  if (!confirm("Delete this event rubric?")) return;
  try {
    await deleteDoc(doc(db, "rubrics", id));
    rubrics = rubrics.filter(r => r.id !== id);
    renderAdminRubricsSection();
  } catch (e) {
    console.error(e);
    alert("Couldn't delete — check the console.");
  }
};

// One-time import of the starter event list from rubrics.json.
window.adminSeedRubrics = async function() {
  if (!isAdmin(currentUser)) return;
  if (!confirm("Import the starter event list? Existing events with the same ID will be overwritten.")) return;
  try {
    const r = await fetch("rubrics.json");
    const data = await r.json();
    for (const item of data) await setDoc(doc(db, "rubrics", item.id), item);
    alert("Events imported. Now fill in each one's rubric and penalty rules.");
    await loadRubrics();
    renderAdminRubricsSection();
  } catch (e) {
    console.error(e);
    alert("Import failed — check the console.");
  }
};

/* =========================================================================
   FARM4GLASS — MOBILE NAV WIRING
   Builds the landing-page hamburger and the sidebar scrim in JS, so
   index.html doesn't have to carry them. Everything is guarded — if an
   element is already there, it's left alone.
   ========================================================================= */

(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* ---------- 1. landing nav hamburger ---------- */
    var topNav = document.querySelector('.top-nav');

    if (topNav && !topNav.querySelector('.nav-toggle')) {
      var toggle = document.createElement('button');
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-label', 'Menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span></span><span></span><span></span>';
      topNav.appendChild(toggle);

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = topNav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      // close after tapping any link or the login button
      topNav.querySelectorAll('.nav-links a, .nav-login-btn').forEach(function (el) {
        el.addEventListener('click', function () {
          topNav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });

      // close when tapping anywhere else on the page
      document.addEventListener('click', function (e) {
        if (topNav.classList.contains('open') && !topNav.contains(e.target)) {
          topNav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* ---------- 2. portal sidebar ---------- */
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // swap the glyph for three bars so it can animate into an X
    var burger = document.querySelector('.hamburger');
    if (burger && !burger.querySelector('span')) {
      burger.innerHTML = '<span></span><span></span><span></span>';
      burger.setAttribute('aria-label', 'Menu');
    }

    // scrim behind the open sidebar
    var scrim = document.querySelector('.f4g-scrim');
    if (!scrim) {
      scrim = document.createElement('div');
      scrim.className = 'f4g-scrim';
      document.body.appendChild(scrim);
    }

    function sync() {
      var open = sidebar.classList.contains('open');
      scrim.classList.toggle('show', open);
      document.body.classList.toggle('f4g-locked', open);
    }

    // watches whatever the existing hamburger handler does to .sidebar
    new MutationObserver(sync).observe(sidebar, {
      attributes: true,
      attributeFilter: ['class']
    });

    scrim.addEventListener('click', function () {
      sidebar.classList.remove('open');
    });

    // tapping a tab should close the drawer on phones
    sidebar.querySelectorAll('.nav-btn, .logout-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.matchMedia('(max-width: 768px)').matches) {
          sidebar.classList.remove('open');
        }
      });
    });

    // never leave the drawer stuck open when rotating to landscape / tablet
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) sidebar.classList.remove('open');
    });

    sync();
  });
})();


/* =========================================================================
   FARM4GLASS — FARM ICON SET
   Line icons drawn to match the ones already on the site: 24x24 viewBox,
   currentColor, 1.8 stroke, round caps.

     <i class="icon-svg" data-farm-icon="cow"></i>   in HTML
     farmIcon('barn')                                in JS

   Available: barn, cow, goat, bee, wheat, fence
   ========================================================================= */

(function () {
  var OPEN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
    'xmlns="http://www.w3.org/2000/svg">';

  var PATHS = {
    /* gambrel roof, plank doors with the classic cross-brace */
    barn:
      '<path d="M3 21V11l4-3.5L12 4l5 3.5 4 3.5v10Z"/>' +
      '<path d="M10 21v-6.5h4V21"/>' +
      '<path d="m10 14.5 4 6.5M14 14.5l-4 6.5"/>',

    /* head narrows at the cheeks then widens into the muzzle */
    cow:
      '<path d="M6.5 10c0-3 2.5-5 5.5-5s5.5 2 5.5 5c0 1.3-.4 2.4-1.1 3.3.9.6 1.4 1.5 1.4 2.5 0 2.1-2.4 3.7-5.8 3.7S6.2 17.9 6.2 15.8c0-1 .5-1.9 1.4-2.5A5.3 5.3 0 0 1 6.5 10Z"/>' +
      '<path d="M6.9 8.3 4.4 7.2c-1.4-.6-2.5.9-1.6 2.2.7 1 1.9 1.6 3.3 1.7"/>' +
      '<path d="m17.1 8.3 2.5-1.1c1.4-.6 2.5.9 1.6 2.2-.7 1-1.9 1.6-3.3 1.7"/>' +
      '<path d="M8.6 5.8 7.4 4.1M15.4 5.8l1.2-1.7"/>' +
      '<path d="M10 10h.01M14 10h.01"/>' +
      '<path d="M10.6 15.6h.01M13.4 15.6h.01"/>',

    /* swept-back horns and the beard do the identifying */
    goat:
      '<path d="M8.5 8c0-2.5 1.6-4 3.5-4s3.5 1.5 3.5 4v3.5c0 2.5-1.6 4.5-3.5 4.5s-3.5-2-3.5-4.5Z"/>' +
      '<path d="M9 5.5C7.8 3.6 5.4 2.7 4 3.6c-1 .7-.6 2.2 1 3.2"/>' +
      '<path d="M15 5.5c1.2-1.9 3.6-2.8 5-1.9 1 .7.6 2.2-1 3.2"/>' +
      '<path d="M8.5 8.6 6.6 9.5M15.5 8.6l1.9.9"/>' +
      '<path d="M10.3 9h.01M13.7 9h.01"/>' +
      '<path d="M10.8 12.8h2.4"/>' +
      '<path d="M11 16.2c0 2 .3 3.2 1 4.3.7-1.1 1-2.3 1-4.3"/>',

    bee:
      '<path d="M12 8.5c-2.5 0-4.5 2.2-4.5 5s2 5 4.5 5 4.5-2.2 4.5-5-2-5-4.5-5Z"/>' +
      '<path d="M7.8 12h8.4M8 15.6h8"/>' +
      '<path d="M9.5 8C8 5.5 5 4.5 3.6 6c-1.2 1.3-.2 3.8 2.4 4.6"/>' +
      '<path d="M14.5 8c1.5-2.5 4.5-3.5 5.9-2 1.2 1.3.2 3.8-2.4 4.6"/>' +
      '<path d="M10.8 6.2 9.8 4.4M13.2 6.2l1-1.8"/>',

    wheat:
      '<path d="M12 21V9"/>' +
      '<path d="M12 12c-2.2 0-4-1.8-4-4 2.2 0 4 1.8 4 4Z"/>' +
      '<path d="M12 12c2.2 0 4-1.8 4-4-2.2 0-4 1.8-4 4Z"/>' +
      '<path d="M12 7.5c-2.2 0-4-1.8-4-4 2.2 0 4 1.8 4 4Z"/>' +
      '<path d="M12 7.5c2.2 0 4-1.8 4-4-2.2 0-4 1.8-4 4Z"/>',

    fence:
      '<path d="M5 21V6.5L6.5 5 8 6.5V21"/>' +
      '<path d="M11 21V6.5L12.5 5 14 6.5V21"/>' +
      '<path d="M17 21V6.5L18.5 5 20 6.5V21"/>' +
      '<path d="M3 10h18M3 15h18"/>'
  };

  var FARM_ICONS = {};
  Object.keys(PATHS).forEach(function (k) {
    FARM_ICONS[k] = OPEN + PATHS[k] + '</svg>';
  });

  window.F4G_FARM_ICONS = FARM_ICONS;

  /* Returns a ready-to-drop string, e.g. farmIcon('cow') */
  window.farmIcon = function (name, extraClass) {
    if (!FARM_ICONS[name]) return '';
    return '<i class="icon-svg' + (extraClass ? ' ' + extraClass : '') +
      '" data-farm-icon-done="1">' + FARM_ICONS[name] + '</i>';
  };

  /* Fills any <i data-farm-icon="..."> that hasn't been filled yet */
  function hydrate(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-farm-icon]').forEach(function (el) {
      if (el.getAttribute('data-farm-icon-done') === '1') return;
      var svg = FARM_ICONS[el.getAttribute('data-farm-icon')];
      if (!svg) return;
      el.innerHTML = svg;
      el.setAttribute('data-farm-icon-done', '1');
      el.classList.add('icon-svg');
    });
  }
  window.hydrateFarmIcons = hydrate;

  function start() {
    hydrate(document);
    // tabs render their content after load, so keep watching
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes.length) { hydrate(document); return; }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
