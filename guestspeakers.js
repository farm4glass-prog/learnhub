/* =========================================================================
   FARM4GLASS — GUEST SPEAKER VIDEOS          build 4
   -------------------------------------------------------------------------
   Two mounts:

     1. The student-facing "Guest Speaker Videos" tab (#guestSpeakersContent).
     2. The admin editor, rendered into #adminSubtabBody by script.js when the
        "Guest Speakers" subtab is clicked.

   Mount 2 is now a REAL subtab: script.js draws the button alongside Courses,
   KPI Database and the rest, and calls window.renderGuestSpeakerAdmin() to
   fill the body. That needs two small edits in script.js — see the comment
   block at the bottom of this file for exactly what they are.

   If the admin subtab shows "the guest speaker editor didn't load", this file
   isn't being fetched. Check it's named exactly guest-speakers.js and sits
   next to index.html.

   Console diagnostics all start with "[guest-speakers]".

   Speakers live in the Firestore "guestSpeakers" collection.

   Doc shape:
     {
       id, name, role, area,
       videoUrl,            // YouTube or Google Drive
       notesUrl,            // key takeaways doc (Google Doc, PDF, anything)
       notesLabel,          // button text, defaults to "Key takeaways"
       recordedOn,          // free text, e.g. "March 2026"
       order,               // lower numbers sort first; blank sorts last
       description, addedAt
     }
   ========================================================================= */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import {
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbx0tdGbQBeUmWnTMHdipSLPrp6zo6n6c",
  authDomain: "farm4glass-142b7.firebaseapp.com",
  storageBucket: "farm4glass-142b7.firebasestorage.app",
  projectId: "farm4glass-142b7",
  messagingSenderId: "1080688954531",
  appId: "1:1080688954531:web:334be5bdfae4d338e74316",
  measurementId: "G-27SR58HRSZ"
};

const ADMIN_EMAILS = ["farm4glass@gmail.com"];
const GS_BUILD = 4;

const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const gsLog = (...args) => console.log("[guest-speakers]", ...args);
gsLog(`module loaded (build ${GS_BUILD})`);

/* ---------- state ---------- */

let gsUser = null;
let speakers = [];
let speakersLoaded = false;
let gsArea = "All areas";
let gsSelectedId = null;
let gsEditingId = null;

function gsIsAdmin() {
  return !!gsUser && ADMIN_EMAILS.includes(gsUser.email);
}

/* ---------- small helpers (kept local so script.js stays lean) ---------- */

function gsEsc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function gsSafeUrl(u) {
  const raw = String(u || "").trim();
  return /^https?:\/\//i.test(raw) ? raw : "";
}

function gsIcon(name) {
  const paths = {
    play: '<circle cx="12" cy="12" r="9"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    file: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>'
  };
  if (!paths[name]) return "";
  return `<span class="icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg></span>`;
}

/* ---------- video + doc links ---------- */

function gsYoutubeId(url) {
  const raw = String(url || "");
  if (raw.includes("v=")) return raw.split("v=")[1].split("&")[0];
  if (raw.includes("youtu.be/")) return raw.split("youtu.be/")[1].split("?")[0];
  if (raw.includes("/embed/")) return raw.split("/embed/")[1].split("?")[0];
  if (raw.includes("/shorts/")) return raw.split("/shorts/")[1].split("?")[0];
  return "";
}

function gsDriveId(url) {
  const raw = String(url || "");
  const m = raw.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/) || raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : "";
}

function gsEmbedUrl(url) {
  const yt = gsYoutubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}`;
  const drive = gsDriveId(url);
  if (drive) return `https://drive.google.com/file/d/${drive}/preview`;
  return "";
}

function gsThumbUrl(url) {
  const yt = gsYoutubeId(url);
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : "";
}

function gsNotesLabel(s) {
  return String(s.notesLabel || "").trim() || "Key takeaways";
}

