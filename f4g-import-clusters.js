/* =========================================================================
   FARM4GLASS — FINANCE + HOSPITALITY CLUSTER IMPORTER
   -------------------------------------------------------------------------
   Loads the shared question bank into the Finance and Hospitality cluster
   courses. Each command is locked to one course and takes no arguments, so
   there is nothing to mistype.

   REQUIRES f4g-questions-ent.js — this file reads the bank from it rather
   than carrying a third copy of the same 220 questions. Keep that script tag
   in index.html for as long as you're using this one.

   HOW TO USE
   1. Upload this file to the repo next to index.html.
   2. In index.html, add this AFTER the f4g-questions-ent.js line:

        <script type="module" src="f4g-import-clusters.js"></script>

   3. Reload, sign in as admin, open the console. Four commands:

        f4gPreviewFinance()        preview finance — writes nothing
        f4gImportFinance()         write to finance

        f4gPreviewHospitality()    preview hospitality — writes nothing
        f4gImportHospitality()     write to hospitality

   4. Delete the script tag when you're done. Keep the file in the repo.

   IT WILL NOT CREATE UNITS. If an instructional area has no matching unit in
   the course, it reports "no matching unit" and moves on. Channel Management
   and Marketing-Information Management aren't units in these courses, so
   expect two skipped rows in every run — that's correct, not an error.

   To land those two somewhere, either add units with those exact names in
   Admin > Courses, or ignore them.
   ========================================================================= */

import { getApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc }
  from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

/* The only two courses this file can touch. If either ID is different in
   Admin > Courses, change it here — this is the single place they appear. */
const FINANCE_COURSE = "finance";
const HOSPITALITY_COURSE = "hospitality";

const NEW_QUIZ_XP = 25;
const NEW_QUIZ_DURATION = "5 min";

/* ============ KNOWLEDGE MANAGEMENT (new — not in the shared bank) ============
   These 10 are written from standard DECA terminology rather than from an
   uploaded cluster guide, so check them against yours before students see
   them. Everything else comes from the bank you already reviewed. */

function Q(q, options, answer, explanation) {
  return { q, options, answer, explanation };
}

const KNOWLEDGE_MANAGEMENT = {
  ia: "Knowledge Management",
  aliases: ["Knowledge Mgmt"],
  questions: [
    Q("A company creates a system for capturing what its employees know so the information isn't lost when they leave. Which concept is this?",
      ["Knowledge management", "Quality control", "Risk retention", "Benchmarking"], 0,
      "Knowledge management is capturing, organizing, and sharing what an organization knows."),
    Q("A company documents its procedures in written manuals that any employee can read. Which type of knowledge is this?",
      ["Tacit knowledge", "Intellectual capital", "Explicit knowledge", "Raw data"], 2,
      "Explicit knowledge is written down and easily transferred."),
    Q("A veteran employee has instincts about handling difficult customers that have never been written down. Which type of knowledge is this?",
      ["Explicit knowledge", "Tacit knowledge", "Data warehouse", "Benchmarking"], 1,
      "Tacit knowledge is experience-based and hard to document."),
    Q("A business records the number 4,832 with no context attached. What is this?",
      ["Information", "Knowledge", "Data", "Intelligence"], 2,
      "Data is a raw fact or figure that carries no meaning on its own."),
    Q("A business reports that sales rose 12% in the Northeast last quarter. What has the raw data become?",
      ["Information", "Data", "Tacit knowledge", "A trade secret"], 0,
      "Information is data that has been processed into something meaningful."),
    Q("A company values the combined skills, experience, and expertise of its workforce as a business asset. Which concept is this?",
      ["Capital goods", "Intellectual capital", "Accounts receivable", "Explicit knowledge"], 1,
      "Intellectual capital is the value of an organization's collective knowledge and expertise."),
    Q("A company builds a searchable internal database where employees store and find company documents. What is this called?",
      ["Data mining", "Knowledge repository", "Focus group", "Quality circle"], 1,
      "A knowledge repository is a central store where organizational knowledge is kept and retrieved."),
    Q("A retailer analyzes years of transaction data to uncover patterns it didn't know existed. Which concept is this?",
      ["Data mining", "Knowledge sharing", "Benchmarking", "Tacit knowledge"], 0,
      "Data mining searches large data sets for previously unknown patterns."),
    Q("A company identifies the method that consistently produces the best results and asks every location to adopt it. What is this?",
      ["Risk transfer", "A trade secret", "A best practice", "Intellectual capital"], 2,
      "A best practice is the approach shown to produce the best results, then standardized."),
    Q("An experienced employee is paired with a new hire specifically to pass along know-how that isn't in any manual. Which concept is this?",
      ["Knowledge sharing", "Data mining", "Quality control", "Chain of command"], 0,
      "Knowledge sharing moves knowledge, especially tacit knowledge, from one person to another.")
  ]
};

/* deterministic option shuffle — same helper the shared bank uses, so the new
   questions don't sit in a predictable answer position either */

function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleQuestion(question) {
  let seed = seedFrom(question.q);
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const paired = question.options.map((opt, i) => ({ opt, correct: i === question.answer }));
  for (let i = paired.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [paired[i], paired[j]] = [paired[j], paired[i]];
  }
  return {
    q: question.q,
    options: paired.map(p => p.opt),
    answer: paired.findIndex(p => p.correct),
    explanation: question.explanation
  };
}

function buildBank() {
  const shared = window.F4G_QUESTION_BANK_ENT;
  if (!Array.isArray(shared) || !shared.length) return null;
  return [
    ...shared,
    {
      ia: KNOWLEDGE_MANAGEMENT.ia,
      aliases: KNOWLEDGE_MANAGEMENT.aliases,
      questions: KNOWLEDGE_MANAGEMENT.questions.map(shuffleQuestion)
    }
  ];
}

