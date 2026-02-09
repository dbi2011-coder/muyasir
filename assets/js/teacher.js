// ============================================
// 📁 الملف: assets/js/teacher.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('dashboard.html')) initializeTeacherDashboard();
    else if (path.includes('students.html')) initializeStudentsPage();
});

function initializeStudentsPage() {
    const user = checkAuth();
    if (!user || user.role !== 'teacher') return;
    updateUserInterface(user);
    loadStudentsData();
}

function initializeTeacherDashboard() {
    const user = checkAuth();
    if (!user || user.role !== 'teacher') return;
    updateUserInterface(user);
    loadTeacherStats();
}

function loadTeacherStats() {
    const currentTeacher = getCurrentUser();
    if (!currentTeacher) return;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const studentsCount = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id).length;
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lessonsCount = lessons.filter(l => l.teacherId === currentTeacher.id).length;
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const assignmentsCount = assignments.filter(a => a.teacherId === currentTeacher.id).length;
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const messagesCount = messages.filter(m => m.teacherId === currentTeacher.id && m.isFromStudent && !m.isRead).length;

    if (document.getElementById('studentsCount')) document.getElementById('studentsCount').innerText = studentsCount;
    if (document.getElementById('lessonsCount')) document.getElementById('lessonsCount').innerText = lessonsCount;
    if (document.getElementById('assignmentsCount')) document.getElementById('assignmentsCount').innerText = assignmentsCount;
    if (document.getElementById('unreadMessages')) document.getElementById('unreadMessages').innerText = messagesCount;
}

function loadStudentsData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;

    if(loadingState) loadingState.style.display = 'block';
    if(emptyState) emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentTeacher = getCurrentUser();
        const students = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id);
        
        if(loadingState) loadingState.style.display = 'none';
        
        if (students.length === 0) {
            if(emptyState) emptyState.style.display = 'block';
            return;
        }

        tableBody.innerHTML = students.map((student, index) => {
            const progress = student.progress || 0;
            const progressColor = progress >= 80 ? 'success' : progress >= 50 ? 'warning' : 'danger';
            return `<tr><td>${index + 1}</td><td>${student.name}</td><td>${student.grade}</td><td>${student.subject}</td><td class="progress-cell"><div class="progress-text text-${progressColor}">${progress}%</div><div class="progress-bar"><div class="progress-fill bg-${progressColor}" style="width: ${progress}%"></div></div></td><td><div class="student-actions" style="display: flex; gap: 5px; flex-wrap: wrap;"><button class="btn btn-sm btn-primary" onclick="openStudentFile(${student.id})">ملف</button><button class="btn btn-sm btn-secondary" onclick="showStudentLoginData(${student.id})">بيانات</button><button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})">تعديل</button><button class="btn btn-sm btn-info" onclick="exportStudentData(${student.id})">تصدير</button><button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})">حذف</button></div></td></tr>`;
        }).join('');
    }, 200);
}

function addNewStudent() {
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;

    if (!name || !grade || !subject) return alert('يرجى ملء جميع الحقول');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const allAccounts = [...users, ...committeeMembers];
    const currentTeacher = getCurrentUser();

    let username = '';
    let password = '123';
    let isUnique = false;

    while (!isUnique) {
        username = 's_' + Math.floor(Math.random() * 10000);
        const exists = allAccounts.some(u => String(u.username) === String(username) && String(u.password) === String(password));
        if (!exists) isUnique = true;
    }

    const newStudent = {
        id: Date.now(), teacherId: currentTeacher.id, role: 'student', name: name, grade: grade, subject: subject, username: username, password: password, progress: 0, createdAt: new Date().toISOString()
    };
    users.push(newStudent);
    localStorage.setItem('users', JSON.stringify(users));
    alert('تم إضافة الطالب بنجاح ✅');
    closeAddStudentModal(); loadStudentsData();
}

function editStudent(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id == studentId);
    if (!student) return;
    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentGrade').value = student.grade;
    document.getElementById('editStudentSubject').value = student.subject;
    if(document.getElementById('editStudentUsername')) document.getElementById('editStudentUsername').value = student.username || '';
    if(document.getElementById('editStudentPassword')) document.getElementById('editStudentPassword').value = '';
    document.getElementById('editStudentModal').classList.add('show');
}

function updateStudentData() {
    const idInput = document.getElementById('editStudentId').value;
    const currentId = String(idInput);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => String(u.id) === currentId);

    if (index !== -1) {
        const currentUser = users[index];
        const newName = document.getElementById('editStudentName').value.trim();
        const newGrade = document.getElementById('editStudentGrade').value;
        const newSubject = document.getElementById('editStudentSubject').value;
        
        let finalUsername = document.getElementById('editStudentUsername').value.trim() || currentUser.username;
        let finalPassword = document.getElementById('editStudentPassword').value.trim() || currentUser.password;

        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const allAccounts = [...users, ...committeeMembers];

        const duplicateUser = allAccounts.find(u => {
            if (String(u.id) === currentId) return false;
            const uName = String(u.username || '').trim();
            const uPass = String(u.password || '').trim();
            return uName === String(finalUsername) && uPass === String(finalPassword);
        });
        
        if (duplicateUser) {
            alert('اسم المستخدم غير متاح . يرجى اختيار اسم آخر');
            return;
        }

        users[index].name = newName; users[index].grade = newGrade; users[index].subject = newSubject;
        users[index].username = finalUsername; users[index].password = finalPassword;
        localStorage.setItem('users', JSON.stringify(users));
        alert('تم التحديث بنجاح ✅');
        document.getElementById('editStudentModal').classList.remove('show');
        loadStudentsData();
    } else { alert('خطأ: الطالب غير موجود.'); }
}

