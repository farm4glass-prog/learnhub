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

    if (lesson.type === "pdf") {

      lessonsHTML += `
        <div class="course-card">

          <h3>${lesson.title}</h3>

          <p>PDF Resource</p>

          <a
            href="${lesson.url}"
            target="_blank">
            Open PDF
          </a>

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
      "
      style="
        background:#167db5;
        color:white;
        border:none;
        padding:12px 18px;
        border-radius:12px;
        cursor:pointer;
        margin-top:20px;
      ">
      ← Back to Courses
    </button>

  `;

  showTab("courses");
}
