/* =========================================================================
   FARM4GLASS — CHAPTER ADVISOR DASHBOARD
   -------------------------------------------------------------------------
   A full admin panel for the person running a chapter, district, or
   association. They see every member who redeemed their access code, what
   each one has finished, what events each one is competing in, and they can
   assign units with a due date and watch the completion come in.

   HOW THIS FILE HOOKS IN
   ----------------------
   It touches nothing in script.js. Two things make that work:

     1. It reuses the Firebase app script.js already created (getApp()), so
        there's no second initialisation and no second sign-in.
     2. index.html renames the advisor container to #advisorRoot. The old
        renderAdvisorDashboard() in script.js looks for #advisorContent,
        finds nothing, and returns on its first line — so it never fights
        this file for the tab.

   It also wraps window.showTab so the panel rebuilds every time the tab is
   opened, and renders the student-facing "Assigned to you" widget on the
   dashboard.

   FIRESTORE
   ---------
   New collection: "assignments"
     { id, partnerId, courseId, courseTitle, unitKeys[], lessonIds[],
       title, note, dueDate, allMembers, memberIds[],
       createdAt, createdByEmail }

   Nothing else changes shape. Completion is READ from each student's
   existing completedLessons array, so assigning work never writes to a
   student's document.
   ========================================================================= */

import { getApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);

/* ========================= STATE ========================= */

const ADV = {
  user: null,
  partner: null,
  members: [],
  courses: [],
  assignments: [],
  loaded: false,
  loading: false,
  error: "",
  tab: "overview",        // overview | members | assignments | settings
  memberId: null,         // when set, the Members tab shows one person
  search: "",
  sort: "xp",
  editingId: null,        // assignment being edited
  formCourseId: ""
};

/* ========================= ICONS ========================= */
// Same stroke language as the rest of the site. No emoji.

const AI = {
  users: `<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  check: `<path d="m20 6-11 11-5-5"/>`,
  clipboard: `<rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h6"/>`,
  play: `<circle cx="12" cy="12" r="9"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>`,
  quiz: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h.01M8 13h.01M8 17h.01"/><path d="M12 9h5M12 13h5M12 17h5"/>`,
  file: `<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/>`,
  book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
  flame: `<path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.3-2-1-3 2 1 3 3 3 6a6 6 0 0 1-12 0c0-4 2-5 4-10z"/>`,
  award: `<circle cx="12" cy="8" r="6"/><path d="M9 13.5 7 22l5-3 5 3-2-8.5"/>`,
  target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>`,
  alert: `<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>`,
  download: `<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 21h16"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  trash: `<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>`,
  copy: `<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>`,
  key: `<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9 2 2-2 2 2 2-2 2-2-2-3 3"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 6 8 7 8-7"/>`,
  back: `<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>`
};

function ai(name) {
  return `<span class="icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${AI[name] || ""}</svg></span>`;
}

/* ========================= SMALL HELPERS ========================= */

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const today = () => new Date().toISOString().slice(0, 10);

function daysSince(iso) {
  if (!iso) return null;
  const then = new Date(iso + "T00:00:00").getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

function lastActiveLabel(iso) {
  const d = daysSince(iso);
  if (d == null) return "Never";
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  return new Date(iso + "T00:00:00").toLocaleDateString();
}

function dateLabel(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function firstName(m) {
  return String(m.displayName || "DECA Student").split(" ")[0];
}

// Same unit grouping script.js uses, so a unit here means the same thing a
// unit means to a student.
function unitKeyFor(lesson) {
  const id = String(lesson?.id || "");
  let m = id.match(/^(.*)-(?:video|quiz|article)$/);
  if (m) return m[1];
  m = id.match(/^(.*)-(?:video|quiz|article)-(\d+)$/);
  if (m) return `${m[1]}-${m[2]}`;
  return id;
}

function stripUnitSuffix(title) {
  return String(title || "")
    .replace(/\s*[\u2014\u2013-]\s*(Practice Quiz|Quiz|Article|Reading|PDF)\s*$/i, "")
    .trim();
}

function buildUnits(course) {
  const map = new Map();
  (course?.lessons || []).forEach(lesson => {
    const key = unitKeyFor(lesson);
    if (!map.has(key)) map.set(key, { key, video: null, article: null, quiz: null, lessons: [] });
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
    unit.xp = unit.lessons.reduce((sum, l) => sum + (l.xp || 0), 0);
  });
  return units;
}

/* ========================= LOADING ========================= */

function isChapterAdmin(user, partner) {
  if (!user || !partner) return false;
  const email = String(user.email || "").toLowerCase();
  return (partner.advisorEmails || []).some(e => String(e || "").toLowerCase() === email);
}

async function findPartnerFor(user) {
  const snap = await getDocs(collection(db, "partners"));
  const partners = snap.docs.map(d => d.data());
  return partners.find(p => isChapterAdmin(user, p)) || null;
}

async function loadAdvisorData(force) {
  if (ADV.loading) return;
  if (ADV.loaded && !force) return;
  ADV.loading = true;
  ADV.error = "";

  try {
    if (!ADV.partner) ADV.partner = await findPartnerFor(ADV.user);
    if (!ADV.partner) {
      ADV.loaded = true;
      ADV.loading = false;
      renderAdvisor();
      return;
    }

    const [memberSnap, courseSnap, assignSnap] = await Promise.all([
      getDocs(query(collection(db, "users"), where("partnerId", "==", ADV.partner.id))),
      getDocs(collection(db, "courses")),
      getDocs(query(collection(db, "assignments"), where("partnerId", "==", ADV.partner.id)))
    ]);

    ADV.members = memberSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.xp || 0) - (a.xp || 0));

    ADV.courses = courseSnap.docs.map(d => d.data()).filter(c => (c.lessons || []).length);
    ADV.courses.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));

    ADV.assignments = assignSnap.docs.map(d => d.data())
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    ADV.loaded = true;
  } catch (e) {
    console.error("Advisor dashboard failed to load:", e);
    ADV.error = e?.message || String(e);
    ADV.loaded = true;
  }

  ADV.loading = false;
  document.getElementById("nav-advisor")?.classList.toggle("hidden", !ADV.partner);
  renderAdvisor();
}

