/* =========================================================================
   FARM4GLASS — BULK ROLEPLAY IMPORT
   -------------------------------------------------------------------------
   Adds a "Bulk import" box to Admin > Roleplays. Paste the rows from the
   Drive export sheet (or a JSON list), check them, and import hundreds of
   practice roleplays in one click instead of one form at a time.

   Load it AFTER script.js in index.html:
     <script type="module" src="script.js"></script>
     <script type="module" src="roleplay-import.js"></script>

   It touches nothing in script.js. It reuses the Firebase app script.js
   already started, so it signs in as the same admin and writes to the same
   "roleplays" collection, in the same shape the single-add form uses:
     { id, eventCode, area, title, url, description, addedAt }

   Safe to run as often as you like:
     - anything whose Drive file is already on the site is skipped
     - imported docs are keyed by Drive file ID (rp-drive-<id>), so even a
       repeat import can't create a duplicate
   ========================================================================= */

import { getApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, writeBatch
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

// Used only if the admin form's event dropdown can't be read for some reason.
const FALLBACK_CODES = [
  "PBM", "PEN", "PFN", "PHT", "PMK",
  "ACT", "AAM", "ASM", "BFS", "BSM", "ENT", "FMS", "HLM", "HRM", "MCS",
  "QSRM", "RFSM", "RMS", "SEM",
  "BLTDM", "BTDM", "ETDM", "FTDM", "HTDM", "MTDM", "STDM", "TTDM",
  "PFL", "FCE", "HTPS", "PSE"
];

// Firestore allows 500 writes per batch; stay under it.
const BATCH_SIZE = 400;

const FIELD_ALIASES = {
  eventCode:   ["eventcode", "event code", "event", "code"],
  area:        ["area", "instructional area", "instructionalarea"],
  title:       ["title", "name"],
  url:         ["url", "link", "drive link", "google drive link", "share link"],
  description: ["description", "desc", "notes"]
};
const COLUMN_ORDER = ["eventCode", "area", "title", "url", "description"];

const state = {
  open: false,
  text: "",
  busy: false,
  preview: null,     // { total, fresh, dupes, problems, existingCount }
  progress: null,    // { done, total }
  result: null,      // { added } after a finished import
  error: ""
};

/* ---------- helpers ---------- */

function db() {
  return getFirestore(getApp());
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Same rule script.js uses, so a link that previews there is accepted here.
function driveFileId(url) {
  const raw = String(url || "");
  const m = raw.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/) || raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
}

// The event codes the site actually knows, read straight off the admin
// form's dropdown so this never drifts from DECA_ROLEPLAY_EVENTS.
function knownCodes() {
  const fromForm = [...document.querySelectorAll("#rp-event option")]
    .map(o => o.value).filter(Boolean);
  return new Set((fromForm.length ? fromForm : FALLBACK_CODES).map(c => c.toUpperCase()));
}

// Accepts "PBM", "pbm", or the full "Retail Merchandising Series (RMS)".
function normalizeCode(raw) {
  const s = String(raw || "").trim();
  const inParens = s.match(/\(([^)]+)\)\s*$/);
  return (inParens ? inParens[1] : s).toUpperCase().replace(/\s+/g, "");
}

function plural(n, one, many) {
  return `${n.toLocaleString()} ${n === 1 ? one : (many || one + "s")}`;
}

/* ---------- parsing ---------- */

function parseCsvLine(line) {
  const out = [];
  let cur = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function fieldForHeader(cell) {
  const h = String(cell || "").trim().toLowerCase();
  return Object.keys(FIELD_ALIASES).find(f => FIELD_ALIASES[f].includes(h)) || null;
}

// Rows copied out of Google Sheets arrive tab-separated. CSV and a JSON
// array work too. A header row is optional; without one, columns are read
// as: event code, area, title, link, description.
function parseInput(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    let data;
    try { data = JSON.parse(trimmed); }
    catch (e) { throw new Error("That looks like JSON but it didn't parse — check for a missing comma or bracket."); }
    if (!Array.isArray(data)) throw new Error("The JSON needs to be a list: [ {...}, {...} ].");
    return data.map((obj, i) => {
      const row = { line: i + 1 };
      Object.entries(obj || {}).forEach(([k, v]) => {
        const f = fieldForHeader(k) || (COLUMN_ORDER.includes(k) ? k : null);
        if (f) row[f] = v;
      });
      return row;
    });
  }

  const lines = trimmed.replace(/\r\n?/g, "\n").split("\n").filter(l => l.trim());
  const useTabs = lines.some(l => l.includes("\t"));
  const cells = lines.map(l => (useTabs ? l.split("\t") : parseCsvLine(l)).map(c => c.trim()));

  let columns = COLUMN_ORDER;
  let start = 0;
  const headerFields = cells[0].map(fieldForHeader);
  if (headerFields.filter(Boolean).length >= 2) {
    columns = headerFields;
    start = 1;
  }

  return cells.slice(start).map((row, i) => {
    const out = { line: i + start + 1 };
    columns.forEach((f, ci) => { if (f) out[f] = row[ci] || ""; });
    return out;
  });
}

