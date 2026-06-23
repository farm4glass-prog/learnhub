let courses = [];

fetch("courses.json")
.then(response => response.json())
.then(data => {

    courses = data;

    renderCourses();
    renderFeaturedCourses();

});

function showTab(tab){

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
    .getElementById(tab)
    .classList.remove("hidden");

}

function renderFeaturedCourses(){

    const container =
    document.getElementById(
        "featuredCourses"
    );

    container.innerHTML = "";

    courses.forEach(course => {

        container.innerHTML += `

        <div class="course-card">

            <h3>
                ${course.title}
            </h3>

            <p>
                ${course.description}
            </p>

            <div class="progress">

                <div
                    class="progress-fill"
                    style="width:${course.progress}%"
                >
                </div>

            </div>

            <button
                onclick="openCourse('${course.id}')"
            >
                Continue
            </button>

        </div>

        `;

    });

}

function renderCourses(){

    const container =
    document.getElementById(
        "course-list"
    );

    container.innerHTML = "";

    courses.forEach(course => {

        container.innerHTML += `

        <div class="course-card">

            <h3>
                ${course.title}
            </h3>

            <p>
                ${course.description}
            </p>

            <div class="progress">

                <div
                    class="progress-fill"
                    style="width:${course.progress}%"
                >
                </div>

            </div>

            <button
                onclick="openCourse('${course.id}')"
            >
                Open Course
            </button>

        </div>

        `;

    });

}

function openCourse(id){

    const course =
    courses.find(
        c => c.id === id
    );

    let lessonHTML = "";

    course.lessons.forEach(
        lesson => {

            if(
                lesson.type === "youtube"
            ){

                const videoId =
                lesson.url
                .split("v=")[1];

                lessonHTML += `

                <div class="continue-card">

                    <h3>
                        ${lesson.title}
                    </h3>

                    <div class="video-container">

                        <iframe
                            src="https://www.youtube.com/embed/${videoId}"
                            allowfullscreen>
                        </iframe>

                    </div>

                </div>

                `;

            }

            if(
                lesson.type === "pdf"
            ){

                lessonHTML += `

                <div class="course-card">

                    <h3>
                        ${lesson.title}
                    </h3>

                    <a
                        href="${lesson.url}"
                        target="_blank"
                    >
                        Open PDF
                    </a>

                </div>

                `;

            }

        }
    );

    document
    .getElementById("courses")
    .innerHTML = `

        <h1>
            ${course.title}
        </h1>

        <p style="
            margin-top:10px;
            margin-bottom:25px;
            color:#64748b;
        ">
            ${course.description}
        </p>

        ${lessonHTML}

        <button
            onclick="
                showTab('courses');
                renderCourses();
            "
            style="
                margin-top:20px;
                padding:12px 18px;
                border:none;
                border-radius:12px;
                background:#2563eb;
                color:white;
                cursor:pointer;
            "
        >
            Back to Courses
        </button>

    `;

    showTab("courses");

}
