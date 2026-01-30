// ============================================
// 📁 المسار: assets/js/teacher.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('dashboard.html')) {
        initializeTeacherDashboard();
    } else if (window.location.pathname.includes('students.html')) {
        initializeStudentsPage();
    } else if (window.location.pathname.includes('content-library.html')) {
        initializeContentLibraryPage();
    }
});

// --- تهيئة الصفحات ---

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
    loadTeacherStats(); // تفعيل العدادات
}

function initializeContentLibraryPage() {
    const user = checkAuth();
    if (!user || user.role !== 'teacher') return;
    updateUserInterface(user);
    if(typeof loadContentLibrary === 'function') loadContentLibrary();
}

// ============================================
// 1. قسم إدارة الطلاب
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
            
            // ✅ تم إعادة الأزرار لشكلها الأصلي (نص + أيقونة) كما كانت
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
    }, 300);
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
    if(typeof closeAddStudentModal === 'function') closeAddStudentModal();
    loadStudentsData();
}

// ✅ دالة التعديل (تم التأكد من مطابقتها لمعرفات HTML)
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
        
        const usernameField = document.getElementById('editStudentUsername');
        if(usernameField) users[index].username = usernameField.value;
        
        const newPass = document.getElementById('editStudentPassword').value;
        if (newPass) users[index].password = newPass;

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

function openStudentFile(id) { window.location.href = `student-profile.html?id=${id}`; }

// ============================================
// 2. حفظ المحتوى (لضمان عمل العدادات في لوحة التحكم)
// ============================================

function saveContentItem(item) {
    const library = JSON.parse(localStorage.getItem('contentLibrary') || '[]');
    library.push(item);
    localStorage.setItem('contentLibrary', JSON.stringify(library));
}

function saveLesson() {
    const title = document.getElementById('lessonTitle').value;
    const subject = document.getElementById('lessonSubject').value;
    if(!title) return alert('يرجى كتابة عنوان الدرس');
    const lesson = { id: Date.now(), type: 'lesson', title: title, subject: subject, date: new Date().toISOString() };
    saveContentItem(lesson);
    alert('تم حفظ الدرس ✅');
    if(typeof closeModal === 'function') closeModal('createLessonModal');
    if(typeof loadContentLibrary === 'function') loadContentLibrary();
}

function saveHomework() {
    const title = document.getElementById('homeworkTitle').value;
    const subject = document.getElementById('homeworkSubject').value;
    if(!title) return alert('يرجى كتابة عنوان الواجب');
    const homework = { id: Date.now(), type: 'homework', title: title, subject: subject, date: new Date().toISOString() };
    saveContentItem(homework);
    alert('تم حفظ الواجب ✅');
    if(typeof closeModal === 'function') closeModal('createHomeworkModal');
    if(typeof loadContentLibrary === 'function') loadContentLibrary();
}

function saveTest() {
    const title = document.getElementById('testTitle').value;
    const subject = document.getElementById('testSubject').value;
    if(!title) return alert('العنوان مطلوب');
    const test = { id: Date.now(), type: 'test', title: title, subject: subject, date: new Date().toISOString() };
    saveContentItem(test);
    alert('تم حفظ الاختبار ✅');
    if(typeof closeModal === 'function') closeModal('createTestModal');
    if(typeof loadContentLibrary === 'function') loadContentLibrary();
}

function saveObjective() {
    const title = document.getElementById('shortTermGoal').value;
    const subject = document.getElementById('objSubject').value;
    if(!title) return alert('الهدف مطلوب');
    const objective = { id: Date.now(), type: 'objective', title: title, subject: subject, date: new Date().toISOString() };
    saveContentItem(objective);
    alert('تم حفظ الهدف ✅');
    if(typeof closeModal === 'function') closeModal('createObjectiveModal');
    if(typeof loadContentLibrary === 'function') loadContentLibrary();
}

// ============================================
// 3. تحديث إحصائيات لوحة التحكم
// ============================================

function loadTeacherStats() {
    const currentTeacher = getCurrentUser();
    if(!currentTeacher) return;

    // الطلاب
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const studentsCount = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id).length;
    
    // المحتوى
    const library = JSON.parse(localStorage.getItem('contentLibrary') || '[]');
    const lessonsCount = library.filter(i => i.type === 'lesson' || i.type === 'interactive_lesson').length;
    const assignmentsCount = library.filter(i => i.type === 'homework' || i.type === 'assignment').length;

    // الرسائل
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const messagesCount = messages.length; 

    // تحديث الواجهة
    if(document.getElementById('studentsCount')) document.getElementById('studentsCount').innerText = studentsCount;
    if(document.getElementById('lessonsCount')) document.getElementById('lessonsCount').innerText = lessonsCount;
    if(document.getElementById('assignmentsCount')) document.getElementById('assignmentsCount').innerText = assignmentsCount;
    if(document.getElementById('unreadMessages')) document.getElementById('unreadMessages').innerText = messagesCount;
}

// دوال مساعدة
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

// تصدير الدوال
window.addNewStudent = addNewStudent;
window.editStudent = editStudent;
window.updateStudentData = updateStudentData;
window.deleteStudent = deleteStudent;
window.saveLesson = saveLesson;
window.saveHomework = saveHomework;
window.saveTest = saveTest;
window.saveObjective = saveObjective;
window.openStudentFile = openStudentFile;
window.showStudentLoginData = showStudentLoginData;
window.copyToClipboard = copyToClipboard;
window.loadStudentsData = loadStudentsData;
