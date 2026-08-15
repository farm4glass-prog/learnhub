/* =========================================================================
   FARM4GLASS — UNDO A MIS-TARGETED QUESTION IMPORT (temporary tool)
   -------------------------------------------------------------------------
   Removes the questions in window.F4G_QUESTION_BANK_ENT from a course they
   were imported into by mistake. Use when f4gImportQuestions ran without a
   courseId and wrote the entrepreneurship bank into "marketing".

   HOW TO USE
   1. Save this file next to index.html.
   2. Add this line to index.html just before </body>, AFTER the
      f4g-questions-ent.js line:

        <script type="module" src="f4g-undo-ent-import.js"></script>

   3. Reload, sign in as admin, open the console:

        f4gUndoEntImport()                    // PREVIEW — writes nothing
        f4gUndoEntImport({ apply: true })     // actually removes

   WHAT IT REMOVES
   - Only questions whose text appears in the entrepreneurship bank. Anything
     you added by hand, and anything from question banks 1-3, is left alone.
   - A unit is deleted ONLY if it ends up with no questions AND has no video
     and no article — that is, only units this import created from nothing.
     A unit with a video keeps its (now empty) quiz and stays put.

   Preview mode makes zero writes. Run it as many times as you like.
   ========================================================================= */

import { getApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc }
  from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const DEFAULT_COURSE_ID = "marketing";

/* helpers copied from script.js so the two agree exactly */

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

function normalizeQuestionText(q) {
  return String(q || "").toLowerCase().replace(/\s+/g, " ").trim();
}

window.f4gUndoEntImport = async function ({
  courseId = DEFAULT_COURSE_ID,
  apply = false
} = {}) {

  const bank = window.F4G_QUESTION_BANK_ENT;
  if (!Array.isArray(bank) || !bank.length) {
    console.error(
      "The entrepreneurship bank isn't loaded, so there's nothing to match against. " +
      "Check that f4g-questions-ent.js is in index.html and loads before this file."
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

  const targets = new Set();
  bank.forEach(entry => entry.questions.forEach(q => targets.add(normalizeQuestionText(q.q))));
  console.log(
    `Matching against ${targets.size} question(s) from the entrepreneurship bank.\n` +
    `Target course: ${courseId}\n` +
    (apply ? "MODE: APPLY — this will write to Firestore." : "MODE: PREVIEW — nothing will be written.")
  );

  const ref = doc(db, "courses", courseId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    console.error(`No course document "${courseId}" in Firestore.`);
    return;
  }

  let lessons = (snap.data().lessons || []).map(l => ({ ...l }));

  /* 1. strip matching questions out of every quiz */
  let removed = 0;
  lessons.forEach(l => {
    if (l.type !== "quiz" || !Array.isArray(l.questions)) return;
    const before = l.questions.length;
    l.questions = l.questions.filter(q => !targets.has(normalizeQuestionText(q.q)));
    removed += before - l.questions.length;
  });

  /* 2. find units that are now completely empty and have no other content */
  const unitKeys = [...new Set(lessons.map(unitKeyFor))];
  const emptyUnits = unitKeys.filter(key => {
    const parts = lessons.filter(l => unitKeyFor(l) === key);
    const hasVideo = parts.some(l => l.type !== "quiz" && l.type !== "article" && l.url);
    const hasArticle = parts.some(l => l.type === "article" && l.url);
    const hasQuestions = parts.some(l => l.type === "quiz" && (l.questions || []).length);
    return !hasVideo && !hasArticle && !hasQuestions;
  });

  const report = [];
  unitKeys.forEach(key => {
    const parts = lessons.filter(l => unitKeyFor(l) === key);
    const source = parts.find(l => l.type !== "quiz" && l.type !== "article") || parts[0];
    const quiz = parts.find(l => l.type === "quiz");
    const original = (snap.data().lessons || [])
      .filter(l => unitKeyFor(l) === key && l.type === "quiz")
      .reduce((n, l) => n + (l.questions || []).length, 0);
    const now = quiz ? (quiz.questions || []).length : 0;
    if (original === now && !emptyUnits.includes(key)) return;
    report.push({
      Unit: stripUnitSuffix(source?.title) || key,
      "Questions before": original,
      "Questions after": now,
      Removed: original - now,
      Note: emptyUnits.includes(key) ? "UNIT WILL BE DELETED (nothing left in it)" : ""
    });
  });

  console.table(report);
  console.log(
    `${removed} question(s) to remove · ${emptyUnits.length} empty unit(s) to delete`
  );

  if (!apply) {
    console.log(
      "PREVIEW ONLY — nothing was written.\n" +
      "Check the table. Any unit marked UNIT WILL BE DELETED had no video, no article, " +
      "and no questions other than the ones being removed.\n" +
      "When it looks right, run:  f4gUndoEntImport({ apply: true })"
    );
    return report;
  }

  lessons = lessons.filter(l => !emptyUnits.includes(unitKeyFor(l)));

  try {
    await setDoc(ref, { lessons }, { merge: true });
    console.log(`Done. ${courseId} is back to what it was. Reload the page to see it.`);
  } catch (e) {
    console.error("Write failed — nothing was saved:", e);
  }

  return report;
};

console.log("Undo tool ready. Run f4gUndoEntImport() for a preview.");
