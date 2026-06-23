function openLesson(id){

  const course =
    courses.find(c => c.id === id);

  lessonView.classList.remove("hidden");

  let lessonsHTML = "";

  course.lessons.forEach(lesson => {

    if(lesson.type === "youtube"){

      const videoId =
        lesson.url.split("v=")[1];

      const thumb =
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      lessonsHTML += `
      <div class="lesson-card">

        <img
          src="${thumb}"
          class="thumb"
        >

        <h3>${lesson.title}</h3>

        <a
          href="${lesson.url}"
          target="_blank"
        >
          Watch Video →
        </a>

      </div>
      `;
    }

    if(lesson.type === "pdf"){

      lessonsHTML += `
      <div class="lesson-card">

        <h3>
          📄 ${lesson.title}
        </h3>

        <a
          href="${lesson.url}"
          target="_blank"
        >
          Open PDF →
        </a>

      </div>
      `;
    }

  });

  lessonView.innerHTML = `
  <div class="lesson">

    <h2>
      ${course.title}
    </h2>

    <p>
      ${course.description}
    </p>

    <br>

    ${lessonsHTML}

  </div>
  `;
}
