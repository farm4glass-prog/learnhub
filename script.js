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


// FIREBASE

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


// LOGIN

async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

document
  .getElementById("landingLogin")
  ?.addEventListener("click", loginWithGoogle);

document
  .getElementById("heroLogin")
  ?.addEventListener("click", loginWithGoogle);


// AUTH STATE

onAuthStateChanged(auth, async (user) => {

  const landingPage =
    document.getElementById("landingPage");

  const portal =
    document.getElementById("portal");

  const userInfo =
    document.getElementById("userInfo");

  const profileInfo =
    document.getElementById("profileInfo");

  if (user) {

    landingPage?.classList.add("hidden");
    portal?.classList.remove("hidden");

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

    const userData =
      (await getDoc(userRef)).data();

    if (userInfo) {

      userInfo.innerHTML = `
        <div class="profile-card">
          <img
            src="${user.photoURL}"
            width="60"
            style="border-radius:50%;"
          >

          <h3>${userData.displayName}</h3>

          <p>${userData.email}</p>
        </div>
      `;
    }

    if (profileInfo) {

      profileInfo.innerHTML = `
        <img
          src="${user.photoURL}"
          width="100"
          style="border-radius:50%;margin-bottom:15px;"
        >

        <h2>${userData.displayName}</h2>

        <p>${userData.email}</p>

        <br>

        <p>XP: ${userData.xp}</p>

        <p>Streak: ${userData.streak}</p>

        <br>

        <button id="logoutBtn">
          Sign Out
        </button>
      `;

      document
        .getElementById("logoutBtn")
        ?.addEventListener("click", async () => {

          await signOut(auth);

        });
    }

  } else {

    portal?.classList.add("hidden");
    landingPage?.classList.remove("hidden");

    if (userInfo) {
      userInfo.innerHTML = "";
    }
  }

});


// COURSES

let courses = [];

fetch("courses.json")
  .then(response => response.json())
  .then(data => {

    courses = data;

    renderCourses();
    renderFeaturedCourses();

  })
  .catch(error => {

    console.error(
      "Failed to load courses:",
      error
    );

  });


// TABS

function showTab(tabName) {

  document
    .getElementById("dashboard")
    ?.classList.add("hidden");

  document
    .getElementById("courses")
    ?.classList.add("hidden");

  document
    .getElementById("profile")
    ?.classList.add("hidden");

  document
    .getElementById(tabName)
    ?.classList.remove("hidden");
}


// FEATURED COURSES

function renderFeaturedCourses() {

  const container =
    document.getElementById("featuredCourses");

  if (!container) return;

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


// ALL COURSES

function renderCourses() {

  const container =
    document.getElementById("course-list");

  if (!container) return;

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


// OPEN COURSE

function openCourse(id) {

  const course =
    courses.find(c => c.id === id);

  if (!course) return;

  let lessonsHTML = "";

  course.lessons.forEach(lesson => {

    const videoId =
      lesson.url.split("v=")[1];

    lessonsHTML += `
      <div class="course-card">

        <h3>${lesson.title}</h3>

        <iframe
          width="100%"
          height="400"
          src="https://www.youtube.com/embed/${videoId}"
          allowfullscreen>
        </iframe>

      </div>
    `;
  });

  document.getElementById("courses").innerHTML = `
    <h1>${course.title}</h1>

    <p style="margin:15px 0;">
      ${course.description}
    </p>

    ${lessonsHTML}

    <button
      onclick="
        renderCourses();
        showTab('courses');
      ">
      Back to Courses
    </button>
  `;

  showTab("courses");
}


// GLOBAL

window.showTab = showTab;
window.openCourse = openCourse;
