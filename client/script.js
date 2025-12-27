const SERVICES = {
    STUDENT: 'http://localhost:4001/graphql',
    COURSE: 'http://localhost:4002/graphql',
    ENROLLMENT: 'http://localhost:4003/graphql'
};

let currentUser = JSON.parse(localStorage.getItem('eduHubUser')) || null;
let isTeacher = false;
let currentCourseId = null;
let studentEnrollments = [];

async function fetchGraphQL(url, query, variables = {}) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        });
        const result = await response.json();
        if (result.errors) throw new Error(result.errors[0].message);
        return result.data;
    } catch (error) {
        showToast(error.message, 'error');
        return null;
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

async function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const roleSwitchContainer = document.getElementById('roleSwitchContainer');
    const addCourseBtn = document.getElementById('addCourseBtn');

    if (currentUser || isTeacher) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        roleSwitchContainer.style.display = 'flex';
        document.getElementById('userName').textContent = isTeacher ? "Teacher View" : currentUser.nama;
        document.getElementById('userAvatar').textContent = isTeacher ? "T" : currentUser.nama[0];
        addCourseBtn.classList.toggle('hidden', !isTeacher);
        
        // If student is logged in, fetch their enrollments
        if (!isTeacher && currentUser) {
            const data = await fetchGraphQL(SERVICES.ENROLLMENT, 
                `query($sid: Int) { enrollmentStudent(studentID: $sid) { courseId } }`, 
                { sid: parseInt(currentUser.id) }
            );
            studentEnrollments = data?.enrollmentStudent.map(e => String(e.courseId)) || [];
        }
    } else {
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
        roleSwitchContainer.style.display = 'none';
        addCourseBtn.classList.add('hidden');
        studentEnrollments = [];
    }
    loadCourses();
}

async function loadCourses() {
    const container = document.getElementById('courseContainer');
    const data = await fetchGraphQL(SERVICES.COURSE, `query { courses { id title description instructor } }`);
    
    if (!data || !data.courses) return;

    container.innerHTML = data.courses.map(course => {
        const isEnrolled = studentEnrollments.includes(String(course.id));
        
        return `
        <div class="course-card" onclick="viewCourseDetails('${course.id}')">
            <div class="course-header">
                <h3 class="course-title">${course.title}</h3>
                <div class="course-instructor">👤 ${course.instructor}</div>
            </div>
            <p class="course-description">${course.description || 'No description available.'}</p>
            <div class="course-actions">
                ${!isTeacher && currentUser ? 
                    `<button class="btn ${isEnrolled ? 'btn-secondary' : 'btn-primary'}" 
                              onclick="enrollInCourse(event, '${course.id}')" 
                              ${isEnrolled ? 'disabled' : ''}>
                        ${isEnrolled ? 'Already Enrolled' : 'Enroll'}
                    </button>` : 
                    `<button class="btn btn-secondary">View Details</button>`
                }
            </div>
        </div>`;
    }).join('');
}

async function enrollInCourse(event, courseId) {
    event.stopPropagation();
    if (!currentUser) return openModal('loginModal');

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Enrolling...';

    const mutation = `mutation($sid: Int, $cid: Int) {
        enroll(studentID: $sid, courseID: $cid) { id status }
    }`;
    
    const data = await fetchGraphQL(SERVICES.ENROLLMENT, mutation, {
        sid: parseInt(currentUser.id),
        cid: parseInt(courseId)
    });

    if (data) {
        showToast("Enrolled successfully!", "success");
        btn.textContent = 'Already Enrolled';
        btn.className = 'btn btn-secondary';
        studentEnrollments.push(String(courseId)); // Update local state
    } else {
        btn.disabled = false;
        btn.textContent = 'Enroll';
    }
}

