/* =========================================================================
   FARM4GLASS — BULK QUESTION IMPORT (temporary tool)
   -------------------------------------------------------------------------
   Merges a bank of practice questions into a course's units in Firestore.

   HOW TO USE
   1. Drop this file and the f4g-questions-*.js data files next to index.html.
   2. Add these lines to index.html, just before </body>, AFTER script.js:

        <script src="f4g-questions-1.js"></script>
        <script src="f4g-questions-2.js"></script>
        <script src="f4g-questions-3.js"></script>
        <script type="module" src="f4g-import-questions.js"></script>

   3. Load the site and sign in with the admin account.
   4. Open the browser console and run:

        f4gImportQuestions()                    // PREVIEW — writes nothing
        f4gImportQuestions({ apply: true })     // actually writes

   5. Delete the four <script> lines from index.html when you're done.

   WHAT IT DOES NOT DO
   - It never deletes or overwrites a question you added by hand. Questions are
     appended, and anything whose text already exists in that unit is skipped.
   - It never touches videos, articles, XP values, or unit titles that exist.
   - Preview mode makes zero writes, so you can run it as many times as you want.

   RE-RUNNING IS SAFE. Run it twice and the second run reports every question
   as a duplicate and writes nothing.
   ========================================================================= */

import { getApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc }
  from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

/* Which course the questions go into. The Marketing Cluster Guide maps to the
   "marketing" course. To load the same bank into another cluster course, run:
     f4gImportQuestions({ courseId: "business-admin-core", apply: true })   */
const DEFAULT_COURSE_ID = "marketing";

/* Defaults for any quiz lesson this script has to create. Matches what the
   admin Courses editor creates so the two are indistinguishable afterward. */
const NEW_QUIZ_XP = 25;
const NEW_QUIZ_DURATION = "5 min";

/* ---- helpers copied from script.js so the two agree exactly ------------- */

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

/* ---- matching ----------------------------------------------------------
   A unit title looks like "Unit 3: Channel Management". Strip the "Unit N:"
   prefix and flatten to letters and digits, so punctuation and spacing in
   either the title or the bank's area name can't cause a miss.
   Matching is EXACT on the flattened form. Anything that doesn't match
   exactly gets a brand-new unit rather than being guessed into the wrong one —
   "Information Management" and "Marketing Information Management" are
   different instructional areas and must never collide.                      */

