// ============================================
// 📁 المسار: assets/js/teacher.js
// الوصف: العقل المدبر لإدارة المعلم (طلاب، محتوى، إحصائيات)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من الصفحة الحالية وتشغيل الدالة المناسبة
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
    loadTeacherStats(); // تحميل الإحصائيات الحقيقية
}

function initializeContentLibraryPage() {
    const user = checkAuth();
    if (!user || user.role !== 'teacher') return;
    updateUserInterface(user);
    loadContentLibrary(); // دالة في content-library.js، لكننا سنضمن البيانات هنا
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
        // جلب الطلاب المرتبطين بهذا المعلم
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
                            <button class="btn btn-sm btn-primary" onclick="openStudentFile(${student.id})" title="ملف الطالب"><i class="fas fa-file-alt"></i></button>
                            <button class="btn btn-sm btn-secondary" onclick="showStudentLoginData(${student.id})" title="بيانات الدخول"><i class="fas fa-key"></i></button>
                            <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})" title="حذف"><i class="fas fa-trash"></i></button>
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
        id: Date.now(), // استخدام الوقت كمعرف فريد
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

function deleteStudent(studentId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.filter(u => u.id !== studentId);
    localStorage.setItem('users', JSON.stringify(users));
    loadStudentsData();
}

function openStudentFile(id) { window.location.href = `student-profile.html?id=${id}`; }

// ============================================
// 2. قسم إدارة المحتوى (حفظ الدروس والواجبات)
// ============================================

// دالة مساعدة لحفظ أي نوع محتوى
function saveContentItem(item) {
    const library = JSON.parse(localStorage.getItem('contentLibrary') || '[]');
    library.push(item);
    localStorage.setItem('contentLibrary', JSON.stringify(library));
}

// أ) حفظ الدرس
function saveLesson() {
    const title = document.getElementById('lessonTitle').value;
    const subject = document.getElementById('lessonSubject').value;
    
    if(!title) return alert('يرجى كتابة عنوان الدرس');

    const lesson = {
        id: Date.now(),
        type: 'lesson', // هذا النوع مهم للعد في الداشبورد
        title: title,
        subject: subject,
        date: new Date().toISOString(),
        questions: [], // سيتم تطويره لاحقاً لجمع الأسئلة من النموذج
        status: 'active'
    };

    saveContentItem(lesson);
    alert('تم حفظ الدرس بنجاح ✅');
    if(typeof closeModal === 'function') closeModal('createLessonModal');
    // إعادة تحميل المكتبة إذا كنا في صفحتها
    if(typeof loadContentLibrary === 'function') loadContentLibrary();
}

// ب) حفظ الواجب
function saveHomework() {
    const title = document.getElementById('homeworkTitle').value;
    const subject = document.getElementById('homeworkSubject').value;
    const desc = document.getElementById('homeworkDescription').value;

    if(!title) return alert('يرجى كتابة عنوان الواجب');

    const homework = {
        id: Date.now(),
        type: 'homework', // مهم للعد
        title: title,
        subject: subject,
        description: desc,
        date: new Date().toISOString(),
        status: 'active'
    };

    saveContentItem(homework);
    alert('تم حفظ الواجب بنجاح ✅');
    if(typeof closeModal === 'function') closeModal('createHomeworkModal');
    if(typeof loadContentLibrary === 'function') loadContentLibrary();
}

// ج) حفظ الاختبار
function saveTest() {
    const title = document.getElementById('testTitle').value;
    const subject = document.getElementById('testSubject').value;

    if(!title) return alert('العنوان مطلوب');

    const test = {
        id: Date.now(),
        type: 'test',
        title: title,
        subject: subject,
        date: new Date().toISOString()
    };

    saveContentItem(test);
    alert('تم حفظ الاختبار ✅');
    if(typeof closeModal === 'function') closeModal('createTestModal');
    if(typeof loadContentLibrary === 'function') loadContentLibrary();
}

// د) حفظ الهدف
function saveObjective() {
    const title = document.getElementById('shortTermGoal').value;
    const subject = document.getElementById('objSubject').value;

    if(!title) return alert('الهدف مطلوب');

    const objective = {
        id: Date.now(),
        type: 'objective',
        title: title,
        subject: subject,
        date: new Date().toISOString()
    };

    saveContentItem(objective);
    alert('تم حفظ الهدف ✅');
    if(typeof closeModal === 'function') closeModal('createObjectiveModal');
    if(typeof loadContentLibrary === 'function') loadContentLibrary();
}

// ============================================
// 3. قسم الإحصائيات (تحديث الداشبورد)
// ============================================

function loadTeacherStats() {
    const currentTeacher = getCurrentUser();
    if(!currentTeacher) return;

    // 1. عدد الطلاب
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const studentsCount = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id).length;
    
    // 2. عدد الدروس والواجبات (من مكتبة المحتوى)
    const library = JSON.parse(localStorage.getItem('contentLibrary') || '[]');
    const lessonsCount = library.filter(i => i.type === 'lesson' || i.type === 'interactive_lesson').length;
    const assignmentsCount = library.filter(i => i.type === 'homework' || i.type === 'assignment').length;

    // 3. عدد الرسائل
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    // نفترض أن الرسائل مخزنة بشكل عام حالياً، أو يمكن تصفيتها للمستخدم الحالي
    const messagesCount = messages.length; 

    // تحديث الواجهة (DOM)
    if(document.getElementById('studentsCount')) document.getElementById('studentsCount').innerText = studentsCount;
    if(document.getElementById('lessonsCount')) document.getElementById('lessonsCount').innerText = lessonsCount;
    if(document.getElementById('assignmentsCount')) document.getElementById('assignmentsCount').innerText = assignmentsCount;
    if(document.getElementById('unreadMessages')) document.getElementById('unreadMessages').innerText = messagesCount;
}

// دوال مساعدة إضافية
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

// تصدير الدوال للنطاق العام (Window) لضمان عمل onclick في HTML
window.addNewStudent = addNewStudent;
window.deleteStudent = deleteStudent;
window.saveLesson = saveLesson;
window.saveHomework = saveHomework;
window.saveTest = saveTest;
window.saveObjective = saveObjective;
window.openStudentFile = openStudentFile;
window.showStudentLoginData = showStudentLoginData;
window.copyToClipboard = copyToClipboard;
window.loadStudentsData = loadStudentsData;