// 🔥 تحديث الحذف
function deleteStudent(studentId) {
    showConfirmModal('⚠️ هل أنت متأكد من حذف هذا الطالب؟', function() {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users = users.filter(u => u.id != studentId);
        localStorage.setItem('users', JSON.stringify(users));
        showSuccess('تم الحذف بنجاح');
        loadStudentsData();
    });
}

function exportStudentData(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id == studentId);
    if (!student) return alert('بيانات الطالب غير موجودة');
    const exportData = {
        info: student,
        data: {
            tests: getStudentData('studentTests', studentId),
            lessons: getStudentData('studentLessons', studentId),
            assignments: getStudentData('studentAssignments', studentId),
            progress: getStudentData('studentProgress', studentId),
            events: getStudentData('studentEvents', studentId),
            activities: getStudentData('studentActivities', studentId)
        }, meta: { exportedBy: getCurrentUser().name, date: new Date().toISOString() }
    };
    const fileName = `student_${student.name}.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function showImportStudentModal() {
    const fileInput = document.getElementById('studentJsonFile'); if(fileInput) fileInput.value = '';
    const modal = document.getElementById('importStudentModal'); if(modal) modal.classList.add('show');
}

function processStudentImport() {
    const fileInput = document.getElementById('studentJsonFile');
    if (!fileInput || !fileInput.files[0]) return alert('يرجى اختيار ملف الطالب أولاً');
    const currentUser = getCurrentUser();
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!imported.info || !imported.data) throw new Error('الملف غير صالح');
            const studentInfo = imported.info;
            studentInfo.teacherId = currentUser.id; 

            let users = JSON.parse(localStorage.getItem('users') || '[]');
            const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
            const allAccounts = [...users, ...committeeMembers];

            const collision = allAccounts.find(u => u.username === studentInfo.username && u.password === studentInfo.password && u.id != studentInfo.id);

            if(collision && collision.id != studentInfo.id) {
                studentInfo.username = studentInfo.username + '_imp';
                alert('تنبيه: تم تعديل اسم المستخدم تلقائياً لوجود تطابق في البيانات.');
            }

            const existingIndex = users.findIndex(u => u.username === studentInfo.username);
            
            const doImport = () => {
                users.push(studentInfo);
                localStorage.setItem('users', JSON.stringify(users));
                mergeData('studentTests', imported.data.tests); mergeData('studentLessons', imported.data.lessons); mergeData('studentAssignments', imported.data.assignments); mergeData('studentProgress', imported.data.progress); mergeData('studentEvents', imported.data.events); mergeData('studentActivities', imported.data.activities);
                alert('تم الاستيراد بنجاح'); closeModal('importStudentModal'); loadStudentsData();
            };

            if (existingIndex !== -1) {
                showConfirmModal(`الطالب "${studentInfo.name}" موجود. هل تريد تحديث بياناته؟`, function() {
                    cleanStudentOldData(users[existingIndex].id);
                    users.splice(existingIndex, 1);
                    doImport();
                });
            } else {
                doImport();
            }

        } catch (err) { alert('خطأ: ' + err.message); }
    }; reader.readAsText(fileInput.files[0]);
}

function getStudentData(key, id) { return JSON.parse(localStorage.getItem(key) || '[]').filter(x => x.studentId == id); }
function mergeData(key, newData) { if (!newData || !newData.length) return; let current = JSON.parse(localStorage.getItem(key) || '[]'); current = current.filter(x => x.studentId != newData[0].studentId); localStorage.setItem(key, JSON.stringify([...current, ...newData])); }
function cleanStudentOldData(id) { ['studentTests', 'studentLessons', 'studentAssignments', 'studentEvents'].forEach(key => { let data = JSON.parse(localStorage.getItem(key) || '[]'); localStorage.setItem(key, JSON.stringify(data.filter(x => x.studentId != id))); }); }
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
function openStudentFile(id) { window.location.href = `student-profile.html?id=${id}`; }
function showStudentLoginData(id) { const users = JSON.parse(localStorage.getItem('users') || '[]'); const s = users.find(u => u.id == id); if(s) { document.getElementById('loginDataUsername').value = s.username; document.getElementById('loginDataPassword').value = s.password; document.getElementById('studentLoginDataModal').classList.add('show'); } }
function copyToClipboard(id) { const el = document.getElementById(id); el.select(); document.execCommand('copy'); alert('تم النسخ'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function closeAddStudentModal() { document.getElementById('addStudentModal').classList.remove('show'); }
function showAddStudentModal() { document.getElementById('addStudentModal').classList.add('show'); }
function searchStudents() { const term = document.getElementById('studentSearch').value.toLowerCase(); document.querySelectorAll('#studentsTableBody tr').forEach(row => { row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none'; }); }
function filterStudents() { const grade = document.getElementById('gradeFilter').value; document.querySelectorAll('#studentsTableBody tr').forEach(row => { row.style.display = (grade === 'all' || row.children[2].innerText.includes(grade)) ? '' : 'none'; }); }

window.addNewStudent = addNewStudent; window.editStudent = editStudent; window.updateStudentData = updateStudentData;
window.deleteStudent = deleteStudent; window.openStudentFile = openStudentFile; window.showStudentLoginData = showStudentLoginData;
window.copyToClipboard = copyToClipboard; window.loadStudentsData = loadStudentsData; window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal; window.showImportStudentModal = showImportStudentModal; window.exportStudentData = exportStudentData;
window.processStudentImport = processStudentImport; window.searchStudents = searchStudents; window.filterStudents = filterStudents; window.closeModal = closeModal;
