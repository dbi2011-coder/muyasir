// إدارة لوحة تحكم المعلم وإدارة الطلاب

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

// 1. تحديث دالة تحميل بيانات الطلاب لتعكس الأزرار الجديدة
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
                        <div class="action-buttons" style="flex-wrap: wrap;">
                            <button class="btn btn-sm btn-primary" onclick="openStudentFile(${student.id})" title="فتح ملف الطالب">
                                <i class="fas fa-file-alt"></i> ملف الطالب
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="showStudentLoginData(${student.id})" title="عرض بيانات الدخول">
                                <i class="fas fa-key"></i> بيانات الدخول
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})" title="تعديل البيانات">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                            <button class="btn btn-sm btn-info" onclick="exportStudentJson(${student.id})" title="تصدير البيانات">
                                <i class="fas fa-file-export"></i> تصدير
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})" title="حذف الطالب">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }, 500);
}

// 2. دالة فتح ملف الطالب (الواجهة الجديدة)
function openStudentFile(studentId) {
    window.location.href = `student-profile.html?id=${studentId}`;
}

// 3. دالة تصدير بيانات الطالب كملف JSON
function exportStudentJson(studentId) {
    const students = JSON.parse(localStorage.getItem('users') || '[]');
    const student = students.find(u => u.id === studentId);
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }

    // تجميع كافة البيانات المرتبطة بالطالب
    const allData = {
        studentProfile: student,
        iep: (JSON.parse(localStorage.getItem('educationalPlans') || '[]')).find(p => p.studentId === studentId),
        tests: (JSON.parse(localStorage.getItem('studentTests') || '[]')).filter(t => t.studentId === studentId),
        lessons: (JSON.parse(localStorage.getItem('studentLessons') || '[]')).filter(l => l.studentId === studentId),
        assignments: (JSON.parse(localStorage.getItem('studentAssignments') || '[]')).filter(a => a.studentId === studentId),
        progress: (JSON.parse(localStorage.getItem('studentProgress') || '[]')).find(p => p.studentId === studentId),
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_${student.name.replace(/\s+/g, '_')}_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAuthNotification('تم تصدير ملف الطالب بنجاح', 'success');
}

// 4. دالة عرض بيانات الدخول
function showStudentLoginData(studentId) {
    const students = JSON.parse(localStorage.getItem('users') || '[]');
    const student = students.find(u => u.id === studentId);
    
    if (!student) return;

    document.getElementById('loginDataUsername').value = student.username || generateUsername(student.name);
    document.getElementById('loginDataPassword').value = student.password || '123456';
    
    // إذا لم يكن لديه بيانات، قم بحفظ البيانات الافتراضية
    if (!student.username) {
        student.username = document.getElementById('loginDataUsername').value;
        student.password = document.getElementById('loginDataPassword').value;
        localStorage.setItem('users', JSON.stringify(students));
    }

    document.getElementById('studentLoginDataModal').classList.add('show');
}

// 5. دالة تعديل الطالب (تحضير المودال)
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

// 6. حفظ تعديلات الطالب
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
        showAuthNotification('تم تحديث بيانات الطالب بنجاح', 'success');
        document.getElementById('editStudentModal').classList.remove('show');
        loadStudentsData();
    }
}

// 7. حذف الطالب
function deleteStudent(studentId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع البيانات المرتبطة به ولا يمكن التراجع عن هذا الإجراء.')) return;

    // حذف من المستخدمين
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.filter(u => u.id !== studentId);
    localStorage.setItem('users', JSON.stringify(users));

    // حذف من الخطط
    let plans = JSON.parse(localStorage.getItem('educationalPlans') || '[]');
    plans = plans.filter(p => p.studentId !== studentId);
    localStorage.setItem('educationalPlans', JSON.stringify(plans));

    // يمكن إضافة حذف من الجداول الأخرى (tests, lessons...) هنا

    showAuthNotification('تم حذف الطالب بنجاح', 'success');
    loadStudentsData();
}

// وظائف مساعدة
function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    showAuthNotification('تم النسخ', 'success');
}

function generateUsername(name) {
    return 'std_' + Math.floor(Math.random() * 10000);
}

// النوافذ المنبثقة
function showAddStudentModal() { document.getElementById('addStudentModal').classList.add('show'); }
function closeAddStudentModal() { document.getElementById('addStudentModal').classList.remove('show'); }
function showImportStudentModal() { /* منطق الاستيراد */ alert('ميزة الاستيراد'); }

// البحث
function searchStudents() {
    const term = document.getElementById('studentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}
