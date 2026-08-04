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
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>`
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
async function loadKPIs() {
  let base = [];
  try {
    const r = await fetch("kpis.json");
    if (!r.ok) throw new Error(`kpis.json returned ${r.status}`);
    base = await r.json();
  } catch (e) {
    console.error("Failed to load kpis.json:", e);
  }
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
  const row = document.createElement("div");
  row.className = "pasture-row";
  row.onclick = () => openCourse(course.id);
  row.innerHTML = `
    <div class="pasture-icon" style="background:${course.color}22;color:${course.color};">${icon(groupIcon(course.group))}</div>
    <div class="pasture-info">
      <div class="pasture-title">${course.title}</div>
      <div class="pasture-pct">${isSuggestion ? `${course.lessons.length} lessons · not started` : `${pct}% complete`}</div>
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
    const level = course.level || "Beginner";
    const levelClass = level.toLowerCase().replace(/\s+/g, "-");

    const card = document.createElement("div");
    card.className = "course-card-new";
    card.onclick = () => openCourse(course.id);
    card.innerHTML = `
      <div class="cc-body">
        <div class="cc-icon" style="background:${course.color}22;color:${course.color};">${icon(groupIcon(course.group))}</div>
        <div class="cc-title">${course.title}</div>
        <div class="cc-desc">${course.description}</div>
        <div class="cc-meta">
          <span> ${course.lessons.length} lessons</span>
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

// ========================= OPEN COURSE =========================
window.openCourse = function(id) {
  currentCourseId = id;
  const course = courses.find(c => c.id === id);
  if (!course) return;

  const completed = userData?.completedLessons || [];
  const bookmarked = userData?.bookmarkedLessons || [];
  showTab("lessonView");

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
        ${course.lessons.map((lesson, i) => {
          const isDone = completed.includes(lesson.id);
          const isBookmarked = bookmarked.includes(lesson.id);
          const typeIcon = lesson.type === "quiz" ? icon("quiz") : icon("play");
          return `
            <div class="lesson-row ${isDone ? "done" : ""}" onclick="openLesson('${course.id}', '${lesson.id}')">
              <div class="lr-status ${isDone ? "completed" : "pending"}">${isDone ? "✓" : typeIcon}</div>
              <div class="lr-info">
                <div class="lr-title">${lesson.title}</div>
                <div class="lr-meta"><span class="lr-type-icon">${lesson.type === "quiz" ? icon("quiz") : icon("play")}</span> ${lesson.type === "quiz" ? "Quiz" : "Video"} · ${lesson.duration}</div>
              </div>
              <button class="bookmark-btn ${isBookmarked ? "active" : ""}" onclick="event.stopPropagation(); toggleLessonBookmark('${lesson.id}')" title="${isBookmarked ? "Remove bookmark" : "Bookmark this lesson"}">${icon(isBookmarked ? "bookmarkFilled" : "bookmark")}</button>
              <span class="lr-xp">+${lesson.xp} XP</span>
              <span class="lr-arrow">›</span>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
};

// ========================= OPEN LESSON =========================
window.openLesson = function(courseId, lessonId) {
  const course = courses.find(c => c.id === courseId);
  const lesson = course?.lessons.find(l => l.id === lessonId);
  if (!course || !lesson) return;
  currentLesson = lesson;

  if (lesson.type === "youtube") openVideoLesson(course, lesson);
  else if (lesson.type === "quiz") openQuiz(course, lesson);
};

function openVideoLesson(course, lesson) {
  const isCompleted = (userData?.completedLessons || []).includes(lesson.id);
  const videoId = lesson.url.includes("v=") ? lesson.url.split("v=")[1].split("&")[0] : lesson.url.split("/").pop();
  const container = document.getElementById("lessonViewContent");

  container.innerHTML = `
    <div class="video-lesson-wrap">
      <div class="vl-back" onclick="openCourse('${course.id}')">← ${course.title}</div>
      <div class="video-container">
        <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
      </div>
      <div class="vl-info">
        <h2>${lesson.title}</h2>
        <div class="vl-meta">Video lesson · ${lesson.duration} · +${lesson.xp} XP on completion</div>
        <button class="complete-btn" id="completeBtn" onclick="completeLesson('${lesson.id}', ${lesson.xp})" ${isCompleted ? "disabled" : ""}>
          ${isCompleted ? "✓ Completed" : "Mark as Complete (+"+lesson.xp+" XP)"}
        </button>
      </div>
    </div>
  `;
}

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
    const activityLog = [...(userData.activityLog || []), { date: new Date().toISOString().slice(0, 10), xp, lessonId, type: "video" }].slice(-300);
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
    document.querySelector("#completeBtn") && (document.querySelector("#completeBtn").disabled = true);
    document.querySelector("#completeBtn") && (document.querySelector("#completeBtn").textContent = "✓ Completed");
    renderDashboard();
  } catch (e) {
    console.error("Failed to save lesson completion:", e);
    alert("Couldn't save your progress — check the console for details.");
  }
};

