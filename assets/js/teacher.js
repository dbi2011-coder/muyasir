// ============================================
// 📁 المسار: assets/js/teacher.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من الصفحة الحالية وتشغيل الدالة المناسبة
    if (window.location.pathname.includes('dashboard.html')) {
        initializeTeacherDashboard();
    } else if (window.location.pathname.includes('students.html')) {
        initializeStudentsPage();
    }
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

// 1. عرض بيانات الطلاب في الجدول
function loadStudentsData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;

    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentTeacher = getCurrentUser();
        const students = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id);
        
        loadingState.style.display = 'none';
        
        if (students.length === 0) {
            emptyState.style.display = 'block';
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
    }, 500);
}

// 2. إضافة طالب جديد (الدالة التي كانت مفقودة)
function addNewStudent() {
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;

    if (!name || !grade || !subject) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentTeacher = getCurrentUser();

    const newStudent = {
        id: generateId(),
        teacherId: currentTeacher.id,
        role: 'student',
        name: name,
        grade: grade,
        subject: subject,
        username: generateUsername(name), // توليد اسم مستخدم تلقائي
        password: '123', // كلمة مرور افتراضية
        progress: 0,
        createdAt: new Date().toISOString()
    };

    users.push(newStudent);
    localStorage.setItem('users', JSON.stringify(users));

    showAuthNotification('تم إضافة الطالب بنجاح', 'success');
    closeAddStudentModal();
    loadStudentsData();
}

// 3. فتح ملف الطالب
function openStudentFile(studentId) {
    window.location.href = `student-profile.html?id=${studentId}`;
}

// 4. تصدير بيانات الطالب
function exportStudentJson(studentId) {
    const students = JSON.parse(localStorage.getItem('users') || '[]');
    const student = students.find(u => u.id === studentId);
    
    if (!student) return;

    const allData = {
        studentProfile: student,
        iep: (JSON.parse(localStorage.getItem('educationalPlans') || '[]')).find(p => p.studentId === studentId),
        tests: (JSON.parse(localStorage.getItem('studentTests') || '[]')).filter(t => t.studentId === studentId),
        lessons: (JSON.parse(localStorage.getItem('studentLessons') || '[]')).filter(l => l.studentId === studentId),
        assignments: (JSON.parse(localStorage.getItem('studentAssignments') || '[]')).filter(a => a.studentId === studentId),
        progress: (JSON.parse(localStorage.getItem('studentProgress') || '[]')).find(p => p.studentId === studentId)
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_${student.name}_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAuthNotification('تم تصدير ملف الطالب', 'success');
}

// 5. عرض وتوليد بيانات الدخول
function showStudentLoginData(studentId) {
    const students = JSON.parse(localStorage.getItem('users') || '[]');
    const student = students.find(u => u.id === studentId);
    
    if (!student) return;

    // إذا لم تكن لديه بيانات دخول، قم بتوليدها
    if (!student.username) {
        student.username = generateUsername(student.name);
        student.password = '123';
        localStorage.setItem('users', JSON.stringify(students));
    }

    document.getElementById('loginDataUsername').value = student.username;
    document.getElementById('loginDataPassword').value = student.password;
    
    document.getElementById('studentLoginDataModal').classList.add('show');
}

// 6. تحضير تعديل الطالب
function editStudent(studentId) {
    const students = JSON.parse(localStorage.getItem('users') || '[]');
    const student = students.find(u => u.id === studentId);
    
    if (!student) return;

    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentGrade').value = student.grade;
    document.getElementById('editStudentSubject').value = student.subject;
    document.getElementById('editStudentUsername').value = student.username || '';
    document.getElementById('editStudentPassword').value = student.password || '';

    document.getElementById('editStudentModal').classList.add('show');
}

// 7. حفظ تعديلات الطالب
function updateStudentData() {
    const id = parseInt(document.getElementById('editStudentId').value);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.id === id);

    if (index !== -1) {
        users[index].name = document.getElementById('editStudentName').value;
        users[index].grade = document.getElementById('editStudentGrade').value;
        users[index].subject = document.getElementById('editStudentSubject').value;
        users[index].username = document.getElementById('editStudentUsername').value;
        
        const newPass = document.getElementById('editStudentPassword').value;
        if (newPass) users[index].password = newPass;

        localStorage.setItem('users', JSON.stringify(users));
        showAuthNotification('تم التحديث بنجاح', 'success');
        document.getElementById('editStudentModal').classList.remove('show');
        loadStudentsData();
    }
}

// 8. حذف الطالب
function deleteStudent(studentId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب وجميع بياناته؟')) return;

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.filter(u => u.id !== studentId);
    localStorage.setItem('users', JSON.stringify(users));

    // حذف البيانات المرتبطة (اختياري، للتنظيف)
    // يمكن إضافة كود لحذف الاختبارات والدروس المرتبطة هنا

    showAuthNotification('تم حذف الطالب', 'success');
    loadStudentsData();
}

// دوال المودال (النوافذ المنبثقة)
function showAddStudentModal() { 
    document.getElementById('addStudentModal').classList.add('show'); 
    document.getElementById('addStudentForm').reset();
}
function closeAddStudentModal() { document.getElementById('addStudentModal').classList.remove('show'); }
function showImportStudentModal() { alert('ميزة الاستيراد قيد التطوير'); }
function closeLoginDataModal() { document.getElementById('studentLoginDataModal').classList.remove('show'); }

// أدوات مساعدة
function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    showAuthNotification('تم النسخ', 'success');
}

function generateUsername(name) {
    // توليد اسم مستخدم بسيط (أول حرفين + رقم عشوائي)
    return 's_' + Math.floor(Math.random() * 10000);
}

function generateId() {
    return Math.floor(Math.random() * 1000000);
}

function searchStudents() {
    const term = document.getElementById('studentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

function filterStudents() {
    const grade = document.getElementById('gradeFilter').value;
    const rows = document.querySelectorAll('#studentsTableBody tr');
    rows.forEach(row => {
        const rowGrade = row.children[2].innerText; // العمود الثالث هو الصف
        if (grade === 'all' || rowGrade.includes(grade)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// محاكاة إحصائيات المعلم للوحة التحكم الرئيسية
function loadTeacherStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentTeacher = getCurrentUser();
    const students = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id);
    
    if(document.getElementById('studentsCount')) {
        document.getElementById('studentsCount').textContent = students.length;
    }
}
