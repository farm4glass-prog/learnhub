// =====================
// FIREBASE IMPORTS
// =====================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =====================
// FIREBASE CONFIG
// =====================

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


// =====================
// GOOGLE LOGIN
// =====================

const loginBtn = document.getElementById("googleLogin");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}

onAuthStateChanged(auth, async (user) => {

  const userInfo =
    document.getElementById("userInfo");

  if (!userInfo) return;

  if (user) {

    const userRef =
      doc(db, "users", user.uid);

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {

      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        xp: 0,
        streak: 0,
        completedLessons: []
      });

    }

    const data =
      (await getDoc(userRef)).data();

    userInfo.innerHTML = `
      <div class="profile-card">

        <img
          src="${user.photoURL}"
          width="60"
          style="border-radius:50%;margin-bottom:10px;"
        >

        <h3>${data.displayName}</h3>

        <p>${data.email}</p>

        <p>XP: ${data.xp}</p>

        <p>Streak: ${data.streak}</p>

        <button id="logoutBtn">
          Sign Out
        </button>

      </div>
    `;

    document
      .getElementById("logoutBtn")
      .addEventListener("click", () => {
        signOut(auth);
      });

  } else {

    userInfo.innerHTML = `
      <p>Not signed in</p>
    `;

  }

});


// =====================
// COURSE SYSTEM
// =====================

let courses = [];

fetch("courses.json")
  .then(response => response.json())
  .then(data => {
    courses = data;

    renderCourses();
    renderFeaturedCourses();
  })
  .catch(error => {
    console.error("Failed to load courses:", error);
  });

function showTab(tabName) {

  document.getElementById("dashboard")
    .classList.add("hidden");

  document.getElementById("courses")
    .classList.add("hidden");

  document.getElementById("profile")
    .classList.add("hidden");

  document.getElementById(tabName)
    .classList.remove("hidden");
}

function renderFeaturedCourses() {

  const container =
    document.getElementById("featuredCourses");

  container.innerHTML = "";

  courses.forEach(course => {

    container.innerHTML += `
      <div class="course-card">

        <h3>${course.title}</h3>

        <p>${course.description}</p>

        <div class="progress">
          <div
            class="progress-fill"
            style="width:${course.progress}%">
          </div>
        </div>

        <button onclick="openCourse('${course.id}')">
          Continue
        </button>

      </div>
    `;
  });
}

function renderCourses() {

  const container =
    document.getElementById("course-list");

  container.innerHTML = "";

  courses.forEach(course => {

    container.innerHTML += `
      <div class="course-card">

        <h3>${course.title}</h3>

        <p>${course.description}</p>

        <div class="progress">
          <div
            class="progress-fill"
            style="width:${course.progress}%">
          </div>
        </div>

        <button onclick="openCourse('${course.id}')">
          Open Course
        </button>

      </div>
    `;
  });
}

function openCourse(id) {

  const course =
    courses.find(c => c.id === id);

  if (!course) return;

  alert(course.title);
}

window.showTab = showTab;
window.openCourse = openCourse;