/* ============================== IMPORTER ============================== */

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

function insertIntoUnit(lessons, unitKey, newLesson) {
  let lastIdx = -1;
  lessons.forEach((l, i) => { if (unitKeyFor(l) === unitKey) lastIdx = i; });
  if (lastIdx === -1) return [...lessons, newLesson];
  return [...lessons.slice(0, lastIdx + 1), newLesson, ...lessons.slice(lastIdx + 1)];
}

function flatten(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function unitAreaName(title) {
  return String(title || "").replace(/^\s*unit\s*\d+\s*[:.\-]?\s*/i, "").trim();
}

function normalizeQuestionText(q) {
  return String(q || "").toLowerCase().replace(/\s+/g, " ").trim();
}

async function run(courseId, label, apply) {
  const bank = buildBank();
  if (!bank) {
    console.error(
      "The shared bank isn't loaded. f4g-questions-ent.js has to be in index.html " +
      "and load BEFORE this file."
    );
    return;
  }

  const app = getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (!auth.currentUser) {
    console.error("Sign in with the admin account first, then run this again.");
    return;
  }

  console.log(
    `%cTARGET COURSE: ${courseId}  (${label})`,
    "font-weight:bold;font-size:14px;color:#167db5"
  );
  console.log(apply ? "MODE: APPLY — writing now." : "MODE: PREVIEW — nothing will be written.");

  const ref = doc(db, "courses", courseId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    console.error(
      `No course document "${courseId}" in Firestore. Check the ID in Admin > Courses ` +
      `and update it at the top of f4g-import-clusters.js.`
    );
    return;
  }

  let lessons = [...(snap.data().lessons || [])];

  function indexUnits() {
    const map = new Map();
    const seen = new Set();
    lessons.forEach(l => {
      const key = unitKeyFor(l);
      if (seen.has(key)) return;
      seen.add(key);
      const source = lessons.find(x => unitKeyFor(x) === key && x.type !== "quiz" && x.type !== "article")
        || lessons.find(x => unitKeyFor(x) === key && x.type === "article")
        || lessons.find(x => unitKeyFor(x) === key);
      const title = stripUnitSuffix(source?.title) || key;
      map.set(flatten(unitAreaName(title)), { key, title });
    });
    return map;
  }

  const report = [];
  let added = 0, skipped = 0, noMatch = 0;

  for (const entry of bank) {
    const units = indexUnits();
    const candidates = [entry.ia, ...(entry.aliases || [])].map(flatten);
    let unit = null;
    for (const c of candidates) {
      if (units.has(c)) { unit = units.get(c); break; }
    }

    /* No matching unit means no unit gets created. Report it and move on. */
    if (!unit) {
      noMatch++;
      report.push({
        "Instructional Area": entry.ia,
        Unit: "— none —",
        Added: 0,
        Skipped: 0,
        Note: "no matching unit in this course — nothing done"
      });
      continue;
    }

    let quiz = lessons.find(l => unitKeyFor(l) === unit.key && l.type === "quiz");
    if (!quiz) {
      quiz = {
        id: `${unit.key}-quiz`,
        title: `${unit.title} — Practice Quiz`,
        type: "quiz",
        xp: NEW_QUIZ_XP,
        duration: NEW_QUIZ_DURATION,
        questions: []
      };
      lessons = insertIntoUnit(lessons, unit.key, quiz);
    }

    const existing = new Set((quiz.questions || []).map(q => normalizeQuestionText(q.q)));
    let entryAdded = 0, entrySkipped = 0;

    entry.questions.forEach(q => {
      const norm = normalizeQuestionText(q.q);
      if (existing.has(norm)) { entrySkipped++; return; }
      existing.add(norm);
      quiz.questions = [...(quiz.questions || []), { ...q }];
      entryAdded++;
    });

    added += entryAdded;
    skipped += entrySkipped;

    report.push({
      "Instructional Area": entry.ia,
      Unit: unit.title,
      Added: entryAdded,
      Skipped: entrySkipped,
      Note: ""
    });
  }

  console.table(report);
  console.log(
    `${added} question(s) · ${skipped} already present · ${noMatch} area(s) with no matching unit`
  );

  if (!apply) {
    console.log(
      "PREVIEW ONLY — nothing was written.\n" +
      `When it looks right, run:  ${courseId === FINANCE_COURSE ? "f4gImportFinance()" : "f4gImportHospitality()"}`
    );
    return report;
  }

  try {
    await setDoc(ref, { lessons }, { merge: true });
    console.log(
      `%cWritten to ${courseId}. Reload the page and open it to check.`,
      "font-weight:bold;color:#059669"
    );
  } catch (e) {
    console.error("Write failed — nothing was saved:", e);
  }

  return report;
}

window.f4gPreviewFinance     = () => run(FINANCE_COURSE, "Finance Cluster", false);
window.f4gImportFinance      = () => run(FINANCE_COURSE, "Finance Cluster", true);
window.f4gPreviewHospitality = () => run(HOSPITALITY_COURSE, "Hospitality + Tourism Cluster", false);
window.f4gImportHospitality  = () => run(HOSPITALITY_COURSE, "Hospitality + Tourism Cluster", true);

console.log("%cCluster importer ready.", "font-weight:bold;color:#167db5");
console.log(`  f4gPreviewFinance()       preview  -> ${FINANCE_COURSE}`);
console.log(`  f4gImportFinance()        write    -> ${FINANCE_COURSE}`);
console.log(`  f4gPreviewHospitality()   preview  -> ${HOSPITALITY_COURSE}`);
console.log(`  f4gImportHospitality()    write    -> ${HOSPITALITY_COURSE}`);