// ========================= QUIZ ENGINE =========================
function openQuiz(course, lesson) {
  quizState = {
    course, lesson,
    questions: lesson.questions || [],
    current: 0,
    score: 0,
    answered: false
  };

  if (!quizState.questions.length) {
    const container = document.getElementById("lessonViewContent");
    container.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-back" onclick="openCourse('${course.id}')">← ${course.title}</div>
        <div class="admin-empty-state">This quiz doesn't have any questions yet. Check back soon!</div>
      </div>
    `;
    return;
  }

  renderQuizQuestion();
}

function renderQuizQuestion() {
  const { questions, current, lesson, course } = quizState;
  const q = questions[current];
  const pct = Math.round((current / questions.length) * 100);
  const container = document.getElementById("lessonViewContent");

  container.innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-back" onclick="openCourse('${course.id}')">← ${course.title}</div>
      <div class="quiz-header">
        <h2>${lesson.title}</h2>
        <div class="quiz-progress-row">
          <span>Question ${current + 1} of ${questions.length}</span>
          <span>Score: ${quizState.score}/${current}</span>
        </div>
        <div class="quiz-pbar-outer"><div class="quiz-pbar-inner" style="width:${pct}%"></div></div>
      </div>
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
    </div>
  `;
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

  const container = document.getElementById("lessonViewContent");
  container.innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-results">
        <div class="results-title">${pct === 100 ? "Perfect Score!" : pct >= 80 ? "Great Job!" : pct >= 60 ? "Good Work!" : "Keep Studying!"}</div>
        <div class="results-score">${score} / ${questions.length} correct (${pct}%)</div>
        <div class="results-xp">+${xpEarned} XP Earned </div>
        <div class="results-btns">
          <button class="btn-primary" onclick="retakeQuiz()">Retake Quiz</button>
          <button class="btn-primary" onclick="openCourse('${course.id}')">Back to Course</button>
        </div>
      </div>
    </div>
  `;

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
              return `<div class="analytics-unit-row">${l.title}<span class="analytics-score-pill ${cls}">${score}%</span></div>`;
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
      title: `Retake "${w.lesson.title}"`,
      desc: `You scored ${w.score}% on this quiz in ${w.course.title} — a quick retake could meaningfully boost your average.`,
      action: {
        label: "Retake Quiz",
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

  if (!selectedKPIId || !filtered.some(k => k.id === selectedKPIId)) {
    selectedKPIId = filtered.length ? filtered[0].id : null;
  }

  // Rows are grouped under their instructional area, each carrying that area's
  // icon in that area's color.
  let lastArea = null;
  const listHtml = filtered.map(k => {
    const art = kpiArtFor(k);
    const area = k.area || art.label;
    let heading = "";
    if (area !== lastArea) {
      lastArea = area;
      heading = `<div class="bookmark-group-label">${area}</div>`;
    }
    const isActive = k.id === selectedKPIId;
    return heading + `
      <button class="kpi-list-item ${isActive ? "active" : ""}" onclick="selectKPI('${k.id}')">
        <span class="kpi-item-icon" style="color:${isActive ? "#fff" : art.color};">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round">${art.svg}</svg>
        </span>
        <span class="kpi-item-text">
          ${k.title}
          <span class="kpi-cluster-tag">${k.code ? k.code + " · " : ""}${k.cluster}</span>
        </span>
        ${bookmarked.includes(k.id) ? `<span class="kpi-bookmark-dot">${icon("bookmarkFilled")}</span>` : ""}
      </button>
    `;
  }).join("") || `<div class="admin-empty-state">No matching performance indicators.</div>`;

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
