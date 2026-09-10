/* =========================================================================
   FARM4GLASS — GUEST SPEAKER VIDEOS
   -------------------------------------------------------------------------
   Two things live in this file:

     1. The student-facing "Guest Speaker Videos" tab.
     2. A "Guest Speakers" subtab inside the Admin panel, where you add each
        talk: the video link plus a link to the key-takeaways doc that goes
        with it.

   script.js still needs no edits. This module loads after it, reuses the
   Firebase app it set up, and wraps two of its functions — showTab and
   adminSwitchSubTab — so the new tab and the new admin subtab render
   themselves. The admin subtab button is injected into the existing subtab
   bar after script.js draws it, and a MutationObserver puts it back if the
   panel re-renders.

   Speakers live in the Firestore "guestSpeakers" collection, so adding one
   never needs a commit or a push.

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
  projectId: "farm4glass-142b7",
  storageBucket: "farm4glass-142b7.firebasestorage.app",
  messagingSenderId: "1080688954531",
  appId: "1:1080688954531:web:334be5bdfae4d338e74316",
  measurementId: "G-27SR58HRSZ"
};

const ADMIN_EMAILS = ["farm4glass@gmail.com"];

// Reuse the app script.js created rather than starting a second one.
const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------- state ---------- */

let gsUser = null;
let speakers = [];
let speakersLoaded = false;
let gsArea = "All areas";
let gsSelectedId = null;
let gsEditingId = null;
let gsAdminSubTabActive = false;
let gsObserverStarted = false;

function gsIsAdmin() {
  return !!gsUser && ADMIN_EMAILS.includes(gsUser.email);
}

/* ---------- small helpers (kept local so script.js stays untouched) ---------- */

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
  // script.js exposes no icon helper on window, so the handful this file
  // needs are inlined here in the same 24x24 / 1.8 stroke language.
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

// What actually goes in the <iframe>. Empty means we can't embed it and the
// card falls back to an "open in a new tab" link.
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

// The takeaways doc always opens in its own tab — a Google Doc is far easier
// to read full-width than squeezed into a card.
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
  } catch (e) {
    console.error("Failed to load guest speakers:", e);
    speakers = [];
  }
  gsSort();
  speakersLoaded = true;

  if (document.getElementById("speakers")?.classList.contains("active")) renderGuestSpeakers();
  if (gsAdminSubTabActive) renderGuestSpeakerAdmin();
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
   -------------------------------------------------------------------------
   script.js's renderAdminPanel() builds the subtab bar from a fixed list and
   falls through to the Courses editor for any tab it doesn't recognize. So
   asking it to switch to "speakers" is harmless — it renders Courses, and we
   then replace the body with ours. No edit to script.js required.
   ========================================================================= */

function gsInjectAdminSubtab() {
  if (!gsIsAdmin()) return;

  const bar = document.querySelector("#adminContent .admin-subtabs");
  if (!bar) return;

  let btn = bar.querySelector("#gsAdminSubtabBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "gsAdminSubtabBtn";
    btn.className = "admin-subtab-btn";
    btn.textContent = "Guest Speakers";
    btn.addEventListener("click", () => window.adminSwitchSubTab("speakers"));
    bar.appendChild(btn);
  }

  btn.classList.toggle("active", gsAdminSubTabActive);

  if (gsAdminSubTabActive) {
    // script.js just marked one of its own buttons active; unmark it.
    bar.querySelectorAll(".admin-subtab-btn").forEach(b => {
      if (b !== btn) b.classList.remove("active");
    });
    renderGuestSpeakerAdmin();
  }
}

// The admin panel re-renders itself after all sorts of saves, which wipes the
// injected button. Put it straight back rather than making script.js aware of
// it. Idempotent: it only acts when the button has actually gone missing.
function gsStartAdminObserver() {
  if (gsObserverStarted) return;
  const root = document.getElementById("adminContent");
  if (!root) return;
  gsObserverStarted = true;

  new MutationObserver(() => {
    const bar = document.querySelector("#adminContent .admin-subtabs");
    if (bar && !bar.querySelector("#gsAdminSubtabBtn")) gsInjectAdminSubtab();
  }).observe(root, { childList: true, subtree: true });
}

function renderGuestSpeakerAdmin() {
  const body = document.getElementById("adminSubtabBody");
  if (!body || !gsIsAdmin()) return;

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
}

window.gsEdit = function (id) {
  gsEditingId = id;
  renderGuestSpeakerAdmin();
  document.getElementById("adminSubtabBody")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.gsCancelEdit = function () {
  gsEditingId = null;
  renderGuestSpeakerAdmin();
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
    renderGuestSpeakerAdmin();
    if (document.getElementById("speakers")) renderGuestSpeakers();
    window.f4gNotice?.(
      editing ? "Talk updated" : "Talk published",
      `${name} is live on the Guest Speaker Videos tab.`
    );
  } catch (e) {
    console.error("Couldn't save that speaker:", e);
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
    renderGuestSpeakerAdmin();
    if (document.getElementById("speakers")) renderGuestSpeakers();
  } catch (e) {
    console.error("Couldn't delete that speaker:", e);
    alert("Couldn't remove that — check the console.");
  }
};

/* =========================================================================
   WIRING
   Both wrappers below run after script.js has defined the originals, because
   this script tag comes after it. Same trick advisor.js uses.
   ========================================================================= */

const gsPrevShowTab = window.showTab;
window.showTab = function (tabName) {
  if (typeof gsPrevShowTab === "function") gsPrevShowTab(tabName);
  if (tabName === "speakers") renderGuestSpeakers();
  if (tabName === "admin") {
    gsStartAdminObserver();
    gsInjectAdminSubtab();
  }
};

const gsPrevSwitchSubTab = window.adminSwitchSubTab;
window.adminSwitchSubTab = function (tab) {
  gsAdminSubTabActive = tab === "speakers";
  if (!gsAdminSubTabActive) gsEditingId = null;
  if (typeof gsPrevSwitchSubTab === "function") gsPrevSwitchSubTab(tab);
  gsInjectAdminSubtab();
};

onAuthStateChanged(auth, (user) => {
  gsUser = user || null;
  if (!user) {
    speakers = [];
    speakersLoaded = false;
    gsAdminSubTabActive = false;
    return;
  }
  loadGuestSpeakers();
});
