/* =========================================================================
   FARM4GLASS — GUEST SPEAKER VIDEOS
   -------------------------------------------------------------------------
   A self-contained tab. Nothing in script.js needs to change: this module
   loads AFTER it, reuses the Firebase app script.js already set up, and
   wraps window.showTab so the tab renders when it's opened.

   Speakers live in the Firestore "guestSpeakers" collection, so you add and
   edit them from inside the site — no commit, no push, no deploy. The admin
   controls sit at the top of the tab and are only rendered for accounts in
   ADMIN_EMAILS.

   Doc shape:
     {
       id, name, role, area, videoUrl, description,
       recordedOn,          // free text, e.g. "March 2026"
       order,               // lower numbers sort first; blank sorts last
       addedAt
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
let gsAdminOpen = false;

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
  // script.js exposes no icon helper on window, so the three this tab needs
  // are inlined here in the same 24x24 / 1.8 stroke language as the rest.
  const paths = {
    play: '<circle cx="12" cy="12" r="9"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  if (!paths[name]) return "";
  return `<span class="icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg></span>`;
}

/* ---------- video links ---------- */

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

/* ---------- loading ---------- */

async function loadGuestSpeakers() {
  try {
    const snap = await getDocs(collection(db, "guestSpeakers"));
    speakers = snap.docs.map(d => d.data());
  } catch (e) {
    console.error("Failed to load guest speakers:", e);
    speakers = [];
  }
  speakers.sort((a, b) => {
    const oa = Number.isFinite(Number(a.order)) && a.order !== "" ? Number(a.order) : 9999;
    const ob = Number.isFinite(Number(b.order)) && b.order !== "" ? Number(b.order) : 9999;
    return oa - ob || String(a.name || "").localeCompare(String(b.name || ""));
  });
  speakersLoaded = true;
  if (document.getElementById("speakers")?.classList.contains("active")) renderGuestSpeakers();
}

/* ---------- filters ---------- */

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

/* ---------- rendering ---------- */

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
      ${gsIsAdmin() ? "No talks yet. Add the first one from Manage speakers above." : "No talks in this area yet — check back soon."}
    </div>`;

  container.innerHTML = `
    ${gsAdmin()}
    ${filtersHtml}
    <div class="gs-grid">${cardsHtml}</div>
  `;
}

function gsCardHtml(s) {
  const open = gsSelectedId === s.id;
  const embed = gsEmbedUrl(s.videoUrl);
  const thumb = gsThumbUrl(s.videoUrl);
  const link = gsSafeUrl(s.videoUrl);

  const mediaHtml = open && embed
    ? `<div class="gs-player"><iframe src="${gsEsc(embed)}" title="${gsEsc(s.name)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`
    : `<button class="gs-thumb ${thumb ? "" : "gs-thumb-blank"}" onclick="gsPlay('${gsEsc(s.id)}')"
              ${thumb ? `style="background-image:url('${gsEsc(thumb)}')"` : ""}
              aria-label="Play ${gsEsc(s.name)}'s talk">
         <span class="gs-thumb-play">${gsIcon("play")}</span>
       </button>`;

  return `
    <article class="gs-card ${open ? "gs-open" : ""}" id="gs-card-${gsEsc(s.id)}">
      ${embed ? mediaHtml : `
        <div class="gs-thumb gs-thumb-blank gs-thumb-static"><span class="gs-thumb-play">${gsIcon("users")}</span></div>`}
      <div class="gs-card-body">
        <h3 class="gs-name">${gsEsc(s.name)}</h3>
        ${s.role ? `<div class="gs-role">${gsEsc(s.role)}</div>` : ""}
        <div class="gs-meta">
          ${s.area ? `<span class="gs-area-tag">${gsEsc(s.area)}</span>` : ""}
          ${s.recordedOn ? `<span class="gs-recorded">${gsEsc(s.recordedOn)}</span>` : ""}
        </div>
        ${s.description ? `<p class="gs-desc">${gsEsc(s.description)}</p>` : ""}
        <div class="gs-actions">
          ${embed
            ? `<button class="gs-play-btn" onclick="gsPlay('${gsEsc(s.id)}')">${gsIcon("play")} ${open ? "Close video" : "Watch the talk"}</button>`
            : ""}
          ${link ? `<a class="gs-open-link" href="${gsEsc(link)}" target="_blank" rel="noopener">${gsIcon("external")} Open in a new tab</a>` : ""}
          ${gsIsAdmin() ? `
            <button class="admin-btn-sm ghost" onclick="gsEdit('${gsEsc(s.id)}')">Edit</button>
            <button class="admin-btn-sm danger" onclick="gsDelete('${gsEsc(s.id)}')">${gsIcon("trash")}</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

/* ---------- admin ---------- */