/* ---------- loading ---------- */

function gsSort() {
  speakers.sort((a, b) => {
    const oa = a.order == null || a.order === "" ? 9999 : Number(a.order);
    const ob = b.order == null || b.order === "" ? 9999 : Number(b.order);
    return oa - ob || String(a.name || "").localeCompare(String(b.name || ""));
  });
}

async function loadGuestSpeakers() {
  try {
    const snap = await getDocs(collection(db, "guestSpeakers"));
    speakers = snap.docs.map(d => d.data());
    gsLog(`loaded ${speakers.length} speaker(s)`);
  } catch (e) {
    console.error("[guest-speakers] Firestore read failed — check your rules for the \"guestSpeakers\" collection:", e);
    speakers = [];
  }
  gsSort();
  speakersLoaded = true;

  if (document.getElementById("speakers")?.classList.contains("active")) renderGuestSpeakers();
  // If the admin editor is already on screen when the read lands, refresh it.
  if (document.getElementById("gsAdminMarker")) window.renderGuestSpeakerAdmin();
}

/* =========================================================================
   STUDENT TAB
   ========================================================================= */

function gsAreas() {
  const found = [...new Set(speakers.map(s => String(s.area || "").trim()).filter(Boolean))].sort();
  return ["All areas", ...found];
}

window.gsFilterArea = function (area) {
  gsArea = area;
  gsSelectedId = null;
  renderGuestSpeakers();
};

