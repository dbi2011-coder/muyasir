// ============================================
// 📁 المسار: assets/js/teacher.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('dashboard.html')) {
        initializeTeacherDashboard();
    } else if (path.includes('students.html')) {
        initializeStudentsPage();
    }
    // ملاحظة: الصفحات الأخرى تدير نفسها أو تستدعي دوالاً عامة
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
    loadTeacherStats(); // تشغيل العدادات
}

// ============================================
// 1. تحديث إحصائيات لوحة التحكم (العدادات)
// ============================================
function loadTeacherStats() {
    const currentTeacher = getCurrentUser();
    if (!currentTeacher) return;

    // 1. الطلاب
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const studentsCount = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id).length;
    
    // 2. الدروس (من مفتاح lessons)
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lessonsCount = lessons.filter(l => l.teacherId === currentTeacher.id).length;
    
    // 3. الواجبات (من مفتاح assignments)
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const assignmentsCount = assignments.filter(a => a.teacherId === currentTeacher.id).length;

    // 4. الرسائل (من مفتاح teacherMessages)
    const messages = JSON.parse(localStorage.getItem('teacherMessages') || '[]');
    const messagesCount = messages.filter(m => m.teacherId === currentTeacher.id && m.isFromStudent && !m.isRead).length;

    // التحديث في الصفحة
    if (document.getElementById('studentsCount')) document.getElementById('studentsCount').innerText = studentsCount;
    if (document.getElementById('lessonsCount')) document.getElementById('lessonsCount').innerText = lessonsCount;
    if (document.getElementById('assignmentsCount')) document.getElementById('assignmentsCount').innerText = assignmentsCount;
    if (document.getElementById('unreadMessages')) document.getElementById('unreadMessages').innerText = messagesCount;
}

// ============================================
// 2. إدارة الطلاب
// ============================================
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
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.name}</td>
                    <td>${student.grade}</td>
                    <td>${student.subject}</td>
                    <td class="progress-cell">
                        <div class="progress-text text-${progressColor}">${progress}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill bg-${progressColor}" style="width: ${progress}%"></div>
                        </div>
                    </td>
                    <td>
                        <div class="student-actions" style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button class="btn btn-sm btn-primary" onclick="openStudentFile(${student.id})" title="ملف الطالب">
                                <i class="fas fa-file-alt"></i> ملف الطالب
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="showStudentLoginData(${student.id})" title="بيانات الدخول">
                                <i class="fas fa-key"></i> دخول
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="exportStudentJson(${student.id})" title="تصدير">
                                <i class="fas fa-file-export"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }, 200);
}

function addNewStudent() {
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;

    if (!name || !grade || !subject) {
        alert('يرجى ملء جميع الحقول');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentTeacher = getCurrentUser();

    const newStudent = {
        id: Date.now(),
        teacherId: currentTeacher.id,
        role: 'student',
        name: name,
        grade: grade,
        subject: subject,
        username: 's_' + Math.floor(Math.random() * 10000),
        password: '123',
        progress: 0,
        createdAt: new Date().toISOString()
    };

    users.push(newStudent);
    localStorage.setItem('users', JSON.stringify(users));

    alert('تم إضافة الطالب بنجاح ✅');
    closeAddStudentModal();
    loadStudentsData();
}

function editStudent(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id === studentId);
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
    const id = parseInt(document.getElementById('editStudentId').value);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.id === id);

    if (index !== -1) {
        users[index].name = document.getElementById('editStudentName').value;
        users[index].grade = document.getElementById('editStudentGrade').value;
        users[index].subject = document.getElementById('editStudentSubject').value;
        
        const userVal = document.getElementById('editStudentUsername').value;
        if(userVal) users[index].username = userVal;
        
        const passVal = document.getElementById('editStudentPassword').value;
        if (passVal) users[index].password = passVal;

        localStorage.setItem('users', JSON.stringify(users));
        alert('تم التحديث بنجاح ✅');
        document.getElementById('editStudentModal').classList.remove('show');
        loadStudentsData();
    }
}

function deleteStudent(studentId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.filter(u => u.id !== studentId);
    localStorage.setItem('users', JSON.stringify(users));
    loadStudentsData();
}

// أدوات مساعدة
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser')).user; }
function openStudentFile(id) { window.location.href = `student-profile.html?id=${id}`; }
function showStudentLoginData(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const s = users.find(u => u.id === id);
    if(s) {
        document.getElementById('loginDataUsername').value = s.username;
        document.getElementById('loginDataPassword').value = s.password;
        document.getElementById('studentLoginDataModal').classList.add('show');
    }
}
function copyToClipboard(id) {
    const el = document.getElementById(id);
    el.select();
    document.execCommand('copy');
    alert('تم النسخ');
}
function closeAddStudentModal() { document.getElementById('addStudentModal').classList.remove('show'); }
function showAddStudentModal() { document.getElementById('addStudentModal').classList.add('show'); }
function showImportStudentModal() { alert('قريباً'); }
function exportStudentJson() { alert('قريباً'); }
function searchStudents() {
    const term = document.getElementById('studentSearch').value.toLowerCase();
    document.querySelectorAll('#studentsTableBody tr').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
}
function filterStudents() {
    const grade = document.getElementById('gradeFilter').value;
    document.querySelectorAll('#studentsTableBody tr').forEach(row => {
        row.style.display = (grade === 'all' || row.children[2].innerText.includes(grade)) ? '' : 'none';
    });
}

// تصدير الدوال
window.addNewStudent = addNewStudent;
window.editStudent = editStudent;
window.updateStudentData = updateStudentData;
window.deleteStudent = deleteStudent;
window.openStudentFile = openStudentFile;
window.showStudentLoginData = showStudentLoginData;
window.copyToClipboard = copyToClipboard;
window.loadStudentsData = loadStudentsData;
window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.showImportStudentModal = showImportStudentModal;
window.exportStudentJson = exportStudentJson;
window.searchStudents = searchStudents;
window.filterStudents = filterStudents;
