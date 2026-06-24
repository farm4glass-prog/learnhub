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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ========================= FARM ANIMALS =========================
const ANIMALS = [
  { emoji: "🐣", name: "Baby Goat",    tagline: "Just hatched on the farm!",           xpNeeded: 100,  level: 1 },
  { emoji: "🐔", name: "Chick",        tagline: "Finding your feed!",                  xpNeeded: 250,  level: 2 },
  { emoji: "🐑", name: "Lamb",         tagline: "Flocking to knowledge!",              xpNeeded: 500,  level: 3 },
  { emoji: "🐐", name: "Goat",         tagline: "Climbing the competition mountain!",  xpNeeded: 900,  level: 4 },
  { emoji: "🐄", name: "Cow",          tagline: "Mooo-ving up in the world!",          xpNeeded: 1500, level: 5 },
  { emoji: "🐂", name: "Bull",         tagline: "Unstoppable on the DECA stage!",      xpNeeded: 2500, level: 6 },
  { emoji: "🏆", name: "Champion",     tagline: "The farm's greatest legend!",         xpNeeded: Infinity, level: 7 }
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
  { id: "first-hay-bale",   emoji: "🌾", name: "First Hay Bale",   desc: "Complete your first lesson",           check: (u) => u.completedLessons?.length >= 1 },
  { id: "barn-burner",      emoji: "🔥", name: "Barn Burner",      desc: "Reach a 3-day streak",                check: (u) => u.streak >= 3 },
  { id: "monthly-moo",      emoji: "🐄", name: "Monthly Moo",      desc: "Earn 500 XP",                         check: (u) => u.xp >= 500 },
  { id: "top-rooster",      emoji: "🐓", name: "Top Rooster",      desc: "Complete 10 lessons",                 check: (u) => u.completedLessons?.length >= 10 },
  { id: "harvest-hero",     emoji: "🏆", name: "Harvest Hero",     desc: "Finish an entire course",             check: (u, courses) => checkCourseComplete(u, courses) },
  { id: "field-hand",       emoji: "👐", name: "Field Hand",       desc: "Complete your first quiz",            check: (u) => u.completedQuizzes >= 1 },
  { id: "ranch-legend",     emoji: "🌟", name: "Ranch Legend",     desc: "Earn 1000 XP",                        check: (u) => u.xp >= 1000 },
  { id: "top-of-pasture",   emoji: "🥇", name: "Top of the Pasture", desc: "Reach a 7-day streak",              check: (u) => u.streak >= 7 },
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
    grid.innerHTML = `<div class="lb-loading">⚠️ ${message}</div>`;
  }
  const dash = document.getElementById("featuredCourses");
  if (dash) {
    dash.innerHTML = `<div class="lb-loading">⚠️ ${message}</div>`;
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

// ========================= COURSES LOAD =========================
fetch("courses.json")
  .then(r => {
    if (!r.ok) throw new Error(`courses.json returned ${r.status}`);
    return r.json();
  })
  .then(data => {

    courses = data.map((course, courseIndex) => ({
      category: "DECA",
      color: [
        "#22c55e",
        "#3b82f6",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#06b6d4"
      ][courseIndex % 6],

      emoji: [
        "📈","💰","🏨","🏢","📊",
        "🚀","💳","🎨","🖌️","📚",
        "👤","🤝","💵","🔬","📋",
        "💡","📣","💻","📉"
      ][courseIndex % 19],

      level: "Beginner",
      duration: "Self-paced",

      ...course,

      lessons: (course.lessons || []).map((lesson, lessonIndex) => ({
        id: lesson.id || `${course.id}-lesson-${lessonIndex + 1}`,
        xp: lesson.xp || 25,
        duration: lesson.duration || "10 min",
        ...lesson
      }))
    }));

    coursesLoaded = true;
    console.log("Courses loaded:", courses);

    // Render the course grid as soon as courses are ready, regardless of
    // whether the user profile has finished loading yet. The grid functions
    // already guard against userData being null.
    renderCourseGrid();
    renderFeaturedCourses();
  })
  .catch(err => {
    console.error("Failed to load courses:", err);
    showLoadError(
      "We couldn't load the course catalog (courses.json failed to load). Check that the file exists at the right path and that the browser console doesn't show a 404 or JSON parsing error."
    );
  });

// ========================= RENDER ALL =========================
function renderAll() {
  if (!userData) return;
  renderSidebar();
  renderDashboard();
  renderCourseGrid();
  renderProfile();
  renderLeaderboard();
}

// ========================= SIDEBAR =========================
function renderSidebar() {
  const animal = getAnimalForXP(userData.xp);
  const next = ANIMALS[animal.index + 1];
  const xpIntoTier = animal.index === 0 ? userData.xp : userData.xp - ANIMALS[animal.index - 1]?.xpNeeded || 0;

  let prevXP = 0;
  if (animal.index > 0) prevXP = ANIMALS[animal.index - 1].xpNeeded;
  const tierXP = animal.xpNeeded === Infinity ? 999 : animal.xpNeeded - prevXP;
  const fill = animal.xpNeeded === Infinity ? 100 : Math.min(100, ((userData.xp - prevXP) / tierXP) * 100);

  document.getElementById("saEmoji").textContent = animal.emoji;
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
  const greeting = hour < 12 ? "Mornin'" : hour < 17 ? "Howdy" : "Evenin'";
  const name = (userData.displayName || "Farmer").split(" ")[0];
  document.getElementById("dashGreeting").textContent = `${greeting}, ${name}! 🌾`;

  // Stats
  document.getElementById("statXP").textContent = userData.xp;
  document.getElementById("statStreak").textContent = userData.streak;
  document.getElementById("statAnimalIcon").textContent = animal.emoji;
  document.getElementById("statAnimalName").textContent = animal.name;
  document.getElementById("statLessons").textContent = (userData.completedLessons || []).length;

  // Animal card
  document.getElementById("acEmoji").textContent = animal.emoji;
  document.getElementById("acName").textContent = animal.name;
  document.getElementById("acTagline").textContent = `"${animal.tagline}"`;
  document.getElementById("acLevel").textContent = `Level ${animal.level}`;
  document.getElementById("acNextEmoji").textContent = next.emoji;
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
      <div class="pasture-icon" style="background:${course.color}22;">${course.emoji || "📚"}</div>
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
  const days = ["Mo","Tu","We","Th","Fr","Sa","Su"];
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
  document.getElementById("bestStreakBadge").textContent = `🏆 Best: ${userData.bestStreak || 0}d`;
  document.getElementById("streakMsg").textContent =
    userData.streak > 0 ? `${userData.streak} day streak! Keep it up! 🔥` : "Start your streak today! 🌱";
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
      <div class="badge-icon-wrap ${has ? "unlocked" : "locked"}">${badge.emoji}</div>
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
    container.innerHTML = `<div class="lb-loading">Loading courses... 🐐</div>`;
    return;
  }

  if (!courses.length) {
    container.innerHTML = `<div class="lb-loading">No courses found. 🌱</div>`;
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
      <div class="cc-top" style="background:${course.color};"></div>
      <div class="cc-body">
        <div class="cc-tags">
          <span class="cc-category" style="color:${course.color};border-color:${course.color};">${course.category || "DECA"}</span>
          <span class="cc-level ${levelClass}">${course.level}</span>
        </div>
        <div class="cc-title">${course.emoji} ${course.title}</div>
        <div class="cc-desc">${course.description}</div>
        <div class="cc-meta">
          <span>📖 ${course.lessons.length} lessons</span>
          <span>⏱ ${course.duration || "Self-paced"}</span>
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
    container.innerHTML = `<div class="lb-loading">No courses match your search. 🔍</div>`;
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
        <h1>${course.emoji} ${course.title}</h1>
        <div class="lv-desc">${course.description}</div>
      </div>
      <div class="lessons-list">
        ${course.lessons.map((lesson, i) => {
          const isDone = completed.includes(lesson.id);
          const typeIcon = lesson.type === "quiz" ? "📝" : "▶️";
          return `
            <div class="lesson-row ${isDone ? "done" : ""}" onclick="openLesson('${course.id}', '${lesson.id}')">
              <div class="lr-status ${isDone ? "completed" : "pending"}">${isDone ? "✓" : typeIcon}</div>
              <div class="lr-info">
                <div class="lr-title">${lesson.title}</div>
                <div class="lr-meta">${lesson.type === "quiz" ? "📝 Quiz" : "🎬 Video"} · ${lesson.duration}</div>
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
        <div class="vl-meta">🎬 Video lesson · ${lesson.duration} · +${lesson.xp} XP on completion</div>
        <button class="complete-btn" id="completeBtn" onclick="completeLesson('${lesson.id}', ${lesson.xp})" ${isCompleted ? "disabled" : ""}>
          ${isCompleted ? "✓ Completed" : "✅ Mark as Complete (+"+lesson.xp+" XP)"}
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
    questions: lesson.questions,
    current: 0,
    score: 0,
    answered: false
  };
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
        <div class="explanation-box" id="explanationBox">${q.explanation}</div>
        <button class="next-btn" id="nextBtn" onclick="nextQuestion()">
          ${current + 1 === questions.length ? "See Results 🏆" : "Next Question →"}
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
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "✅" : "📚";

  const container = document.getElementById("lessonViewContent");
  container.innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-results">
        <div class="results-emoji">${emoji}</div>
        <div class="results-title">${pct === 100 ? "Perfect Score!" : pct >= 80 ? "Great Job!" : pct >= 60 ? "Good Work!" : "Keep Studying!"}</div>
        <div class="results-score">${score} / ${questions.length} correct (${pct}%)</div>
        <div class="results-xp">+${xpEarned} XP Earned 🌾</div>
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
        document.getElementById("badgeModalEmoji").textContent = badge.emoji;
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

  const sortField = lbMode === "xp" ? "xp" : lbMode === "streak" ? "streak" : "completedLessons";

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

      const row = document.createElement("div");
      row.className = `lb-row${isYou ? " you" : ""}`;
      row.innerHTML = `
        <div class="lb-rank ${rankClass}">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}</div>
        <div class="lb-avatar">${animal.emoji}</div>
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
      container.innerHTML = '<div class="lb-loading">No data yet. Be the first! 🐐</div>';
    }
  } catch (e) {
    container.innerHTML = `<div class="lb-loading">Couldn't load rankings — check Firestore rules. 🐄</div>`;
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
  document.getElementById("profileLevel").textContent = `${animal.emoji} ${animal.name} · ${userData.xp} XP`;

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
        <div class="badge-icon-lg ${has ? "unlocked" : "locked"}">${badge.emoji}</div>
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
      cl.innerHTML = '<div style="color:var(--muted);font-size:14px;">No lessons completed yet. Start learning! 🌱</div>';
    } else {
      completedIds.forEach(id => {
        const course = courses.find(c => c.lessons.some(l => l.id === id));
        const lesson = course?.lessons.find(l => l.id === id);
        if (!lesson) return;
        const div = document.createElement("div");
        div.className = "completed-item";
        div.innerHTML = `<span>✅</span><span>${lesson.title}</span><span style="color:var(--muted);font-size:12px;margin-left:auto;">${course?.title}</span>`;
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
    alert("✅ Profile saved!");
  } catch (e) {
    console.error("Failed to save profile:", e);
    alert("Couldn't save your profile — check the console for details.");
  }
};

// ========================= TABS =========================
window.showTab = function(tabName) {
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
  toast.textContent = `+${xp} XP 🌾`;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2500);
}

// ========================= LEVEL UP MODAL =========================
function showLevelUpModal(animal) {
  document.getElementById("modalEmoji").textContent = "🎉";
  document.getElementById("modalAnimal").textContent = `${animal.emoji} ${animal.name}`;
  document.getElementById("modalMsg").textContent = `You evolved into a ${animal.name}! Keep studying to evolve again!`;
  document.getElementById("levelUpModal").classList.remove("hidden");
}

window.closeModal = function(id) {
  document.getElementById(id)?.classList.add("hidden");
};