window.gsPlay = function (id) {
  gsSelectedId = gsSelectedId === id ? null : id;
  renderGuestSpeakers();
  if (gsSelectedId) {
    document.getElementById(`gs-card-${CSS.escape(gsSelectedId)}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

function renderGuestSpeakers() {
  const container = document.getElementById("guestSpeakersContent");
  if (!container) return;

  if (!speakersLoaded) {
    container.innerHTML = `<div class="admin-empty-state">Loading talks...</div>`;
    return;
  }

  const areas = gsAreas();
  if (!areas.includes(gsArea)) gsArea = "All areas";
  const list = speakers.filter(s => gsArea === "All areas" || String(s.area || "").trim() === gsArea);

  const filtersHtml = areas.length > 1
    ? `<div class="category-filters">${areas.map(a => `
        <button class="cat-btn ${a === gsArea ? "active" : ""}" onclick="gsFilterArea('${gsEsc(a).replace(/'/g, "\\'")}')">${gsEsc(a)}</button>
      `).join("")}</div>`
    : "";

  const cardsHtml = list.map(gsCardHtml).join("") || `
    <div class="admin-empty-state">
      ${gsIsAdmin()
        ? "No talks yet. Add the first one under Admin &gt; Guest Speakers."
        : "No talks in this area yet — check back soon."}
    </div>`;

  container.innerHTML = `${filtersHtml}<div class="gs-grid">${cardsHtml}</div>`;
}

function gsCardHtml(s) {
  const open = gsSelectedId === s.id;
  const embed = gsEmbedUrl(s.videoUrl);
  const thumb = gsThumbUrl(s.videoUrl);
  const videoLink = gsSafeUrl(s.videoUrl);
  const notesLink = gsSafeUrl(s.notesUrl);

  const mediaHtml = open && embed
    ? `<div class="gs-player"><iframe src="${gsEsc(embed)}" title="${gsEsc(s.name)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`
    : embed
      ? `<button class="gs-thumb ${thumb ? "" : "gs-thumb-blank"}" onclick="gsPlay('${gsEsc(s.id)}')"
                ${thumb ? `style="background-image:url('${gsEsc(thumb)}')"` : ""}
                aria-label="Play ${gsEsc(s.name)}'s talk">
           <span class="gs-thumb-play">${gsIcon("play")}</span>
         </button>`
      : `<div class="gs-thumb gs-thumb-blank gs-thumb-static"><span class="gs-thumb-play">${gsIcon("users")}</span></div>`;

  return `
    <article class="gs-card ${open ? "gs-open" : ""}" id="gs-card-${gsEsc(s.id)}">
      ${mediaHtml}
      <div class="gs-card-body">
        <h3 class="gs-name">${gsEsc(s.name)}</h3>
        ${s.role ? `<div class="gs-role">${gsEsc(s.role)}</div>` : ""}
        <div class="gs-meta">
          ${s.area ? `<span class="gs-area-tag">${gsEsc(s.area)}</span>` : ""}
          ${s.recordedOn ? `<span class="gs-recorded">${gsEsc(s.recordedOn)}</span>` : ""}
        </div>
        ${s.description ? `<p class="gs-desc">${gsEsc(s.description)}</p>` : ""}
        <div class="gs-actions">
          ${embed ? `<button class="gs-play-btn" onclick="gsPlay('${gsEsc(s.id)}')">${gsIcon("play")} ${open ? "Close video" : "Watch the talk"}</button>` : ""}
          ${notesLink ? `<a class="gs-notes-link" href="${gsEsc(notesLink)}" target="_blank" rel="noopener">${gsIcon("file")} ${gsEsc(gsNotesLabel(s))}</a>` : ""}
          ${!embed && videoLink ? `<a class="gs-open-link" href="${gsEsc(videoLink)}" target="_blank" rel="noopener">${gsIcon("external")} Open the video</a>` : ""}
        </div>
      </div>
    </article>
  `;
}

/* =========================================================================
   ADMIN SUBTAB
   script.js calls this when the "Guest Speakers" subtab is selected. Same
   shape as renderAdminRoleplaysSection and friends: list on the left, form
   on the right.
   ========================================================================= */

window.renderGuestSpeakerAdmin = function () {
  const body = document.getElementById("adminSubtabBody");
  if (!body) return;

  if (!gsIsAdmin()) {
    body.innerHTML = `<div class="admin-empty-state">Admin accounts only.</div>`;
    return;
  }

  if (!speakersLoaded) {
    body.innerHTML = `<div class="admin-empty-state" id="gsAdminMarker">Loading speakers...</div>`;
    return;
  }

  const editing = gsEditingId ? speakers.find(s => s.id === gsEditingId) : null;

  const listHtml = speakers.map(s => {
    const embeds = !!gsEmbedUrl(s.videoUrl);
    const hasNotes = !!gsSafeUrl(s.notesUrl);
    return `
      <div class="admin-lesson-block">
        <div class="admin-lesson-head">
          <h4>${gsEsc(s.name)}</h4>
          <div style="display:flex;gap:8px;">
            <button class="admin-btn-sm ghost" onclick="gsEdit('${gsEsc(s.id)}')">Edit</button>
            <button class="admin-btn-sm danger" onclick="gsDelete('${gsEsc(s.id)}')">${gsIcon("trash")}</button>
          </div>
        </div>
        <div style="font-size:12px;color:var(--muted);">
          ${s.area ? gsEsc(s.area) + " · " : ""}${embeds ? "video plays inline" : "video opens in a new tab"} ·
          ${hasNotes ? gsEsc(gsNotesLabel(s)) + " attached" : "<strong>no takeaways doc</strong>"}
        </div>
      </div>`;
  }).join("") || `<div class="admin-empty-state">No talks yet.</div>`;

  const areaList = [...new Set(speakers.map(s => s.area).filter(Boolean))]
    .map(a => `<option value="${gsEsc(a)}"></option>`).join("");

  body.innerHTML = `
    <span id="gsAdminMarker" hidden></span>
    <datalist id="gsAreaList">${areaList}</datalist>
    <div class="admin-seed-banner">
      <div>
        Paste a YouTube or Google Drive link for the video, and the share link for the
        key-takeaways doc. Anything on Drive or Docs has to be shared as
        <strong>Anyone with the link — Viewer</strong>, or students hit a sign-in wall.
        A video link that isn't YouTube or Drive still saves — it just opens in a new tab
        instead of playing inside the card.
      </div>
    </div>
    <div class="admin-layout">
      <div class="admin-course-list">${listHtml}</div>
      <div class="admin-panel-body">
        <h3 style="margin-bottom:16px;">${editing ? "Edit talk" : "Add a talk"}</h3>
        <div class="admin-kpi-form">
          <input type="text" id="gs-name" placeholder="Speaker name" value="${editing ? gsEsc(editing.name) : ""}">
          <input type="text" id="gs-role" placeholder="Who they are (e.g. 2026 ICDC champion, Retail Merchandising Series)" value="${editing ? gsEsc(editing.role || "") : ""}">
          <input type="text" id="gs-area" list="gsAreaList" placeholder="Event area (e.g. Corporate Challenges, Principles Events)" value="${editing ? gsEsc(editing.area || "") : ""}">

          <label class="gs-field-label">Video link</label>
          <input type="url" id="gs-url" placeholder="https://youtube.com/watch?v=... or a Drive share link" value="${editing ? gsEsc(editing.videoUrl || "") : ""}">

          <label class="gs-field-label">Key takeaways doc</label>
          <input type="url" id="gs-notes" placeholder="https://docs.google.com/document/d/..." value="${editing ? gsEsc(editing.notesUrl || "") : ""}">
          <input type="text" id="gs-notes-label" placeholder="Button text (optional — defaults to &quot;Key takeaways&quot;)" value="${editing ? gsEsc(editing.notesLabel || "") : ""}">

          <label class="gs-field-label">Extras</label>
          <input type="text" id="gs-recorded" placeholder="When it was recorded (optional, e.g. March 2026)" value="${editing ? gsEsc(editing.recordedOn || "") : ""}">
          <input type="number" id="gs-order" placeholder="Sort position (optional — lower shows first)" value="${editing && editing.order != null && editing.order !== "" ? gsEsc(editing.order) : ""}">
          <textarea id="gs-desc" rows="3" placeholder="What the talk covers (optional)">${editing ? gsEsc(editing.description || "") : ""}</textarea>

          <div style="display:flex;gap:10px;">
            <button class="admin-btn-sm" onclick="gsSave()">${editing ? "Save changes" : "Publish talk"}</button>
            ${editing ? `<button class="admin-btn-sm ghost" onclick="gsCancelEdit()">Cancel</button>` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
};

window.gsEdit = function (id) {
  gsEditingId = id;
  window.renderGuestSpeakerAdmin();
  document.getElementById("adminSubtabBody")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.gsCancelEdit = function () {
  gsEditingId = null;
  window.renderGuestSpeakerAdmin();
};

window.gsSave = async function () {
  if (!gsIsAdmin()) return;

  const val = id => (document.getElementById(id)?.value || "").trim();

  const name = val("gs-name");
  const role = val("gs-role");
  const area = val("gs-area");
  const videoUrl = val("gs-url");
  const notesUrl = val("gs-notes");
  const notesLabel = val("gs-notes-label");
  const recordedOn = val("gs-recorded");
  const orderRaw = val("gs-order");
  const description = val("gs-desc");

  if (!name) return alert("Enter the speaker's name.");
  if (!videoUrl) return alert("Add the video link.");
  if (!gsSafeUrl(videoUrl)) return alert("The video link needs to start with https://");
  if (notesUrl && !gsSafeUrl(notesUrl)) return alert("The takeaways doc link needs to start with https://");

  if (!gsEmbedUrl(videoUrl) &&
      !confirm("That video link isn't YouTube or Google Drive, so it won't play inside the site — students get a button that opens it in a new tab instead. Save it anyway?")) return;

  const editing = gsEditingId ? speakers.find(s => s.id === gsEditingId) : null;
  const id = gsEditingId || `speaker-${Date.now()}`;
  const speakerDoc = {
    id, name, role, area, videoUrl, notesUrl, notesLabel,
    recordedOn, description,
    order: orderRaw === "" ? null : Number(orderRaw),
    addedAt: editing ? editing.addedAt : new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "guestSpeakers", id), speakerDoc);
    const idx = speakers.findIndex(s => s.id === id);
    if (idx >= 0) speakers[idx] = speakerDoc; else speakers.push(speakerDoc);
    gsSort();
    gsEditingId = null;
    window.renderGuestSpeakerAdmin();
    if (document.getElementById("guestSpeakersContent")) renderGuestSpeakers();
    window.f4gNotice?.(
      editing ? "Talk updated" : "Talk published",
      `${name} is live on the Guest Speaker Videos tab.`
    );
  } catch (e) {
    console.error("[guest-speakers] couldn't save:", e);
    alert("Couldn't save that — check the console. If it's a permissions error, add a rule for the \"guestSpeakers\" collection in Firestore.");
  }
};

window.gsDelete = async function (id) {
  if (!gsIsAdmin()) return;
  const s = speakers.find(x => x.id === id);
  if (!confirm(`Remove ${s ? s.name : "this talk"}? The video and the doc themselves aren't touched.`)) return;
  try {
    await deleteDoc(doc(db, "guestSpeakers", id));
    speakers = speakers.filter(x => x.id !== id);
    if (gsSelectedId === id) gsSelectedId = null;
    if (gsEditingId === id) gsEditingId = null;
    window.renderGuestSpeakerAdmin();
    if (document.getElementById("guestSpeakersContent")) renderGuestSpeakers();
  } catch (e) {
    console.error("[guest-speakers] couldn't delete:", e);
    alert("Couldn't remove that — check the console.");
  }
};

/* =========================================================================
   WIRING
   Only the student tab needs a showTab hook now; the admin side is driven by
   script.js calling renderGuestSpeakerAdmin() directly.
   ========================================================================= */

const gsPrevShowTab = window.showTab;
if (typeof gsPrevShowTab !== "function") {
  console.error("[guest-speakers] window.showTab wasn't defined when this file ran. It must load AFTER script.js — check the script tag order in index.html.");
}

window.showTab = function (tabName) {
  if (typeof gsPrevShowTab === "function") gsPrevShowTab(tabName);
  if (tabName === "speakers") renderGuestSpeakers();
};

onAuthStateChanged(auth, (user) => {
  gsUser = user || null;
  if (!user) {
    speakers = [];
    speakersLoaded = false;
    return;
  }
  gsLog(gsIsAdmin() ? `signed in as admin (${user.email})` : `signed in as ${user.email} — not an admin`);
  loadGuestSpeakers();
});

/* =========================================================================
   THE TWO EDITS THIS FILE NEEDS IN script.js
   -------------------------------------------------------------------------
   EDIT 1 — in renderAdminPanel(), inside the subtabsHtml template, add a
   button after the Rubrics one:

     <button class="admin-subtab-btn ${adminActiveSubTab === "speakers" ? "active" : ""}"
             onclick="adminSwitchSubTab('speakers')">Guest Speakers</button>

   EDIT 2 — in the same function, in the else-if chain that ends with
   "else renderAdminCoursesSection();", add one line just before that else:

     else if (adminActiveSubTab === "speakers") renderAdminGuestSpeakersSection();

   and define this small function anywhere in script.js:

     function renderAdminGuestSpeakersSection() {
       const body = document.getElementById("adminSubtabBody");
       if (!body) return;
       if (typeof window.renderGuestSpeakerAdmin === "function") {
         window.renderGuestSpeakerAdmin();
       } else {
         body.innerHTML = `<div class="admin-empty-state">The guest speaker
           editor didn't load. Check that guest-speakers.js is in the repo
           next to index.html, spelled exactly that way.</div>`;
       }
     }
   ========================================================================= */