/* ---------- check ---------- */

async function buildPreview(text) {
  const rows = parseInput(text);
  if (!rows.length) throw new Error("Nothing to check — paste the rows first.");

  const snap = await getDocs(collection(db(), "roleplays"));
  const onSiteFiles = new Set();
  const onSiteIds = new Set();
  snap.forEach(d => {
    onSiteIds.add(d.id);
    const id = driveFileId(d.data()?.url);
    if (id) onSiteFiles.add(id);
  });

  const codes = knownCodes();
  const seen = new Set();
  const fresh = [], dupes = [], problems = [];

  rows.forEach(r => {
    const code = normalizeCode(r.eventCode);
    const fileId = driveFileId(r.url);
    const title = String(r.title || "").trim();
    const area = String(r.area || "").trim();
    const description = String(r.description || "").trim();

    if (!code) return problems.push({ line: r.line, why: "no event code" });
    if (!codes.has(code)) return problems.push({ line: r.line, why: `"${r.eventCode}" isn't a roleplay event code on the site` });
    if (!fileId) return problems.push({ line: r.line, why: "no Google Drive file link" });
    if (!title) return problems.push({ line: r.line, why: "no title" });

    const docId = `rp-drive-${fileId}`;
    if (seen.has(fileId)) return dupes.push({ line: r.line, why: "listed twice in what you pasted" });
    seen.add(fileId);
    if (onSiteFiles.has(fileId) || onSiteIds.has(docId)) return dupes.push({ line: r.line, why: "already on the site" });

    fresh.push({
      id: docId,
      eventCode: code,
      area,
      title,
      url: `https://drive.google.com/file/d/${fileId}/view`,
      description
    });
  });

  return { total: rows.length, fresh, dupes, problems, existingCount: snap.size };
}

/* ---------- import ---------- */

async function runImport() {
  const items = state.preview?.fresh || [];
  if (!items.length) return;

  const addedAt = new Date().toISOString();
  state.progress = { done: 0, total: items.length };
  renderResult();

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = writeBatch(db());
    items.slice(i, i + BATCH_SIZE).forEach(r => {
      batch.set(doc(db(), "roleplays", r.id), { ...r, addedAt });
    });
    await batch.commit();
    state.progress.done = Math.min(items.length, i + BATCH_SIZE);
    renderResult();
  }

  state.result = { added: items.length };
  state.preview = null;
  state.progress = null;
}

/* ---------- rendering ---------- */

const DISABLED = `disabled style="opacity:.5;cursor:default;"`;

function eventSummaryHtml(fresh) {
  const byEvent = new Map();
  fresh.forEach(r => {
    if (!byEvent.has(r.eventCode)) byEvent.set(r.eventCode, { n: 0, areas: new Set() });
    const g = byEvent.get(r.eventCode);
    g.n++;
    g.areas.add(r.area || "Not categorized");
  });
  return [...byEvent.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([code, g]) => `
      <div style="font-size:13px;padding:4px 0;">
        <strong>${esc(code)}</strong> — ${plural(g.n, "new roleplay")} across ${plural(g.areas.size, "area")}
        <span style="color:var(--muted);">(${[...g.areas].sort().map(esc).join(", ")})</span>
      </div>`).join("");
}

function resultHtml() {
  if (state.error) {
    return `<div class="planner-warning" style="margin-top:12px;">${esc(state.error)}</div>`;
  }

  if (state.progress) {
    return `<div class="admin-empty-state" style="margin-top:12px;">
      Importing… ${state.progress.done.toLocaleString()} of ${state.progress.total.toLocaleString()} saved.
      Keep this tab open until it finishes.
    </div>`;
  }

  if (state.result) {
    return `<div class="admin-seed-banner" style="margin-top:12px;">
      <div>Added ${plural(state.result.added, "practice roleplay")}. Reload the page to see them in the list here and on the Roleplays tab.</div>
      <button class="admin-btn-sm" data-action="reload">Reload now</button>
    </div>`;
  }

  if (state.busy) {
    return `<div class="admin-empty-state" style="margin-top:12px;">Checking against what's already on the site…</div>`;
  }

  const p = state.preview;
  if (!p) return "";

  const problemsHtml = p.problems.length ? `
    <div style="margin-top:10px;font-size:13px;">
      <strong>${plural(p.problems.length, "row")} can't be imported:</strong>
      ${p.problems.slice(0, 15).map(x => `<div style="color:var(--muted);">Row ${x.line}: ${esc(x.why)}</div>`).join("")}
      ${p.problems.length > 15 ? `<div style="color:var(--muted);">…and ${p.problems.length - 15} more.</div>` : ""}
    </div>` : "";

  const dupesInPaste = p.dupes.filter(d => d.why !== "already on the site").length;

  return `
    <div style="margin-top:14px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:6px;">
        ${plural(p.fresh.length, "new roleplay")} ready to import
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">
        ${plural(p.total, "row")} read · ${(p.dupes.length - dupesInPaste).toLocaleString()} already on the site (skipped)
        ${dupesInPaste ? ` · ${dupesInPaste.toLocaleString()} listed twice (skipped)` : ""}
        · ${p.existingCount.toLocaleString()} on the site now
      </div>
      ${eventSummaryHtml(p.fresh)}
      ${problemsHtml}
    </div>`;
}