/* ========================= DERIVED DATA ========================= */

function memberCourseProgress(member, course) {
  const done = member.completedLessons || [];
  const total = (course.lessons || []).length;
  const finished = (course.lessons || []).filter(l => done.includes(l.id)).length;
  return { finished, total, pct: total ? Math.round((finished / total) * 100) : 0 };
}

function memberEvents(member) {
  return [
    member.roleplayEvent && { label: "Roleplay", value: member.roleplayEvent },
    member.writtenEvent && { label: "Written", value: member.writtenEvent },
    member.clusterExam && { label: "Cluster exam", value: member.clusterExam }
  ].filter(Boolean);
}

function assignmentLessonIds(a) {
  const course = ADV.courses.find(c => c.id === a.courseId);
  if (!course) return a.lessonIds || [];
  const units = buildUnits(course);
  const ids = [];
  (a.unitKeys || []).forEach(k => {
    const u = units.find(x => x.key === k);
    if (u) u.lessons.forEach(l => ids.push(l.id));
  });
  return ids.length ? ids : (a.lessonIds || []);
}

function assignmentMembers(a) {
  if (a.allMembers) return ADV.members;
  return ADV.members.filter(m => (a.memberIds || []).includes(m.id));
}

function assignmentPctFor(a, member) {
  const ids = assignmentLessonIds(a);
  if (!ids.length) return 0;
  const done = (member.completedLessons || []).filter(id => ids.includes(id)).length;
  return Math.round((done / ids.length) * 100);
}

function assignmentsForMember(memberId) {
  return ADV.assignments.filter(a => a.allMembers || (a.memberIds || []).includes(memberId));
}

function assignmentSummary(a) {
  const people = assignmentMembers(a);
  const doneCount = people.filter(m => assignmentPctFor(a, m) === 100).length;
  const avg = people.length
    ? Math.round(people.reduce((s, m) => s + assignmentPctFor(a, m), 0) / people.length)
    : 0;
  const overdue = !!a.dueDate && a.dueDate < today() && doneCount < people.length;
  return { people, doneCount, avg, overdue };
}

function memberAssignmentScore(member) {
  const list = assignmentsForMember(member.id);
  if (!list.length) return null;
  const done = list.filter(a => assignmentPctFor(a, member) === 100).length;
  return { done, total: list.length };
}

/* ========================= RENDER: SHELL ========================= */

function renderAdvisor() {
  const root = document.getElementById("advisorRoot");
  if (!root) return;

  if (!ADV.user) {
    root.innerHTML = `<div class="admin-empty-state">Sign in with the Google account your chapter code is registered to.</div>`;
    return;
  }

  if (!ADV.loaded) {
    root.innerHTML = `<div class="lb-loading">Loading your chapter...</div>`;
    loadAdvisorData();
    return;
  }

  if (ADV.error) {
    root.innerHTML = `
      <div class="planner-warning">${ai("alert")} Couldn't load your chapter: ${esc(ADV.error)}
      <br><br>If this mentions permissions, the Firestore rules need to allow reading
      <code>users</code> where <code>partnerId</code> matches, plus the <code>assignments</code> collection.</div>`;
    return;
  }

  if (!ADV.partner) {
    root.innerHTML = `
      <div class="admin-empty-state">
        This account isn't listed as an advisor for any chapter yet.<br>
        Ask Farm4Glass to add <strong>${esc(ADV.user.email || "")}</strong> to your chapter's advisor list.
      </div>`;
    return;
  }

  const tabs = [
    ["overview", "Overview"],
    ["members", "Members"],
    ["assignments", "Assignments"],
    ["settings", "Chapter settings"]
  ];

  root.innerHTML = `
    <div class="adv-head">
      <div>
        <div class="adv-partner-name">${esc(ADV.partner.name)}</div>
        <div class="adv-partner-sub">${esc((ADV.partner.type || "chapter"))} · ${ADV.members.length} ${ADV.members.length === 1 ? "member" : "members"} joined</div>
      </div>
      <button class="admin-btn-sm ghost" onclick="advRefresh()">Refresh</button>
    </div>

    <div class="admin-subtabs adv-subtabs">
      ${tabs.map(([k, label]) => `
        <button class="admin-subtab-btn ${ADV.tab === k ? "active" : ""}" onclick="advSwitchTab('${k}')">${label}</button>
      `).join("")}
    </div>

    <div id="advBody"></div>
  `;

  if (ADV.tab === "members") renderMembersTab();
  else if (ADV.tab === "assignments") renderAssignmentsTab();
  else if (ADV.tab === "settings") renderSettingsTab();
  else renderOverviewTab();
}

window.f4gRenderAdvisor = renderAdvisor;

window.advSwitchTab = function (tab) {
  ADV.tab = tab;
  ADV.memberId = null;
  renderAdvisor();
};

window.advRefresh = async function () {
  ADV.loaded = false;
  renderAdvisor();
  await loadAdvisorData(true);
};

/* ========================= RENDER: OVERVIEW ========================= */