// 4. View Course Details & Students (Teacher View)
async function viewCourseDetails(courseId) {
    currentCourseId = courseId;
    const courseData = await fetchGraphQL(SERVICES.COURSE, 
        `query($id: ID) { course(id: $id) { title description instructor } }`, { id: courseId });
    
    if (!courseData) return;

    document.getElementById('detailCourseTitle').textContent = courseData.course.title;
    document.getElementById('detailCourseInstructor').textContent = courseData.course.instructor;
    document.getElementById('detailCourseDescription').textContent = courseData.course.description;
    
    const listContainer = document.getElementById('enrolledStudentsList');
    listContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    openModal('courseDetailModal');

    // Fetch Enrollments for this course
    const enrollData = await fetchGraphQL(SERVICES.ENROLLMENT, 
        `query($id: Int) { enrollmentCourse(courseID: $id) { id studentId } }`, { id: parseInt(courseId) });

    if (enrollData && enrollData.enrollmentCourse.length > 0) {
        let html = '<label class="form-label">Enrolled Students</label>';
        for (const en of enrollData.enrollmentCourse) {
            // Fetch student name from Student Service
            const sData = await fetchGraphQL(SERVICES.STUDENT, 
                `query($id: ID) { student(id: $id) { nama email } }`, { id: en.studentId });
            
            // Fetch grade if it exists
            const gData = await fetchGraphQL(SERVICES.ENROLLMENT,
                `query($eid: Int) { gradeByEnrollment(enrollmentID: $eid) { grade } }`, { eid: parseInt(en.id) });

            html += `
                <div class="student-item">
                    <div class="student-info">
                        <div class="student-name">${sData.student.nama}</div>
                        <div class="student-email">${sData.student.email}</div>
                    </div>
                    <div class="student-grade">
                        ${gData?.gradeByEnrollment ? `<span class="grade-badge">${gData.gradeByEnrollment.grade}</span>` : ''}
                        ${isTeacher ? `<button class="btn btn-secondary btn-sm" onclick="openGradeModal('${en.id}', '${sData.student.nama}')">Grade</button>` : ''}
                    </div>
                </div>`;
        }
        listContainer.innerHTML = html;
    } else {
        listContainer.innerHTML = '<p class="empty-state">No students enrolled yet.</p>';
    }
}

// 5. Grading
let currentEnrollmentId = null;
window.openGradeModal = (enrollId, name) => {
    currentEnrollmentId = enrollId;
    document.getElementById('gradeStudentName').textContent = name;
    openModal('gradeStudentModal');
};

document.getElementById('gradeForm').onsubmit = async (e) => {
    e.preventDefault();
    const grade = document.getElementById('gradeValue').value;
    const mutation = `mutation($eid: Int, $g: String) { addGrade(enrollmentID: $eid, grade: $g) { id grade } }`;
    
    const data = await fetchGraphQL(SERVICES.ENROLLMENT, mutation, {
        eid: parseInt(currentEnrollmentId),
        g: grade
    });

    if (data) {
        showToast("Grade submitted!", "success");
        closeModal('gradeStudentModal');
        viewCourseDetails(currentCourseId);
    }
};

// --- Auth Mockup (Using Register as Login) ---
document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const mutation = `mutation($n: String, $e: String) {
        createStudent(nama: $n, email: $e, jurusan: "General", enrollmentYear: 2024) { id nama email }
    }`;
    const data = await fetchGraphQL(SERVICES.STUDENT, mutation, {
        n: document.getElementById('loginName').value,
        e: document.getElementById('loginEmail').value
    });

    if (data) {
        currentUser = data.createStudent;
        localStorage.setItem('eduHubUser', JSON.stringify(currentUser));
        closeModal('loginModal');
        updateUI();
        showToast(`Welcome, ${currentUser.nama}!`, 'success');
    }
};

// --- Event Listeners ---
document.getElementById('roleSwitch').onchange = (e) => {
    isTeacher = e.target.checked;
    updateUI();
};

document.getElementById('logoutBtn').onclick = () => {
    currentUser = null;
    localStorage.removeItem('eduHubUser');
    updateUI();
};

document.getElementById('loginBtn').onclick = () => openModal('loginModal');
document.getElementById('addCourseBtn').onclick = () => openModal('addCourseModal');

// Initial Load
window.onload = updateUI;