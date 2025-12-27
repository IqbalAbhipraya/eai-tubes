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
    const editProfileBtn = document.getElementById('editProfileBtn');

    if (currentUser || isTeacher) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        roleSwitchContainer.style.display = 'flex';
        document.getElementById('userName').textContent = isTeacher ? "Teacher View" : currentUser.nama;
        document.getElementById('userAvatar').textContent = isTeacher ? "T" : currentUser.nama[0];
        addCourseBtn.classList.toggle('hidden', !isTeacher);

        // Show edit profile button only in student mode
        editProfileBtn.style.display = (!isTeacher && currentUser) ? 'block' : 'none';

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
        editProfileBtn.style.display = 'none';
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

    // Show course action buttons only in teacher mode
    const courseActionButtons = document.getElementById('courseActionButtons');
    courseActionButtons.style.display = isTeacher ? 'block' : 'none';

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

            // Skip if student no longer exists
            if (!sData || !sData.student) continue;

            // Fetch grade if it exists
            const gData = await fetchGraphQL(SERVICES.ENROLLMENT,
                `query($eid: Int) { gradeByEnrollment(enrollmentID: $eid) { id grade } }`, { eid: parseInt(en.id) });

            const isCurrentUser = currentUser && String(en.studentId) === String(currentUser.id);
            const gradeId = gData?.gradeByEnrollment?.id || null;
            const gradeValue = gData?.gradeByEnrollment?.grade || '';

            html += `
                <div class="student-item">
                    <div class="student-info">
                        <div class="student-name">${sData.student.nama}${isCurrentUser ? ' (You)' : ''}</div>
                        <div class="student-email">${sData.student.email}</div>
                    </div>
                    <div class="student-grade">
                        ${gradeValue ? `<span class="grade-badge">${gradeValue}</span>` : ''}
                        ${isTeacher ? `<button class="btn btn-secondary btn-sm" onclick="openGradeModal('${en.id}', '${sData.student.nama}', '${gradeId}', '${gradeValue}')">${gradeValue ? 'Update' : 'Grade'}</button>` : ''}
                        ${isTeacher && !isCurrentUser ? `<button class="btn btn-sm" style="background-color: #e74c3c; color: white; margin-left: 5px;" onclick="deleteStudent('${en.studentId}', '${sData.student.nama}')">Delete</button>` : ''}
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
let currentGradeId = null;

window.openGradeModal = (enrollId, name, gradeId, existingGrade) => {
    currentEnrollmentId = enrollId;
    currentGradeId = gradeId && gradeId !== 'null' ? gradeId : null;
    document.getElementById('gradeStudentName').textContent = name;
    document.getElementById('gradeValue').value = existingGrade && existingGrade !== 'null' ? existingGrade : '';
    document.getElementById('gradeSubmitBtn').textContent = currentGradeId ? 'Update Grade' : 'Submit Grade';
    openModal('gradeStudentModal');
};

document.getElementById('gradeForm').onsubmit = async (e) => {
    e.preventDefault();
    const grade = document.getElementById('gradeValue').value;
    let data;

    if (currentGradeId) {
        // Update existing grade
        const mutation = `mutation($id: ID, $g: String) { updateGrade(id: $id, grade: $g) { id grade } }`;
        data = await fetchGraphQL(SERVICES.ENROLLMENT, mutation, {
            id: currentGradeId,
            g: grade
        });
    } else {
        // Add new grade
        const mutation = `mutation($eid: Int, $g: String) { addGrade(enrollmentID: $eid, grade: $g) { id grade } }`;
        data = await fetchGraphQL(SERVICES.ENROLLMENT, mutation, {
            eid: parseInt(currentEnrollmentId),
            g: grade
        });
    }

    if (data) {
        showToast(currentGradeId ? "Grade updated!" : "Grade submitted!", "success");
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

// --- Add Course Form ---
document.getElementById('addCourseForm').onsubmit = async (e) => {
    e.preventDefault();
    const mutation = `mutation($title: String, $desc: String, $instructor: String) {
        createCourse(title: $title, description: $desc, instructor: $instructor) { id title description instructor }
    }`;

    const data = await fetchGraphQL(SERVICES.COURSE, mutation, {
        title: document.getElementById('courseTitle').value,
        desc: document.getElementById('courseDescription').value,
        instructor: document.getElementById('courseInstructor').value
    });

    if (data) {
        showToast("Course added successfully!", "success");
        closeModal('addCourseModal');
        document.getElementById('addCourseForm').reset();
        loadCourses();
    }
};

// --- Edit Course Functions ---
window.openEditCourseModal = async () => {
    const courseData = await fetchGraphQL(SERVICES.COURSE,
        `query($id: ID) { course(id: $id) { title description instructor } }`, { id: currentCourseId });

    if (courseData) {
        document.getElementById('editCourseTitle').value = courseData.course.title;
        document.getElementById('editCourseDescription').value = courseData.course.description || '';
        document.getElementById('editCourseInstructor').value = courseData.course.instructor;
        closeModal('courseDetailModal');
        openModal('editCourseModal');
    }
};

document.getElementById('editCourseForm').onsubmit = async (e) => {
    e.preventDefault();
    const mutation = `mutation($id: ID, $title: String, $desc: String, $instructor: String) {
        updateCourse(id: $id, title: $title, description: $desc, instructor: $instructor) { id title description instructor }
    }`;

    const data = await fetchGraphQL(SERVICES.COURSE, mutation, {
        id: currentCourseId,
        title: document.getElementById('editCourseTitle').value,
        desc: document.getElementById('editCourseDescription').value,
        instructor: document.getElementById('editCourseInstructor').value
    });

    if (data) {
        showToast("Course updated successfully!", "success");
        closeModal('editCourseModal');
        loadCourses();
        viewCourseDetails(currentCourseId);
    }
};

// --- Delete Course Function ---
window.deleteCourse = async () => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    const mutation = `mutation($id: ID) { deleteCourse(id: $id) { id } }`;
    const data = await fetchGraphQL(SERVICES.COURSE, mutation, { id: currentCourseId });

    if (data) {
        showToast("Course deleted successfully!", "success");
        closeModal('courseDetailModal');
        loadCourses();
    }
};

// --- Delete Student Function ---
window.deleteStudent = async (studentId, studentName) => {
    if (!confirm(`Are you sure you want to delete student "${studentName}"? This will remove all their enrollments and grades.`)) return;

    const mutation = `mutation($id: ID) { deleteStudent(id: $id) { id } }`;
    const data = await fetchGraphQL(SERVICES.STUDENT, mutation, { id: studentId });

    if (data) {
        showToast("Student deleted successfully!", "success");
        viewCourseDetails(currentCourseId);
    }
};

// --- Edit Profile Functions ---
document.getElementById('editProfileBtn').onclick = () => {
    if (!currentUser) return;

    document.getElementById('editProfileName').value = currentUser.nama || '';
    document.getElementById('editProfileEmail').value = currentUser.email || '';
    document.getElementById('editProfileJurusan').value = currentUser.jurusan || '';
    document.getElementById('editProfileYear').value = currentUser.enrollmentYear || '';
    openModal('editProfileModal');
};

document.getElementById('editProfileForm').onsubmit = async (e) => {
    e.preventDefault();
    const mutation = `mutation($id: ID, $nama: String, $email: String, $jurusan: String, $year: Int) {
        updateStudent(id: $id, nama: $nama, email: $email, jurusan: $jurusan, enrollmentYear: $year) 
        { id nama email jurusan enrollmentYear }
    }`;

    const data = await fetchGraphQL(SERVICES.STUDENT, mutation, {
        id: currentUser.id,
        nama: document.getElementById('editProfileName').value,
        email: document.getElementById('editProfileEmail').value,
        jurusan: document.getElementById('editProfileJurusan').value,
        year: parseInt(document.getElementById('editProfileYear').value) || null
    });

    if (data) {
        currentUser = data.updateStudent;
        localStorage.setItem('eduHubUser', JSON.stringify(currentUser));
        showToast("Profile updated successfully!", "success");
        closeModal('editProfileModal');
        updateUI();
    }
};

// Initial Load
window.onload = updateUI;