function renderOverviewTab() {
  const body = document.getElementById("advBody");
  if (!body) return;

  const members = ADV.members;
  const activeWeek = members.filter(m => {
    const d = daysSince(m.lastActiveDate);
    return d != null && d <= 7;
  });
  const totalLessons = members.reduce((s, m) => s + (m.completedLessons?.length || 0), 0);
  const avgXP = members.length ? Math.round(members.reduce((s, m) => s + (m.xp || 0), 0) / members.length) : 0;

  // Who to nudge, most urgent first: never started, then gone quiet, then
  // sitting on an overdue assignment, then no event picked.
  const attention = [];
  members.forEach(m => {
    const d = daysSince(m.lastActiveDate);
    const overdue = assignmentsForMember(m.id).filter(a =>
      a.dueDate && a.dueDate < today() && assignmentPctFor(a, m) < 100
    );

    if (!(m.completedLessons || []).length) {
      attention.push({ m, rank: 0, why: "Hasn't finished a single lesson yet" });
    } else if (d == null || d > 14) {
      attention.push({ m, rank: 1, why: `No activity since ${lastActiveLabel(m.lastActiveDate).toLowerCase()}` });
    } else if (overdue.length) {
      attention.push({ m, rank: 2, why: `${overdue.length} overdue ${overdue.length === 1 ? "assignment" : "assignments"}` });
    } else if (!memberEvents(m).length) {
      attention.push({ m, rank: 3, why: "No competitive events set on their profile" });
    }
  });
  attention.sort((a, b) => a.rank - b.rank || (b.m.xp || 0) - (a.m.xp || 0));

  // Event spread — what the chapter is actually competing in.
  const eventCounts = new Map();
  members.forEach(m => memberEvents(m).forEach(e => {
    const key = `${e.label}||${e.value}`;
    eventCounts.set(key, (eventCounts.get(key) || 0) + 1);
  }));
  const eventRows = [...eventCounts.entries()]
    .map(([k, n]) => ({ label: k.split("||")[0], value: k.split("||")[1], n }))
    .sort((a, b) => b.n - a.n || a.value.localeCompare(b.value));

  const liveAssignments = ADV.assignments.slice(0, 4);

  body.innerHTML = `
    <div class="stats-grid adv-stats">
      <div class="stat-card"><div class="stat-value">${members.length}</div><div class="stat-label">Members</div></div>
      <div class="stat-card"><div class="stat-value">${activeWeek.length}</div><div class="stat-label">Active this week</div></div>
      <div class="stat-card"><div class="stat-value">${avgXP.toLocaleString()}</div><div class="stat-label">Average XP</div></div>
      <div class="stat-card"><div class="stat-value">${totalLessons.toLocaleString()}</div><div class="stat-label">Lessons completed</div></div>
    </div>

    ${!members.length ? `
      <div class="widget adv-widget">
        <div class="widget-header"><span>Nobody has joined yet</span></div>
        <p class="adv-empty-copy">
          Share the code <strong class="adv-code-inline">${esc(ADV.partner.accessCode || "")}</strong> with your members.
          They enter it under Profile &rarr; Partnership, and they'll show up here straight away.
        </p>
      </div>
    ` : `
      <div class="adv-two-col">
        <div class="widget adv-widget">
          <div class="widget-header">
            <span>Worth a nudge</span>
            <span class="widget-badge">${attention.length}</span>
          </div>
          ${attention.length ? attention.slice(0, 8).map(a => `
            <button class="adv-nudge" onclick="advOpenMember('${esc(a.m.id)}')">
              <span class="adv-nudge-dot r${a.rank}"></span>
              <span class="adv-nudge-main">
                <span class="adv-nudge-name">${esc(a.m.displayName || "DECA Student")}</span>
                <span class="adv-nudge-why">${esc(a.why)}</span>
              </span>
              <span class="adv-nudge-go">View</span>
            </button>
          `).join("") : `<p class="adv-empty-copy">Everyone's active, on track, and has their events set. Rare and good.</p>`}
        </div>

        <div class="widget adv-widget">
          <div class="widget-header"><span>Leading the chapter</span></div>
          ${members.slice(0, 6).map((m, i) => `
            <button class="adv-rank-row" onclick="advOpenMember('${esc(m.id)}')">
              <span class="adv-rank-num">${i + 1}</span>
              <span class="adv-rank-name">${esc(m.displayName || "DECA Student")}</span>
              <span class="adv-rank-val">${(m.xp || 0).toLocaleString()} XP</span>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="adv-two-col">
        <div class="widget adv-widget">
          <div class="widget-header"><span>What your chapter is competing in</span></div>
          ${eventRows.length ? `
            <div class="adv-event-list">
              ${eventRows.slice(0, 12).map(r => `
                <div class="adv-event-row">
                  <span class="adv-event-kind">${esc(r.label)}</span>
                  <span class="adv-event-name">${esc(r.value)}</span>
                  <span class="adv-event-count">${r.n}</span>
                </div>
              `).join("")}
            </div>
          ` : `<p class="adv-empty-copy">Nobody has set their events yet. Members pick them under Profile &rarr; Edit Profile.</p>`}
        </div>

        <div class="widget adv-widget">
          <div class="widget-header">
            <span>Recent assignments</span>
            <button class="admin-btn-sm" onclick="advSwitchTab('assignments')">${ai("plus")} New</button>
          </div>
          ${liveAssignments.length ? liveAssignments.map(a => {
            const s = assignmentSummary(a);
            return `
              <div class="adv-assign-mini">
                <div class="adv-assign-mini-head">
                  <span class="adv-assign-mini-title">${esc(a.title)}</span>
                  <span class="adv-assign-mini-count ${s.overdue ? "late" : ""}">${s.doneCount}/${s.people.length}</span>
                </div>
                <div class="pasture-bar-outer"><div class="pasture-bar-inner" style="width:${s.avg}%;background:${s.overdue ? "#dc2626" : "#167db5"};"></div></div>
              </div>`;
          }).join("") : `<p class="adv-empty-copy">No assignments yet. Set one and every member sees it on their dashboard.</p>`}
        </div>
      </div>
    `}
  `;
}

/* ========================= RENDER: MEMBERS ========================= */

function sortedMembers() {
  const q = ADV.search.toLowerCase();
  const list = ADV.members.filter(m =>
    !q || `${m.displayName || ""} ${m.email || ""} ${m.chapter || ""} ${m.roleplayEvent || ""} ${m.writtenEvent || ""} ${m.clusterExam || ""}`
      .toLowerCase().includes(q)
  );

  const by = {
    xp: (a, b) => (b.xp || 0) - (a.xp || 0),
    name: (a, b) => String(a.displayName || "").localeCompare(String(b.displayName || "")),
    lessons: (a, b) => (b.completedLessons?.length || 0) - (a.completedLessons?.length || 0),
    streak: (a, b) => (b.streak || 0) - (a.streak || 0),
    active: (a, b) => String(b.lastActiveDate || "").localeCompare(String(a.lastActiveDate || ""))
  };
  return [...list].sort(by[ADV.sort] || by.xp);
}

function renderMembersTab() {
  const body = document.getElementById("advBody");
  if (!body) return;

  if (ADV.memberId) return renderMemberDetail();

  const list = sortedMembers();

  body.innerHTML = `
    <div class="adv-toolbar">
      <input type="text" id="advSearch" class="adv-search" placeholder="Search by name, email, or event..."
             value="${esc(ADV.search)}" oninput="advSetSearch(this.value)">
      <select class="adv-select" onchange="advSetSort(this.value)">
        ${[["xp", "Most XP"], ["name", "Name"], ["lessons", "Most lessons"], ["streak", "Longest streak"], ["active", "Recently active"]]
          .map(([v, l]) => `<option value="${v}" ${ADV.sort === v ? "selected" : ""}>${l}</option>`).join("")}
      </select>
      <button class="admin-btn-sm ghost" onclick="advExportCsv()">${ai("download")} Export CSV</button>
    </div>

    ${list.length ? `
      <div class="adv-table">
        <div class="adv-row adv-row-head">
          <span>Member</span><span>Events</span><span>XP</span><span>Lessons</span><span>Streak</span><span>Assigned</span><span>Last active</span>
        </div>
        ${list.map(m => {
          const ev = memberEvents(m);
          const score = memberAssignmentScore(m);
          const stale = (daysSince(m.lastActiveDate) ?? 999) > 14;
          return `
            <div class="adv-row" onclick="advOpenMember('${esc(m.id)}')">
              <span class="adv-cell-name">
                <span class="adv-name">${esc(m.displayName || "DECA Student")}</span>
                <span class="adv-email">${esc(m.email || "")}</span>
              </span>
              <span class="adv-cell-events">
                ${ev.length ? ev.map(e => `<span class="adv-chip">${esc(e.value)}</span>`).join("") : `<span class="adv-chip muted">Not set</span>`}
              </span>
              <span class="adv-num">${(m.xp || 0).toLocaleString()}</span>
              <span class="adv-num">${(m.completedLessons?.length || 0)}</span>
              <span class="adv-num">${m.streak || 0}</span>
              <span class="adv-num">${score ? `${score.done}/${score.total}` : "—"}</span>
              <span class="adv-last ${stale ? "stale" : ""}">${esc(lastActiveLabel(m.lastActiveDate))}</span>
            </div>`;
        }).join("")}
      </div>
    ` : `<div class="admin-empty-state">${ADV.search ? `Nobody matches "${esc(ADV.search)}".` : "No members have redeemed your access code yet."}</div>`}
  `;
}

window.advSetSearch = function (v) {
  ADV.search = v;
  renderMembersTab();
  const box = document.getElementById("advSearch");
  if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
};

window.advSetSort = function (v) {
  ADV.sort = v;
  renderMembersTab();
};

window.advOpenMember = function (id) {
  ADV.tab = "members";
  ADV.memberId = id;
  renderAdvisor();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.advBackToMembers = function () {
  ADV.memberId = null;
  renderMembersTab();
};

function renderMemberDetail() {
  const body = document.getElementById("advBody");
  const m = ADV.members.find(x => x.id === ADV.memberId);
  if (!body) return;
  if (!m) { ADV.memberId = null; return renderMembersTab(); }

  const done = m.completedLessons || [];
  const events = memberEvents(m);
  const quizScores = m.quizScores || {};

  const courseRows = ADV.courses.map(c => ({ course: c, ...memberCourseProgress(m, c) }))
    .filter(r => r.finished > 0)
    .sort((a, b) => b.pct - a.pct);

  const scoreEntries = Object.entries(quizScores);
  const avgQuiz = scoreEntries.length
    ? Math.round(scoreEntries.reduce((s, [, v]) => s + v, 0) / scoreEntries.length)
    : null;

  const weakest = scoreEntries
    .map(([lessonId, score]) => {
      const course = ADV.courses.find(c => (c.lessons || []).some(l => l.id === lessonId));
      const lesson = course?.lessons.find(l => l.id === lessonId);
      return lesson ? { title: stripUnitSuffix(lesson.title), course: course.title, score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  const theirAssignments = assignmentsForMember(m.id);
  const attempts = (m.examAttempts || []).slice(-5).reverse();

  body.innerHTML = `
    <button class="adv-back" onclick="advBackToMembers()">${ai("back")} All members</button>

    <div class="widget adv-widget adv-member-head">
      <div class="adv-member-id">
        <div class="adv-member-name">${esc(m.displayName || "DECA Student")}</div>
        <div class="adv-member-meta">${esc(m.email || "")}${m.chapter ? ` · ${esc(m.chapter)}` : ""}${m.association ? ` · ${esc(m.association)}` : ""}</div>
        <div class="adv-member-events">
          ${events.length
            ? events.map(e => `<span class="adv-chip solid" title="${esc(e.label)}">${esc(e.value)}</span>`).join("")
            : `<span class="adv-chip muted">No events set — ask them to fill these in on their profile</span>`}
        </div>
      </div>
      <a class="admin-btn-sm ghost adv-mail" href="mailto:${esc(m.email || "")}">${ai("mail")} Email</a>
    </div>

    <div class="stats-grid adv-stats">
      <div class="stat-card"><div class="stat-value">${(m.xp || 0).toLocaleString()}</div><div class="stat-label">Total XP</div></div>
      <div class="stat-card"><div class="stat-value">${done.length}</div><div class="stat-label">Lessons done</div></div>
      <div class="stat-card"><div class="stat-value">${avgQuiz != null ? avgQuiz + "%" : "—"}</div><div class="stat-label">Average quiz score</div></div>
      <div class="stat-card"><div class="stat-value">${m.streak || 0}</div><div class="stat-label">Day streak</div></div>
    </div>

    <div class="adv-two-col">
      <div class="widget adv-widget">
        <div class="widget-header"><span>Course progress</span></div>
        ${courseRows.length ? courseRows.map(r => `
          <div class="adv-progress-row">
            <div class="adv-progress-head">
              <span>${esc(r.course.title)}</span>
              <span>${r.finished}/${r.total} · ${r.pct}%</span>
            </div>
            <div class="pasture-bar-outer"><div class="pasture-bar-inner" style="width:${r.pct}%;background:${r.course.color || "#167db5"};"></div></div>
          </div>
        `).join("") : `<p class="adv-empty-copy">Hasn't started a course yet.</p>`}
      </div>

      <div class="widget adv-widget">
        <div class="widget-header"><span>Weakest practice scores</span></div>
        ${weakest.length ? weakest.map(w => `
          <div class="adv-score-row">
            <span class="adv-score-title">${esc(w.title)}<span class="adv-score-course">${esc(w.course)}</span></span>
            <span class="analytics-score-pill ${w.score >= 80 ? "good" : w.score >= 60 ? "mid" : "low"}">${w.score}%</span>
          </div>
        `).join("") : `<p class="adv-empty-copy">No practice quizzes taken yet.</p>`}

        ${attempts.length ? `
          <div class="adv-sub-label">Recent practice exams</div>
          ${attempts.map(a => `
            <div class="adv-score-row">
              <span class="adv-score-title">${esc(a.courseTitle || "Practice exam")}<span class="adv-score-course">${new Date(a.date).toLocaleDateString()}</span></span>
              <span class="analytics-score-pill ${a.pct >= 80 ? "good" : a.pct >= 60 ? "mid" : "low"}">${a.pct}%</span>
            </div>
          `).join("")}
        ` : ""}
      </div>
    </div>

    <div class="widget adv-widget">
      <div class="widget-header">
        <span>Assignments</span>
        <button class="admin-btn-sm" onclick="advNewAssignmentFor('${esc(m.id)}')">${ai("plus")} Assign work</button>
      </div>
      ${theirAssignments.length ? theirAssignments.map(a => {
        const pct = assignmentPctFor(a, m);
        const late = a.dueDate && a.dueDate < today() && pct < 100;
        return `
          <div class="adv-assign-line">
            <div class="adv-assign-line-head">
              <span>${esc(a.title)}</span>
              <span class="${late ? "adv-late" : ""}">${pct}%${a.dueDate ? ` · due ${esc(dateLabel(a.dueDate))}` : ""}</span>
            </div>
            <div class="pasture-bar-outer"><div class="pasture-bar-inner" style="width:${pct}%;background:${late ? "#dc2626" : pct === 100 ? "#059669" : "#167db5"};"></div></div>
          </div>`;
      }).join("") : `<p class="adv-empty-copy">Nothing assigned to this member yet.</p>`}
    </div>

    <div class="widget adv-widget">
      <div class="widget-header"><span>Everything they've finished</span><span class="widget-badge">${done.length}</span></div>
      ${done.length ? `
        <div class="adv-done-list">
          ${done.map(id => {
            const course = ADV.courses.find(c => (c.lessons || []).some(l => l.id === id));
            const lesson = course?.lessons.find(l => l.id === id);
            if (!lesson) return "";
            const kind = lesson.type === "quiz" ? "quiz" : lesson.type === "article" ? "file" : "play";
            return `
              <div class="adv-done-row">
                ${ai(kind)}
                <span>${esc(stripUnitSuffix(lesson.title))}</span>
                <span class="adv-done-course">${esc(course.title)}</span>
              </div>`;
          }).join("")}
        </div>
      ` : `<p class="adv-empty-copy">Nothing completed yet.</p>`}
    </div>

    <div class="widget adv-widget">
      <div class="widget-header"><span>Remove from chapter</span></div>
      <p class="adv-empty-copy">
        This only unlinks them from ${esc(ADV.partner.name)} — their account, XP, and progress stay exactly as they are.
        They can rejoin any time with the access code.
      </p>
      <button class="admin-btn-sm danger" onclick="advRemoveMember('${esc(m.id)}')">${ai("trash")} Unlink ${esc(firstName(m))}</button>
    </div>
  `;
}

window.advRemoveMember = async function (id) {
  const m = ADV.members.find(x => x.id === id);
  if (!m) return;
  if (!confirm(`Unlink ${m.displayName || "this member"} from ${ADV.partner.name}? Their progress is untouched.`)) return;
  try {
    await updateDoc(doc(db, "users", id), { partnerId: "" });
    ADV.members = ADV.members.filter(x => x.id !== id);
    ADV.memberId = null;
    renderAdvisor();
  } catch (e) {
    console.error("Couldn't unlink member:", e);
    alert("Couldn't unlink that member. Firestore rules need to let an advisor write partnerId on their chapter's members — see the notes at the top of advisor.js.");
  }
};

/* ========================= RENDER: ASSIGNMENTS ========================= */

window.advNewAssignmentFor = function (memberId) {
  ADV.tab = "assignments";
  ADV.memberId = null;
  ADV.editingId = null;
  ADV.prefillMember = memberId;
  renderAdvisor();
  document.getElementById("advAssignForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
};

function renderAssignmentsTab() {
  const body = document.getElementById("advBody");
  if (!body) return;

  const editing = ADV.editingId ? ADV.assignments.find(a => a.id === ADV.editingId) : null;
  const courseId = ADV.formCourseId || editing?.courseId || ADV.courses[0]?.id || "";
  ADV.formCourseId = courseId;

  const preselected = editing
    ? (editing.allMembers ? [] : (editing.memberIds || []))
    : (ADV.prefillMember ? [ADV.prefillMember] : []);
  const allMembers = editing ? !!editing.allMembers : !ADV.prefillMember;

  body.innerHTML = `
    <div class="adv-assign-layout">
      <div class="widget adv-widget" id="advAssignForm">
        <div class="widget-header"><span>${editing ? "Edit assignment" : "Assign work"}</span></div>

        <div class="form-group">
          <label>What are they doing</label>
          <input type="text" id="advTitle" placeholder="e.g. Finish Units 1-3 before Friday's meeting"
                 value="${editing ? esc(editing.title) : ""}">
        </div>

        <div class="form-group">
          <label>Course</label>
          <select id="advCourse" onchange="advCourseChanged(this.value)">
            ${ADV.courses.map(c => `<option value="${esc(c.id)}" ${c.id === courseId ? "selected" : ""}>${esc(c.title)}</option>`).join("")
              || `<option value="">No courses available</option>`}
          </select>
        </div>

        <div class="form-group">
          <label>Units</label>
          <div class="adv-unit-picker" id="advUnitPicker">${unitPickerHtml(courseId, editing?.unitKeys || [])}</div>
        </div>

        <div class="form-group">
          <label>Due date</label>
          <input type="date" id="advDue" value="${editing ? esc(editing.dueDate || "") : ""}">
        </div>

        <div class="form-group">
          <label>Note for your members</label>
          <textarea id="advNote" rows="2" class="adv-textarea" placeholder="Optional — shows under the assignment on their dashboard">${editing ? esc(editing.note || "") : ""}</textarea>
        </div>

        <div class="form-group">
          <label>Who gets it</label>
          <div class="adv-who">
            <label class="adv-radio">
              <input type="radio" name="advWho" value="all" ${allMembers ? "checked" : ""} onchange="advWhoChanged('all')">
              <span>Everyone in ${esc(ADV.partner.name)}</span>
            </label>
            <label class="adv-radio">
              <input type="radio" name="advWho" value="some" ${allMembers ? "" : "checked"} onchange="advWhoChanged('some')">
              <span>Specific members</span>
            </label>
          </div>
          <div class="adv-member-picker ${allMembers ? "hidden" : ""}" id="advMemberPicker">
            ${ADV.members.length ? ADV.members.map(m => `
              <label class="adv-check">
                <input type="checkbox" class="adv-member-cb" value="${esc(m.id)}" ${preselected.includes(m.id) ? "checked" : ""}>
                <span>${esc(m.displayName || "DECA Student")}</span>
              </label>
            `).join("") : `<p class="adv-empty-copy">No members yet.</p>`}
          </div>
        </div>

        <div class="adv-form-btns">
          <button class="btn-primary" onclick="advSaveAssignment()">${editing ? "Save changes" : "Assign it"}</button>
          ${editing ? `<button class="admin-btn-sm ghost" onclick="advCancelEdit()">Cancel</button>` : ""}
        </div>
      </div>

      <div>
        ${ADV.assignments.length ? ADV.assignments.map(assignmentCardHtml).join("") : `
          <div class="widget adv-widget">
            <div class="widget-header"><span>No assignments yet</span></div>
            <p class="adv-empty-copy">
              Pick a course and some units on the left. Every member you assign it to sees it at the top of
              their dashboard, and this page fills in as they finish the work.
            </p>
          </div>
        `}
      </div>
    </div>
  `;

  ADV.prefillMember = null;
}

function unitPickerHtml(courseId, checkedKeys) {
  const course = ADV.courses.find(c => c.id === courseId);
  if (!course) return `<p class="adv-empty-copy">Pick a course first.</p>`;
  const units = buildUnits(course);
  if (!units.length) return `<p class="adv-empty-copy">This course has no units yet.</p>`;

  return `
    <div class="adv-unit-actions">
      <button class="adv-mini-btn" onclick="advToggleAllUnits(true)">Select all</button>
      <button class="adv-mini-btn" onclick="advToggleAllUnits(false)">Clear</button>
    </div>
    ${units.map(u => `
      <label class="adv-check">
        <input type="checkbox" class="adv-unit-cb" value="${esc(u.key)}" ${checkedKeys.includes(u.key) ? "checked" : ""}>
        <span>${esc(u.title)}</span>
        <span class="adv-unit-parts">
          ${u.video ? ai("play") : ""}${u.quiz ? ai("quiz") : ""}${u.article ? ai("file") : ""}
        </span>
      </label>
    `).join("")}
  `;
}

window.advCourseChanged = function (courseId) {
  ADV.formCourseId = courseId;
  const picker = document.getElementById("advUnitPicker");
  if (picker) picker.innerHTML = unitPickerHtml(courseId, []);
};

window.advToggleAllUnits = function (on) {
  document.querySelectorAll(".adv-unit-cb").forEach(cb => { cb.checked = on; });
};

window.advWhoChanged = function (mode) {
  document.getElementById("advMemberPicker")?.classList.toggle("hidden", mode === "all");
};

window.advCancelEdit = function () {
  ADV.editingId = null;
  ADV.formCourseId = "";
  renderAssignmentsTab();
};

function assignmentCardHtml(a) {
  const s = assignmentSummary(a);
  const behind = s.people.filter(m => assignmentPctFor(a, m) < 100);

  return `
    <div class="widget adv-widget adv-assign-card ${s.overdue ? "late" : ""}">
      <div class="adv-assign-card-head">
        <div>
          <div class="adv-assign-title">${esc(a.title)}</div>
          <div class="adv-assign-meta">
            ${esc(a.courseTitle || "")} · ${(a.unitKeys || []).length} ${(a.unitKeys || []).length === 1 ? "unit" : "units"}
            ${a.dueDate ? ` · ${s.overdue ? "was due" : "due"} ${esc(dateLabel(a.dueDate))}` : " · no due date"}
          </div>
        </div>
        <div class="adv-assign-actions">
          <button class="admin-btn-sm ghost" onclick="advEditAssignment('${esc(a.id)}')">Edit</button>
          <button class="admin-btn-sm danger" onclick="advDeleteAssignment('${esc(a.id)}')">${ai("trash")}</button>
        </div>
      </div>

      ${a.note ? `<p class="adv-assign-note">${esc(a.note)}</p>` : ""}

      <div class="adv-assign-progress">
        <span>${s.doneCount} of ${s.people.length} finished</span>
        <span>${s.avg}% average</span>
      </div>
      <div class="pasture-bar-outer"><div class="pasture-bar-inner" style="width:${s.avg}%;background:${s.overdue ? "#dc2626" : "#167db5"};"></div></div>

      ${behind.length ? `
        <div class="adv-sub-label">Still working on it</div>
        <div class="adv-behind">
          ${behind.slice(0, 12).map(m => `
            <button class="adv-behind-chip" onclick="advOpenMember('${esc(m.id)}')">
              ${esc(firstName(m))}<span>${assignmentPctFor(a, m)}%</span>
            </button>
          `).join("")}
          ${behind.length > 12 ? `<span class="adv-behind-more">+${behind.length - 12} more</span>` : ""}
        </div>
      ` : `<div class="adv-all-done">${ai("check")} Everyone finished this one.</div>`}
    </div>
  `;
}

window.advEditAssignment = function (id) {
  ADV.editingId = id;
  ADV.formCourseId = ADV.assignments.find(a => a.id === id)?.courseId || "";
  renderAssignmentsTab();
  document.getElementById("advAssignForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.advSaveAssignment = async function () {
  const title = document.getElementById("advTitle").value.trim();
  const courseId = document.getElementById("advCourse").value;
  const dueDate = document.getElementById("advDue").value;
  const note = document.getElementById("advNote").value.trim();
  const unitKeys = [...document.querySelectorAll(".adv-unit-cb:checked")].map(cb => cb.value);
  const allMembers = document.querySelector('input[name="advWho"]:checked')?.value === "all";
  const memberIds = allMembers ? [] : [...document.querySelectorAll(".adv-member-cb:checked")].map(cb => cb.value);

  if (!title) return alert("Give the assignment a title so your members know what it's for.");
  if (!courseId) return alert("Pick a course.");
  if (!unitKeys.length) return alert("Pick at least one unit.");
  if (!allMembers && !memberIds.length) return alert("Pick who this is for, or switch it to everyone.");
  if (dueDate && dueDate < today() && !confirm("That due date has already passed. Assign it anyway?")) return;

  const course = ADV.courses.find(c => c.id === courseId);
  const units = course ? buildUnits(course) : [];
  const lessonIds = [];
  unitKeys.forEach(k => {
    const u = units.find(x => x.key === k);
    if (u) u.lessons.forEach(l => lessonIds.push(l.id));
  });

  const existing = ADV.editingId ? ADV.assignments.find(a => a.id === ADV.editingId) : null;
  const id = ADV.editingId || `assign-${Date.now()}`;
  const record = {
    id,
    partnerId: ADV.partner.id,
    courseId,
    courseTitle: course?.title || "",
    unitKeys,
    lessonIds,
    title,
    note,
    dueDate: dueDate || "",
    allMembers,
    memberIds,
    createdAt: existing?.createdAt || new Date().toISOString(),
    createdByEmail: ADV.user?.email || ""
  };

  try {
    await setDoc(doc(db, "assignments", id), record);
    const idx = ADV.assignments.findIndex(a => a.id === id);
    if (idx >= 0) ADV.assignments[idx] = record;
    else ADV.assignments.unshift(record);
    ADV.editingId = null;
    ADV.formCourseId = "";
    renderAssignmentsTab();
  } catch (e) {
    console.error("Couldn't save assignment:", e);
    alert("Couldn't save that assignment. The Firestore rules need to allow writes to the \"assignments\" collection.");
  }
};

window.advDeleteAssignment = async function (id) {
  if (!confirm("Delete this assignment? Your members' progress is unaffected — it just stops showing on their dashboard.")) return;
  try {
    await deleteDoc(doc(db, "assignments", id));
    ADV.assignments = ADV.assignments.filter(a => a.id !== id);
    if (ADV.editingId === id) ADV.editingId = null;
    renderAssignmentsTab();
  } catch (e) {
    console.error("Couldn't delete assignment:", e);
    alert("Couldn't delete that — check the console.");
  }
};

/* ========================= RENDER: SETTINGS ========================= */

function renderSettingsTab() {
  const body = document.getElementById("advBody");
  if (!body) return;
  const p = ADV.partner;

  body.innerHTML = `
    <div class="adv-two-col">
      <div class="widget adv-widget">
        <div class="widget-header"><span>Your access code</span></div>
        <p class="adv-empty-copy">
          Members enter this once under Profile &rarr; Partnership. After that they appear here and see
          anything you assign.
        </p>
        <div class="adv-code-box">
          <span class="adv-code">${esc(p.accessCode || "—")}</span>
          <button class="admin-btn-sm ghost" onclick="advCopyCode()">${ai("copy")} Copy</button>
        </div>
        <div class="adv-code-actions">
          <button class="admin-btn-sm ghost" onclick="advRegenerateCode()">${ai("key")} Generate a new code</button>
        </div>
        <p class="adv-empty-copy adv-fine">
          Generating a new code doesn't remove anyone who already joined — it only stops the old code working.
        </p>
      </div>

      <div class="widget adv-widget">
        <div class="widget-header"><span>Who can manage this chapter</span></div>
        ${(p.advisorEmails || []).length ? `
          <div class="adv-advisor-list">
            ${(p.advisorEmails || []).map(e => `
              <div class="adv-advisor-row">
                ${ai("users")}<span>${esc(e)}</span>
                ${String(e).toLowerCase() === String(ADV.user.email || "").toLowerCase() ? `<span class="adv-chip solid">You</span>` : ""}
              </div>
            `).join("")}
          </div>
        ` : `<p class="adv-empty-copy">No advisor emails on file.</p>`}
        <p class="adv-empty-copy adv-fine">
          To add or remove an advisor, email farm4glass@gmail.com — advisor access is set on the Farm4Glass side
          so nobody can add themselves to a chapter.
        </p>
      </div>
    </div>

    <div class="widget adv-widget">
      <div class="widget-header"><span>Export your roster</span></div>
      <p class="adv-empty-copy">
        A spreadsheet of every member, their events, XP, lessons finished, streak, and last active date — useful for
        attendance, officer reports, or awards night.
      </p>
      <button class="admin-btn-sm" onclick="advExportCsv()">${ai("download")} Download CSV</button>
    </div>
  `;
}

window.advCopyCode = async function () {
  try {
    await navigator.clipboard.writeText(ADV.partner.accessCode || "");
    if (window.f4gNotice) window.f4gNotice("Code copied", "Paste it into your chapter group chat.");
  } catch {
    alert(`Your access code is ${ADV.partner.accessCode}`);
  }
};

window.advRegenerateCode = async function () {
  const suggestion = (String(ADV.partner.name || "CHAPTER").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8) || "CHAPTER")
    + new Date().getFullYear();
  const next = prompt("New access code (letters and numbers):", suggestion);
  if (!next) return;
  const code = next.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,24}$/.test(code)) return alert("Use 4-24 letters and numbers, no spaces or symbols.");

  try {
    await updateDoc(doc(db, "partners", ADV.partner.id), { accessCode: code });
    ADV.partner.accessCode = code;
    renderSettingsTab();
    if (window.f4gNotice) window.f4gNotice("New code active", "The old one no longer works.");
  } catch (e) {
    console.error("Couldn't change the access code:", e);
    alert("Couldn't change the code. Firestore rules need to allow an advisor to update their own partner document.");
  }
};

window.advExportCsv = function () {
  const rows = [[
    "Name", "Email", "Chapter", "Association", "Roleplay event", "Written event",
    "Cluster exam", "XP", "Lessons completed", "Quizzes completed", "Current streak",
    "Best streak", "Badges", "Assignments finished", "Assignments given", "Last active"
  ]];

  ADV.members.forEach(m => {
    const score = memberAssignmentScore(m);
    rows.push([
      m.displayName || "", m.email || "", m.chapter || "", m.association || "",
      m.roleplayEvent || "", m.writtenEvent || "", m.clusterExam || "",
      m.xp || 0, (m.completedLessons || []).length, m.completedQuizzes || 0,
      m.streak || 0, m.bestStreak || 0, (m.earnedBadges || []).length,
      score ? score.done : 0, score ? score.total : 0, m.lastActiveDate || ""
    ]);
  });

  const csv = rows.map(r => r.map(cell => {
    const v = String(cell ?? "");
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(ADV.partner.name || "chapter").replace(/[^A-Za-z0-9]+/g, "-")}-roster-${today()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/* =========================================================================
   STUDENT SIDE — "Assigned to you" on the dashboard
   -------------------------------------------------------------------------
   Renders into #studentAssignments. Reads the signed-in student's own
   document plus their chapter's assignments, and links each unit straight
   into the unit view via the openUnit() script.js already exposes.
   ========================================================================= */

let studentCourses = null;

async function renderStudentAssignments() {
  const box = document.getElementById("studentAssignments");
  const user = auth.currentUser;
  if (!box || !user) return;

  try {
    const meSnap = await getDoc(doc(db, "users", user.uid));
    const me = meSnap.exists() ? meSnap.data() : null;
    if (!me?.partnerId) { box.innerHTML = ""; return; }

    const assignSnap = await getDocs(query(collection(db, "assignments"), where("partnerId", "==", me.partnerId)));
    let mine = assignSnap.docs.map(d => d.data())
      .filter(a => a.allMembers || (a.memberIds || []).includes(user.uid));

    if (!mine.length) { box.innerHTML = ""; return; }

    if (!studentCourses) {
      const cs = await getDocs(collection(db, "courses"));
      studentCourses = cs.docs.map(d => d.data());
    }

    const done = me.completedLessons || [];

    // Due soonest first; anything finished drops to the bottom.
    const scored = mine.map(a => {
      const course = studentCourses.find(c => c.id === a.courseId);
      const units = course ? buildUnits(course) : [];
      const chosen = (a.unitKeys || []).map(k => units.find(u => u.key === k)).filter(Boolean);
      const ids = chosen.flatMap(u => u.lessons.map(l => l.id));
      const finished = ids.filter(id => done.includes(id)).length;
      const pct = ids.length ? Math.round((finished / ids.length) * 100) : 0;
      return { a, course, units: chosen, pct, late: !!a.dueDate && a.dueDate < today() && pct < 100 };
    }).sort((x, y) => (x.pct === 100 ? 1 : 0) - (y.pct === 100 ? 1 : 0)
      || String(x.a.dueDate || "9999").localeCompare(String(y.a.dueDate || "9999")));

    box.innerHTML = `
      <div class="widget sa-assign-widget">
        <div class="widget-header">
          <span>Assigned to you</span>
          <span class="widget-badge">${scored.filter(s => s.pct < 100).length} open</span>
        </div>
        ${scored.map(s => `
          <div class="sa-assign ${s.pct === 100 ? "done" : ""} ${s.late ? "late" : ""}">
            <div class="sa-assign-head">
              <span class="sa-assign-title">${esc(s.a.title)}</span>
              <span class="sa-assign-due">
                ${s.pct === 100 ? "Finished" : s.a.dueDate ? `${s.late ? "Was due" : "Due"} ${esc(dateLabel(s.a.dueDate))}` : "No due date"}
              </span>
            </div>
            ${s.a.note ? `<div class="sa-assign-note">${esc(s.a.note)}</div>` : ""}
            <div class="pasture-bar-outer"><div class="pasture-bar-inner" style="width:${s.pct}%;background:${s.pct === 100 ? "#059669" : s.late ? "#dc2626" : "#167db5"};"></div></div>
            <div class="sa-assign-units">
              ${s.units.map(u => {
                const finished = u.lessons.every(l => done.includes(l.id));
                return `
                  <button class="sa-unit-link ${finished ? "done" : ""}"
                          onclick="openUnit('${esc(s.a.courseId)}','${esc(u.key)}')">
                    ${finished ? ai("check") : ai("play")}${esc(u.title)}
                  </button>`;
              }).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  } catch (e) {
    console.error("Couldn't load your assignments:", e);
    box.innerHTML = "";
  }
}

/* ========================= WIRING ========================= */

// Rebuild the advisor panel whenever the tab is opened, without touching
// script.js. showTab is already on window, so we wrap it.
(function wrapShowTab() {
  const attach = () => {
    if (typeof window.showTab !== "function" || window.showTab.__f4gAdvisorWrapped) return false;
    const original = window.showTab;
    const wrapped = function (tabName) {
      original.apply(this, arguments);
      if (tabName === "advisor") renderAdvisor();
      if (tabName === "dashboard") renderStudentAssignments();
    };
    wrapped.__f4gAdvisorWrapped = true;
    window.showTab = wrapped;
    return true;
  };

  if (!attach()) {
    // script.js is a module too — if it hasn't run yet, try again shortly.
    let tries = 0;
    const timer = setInterval(() => {
      if (attach() || ++tries > 40) clearInterval(timer);
    }, 100);
  }
})();

onAuthStateChanged(auth, async (user) => {
  ADV.user = user;
  ADV.partner = null;
  ADV.members = [];
  ADV.assignments = [];
  ADV.loaded = false;
  ADV.memberId = null;
  studentCourses = null;

  if (!user) return;

  // The advisor nav button and the student's assignment widget both need
  // data, so load quietly in the background on sign-in.
  loadAdvisorData(true);
  renderStudentAssignments();
});