function gsAdmin() {
  if (!gsIsAdmin()) return "";

  const editing = gsEditingId ? speakers.find(s => s.id === gsEditingId) : null;
  const openNow = gsAdminOpen || !!editing;

  if (!openNow) {
    return `
      <div class="gs-admin-bar">
        <span>${speakers.length} ${speakers.length === 1 ? "talk" : "talks"} published.</span>
        <button class="admin-btn-sm" onclick="gsToggleAdmin()">${gsIcon("plus")} Manage speakers</button>
      </div>`;
  }

  const areaList = [...new Set(speakers.map(s => s.area).filter(Boolean))]
    .map(a => `<option value="${gsEsc(a)}"></option>`).join("");

  return `
    <datalist id="gsAreaList">${areaList}</datalist>
    <div class="widget gs-admin-panel">
      <div class="widget-header">
        <span>${editing ? "Edit talk" : "Add a talk"}</span>
        <button class="admin-btn-sm ghost" onclick="gsToggleAdmin()">Close</button>
      </div>
      <div class="admin-seed-banner">
        <div>Paste a YouTube link or a Google Drive share link. Drive files need to be shared as <strong>Anyone with the link — Viewer</strong>, or students hit a sign-in wall instead of the video. Anything else still saves, it just opens in a new tab rather than playing here.</div>
      </div>
      <div class="admin-kpi-form">
        <input type="text" id="gs-name" placeholder="Speaker name" value="${editing ? gsEsc(editing.name) : ""}">
        <input type="text" id="gs-role" placeholder="Who they are (e.g. 2026 ICDC champion, Retail Merchandising Series)" value="${editing ? gsEsc(editing.role || "") : ""}">
        <input type="text" id="gs-area" list="gsAreaList" placeholder="Event area (e.g. Corporate Challenges, Principles Events)" value="${editing ? gsEsc(editing.area || "") : ""}">
        <input type="url" id="gs-url" placeholder="Video link (YouTube or Google Drive)" value="${editing ? gsEsc(editing.videoUrl || "") : ""}">
        <input type="text" id="gs-recorded" placeholder="When it was recorded (optional, e.g. March 2026)" value="${editing ? gsEsc(editing.recordedOn || "") : ""}">
        <input type="number" id="gs-order" placeholder="Sort position (optional — lower shows first)" value="${editing && editing.order !== "" && editing.order != null ? gsEsc(editing.order) : ""}">
        <textarea id="gs-desc" rows="3" placeholder="What the talk covers (optional)">${editing ? gsEsc(editing.description || "") : ""}</textarea>
        <div style="display:flex;gap:10px;">
          <button class="admin-btn-sm" onclick="gsSave()">${editing ? "Save changes" : "Publish talk"}</button>
          ${editing ? `<button class="admin-btn-sm ghost" onclick="gsCancelEdit()">Cancel</button>` : ""}
        </div>
      </div>
    </div>
  `;
}

window.gsToggleAdmin = function () {
  gsAdminOpen = !gsAdminOpen;
  if (!gsAdminOpen) gsEditingId = null;
  renderGuestSpeakers();
};

window.gsEdit = function (id) {
  gsEditingId = id;
  gsAdminOpen = true;
  renderGuestSpeakers();
  document.getElementById("guestSpeakersContent")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.gsCancelEdit = function () {
  gsEditingId = null;
  renderGuestSpeakers();
};

window.gsSave = async function () {
  if (!gsIsAdmin()) return;

  const name = document.getElementById("gs-name").value.trim();
  const role = document.getElementById("gs-role").value.trim();
  const area = document.getElementById("gs-area").value.trim();
  const videoUrl = document.getElementById("gs-url").value.trim();
  const recordedOn = document.getElementById("gs-recorded").value.trim();
  const orderRaw = document.getElementById("gs-order").value.trim();
  const description = document.getElementById("gs-desc").value.trim();

  if (!name) return alert("Enter the speaker's name.");
  if (!videoUrl) return alert("Add the video link.");
  if (!gsSafeUrl(videoUrl)) return alert("The video link needs to start with https://");

  if (!gsEmbedUrl(videoUrl) &&
      !confirm("That isn't a YouTube or Google Drive link, so it won't play inside the site — students will get a button that opens it in a new tab. Save it anyway?")) return;

  const editing = gsEditingId ? speakers.find(s => s.id === gsEditingId) : null;
  const id = gsEditingId || `speaker-${Date.now()}`;
  const speakerDoc = {
    id, name, role, area, videoUrl, recordedOn, description,
    order: orderRaw === "" ? null : Number(orderRaw),
    addedAt: editing ? editing.addedAt : new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "guestSpeakers", id), speakerDoc);
    const idx = speakers.findIndex(s => s.id === id);
    if (idx >= 0) speakers[idx] = speakerDoc; else speakers.push(speakerDoc);
    speakers.sort((a, b) => {
      const oa = a.order == null ? 9999 : Number(a.order);
      const ob = b.order == null ? 9999 : Number(b.order);
      return oa - ob || String(a.name || "").localeCompare(String(b.name || ""));
    });
    gsEditingId = null;
    gsAdminOpen = false;
    renderGuestSpeakers();
    window.f4gNotice?.(editing ? "Talk updated" : "Talk published", `${name} is live on the Guest Speaker Videos tab.`);
  } catch (e) {
    console.error("Couldn't save that speaker:", e);
    alert("Couldn't save that — check the console. If it's a permissions error, add a rule for the \"guestSpeakers\" collection in Firestore.");
  }
};

window.gsDelete = async function (id) {
  if (!gsIsAdmin()) return;
  const s = speakers.find(x => x.id === id);
  if (!confirm(`Remove ${s ? s.name : "this talk"} from the tab? The video itself isn't touched.`)) return;
  try {
    await deleteDoc(doc(db, "guestSpeakers", id));
    speakers = speakers.filter(x => x.id !== id);
    if (gsSelectedId === id) gsSelectedId = null;
    if (gsEditingId === id) gsEditingId = null;
    renderGuestSpeakers();
  } catch (e) {
    console.error("Couldn't delete that speaker:", e);
    alert("Couldn't remove that — check the console.");
  }
};

/* ---------- wiring ---------- */

// script.js sets window.showTab in its own module body, which runs before this
// one because this script tag comes after it. Same trick advisor.js uses.
const gsPrevShowTab = window.showTab;
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
  loadGuestSpeakers();
});
