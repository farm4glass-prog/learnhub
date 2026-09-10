/* =========================================================================
   FARM4GLASS — CORPORATE CHALLENGES COURSE
   -------------------------------------------------------------------------
   The admin Courses editor can add UNITS to a course but has no way to add a
   COURSE, so this module adds one. It runs once: when an admin signs in, it
   checks whether courses/corporate-challenges already exists and writes it
   only if it doesn't. After that it does nothing on every future load.

   The course is created HIDDEN, so students don't see an outline with no
   videos in it. Unhide it from Admin > Courses > Show when you're ready —
   that's a one-field write, and it doesn't touch the units or anyone's
   progress.

   Every unit starts flagged "coming soon", which is what makes it appear in
   the course as a locked row rather than an empty video page. As you fill
   each one in, hit "Make available" on that unit in the admin editor.

   To rebuild it later after editing the list below (this OVERWRITES the
   units, so don't run it once you've added real questions through the admin
   panel), run this in the browser console while signed in as an admin:
       f4gAddCorporateChallenges({ force: true })
   ========================================================================= */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

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
const COURSE_ID = "corporate-challenges";

const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* -------------------------------------------------------------------------
   THE UNIT LIST
   Edit the titles here, not in Firestore — then re-run with { force: true }
   if you haven't started adding questions yet. Check the names against the
   current DECA Guide before you publish; the challenge line-up changes.
   ------------------------------------------------------------------------- */

const UNITS = [
  {
    title: "Unit 1: How Corporate Challenges Work",
    blurb: "Formats, team sizes, entry deadlines, and how a challenge gets you to ICDC."
  },
  {
    title: "Unit 2: Choosing Your Challenge and Building Your Team"
  },
  {
    title: "Unit 3: Virtual Business Challenge — Retailing"
  },
  {
    title: "Unit 4: Virtual Business Challenge — Restaurant"
  },
  {
    title: "Unit 5: Virtual Business Challenge — Sports"
  },
  {
    title: "Unit 6: Virtual Business Challenge — Personal Finance"
  },
  {
    title: "Unit 7: Stock Market Game — Building the Portfolio"
  },
  {
    title: "Unit 8: Stock Market Game — Research and Trading Strategy"
  },
  {
    title: "Unit 9: Reading Your Simulation Reports"
  },
  {
    title: "Unit 10: Competition Week and Qualifying for ICDC"
  }
];

/* -------------------------------------------------------------------------
   Builds the flat lessons array script.js expects. The ID pattern
   "<course>-uN-video" / "-quiz" is what buildUnits() groups on, so each pair
   below becomes one unit row with a Video tab and a Practice questions tab.
   ------------------------------------------------------------------------- */

function buildCorporateChallengesCourse() {
  const lessons = [];

  UNITS.forEach((unit, i) => {
    const key = `${COURSE_ID}-u${i + 1}`;

    lessons.push({
      id: `${key}-video`,
      title: unit.title,
      type: "youtube",
      url: "",
      xp: 25,
      duration: "10 min",
      comingSoon: true
    });

    lessons.push({
      id: `${key}-quiz`,
      title: `${unit.title} — Practice Quiz`,
      type: "quiz",
      xp: 25,
      duration: "5 min",
      questions: [],
      comingSoon: true
    });
  });

  return {
    id: COURSE_ID,
    title: "Corporate Challenges",
    description: "The online, corporate-sponsored challenges: how each one is scored, how to run the simulation week by week, and what separates a qualifying team from the rest.",
    group: "online simulation",
    category: "Corporate Challenges",
    color: "#38bdf8",
    level: "Beginner",
    duration: "Self-paced",
    hidden: true,
    lessons
  };
}

/* -------------------------------------------------------------------------
   Write it
   ------------------------------------------------------------------------- */

window.f4gAddCorporateChallenges = async function (opts = {}) {
  const user = auth.currentUser;
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    console.warn("Corporate Challenges: not an admin account, skipping.");
    return false;
  }

  try {
    const ref = doc(db, "courses", COURSE_ID);
    const snap = await getDoc(ref);

    if (snap.exists() && !opts.force) {
      // Already there. Nothing to do, and nothing gets overwritten.
      return false;
    }

    if (snap.exists() && opts.force &&
        !confirm("Rebuild the Corporate Challenges course? This replaces its units — any practice questions you added through the admin panel will be lost.")) {
      return false;
    }

    await setDoc(ref, buildCorporateChallengesCourse());

    console.log(`Corporate Challenges: course written with ${UNITS.length} units (hidden).`);
    window.f4gNotice?.(
      "Corporate Challenges added",
      `${UNITS.length} units, hidden for now. Reload, then unhide it in Admin > Courses.`
    );
    return true;
  } catch (e) {
    console.error("Corporate Challenges: couldn't write the course:", e);
    window.f4gNotice?.("Couldn't add Corporate Challenges", "Check the browser console for the Firestore error.");
    return false;
  }
};

// Seed once per account, on the first admin sign-in after this file ships.
let seedAttempted = false;
onAuthStateChanged(auth, (user) => {
  if (!user || seedAttempted) return;
  if (!ADMIN_EMAILS.includes(user.email)) return;
  seedAttempted = true;
  window.f4gAddCorporateChallenges();
});