function flatten(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function unitAreaName(title) {
  return String(title || "").replace(/^\s*unit\s*\d+\s*[:.\-]?\s*/i, "").trim();
}

function normalizeQuestionText(q) {
  return String(q || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/* ---- validation --------------------------------------------------------- */

function validateEntry(entry, index) {
  const problems = [];
  if (!entry.ia) problems.push(`bank entry #${index + 1} has no "ia"`);
  if (!Array.isArray(entry.questions) || !entry.questions.length) {
    problems.push(`${entry.ia || `entry #${index + 1}`} has no questions`);
  }
  (entry.questions || []).forEach((q, qi) => {
    const where = `${entry.ia} Q${qi + 1}`;
    if (!q.q || typeof q.q !== "string") problems.push(`${where}: missing question text`);
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      problems.push(`${where}: needs exactly 4 options`);
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
      problems.push(`${where}: answer must be 0, 1, 2, or 3`);
    }
    if (!q.explanation) problems.push(`${where}: missing explanation`);
  });
  return problems;
}

/* ---- the import --------------------------------------------------------- */

window.f4gImportQuestions = async function ({
  courseId = DEFAULT_COURSE_ID,
  apply = false,
  createMissingUnits = true
} = {}) {

  const bank = window.F4G_QUESTION_BANK;
  if (!Array.isArray(bank) || !bank.length) {
    console.error(
      "No question bank loaded. Check that the f4g-questions-*.js <script> tags " +
      "are in index.html and that they load BEFORE this module."
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
  console.log(`Signed in as ${auth.currentUser.email}`);

  /* validate the whole bank before touching anything */
  const problems = bank.flatMap(validateEntry);
  if (problems.length) {
    console.error(`${problems.length} problem(s) in the question bank — nothing was written:`);
    problems.forEach(p => console.error("  " + p));
    return;
  }

  const totalInBank = bank.reduce((n, e) => n + e.questions.length, 0);
  console.log(
    `Bank loaded: ${bank.length} instructional areas, ${totalInBank} questions.\n` +
    `Target course: ${courseId}\n` +
    (apply ? "MODE: APPLY — this will write to Firestore." : "MODE: PREVIEW — nothing will be written.")
  );

  /* read the course */
  const ref = doc(db, "courses", courseId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    console.error(
      `No course document "${courseId}" in Firestore. Open Admin > Courses and click ` +
      `"Import courses.json" first, then run this again.`
    );
    return;
  }

  let lessons = [...(snap.data().lessons || [])];

  /* index the units that already exist, by flattened area name */
  function indexUnits() {
    const map = new Map();      // flattened area name -> { key, title }
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

  function nextUnitNumber() {
    let max = 0;
    const seen = new Set();
    lessons.forEach(l => {
      const key = unitKeyFor(l);
      if (seen.has(key)) return;
      seen.add(key);
      const m = stripUnitSuffix(l.title).match(/^\s*unit\s*(\d+)/i);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return max + 1;
  }

  const report = [];
  let added = 0, skipped = 0, unitsCreated = 0, quizzesCreated = 0;
  let newUnitNumber = nextUnitNumber();

  for (const entry of bank) {
    const units = indexUnits();

    /* exact match on the area name, then on any alias the bank supplies */
    const candidates = [entry.ia, ...(entry.aliases || [])].map(flatten);
    let unit = null;
    for (const c of candidates) {
      if (units.has(c)) { unit = units.get(c); break; }
    }

    let createdUnit = false;
    if (!unit) {
      if (!createMissingUnits) {
        report.push({ "Instructional Area": entry.ia, Unit: "— no match —", Added: 0, Skipped: 0, Note: "unit not found, skipped" });
        continue;
      }
      const key = `${courseId}-u${Date.now()}${newUnitNumber}`;
      const title = `Unit ${newUnitNumber}: ${entry.ia}`;
      unit = { key, title };
      newUnitNumber++;
      createdUnit = true;
      unitsCreated++;
    }

    /* find or create the quiz lesson for this unit */
    let quiz = lessons.find(l => unitKeyFor(l) === unit.key && l.type === "quiz");
    let createdQuiz = false;
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
      createdQuiz = true;
      quizzesCreated++;
    }

    /* append, skipping anything already there */
    const existing = new Set((quiz.questions || []).map(q => normalizeQuestionText(q.q)));
    let entryAdded = 0, entrySkipped = 0;

    entry.questions.forEach(q => {
      const norm = normalizeQuestionText(q.q);
      if (existing.has(norm)) { entrySkipped++; return; }
      existing.add(norm);
      quiz.questions = [...(quiz.questions || []), {
        q: q.q,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation
      }];
      entryAdded++;
    });

    added += entryAdded;
    skipped += entrySkipped;

    report.push({
      "Instructional Area": entry.ia,
      Unit: unit.title,
      Added: entryAdded,
      Skipped: entrySkipped,
      Note: createdUnit ? "NEW UNIT created" : createdQuiz ? "new quiz on existing unit" : ""
    });
  }

  console.table(report);
  console.log(
    `${added} question(s) to add · ${skipped} already present · ` +
    `${unitsCreated} unit(s) created · ${quizzesCreated} quiz lesson(s) created`
  );

  if (!apply) {
    console.log(
      "PREVIEW ONLY — nothing was written.\n" +
      "Check the Unit column above. If any row says NEW UNIT created but you expected it " +
      "to land on a unit you already have, the unit title doesn't match the area name — " +
      "either rename the unit in Admin > Courses, or add the exact title to that entry's " +
      "aliases in the data file.\n" +
      "When it looks right, run:  f4gImportQuestions({ apply: true })"
    );
    return report;
  }

  try {
    await setDoc(ref, { lessons }, { merge: true });
    console.log(
      `Written to Firestore. Reload the page and open ${courseId} > any unit > ` +
      `Practice questions to see them.`
    );
  } catch (e) {
    console.error("Write failed — nothing was saved:", e);
    console.error(
      "If this says 'Missing or insufficient permissions', the signed-in account " +
      "isn't allowed to write to the courses collection under your Firestore rules."
    );
  }

  return report;
};

console.log("Question importer ready. Run f4gImportQuestions() for a preview.");
