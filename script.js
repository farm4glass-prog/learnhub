let courses=[];

fetch("courses.json")
.then(r=>r.json())
.then(data=>{

courses=data;

renderCourses();

});

function renderCourses(){

const container=
document.getElementById(
"course-list"
);

container.innerHTML="";

courses.forEach(course=>{

container.innerHTML+=`

<div class="course-card">

<h3>
${course.emoji}
${course.title}
</h3>

<p>
${course.description}
</p>

<button
onclick="openCourse(
'${course.id}'
)"
>
Open Course
</button>

</div>

`;

});

}

function openCourse(id){

const course=
courses.find(
c=>c.id===id
);

let html=`
<h2>${course.title}</h2>
`;

course.lessons.forEach(
lesson=>{

if(
lesson.type==="youtube"
){

const vid=
lesson.url
.split("v=")[1];

html+=`

<div class="lesson-card">

<img
class="thumb"
src="https://img.youtube.com/vi/${vid}/hqdefault.jpg"
>

<h3>
${lesson.title}
</h3>

<a
href="${lesson.url}"
target="_blank"
>
Watch Video
</a>

</div>

`;

}

if(
lesson.type==="pdf"
){

html+=`

<div class="lesson-card">

<h3>
📄 ${lesson.title}
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

});

document
.getElementById(
"lessonView"
)
.innerHTML=html;

}

function showTab(tab){

["dashboard",
"courses",
"profile"]
.forEach(id=>{

document
.getElementById(id)
.classList.add(
"hidden"
);

});

document
.getElementById(tab)
.classList.remove(
"hidden"
);

}
