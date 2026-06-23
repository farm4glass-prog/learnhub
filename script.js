const coursesContainer =
document.getElementById("courses");

const lessonView =
document.getElementById("lessonView");

let courses = [];

fetch("courses.json")
.then(r => r.json())
.then(data => {

courses = data;

renderCourses(data);

});

function renderCourses(data){

coursesContainer.innerHTML="";

data.forEach(course => {

const card =
document.createElement("div");

card.className = "card";

const progress =
getProgress(course.id);

card.innerHTML = `
<h3>${course.title}</h3>
<p>${course.description}</p>

<p>
Progress:
${progress ? "✅ Completed" : "⬜ Not Started"}
</p>

<button onclick="openLesson('${course.id}')">
Open Course
</button>
`;

coursesContainer.appendChild(card);

});

}

function openLesson(id){

const course =
courses.find(c=>c.id===id);

lessonView.classList.remove("hidden");

lessonView.innerHTML = `
<div class="lesson">

<h2>${course.title}</h2>

<p>
${course.lesson}
</p>

<hr><br>

<h3>
${course.quiz.question}
</h3>

${course.quiz.options.map(option => `
<button
class="quiz-option"
onclick="checkAnswer(
'${option}',
'${course.quiz.answer}',
'${id}'
)">
${option}
</button>
`).join("")}

</div>
`;

window.scrollTo({
top: lessonView.offsetTop,
behavior:"smooth"
});

}

function checkAnswer(
choice,
answer,
courseId
){

if(choice===answer){

alert("Correct!");

saveProgress(courseId);

renderCourses(courses);

}else{

alert("Incorrect");

}

}

function saveProgress(id){

const progress =
JSON.parse(
localStorage.getItem("progress")
|| "[]"
);

if(!progress.includes(id))
progress.push(id);

localStorage.setItem(
"progress",
JSON.stringify(progress)
);

}

function getProgress(id){

const progress =
JSON.parse(
localStorage.getItem("progress")
|| "[]"
);

return progress.includes(id);

}

document
.getElementById("search")
.addEventListener("input", e => {

const term =
e.target.value.toLowerCase();

const filtered =
courses.filter(course =>
course.title
.toLowerCase()
.includes(term)
);

renderCourses(filtered);

});

document
.getElementById("themeBtn")
.addEventListener("click", ()=>{

document.body
.classList.toggle("dark");

});