function renderResult() {
  const box = document.getElementById("rpBulkResult");
  if (box) box.innerHTML = resultHtml();

  const importBtn = document.querySelector('#rpBulkImport [data-action="import"]');
  if (importBtn) {
    const n = state.preview?.fresh.length || 0;
    const ready = n > 0 && !state.busy && !state.progress;
    importBtn.disabled = !ready;
    importBtn.style.opacity = ready ? "" : ".5";
    importBtn.style.cursor = ready ? "" : "default";
    importBtn.textContent = n ? `Import ${plural(n, "roleplay")}` : "Import";
  }
}

function panelHtml() {
  const head = `
    <div class="admin-lesson-head">
      <h4>Bulk import from Google Drive</h4>
      <button class="admin-btn-sm ghost" data-action="toggle">${state.open ? "Hide" : "Open"}</button>
    </div>
    <div style="font-size:12px;color:var(--muted);">
      Paste rows from the Drive export sheet — or any list with columns for event code, instructional area, title, and Drive link.
      Anything already on the site is skipped automatically.
    </div>`;

  if (!state.open) return head;

  return `${head}
    <div class="admin-kpi-form" style="margin-top:12px;">
      <textarea id="rpBulkText" rows="7" placeholder="Copy every row from the export sheet (header row included) and paste here.&#10;&#10;eventCode&#9;area&#9;title&#9;url&#9;description&#10;PBM&#9;Business Law&#9;Practice Roleplay 1&#9;https://drive.google.com/file/d/…/view">${esc(state.text)}</textarea>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="admin-btn-sm" data-action="preview">Check list</button>
        <button class="admin-btn-sm" data-action="import" ${DISABLED}>Import</button>
        <button class="admin-btn-sm ghost" data-action="clear">Clear</button>
      </div>
      <div id="rpBulkResult"></div>
    </div>`;
}

function render(panel) {
  panel.innerHTML = panelHtml();
  renderResult();
}

/* ---------- actions ---------- */

async function onAction(action, panel) {
  if (action === "toggle") {
    state.open = !state.open;
    return render(panel);
  }

  if (action === "clear") {
    Object.assign(state, { text: "", preview: null, result: null, error: "", progress: null });
    return render(panel);
  }

  if (action === "reload") {
    return location.reload();
  }

  if (action === "preview") {
    state.text = document.getElementById("rpBulkText")?.value || "";
    Object.assign(state, { busy: true, preview: null, result: null, error: "" });
    renderResult();
    try {
      state.preview = await buildPreview(state.text);
    } catch (e) {
      console.error("Bulk import check failed:", e);
      state.error = /permission/i.test(e?.message || "")
        ? "The database refused the read — make sure you're signed in as the admin account."
        : (e?.message || "Couldn't check that list — see the browser console.");
    }
    state.busy = false;
    return renderResult();
  }

  if (action === "import") {
    const n = state.preview?.fresh.length || 0;
    if (!n) return;
    if (!confirm(`Add ${plural(n, "practice roleplay")} to the site? Students see them as soon as the page reloads.`)) return;
    state.error = "";
    try {
      await runImport();
    } catch (e) {
      console.error("Bulk import failed:", e);
      const saved = state.progress?.done || 0;
      state.progress = null;
      state.preview = null;
      state.error = (/permission/i.test(e?.message || "")
        ? "The database refused the write — make sure you're signed in as the admin account."
        : "The import stopped partway — see the browser console for the error.")
        + (saved ? ` ${plural(saved, "roleplay was", "roleplays were")} saved before it stopped; run Check list again and it'll pick up only what's missing.` : "");
    }
    return renderResult();
  }
}

/* ---------- mounting ---------- */
// script.js rebuilds the Roleplays admin tab with innerHTML on every change,
// which wipes this panel. Watch for the tab's form and put the panel back,
// restoring whatever was pasted and checked from `state`.

function mount() {
  const form = document.getElementById("rp-url");
  const body = form?.closest("#adminSubtabBody");
  if (!body || body.querySelector("#rpBulkImport")) return;

  const panel = document.createElement("div");
  panel.id = "rpBulkImport";
  panel.className = "admin-lesson-block";
  panel.style.borderStyle = "dashed";
  panel.style.marginBottom = "18px";

  const banner = body.querySelector(".admin-seed-banner");
  if (banner) banner.after(panel); else body.prepend(panel);

  panel.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (btn && !btn.disabled) onAction(btn.dataset.action, panel);
  });

  // Editing the list invalidates the last check.
  panel.addEventListener("input", e => {
    if (e.target.id !== "rpBulkText") return;
    state.text = e.target.value;
    if (state.preview || state.error || state.result) {
      Object.assign(state, { preview: null, error: "", result: null });
      renderResult();
    }
  });

  render(panel);
}

let queued = false;
function scheduleMount() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; mount(); });
}

function start() {
  mount();
  new MutationObserver(scheduleMount).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState !== "loading") start();
else document.addEventListener("DOMContentLoaded", start);
