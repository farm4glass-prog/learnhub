import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const provider = new GoogleAuthProvider();

let courses = [];

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("googleLogin");

  if (loginBtn) {

    loginBtn.addEventListener("click", async () => {

      try {

        const result =
          await signInWithPopup(auth, provider);

        const user = result.user;

        document.getElementById("userInfo").innerHTML = `
          <div class="profile-card">
            <img src="${user.photoURL}" width="70">
            <h3>${user.displayName}</h3>
            <p>${user.email}</p>
          </div>
        `;

      } catch (error) {

        console.error(error);
        alert(error.message);

      }

    });

  }

});

fetch("courses.json")
  .then(response => response.json())
  .then(data => {

    courses = data;

    renderCourses();
    renderFeaturedCourses();

  })
  .catch(error => {

    console.error(error);

  });

function showTab(tabName) {

  document
    .getElementById("dashboard")
    .classList.add("hidden");

  document
    .getElementById("courses")
    .classList.add("hidden");

  document
    .getElementById("profile")
    .classList.add("hidden");

  document
    .getElementById(tabName)
    .classList.remove("hidden");
}

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

function openCourse(id) {

  const course =
    courses.find(c => c.id === id);

  if (!course) return;

  let lessonsHTML = "";

  course.lessons.forEach(lesson => {

    if (lesson.type === "youtube") {

      const videoId =
        lesson.url.split("v=")[1];

      lessonsHTML += `
        <div class="continue-card">

          <h3>${lesson.title}</h3>

          <div class="video-container">

            <iframe
              src="https://www.youtube.com/embed/${videoId}"
              allowfullscreen>
            </iframe>

          </div>

        </div>
      `;
    }

  });

  document.getElementById("courses").innerHTML = `

    <h1>${course.title}</h1>

    <p style="
      color:#64748b;
      margin-top:10px;
      margin-bottom:20px;
    ">
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

window.showTab = showTab;
window.openCourse = openCourse;
