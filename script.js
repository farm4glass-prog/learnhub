import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
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
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`
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
    await updateDoc(userRef, {
      xp: newXP,
      completedLessons: completed
    });

    userData.xp = newXP;
    userData.completedLessons = completed;

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
      [`quizScores.${lesson.id}`]: pct
    };

    if (!already && passed) {
      updates.completedLessons = [...(userData.completedLessons || []), lesson.id];
      userData.completedLessons = updates.completedLessons;
    }

    await updateDoc(userRef, updates);
    userData.xp = newXP;
    userData.completedQuizzes = (userData.completedQuizzes || 0) + 1;

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

  if (!coursesLoaded) {
    container.innerHTML = `<div class="admin-empty-state">Loading courses...</div>`;
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

  container.innerHTML = `
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
  renderAdminPanel();
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
