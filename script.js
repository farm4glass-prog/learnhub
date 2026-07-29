import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, orderBy, query, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const auth = getAuth(app);
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
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`
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

function getAnimal(xp) {
  for (let i = ANIMALS.length - 1; i >= 0; i--) {
    if (i === 0 || xp >= ANIMALS[i - 1].xpNeeded) return { ...ANIMALS[i], index: i };
  }
  return { ...ANIMALS[0], index: 0 };
}

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

// ========================= KPI DATABASE (starter content) =========================
// These are a starting set written by Farm4Glass as study aids, not verbatim DECA
// text. Admins can add, edit, and expand this list from the Admin tab as the
// database grows — treat this seed as a foundation, not a complete PI list.
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

// ========================= LOGIN =========================
async function loginWithGoogle() {
  try { await signInWithPopup(auth, provider); }
  catch (e) { console.error(e); alert(e.message); }
}

document.getElementById("landingLogin")?.addEventListener("click", loginWithGoogle);
document.getElementById("heroLogin")?.addEventListener("click", loginWithGoogle);
document.getElementById("aboutLogin")?.addEventListener("click", loginWithGoogle);

// ========================= AUTH STATE =========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    document.getElementById("nav-admin")?.classList.toggle("hidden", !isAdmin(user));

    document.getElementById("landingPage")?.classList.add("hidden");
    document.getElementById("portal")?.classList.remove("hidden");

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName || "DECA Student",
          email: user.email,
          photoURL: user.photoURL || "",
          chapter: "",
          xp: 0,
          streak: 0,
          bestStreak: 0,
          lastActiveDate: "",
          completedLessons: [],
          completedQuizzes: 0,
          earnedBadges: [],
          quizScores: {}
        });
      }

      const fresh = await getDoc(userRef);
      userData = fresh.data();

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
}

// ========================= COURSES LOAD (Firestore, seeded from courses.json) =========================
// Courses now live in the "courses" collection in Firestore so admin edits
// (new videos, new practice questions) are saved permanently and show up
// for every user. courses.json is only used to seed the database the very
// first time (see adminSeedCourses below) or as an offline fallback.
async function loadCourses() {
  try {
    const snap = await getDocs(collection(db, "courses"));
    if (!snap.empty) {
      courses = snap.docs.map(d => normalizeCourse(d.data()));
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

  // Fall back to the bundled courses.json (also what admin "seed" uses)
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

loadCourses();
loadKPIs();

async function loadKPIs() {
  try {
    const snap = await getDocs(collection(db, "kpis"));
    if (!snap.empty) {
      kpis = snap.docs.map(d => d.data());
      kpisLoaded = true;
      renderKPIList();
      if (document.getElementById("admin")?.classList.contains("active")) renderAdminPanel();
      return;
    }
  } catch (e) {
    console.error("Failed to load KPIs from Firestore:", e);
  }
  // Fall back to the bundled starter set until an admin imports/edits in Firestore
  kpis = KPI_SEED;
  kpisLoaded = true;
  renderKPIList();
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

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await signOut(auth);
  }, { once: true });
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

  // Stats
  document.getElementById("statXP").textContent = userData.xp;
  document.getElementById("statStreak").textContent = userData.streak;
  document.getElementById("statAnimalName").textContent = animal.name;
  document.getElementById("statLessons").textContent = (userData.completedLessons || []).length;

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

  // Featured courses (pastures)
  renderFeaturedCourses();

  // Streak widget
  renderStreakWidget();

  // Badges widget
  renderBadgesWidget();
}

function renderFeaturedCourses() {
  const container = document.getElementById("featuredCourses");
  if (!container || !courses.length) return;
  container.innerHTML = "";

  courses.slice(0, 5).forEach(course => {
    const completed = (userData?.completedLessons || []).filter(id => course.lessons.some(l => l.id === id)).length;
    const pct = course.lessons.length
      ? Math.round((completed / course.lessons.length) * 100)
      : 0;

    const row = document.createElement("div");
    row.className = "pasture-row";
    row.onclick = () => openCourse(course.id);
    row.innerHTML = `
      <div class="pasture-icon" style="background:${course.color}22;color:${course.color};">${icon(groupIcon(course.group))}</div>
      <div class="pasture-info">
        <div class="pasture-title">${course.title}</div>
        <div class="pasture-pct">${pct}% complete</div>
        <div class="pasture-bar-outer">
          <div class="pasture-bar-inner" style="width:${pct}%;background:${course.color || "#22c55e"};"></div>
        </div>
      </div>
      <div class="pasture-arrow">›</div>
    `;
    container.appendChild(row);
  });
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

  // Category filters
  const filterContainer = document.getElementById("categoryFilters");
  if (filterContainer && filterContainer.children.length === 0) {
    const cats = ["All Courses", ...new Set(courses.map(c => c.category))];
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
    const matchCat = activeCat === "All Courses" || c.category === activeCat;
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
    container.innerHTML = `<div class="lb-loading">No courses match your search. </div>`;
  }
}

// ========================= OPEN COURSE =========================
window.openCourse = function(id) {
  currentCourseId = id;
  const course = courses.find(c => c.id === id);
  if (!course) return;

  const completed = userData?.completedLessons || [];
  showTab("lessonView");

  const container = document.getElementById("lessonViewContent");
  container.innerHTML = `
    <div class="lesson-view-wrap">
      <div class="lv-back" onclick="showTab('courses')">← Back to Courses</div>
      <div class="lv-header">
        <h1>${course.title}</h1>
        <div class="lv-desc">${course.description}</div>
      </div>
      <div class="lessons-list">
        ${course.lessons.map((lesson, i) => {
          const isDone = completed.includes(lesson.id);
          const typeIcon = lesson.type === "quiz" ? icon("quiz") : icon("play");
          return `
            <div class="lesson-row ${isDone ? "done" : ""}" onclick="openLesson('${course.id}', '${lesson.id}')">
              <div class="lr-status ${isDone ? "completed" : "pending"}">${isDone ? "✓" : typeIcon}</div>
              <div class="lr-info">
                <div class="lr-title">${lesson.title}</div>
                <div class="lr-meta"><span class="lr-type-icon">${lesson.type === "quiz" ? icon("quiz") : icon("play")}</span> ${lesson.type === "quiz" ? "Quiz" : "Video"} · ${lesson.duration}</div>
              </div>
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

    // Check level up
    if (newAnimal.index > oldAnimal.index) {
      setTimeout(() => showLevelUpModal(newAnimal), 800);
    }

    // Check badges
    await checkAndAwardBadges();

    // Refresh UI
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

  if (idx === q.answer) quizState.score++;

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

  // Award XP if not already completed
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

    // Show first new badge modal
    const badge = BADGES.find(b => b.id === newOnes[0]);
    if (badge) {
      setTimeout(() => {
        document.getElementById("badgeModalIcon").innerHTML = ICONS[badge.icon] || "";
        document.getElementById("badgeModalName").textContent = badge.name;
        document.getElementById("badgeModalDesc").textContent = badge.desc;
        document.getElementById("badgeModal").classList.remove("hidden");
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
// Uses the same Firestore user doc (completedLessons, quizScores, activityLog)
// as everywhere else — no separate database needed. Recommendations are
// generated with a simple rules engine based on that data.

function renderAnalytics() {
  const container = document.getElementById("analyticsContent");
  if (!container || !userData) return;

  const quizScores = userData.quizScores || {};
  const scoreEntries = Object.entries(quizScores);
  const avgScore = scoreEntries.length
    ? Math.round(scoreEntries.reduce((s, [, v]) => s + v, 0) / scoreEntries.length)
    : null;

  // Per-course completion + per-unit quiz scores
  const courseRows = courses.map(course => {
    const completed = (userData.completedLessons || []).filter(id => course.lessons.some(l => l.id === id)).length;
    const pct = course.lessons.length ? Math.round((completed / course.lessons.length) * 100) : 0;
    const quizUnits = course.lessons.filter(l => l.type === "quiz" && quizScores[l.id] != null);
    return { course, pct, completed, quizUnits };
  }).filter(r => r.completed > 0 || r.quizUnits.length > 0);

  // Last 7 days of XP from activityLog
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

function buildRecommendations(courseRows, quizScores, log) {
  const recs = [];

  // Weakest quiz units (below 60%)
  const weakUnits = [];
  courseRows.forEach(r => r.quizUnits.forEach(l => {
    if (quizScores[l.id] < 60) weakUnits.push({ course: r.course, lesson: l, score: quizScores[l.id] });
  }));
  weakUnits.sort((a, b) => a.score - b.score).slice(0, 3).forEach(w => {
    recs.push({
      icon: "target",
      title: `Retake "${w.lesson.title}"`,
      desc: `You scored ${w.score}% on this quiz in ${w.course.title} — a quick retake could meaningfully boost your average.`
    });
  });

  // Stalled courses: started but not touched among the most recent activity
  const recentLessonIds = new Set(log.slice(-15).map(e => e.lessonId));
  courseRows.forEach(r => {
    if (r.pct > 0 && r.pct < 100) {
      const touchedRecently = r.course.lessons.some(l => recentLessonIds.has(l.id));
      if (!touchedRecently) {
        recs.push({
          icon: "bulb",
          title: `Pick back up on ${r.course.title}`,
          desc: `You're ${r.pct}% through this course but haven't touched it recently — even one more unit keeps your progress moving.`
        });
      }
    }
  });

  // Streak nudge
  if (!userData.streak) {
    recs.push({ icon: "flame", title: "Start a study streak today", desc: "Complete just one lesson today to start building a streak — consistency compounds fast." });
  }

  // Untouched courses with content
  const untouched = courseRows.length ? courses.filter(c => c.lessons.length > 0 && !courseRows.some(r => r.course.id === c.id)) : courses.filter(c => c.lessons.length > 0);
  if (untouched.length && recs.length < 4) {
    recs.push({ icon: "book", title: `Try ${untouched[0].title}`, desc: "You haven't started this course yet — it's a good candidate for your next study session." });
  }

  return recs.slice(0, 5);
}

// ========================= KPI DATABASE =========================
function renderKPIList() {
  const container = document.getElementById("kpiContent");
  if (!container) return;

  if (!kpisLoaded) {
    container.innerHTML = `<div class="admin-empty-state">Loading KPI database...</div>`;
    return;
  }

  const q = document.getElementById("kpiSearch")?.value.toLowerCase() || "";
  const filtered = kpis.filter(k => k.title.toLowerCase().includes(q) || k.cluster.toLowerCase().includes(q));

  if (!selectedKPIId && filtered.length) selectedKPIId = filtered[0].id;

  const listHtml = filtered.map(k => `
    <button class="kpi-list-item ${k.id === selectedKPIId ? "active" : ""}" onclick="selectKPI('${k.id}')">
      ${k.title}
      <span class="kpi-cluster-tag">${k.cluster}</span>
    </button>
  `).join("") || `<div class="admin-empty-state">No matching performance indicators.</div>`;

  const selected = filtered.find(k => k.id === selectedKPIId) || filtered[0];

  container.innerHTML = `
    <div class="kpi-layout">
      <div class="kpi-list">${listHtml}</div>
      <div class="kpi-detail" id="kpiDetail">${selected ? renderKPIDetailHtml(selected) : `<div class="admin-empty-state">Select a performance indicator.</div>`}</div>
    </div>
  `;
}

function renderKPIDetailHtml(k) {
  return `
    <span class="kpi-cluster-tag">${k.cluster}</span>
    <h2>${k.title}</h2>
    <div class="kpi-section"><h4>Explanation</h4><p>${k.explanation}</p></div>
    <div class="kpi-section"><h4>Real-World Example</h4><p>${k.example}</p></div>
    <div class="kpi-section"><h4>Judge Expectations</h4><p>${k.judgeExpectations}</p></div>
    <div class="kpi-section"><h4>Common Mistakes</h4><p>${k.commonMistakes}</p></div>
    <div class="kpi-section"><h4>Sample Answer</h4><p>${k.sampleAnswer}</p></div>
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

  // Avatar
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

  document.getElementById("pStatXP").textContent = userData.xp;
  document.getElementById("pStatStreak").textContent = userData.streak;
  document.getElementById("pStatLessons").textContent = (userData.completedLessons || []).length;
  document.getElementById("pStatBadges").textContent = (userData.earnedBadges || []).length;

  document.getElementById("editDisplayName").value = userData.displayName || "";
  document.getElementById("editChapter").value = userData.chapter || "";

  // Badges large
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

  // Completed lessons
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
  if (!name) return alert("Display name can't be empty!");

  try {
    await updateDoc(doc(db, "users", currentUser.uid), { displayName: name, chapter });
    userData.displayName = name;
    userData.chapter = chapter;

    renderSidebar();
    renderDashboard();
    renderProfile();
    alert("Profile saved!");
  } catch (e) {
    console.error("Failed to save profile:", e);
    alert("Couldn't save your profile — check the console for details.");
  }
};

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
  if (tabName === "admin") renderAdminPanel();

  // Close mobile sidebar
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
  setTimeout(() => toast.classList.add("hidden"), 2500);
}

// ========================= LEVEL UP MODAL =========================
function showLevelUpModal(animal) {
  document.getElementById("modalEmoji").innerHTML = icon("zap");
  document.getElementById("modalAnimal").textContent = animal.name;
  document.getElementById("modalMsg").textContent = `You evolved into a ${animal.name}! Keep studying to evolve again!`;
  document.getElementById("levelUpModal").classList.remove("hidden");
}

window.closeModal = function(id) {
  document.getElementById(id)?.classList.add("hidden");
};

// ========================================================================
// ========================= ADMIN PANEL =================================
// ========================================================================
// Everything below is only reachable by emails in ADMIN_EMAILS. Course
// content (video lessons + their paired practice quizzes) is stored in the
// Firestore "courses" collection, one document per course, keyed by course id.
// Remember to add Firestore security rules so only admins can write to
// the "courses" collection, e.g.:
//
//   match /courses/{courseId} {
//     allow read: if true;
//     allow write: if request.auth.token.email == "farm4glass@gmail.com";
//   }

function renderAdminPanel() {
  const container = document.getElementById("adminContent");
  if (!container || !isAdmin(currentUser)) return;

  const subtabsHtml = `
    <div class="admin-subtabs">
      <button class="admin-subtab-btn ${adminActiveSubTab === "courses" ? "active" : ""}" onclick="adminSwitchSubTab('courses')">Courses</button>
      <button class="admin-subtab-btn ${adminActiveSubTab === "kpi" ? "active" : ""}" onclick="adminSwitchSubTab('kpi')">KPI Database</button>
    </div>
    <div id="adminSubtabBody"></div>
  `;
  container.innerHTML = subtabsHtml;

  if (adminActiveSubTab === "kpi") renderAdminKPISection();
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

  const courseListHtml = courses.map(c => `
    <button class="admin-course-btn ${c.id === adminSelectedCourseId ? "active" : ""}" onclick="adminSelectCourse('${c.id}')">
      ${c.title}
      <span class="admin-course-sub">${c.lessons.length} lessons</span>
    </button>
  `).join("");

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

function renderAdminKPISection() {
  const body = document.getElementById("adminSubtabBody");
  if (!body) return;

  const listHtml = kpis.map(k => `
    <div class="admin-lesson-block">
      <div class="admin-lesson-head">
        <h4>${k.title}</h4>
        <div style="display:flex;gap:8px;">
          <button class="admin-btn-sm ghost" onclick="adminEditKPI('${k.id}')">Edit</button>
          <button class="admin-btn-sm danger" onclick="adminDeleteKPI('${k.id}')">${icon("trash")} Delete</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);">${k.cluster}</div>
    </div>
  `).join("") || `<div class="admin-empty-state">No performance indicators yet.</div>`;

  const editing = adminEditingKPIId ? kpis.find(k => k.id === adminEditingKPIId) : null;

  body.innerHTML = `
    <div class="admin-seed-banner">
      <div>The KPI database starts with a small Farm4Glass-written seed set. Import it once, then expand it here as you verify and add real content.</div>
      <button class="admin-btn-sm" onclick="adminSeedKPIs()">Import starter KPIs</button>
    </div>
    <div class="admin-layout">
      <div class="admin-course-list">${listHtml}</div>
      <div class="admin-panel-body">
        <h3 style="margin-bottom:16px;">${editing ? "Edit Performance Indicator" : "Add a New Performance Indicator"}</h3>
        <div class="admin-kpi-form">
          <input type="text" id="kpi-title" placeholder="PI title (e.g. Explain the concept of channels of distribution)" value="${editing ? editing.title.replace(/"/g, "&quot;") : ""}">
          <input type="text" id="kpi-cluster" placeholder="Cluster (e.g. Marketing)" value="${editing ? editing.cluster.replace(/"/g, "&quot;") : ""}">
          <textarea id="kpi-explanation" rows="2" placeholder="Explanation">${editing ? editing.explanation : ""}</textarea>
          <textarea id="kpi-example" rows="2" placeholder="Real-world example">${editing ? editing.example : ""}</textarea>
          <textarea id="kpi-judge" rows="2" placeholder="Judge expectations">${editing ? editing.judgeExpectations : ""}</textarea>
          <textarea id="kpi-mistakes" rows="2" placeholder="Common mistakes">${editing ? editing.commonMistakes : ""}</textarea>
          <textarea id="kpi-sample" rows="3" placeholder="Sample answer">${editing ? editing.sampleAnswer : ""}</textarea>
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

  if (!title || !cluster || !explanation) return alert("Please fill in at least the title, cluster, and explanation.");

  const id = adminEditingKPIId || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `kpi-${Date.now()}`;
  const kpiDoc = { id, title, cluster, explanation, example, judgeExpectations, commonMistakes, sampleAnswer };

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

window.adminDeleteKPI = async function(id) {
  if (!confirm("Delete this performance indicator?")) return;
  try {
    await deleteDoc(doc(db, "kpis", id));
    kpis = kpis.filter(k => k.id !== id);
    renderAdminKPISection();
    renderKPIList();
  } catch (e) {
    console.error(e);
    alert("Couldn't delete — check the console.");
  }
};

window.adminSeedKPIs = async function() {
  if (!confirm("Import the starter KPI set into the database? This will overwrite any existing KPI docs with the same IDs.")) return;
  try {
    for (const k of KPI_SEED) {
      await setDoc(doc(db, "kpis", k.id), k);
    }
    alert("Starter KPIs imported!");
    await loadKPIs();
    renderAdminKPISection();
  } catch (e) {
    console.error(e);
    alert("Import failed — check the console.");
  }
};

function renderAdminCourseEditor() {
  const editor = document.getElementById("adminCourseEditor");
  if (!editor) return;
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) {
    editor.innerHTML = `<div class="admin-empty-state">Select a course to edit.</div>`;
    return;
  }

  const lessonsHtml = course.lessons.map((lesson, idx) => {
    if (lesson.type === "quiz") {
      const questionsHtml = (lesson.questions || []).map((q, qi) => `
        <div class="admin-question-card">
          <strong>Q${qi + 1}:</strong> ${q.q}
          <div style="margin-top:6px;font-size:13px;color:var(--muted);">
            ${q.options.map((o, oi) => `${oi === q.answer ? "✓ " : "· "}${o}`).join("<br>")}
          </div>
          <button class="admin-btn-sm danger" style="margin-top:8px;" onclick="adminDeleteQuestion('${lesson.id}', ${qi})">${icon("trash")} Remove question</button>
        </div>
      `).join("") || `<div style="color:var(--muted);font-size:13px;margin-bottom:10px;">No practice questions yet.</div>`;

      return `
        <div class="admin-lesson-block quiz-block" id="admin-lesson-${lesson.id}">
          <div class="admin-lesson-head">
            <h4>${icon("quiz")} ${lesson.title}</h4>
            <button class="admin-btn-sm danger" onclick="adminDeleteLesson('${lesson.id}')">${icon("trash")} Delete quiz</button>
          </div>
          ${questionsHtml}
          <div class="admin-add-question-form">
            <textarea rows="2" placeholder="Question text" id="q-text-${lesson.id}"></textarea>
            <div class="admin-option-inputs">
              <input type="text" placeholder="Option A" id="q-opt0-${lesson.id}">
              <input type="text" placeholder="Option B" id="q-opt1-${lesson.id}">
              <input type="text" placeholder="Option C" id="q-opt2-${lesson.id}">
              <input type="text" placeholder="Option D" id="q-opt3-${lesson.id}">
            </div>
            <div class="admin-field-row">
              <select id="q-answer-${lesson.id}">
                <option value="0">Correct: Option A</option>
                <option value="1">Correct: Option B</option>
                <option value="2">Correct: Option C</option>
                <option value="3">Correct: Option D</option>
              </select>
            </div>
            <textarea rows="2" placeholder="Explanation (shown after answering)" id="q-exp-${lesson.id}"></textarea>
            <button class="admin-btn-sm" onclick="adminAddQuestion('${lesson.id}')">${icon("plus")} Add question</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="admin-lesson-block" id="admin-lesson-${lesson.id}">
        <div class="admin-lesson-head">
          <h4>${icon("play")} ${lesson.title}</h4>
          <button class="admin-btn-sm danger" onclick="adminDeleteLesson('${lesson.id}')">${icon("trash")} Delete video + quiz</button>
        </div>
        <div class="admin-field-row">
          <input type="text" value="${lesson.title.replace(/"/g, "&quot;")}" id="v-title-${lesson.id}" placeholder="Title">
          <input type="text" value="${lesson.url || ""}" id="v-url-${lesson.id}" placeholder="YouTube URL">
          <input type="number" value="${lesson.xp}" id="v-xp-${lesson.id}" placeholder="XP" style="max-width:90px;">
          <button class="admin-btn-sm" onclick="adminUpdateVideo('${lesson.id}')">Save</button>
        </div>
      </div>
    `;
  }).join("");

  editor.innerHTML = `
    <h3 style="margin-bottom:16px;">${course.title}</h3>
    ${lessonsHtml || `<div class="admin-empty-state">No lessons yet. Add the first video unit below.</div>`}
    <div class="admin-lesson-block" style="border-style:dashed;">
      <h4 style="margin-bottom:10px;">${icon("plus")} Add a new unit</h4>
      <div class="admin-field-row">
        <input type="text" placeholder="Unit title (e.g. Unit 21: Marketing Math)" id="new-unit-title">
        <input type="text" placeholder="YouTube URL" id="new-unit-url">
        <input type="number" placeholder="XP (default 25)" id="new-unit-xp" style="max-width:120px;">
        <button class="admin-btn-sm" onclick="adminAddUnit('${course.id}')">${icon("plus")} Add video + quiz</button>
      </div>
      <div style="font-size:12px;color:var(--muted);">Adding a video automatically creates a paired practice quiz right after it — add questions to it once it's created.</div>
    </div>
  `;
}

async function saveCourseLessons(courseId, lessons) {
  await setDoc(doc(db, "courses", courseId), { lessons }, { merge: true });
  const course = courses.find(c => c.id === courseId);
  if (course) course.lessons = lessons;
}

window.adminUpdateVideo = async function(lessonId) {
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) return;
  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  lesson.title = document.getElementById(`v-title-${lessonId}`).value.trim() || lesson.title;
  lesson.url = document.getElementById(`v-url-${lessonId}`).value.trim() || lesson.url;
  lesson.xp = Number(document.getElementById(`v-xp-${lessonId}`).value) || lesson.xp;

  try {
    await saveCourseLessons(course.id, course.lessons);
    alert("Video updated!");
    renderCourseGrid();
    renderFeaturedCourses();
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

  const stamp = Date.now();
  const videoLesson = { id: `${courseId}-video-${stamp}`, title, type: "youtube", url, xp, duration: "10 min" };
  const quizLesson = { id: `${courseId}-quiz-${stamp}`, title: `${title} — Practice Quiz`, type: "quiz", xp, duration: "5 min", questions: [] };

  const newLessons = [...course.lessons, videoLesson, quizLesson];

  try {
    await saveCourseLessons(courseId, newLessons);
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
  if (!confirm("Delete this lesson? This cannot be undone.")) return;

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

window.adminAddQuestion = async function(lessonId) {
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) return;
  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  const qText = document.getElementById(`q-text-${lessonId}`).value.trim();
  const opts = [0, 1, 2, 3].map(i => document.getElementById(`q-opt${i}-${lessonId}`).value.trim());
  const answer = Number(document.getElementById(`q-answer-${lessonId}`).value);
  const explanation = document.getElementById(`q-exp-${lessonId}`).value.trim();

  if (!qText || opts.some(o => !o)) return alert("Please fill in the question and all four options.");

  lesson.questions = [...(lesson.questions || []), { q: qText, options: opts, answer, explanation }];

  try {
    await saveCourseLessons(course.id, course.lessons);
    renderAdminPanel();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

window.adminDeleteQuestion = async function(lessonId, questionIndex) {
  const course = courses.find(c => c.id === adminSelectedCourseId);
  if (!course) return;
  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  lesson.questions = (lesson.questions || []).filter((_, i) => i !== questionIndex);

  try {
    await saveCourseLessons(course.id, course.lessons);
    renderAdminPanel();
  } catch (e) {
    console.error(e);
    alert("Couldn't save — check the console.");
  }
};

// One-time helper: pushes the bundled courses.json into Firestore so the
// admin panel (and every user) reads from the database from now on.
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
// Personalized week-by-week schedule based on: which exam/event, the
// conference/test date, the student's current practice score, and how many
// hours a week they have available. Saved per-user in Firestore so it's
// there next time they log in.

function parseDurationMinutes(str) {
  const match = /(\d+)/.exec(str || "");
  return match ? Number(match[1]) : 10;
}

function renderPlannerForm() {
  const select = document.getElementById("plannerCourse");
  if (!select) return;

  if (select.children.length === 0 && courses.length) {
    select.innerHTML = courses.map(c => `<option value="${c.id}">${c.title}</option>`).join("");
  }

  const saved = userData?.studyPlan;
  if (saved) {
    if (saved.courseId) select.value = saved.courseId;
    if (saved.conferenceDate) document.getElementById("plannerDate").value = saved.conferenceDate;
    if (saved.currentScore != null) document.getElementById("plannerScore").value = saved.currentScore;
    if (saved.hoursPerWeek != null) document.getElementById("plannerHours").value = saved.hoursPerWeek;
    renderPlanResults(saved);
  }
}

window.generateStudyPlan = async function() {
  const courseId = document.getElementById("plannerCourse").value;
  const conferenceDate = document.getElementById("plannerDate").value;
  const currentScore = Number(document.getElementById("plannerScore").value);
  const hoursPerWeek = Number(document.getElementById("plannerHours").value);

  if (!courseId || !conferenceDate || !hoursPerWeek) {
    alert("Please fill in the exam, date, and available hours per week.");
    return;
  }

  const course = courses.find(c => c.id === courseId);
  if (!course) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(conferenceDate + "T00:00:00");
  const daysUntil = Math.max(1, Math.round((target - today) / 86400000));
  const weeksUntil = Math.max(1, Math.ceil(daysUntil / 7));

  const completed = userData?.completedLessons || [];
  const remaining = course.lessons.filter(l => !completed.includes(l.id));

  // Low scorers get quizzes re-queued earlier/more often for extra review
  const orderedRemaining = currentScore && currentScore < 70
    ? [...remaining].sort((a, b) => (a.type === "quiz" ? -1 : 1) - (b.type === "quiz" ? -1 : 1))
    : remaining;

  const totalMinutesNeeded = orderedRemaining.reduce((sum, l) => sum + parseDurationMinutes(l.duration), 0);
  const totalHoursNeeded = totalMinutesNeeded / 60;
  const availableHours = weeksUntil * hoursPerWeek;

  const perWeek = Math.max(1, Math.ceil(orderedRemaining.length / weeksUntil));
  const weeks = [];
  for (let w = 0; w < weeksUntil && w * perWeek < orderedRemaining.length; w++) {
    const chunk = orderedRemaining.slice(w * perWeek, (w + 1) * perWeek);
    if (!chunk.length) break;
    const weekStart = new Date(today.getTime() + w * 7 * 86400000);
    const weekEnd = new Date(Math.min(weekStart.getTime() + 6 * 86400000, target.getTime()));
    weeks.push({
      weekNum: w + 1,
      start: weekStart.toISOString().slice(0, 10),
      end: weekEnd.toISOString().slice(0, 10),
      items: chunk.map(l => ({ title: l.title, type: l.type, duration: l.duration }))
    });
  }

  const plan = {
    courseId, courseTitle: course.title, conferenceDate, currentScore, hoursPerWeek,
    daysUntil, weeksUntil, remainingCount: orderedRemaining.length,
    totalHoursNeeded: Math.round(totalHoursNeeded * 10) / 10,
    availableHours, weeks,
    generatedAt: new Date().toISOString()
  };

  renderPlanResults(plan);

  if (currentUser) {
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { studyPlan: plan });
      if (userData) userData.studyPlan = plan;
    } catch (e) {
      console.error("Failed to save study plan:", e);
    }
  }
};

function renderPlanResults(plan) {
  const container = document.getElementById("plannerResults");
  if (!container) return;

  if (!plan.weeks.length) {
    container.innerHTML = `<div class="admin-empty-state">You've already completed every lesson in ${plan.courseTitle}! Head to the Leaderboard to see how you stack up.</div>`;
    return;
  }

  const onTrack = plan.availableHours >= plan.totalHoursNeeded;
  const statusHtml = onTrack
    ? `<div class="planner-ontrack">${icon("zap")} You have enough time budgeted — stick to the plan below and you'll finish ${plan.courseTitle} before your conference.</div>`
    : `<div class="planner-warning">${icon("alert")} At ${plan.hoursPerWeek} hrs/week you're short about ${Math.max(0, Math.round((plan.totalHoursNeeded - plan.availableHours) * 10) / 10)} hours before your conference. Consider raising your weekly hours or starting review sooner.</div>`;

  const scoreNote = plan.currentScore && plan.currentScore < 70
    ? `<div class="planner-warning">${icon("alert")} Your practice score (${plan.currentScore}%) suggests prioritizing quizzes for extra review — this plan front-loads quiz review where possible.</div>`
    : "";

  const weeksHtml = plan.weeks.map(w => `
    <div class="planner-week-card">
      <div class="planner-week-head">
        <h4>Week ${w.weekNum}</h4>
        <span class="planner-week-dates">${w.start} → ${w.end}</span>
      </div>
      <div class="planner-week-items">
        ${w.items.map(item => `
          <div class="planner-week-item">${icon(item.type === "quiz" ? "quiz" : "play")} ${item.title} <span style="color:var(--muted);margin-left:auto;">${item.duration}</span></div>
        `).join("")}
      </div>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="planner-summary">
      <h3>Your Plan for ${plan.courseTitle}</h3>
      <div class="planner-summary-grid">
        <div class="planner-summary-stat"><div class="val">${plan.daysUntil}</div><div class="lbl">Days Until Conference</div></div>
        <div class="planner-summary-stat"><div class="val">${plan.remainingCount}</div><div class="lbl">Lessons Remaining</div></div>
        <div class="planner-summary-stat"><div class="val">${plan.totalHoursNeeded}h</div><div class="lbl">Est. Time Needed</div></div>
        <div class="planner-summary-stat"><div class="val">${plan.availableHours}h</div><div class="lbl">Time Budgeted</div></div>
      </div>
      ${statusHtml}
      ${scoreNote}
    </div>
    <div class="planner-weeks">${weeksHtml}</div>
  `;
}
