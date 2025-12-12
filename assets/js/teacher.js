// إدارة لوحة تحكم المعلم
document.addEventListener('DOMContentLoaded', function() {
    initializeTeacherDashboard();
});

function initializeTeacherDashboard() {
    // التحقق من المصادقة والدور
    const user = checkAuth();
    if (!user) return;
    
    if (user.role !== 'teacher') {
        showAuthNotification('غير مصرح لك بالوصول إلى هذه الصفحة', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }

    // تحديث واجهة المستخدم
    updateUserInterface(user);
    
    // تحميل البيانات
    loadTeacherStats();
    loadFeaturedStudents();
    loadRecentActivity();
    loadImportantNotices();
    
    // إذا كانت صفحة الطلاب، تحميل بياناتهم
    if (window.location.pathname.includes('students.html')) {
        loadStudentsData();
    }
}

function loadTeacherStats() {
    // محاكاة تحميل الإحصائيات
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentTeacher = getCurrentUser();
        const students = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id);
        
        // محاكاة بيانات أخرى
        document.getElementById('studentsCount').textContent = students.length;
        document.getElementById('lessonsCount').textContent = Math.floor(Math.random() * 20) + 5;
        document.getElementById('assignmentsCount').textContent = Math.floor(Math.random() * 10) + 1;
        document.getElementById('unreadMessages').textContent = Math.floor(Math.random() * 5);
        
        // تحديث عدد الإشعارات
        document.getElementById('notificationCount').textContent = Math.floor(Math.random() * 3);
    }, 1000);
}

function loadFeaturedStudents() {
    const featuredList = document.getElementById('featuredStudentsList');
    if (!featuredList) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentTeacher = getCurrentUser();
    const students = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id);
    
    // أخذ أول 4 طلاب كمثال للطلاب المميزين
    const featuredStudents = students.slice(0, 4);
    
    if (featuredStudents.length === 0) {
        featuredList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">لا توجد بيانات للعرض</p>';
        return;
    }

    featuredList.innerHTML = featuredStudents.map(student => `
        <div class="student-card">
            <div class="student-avatar">${student.name.charAt(0)}</div>
            <div class="student-name">${student.name}</div>
            <div class="student-progress">تقدم ${Math.floor(Math.random() * 100)}%</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.floor(Math.random() * 100)}%"></div>
            </div>
        </div>
    `).join('');
}

function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    const activities = [
        {
            icon: '👨‍🎓',
            title: 'تم إضافة طالب جديد',
            time: 'منذ 5 دقائق',
            color: '#3498db'
        },
        {
            icon: '📚',
            title: 'تم إنشاء درس جديد',
            time: 'منذ ساعة',
            color: '#27ae60'
        },
        {
            icon: '📝',
            title: 'طالب أنجز واجباً',
            time: 'منذ 3 ساعات',
            color: '#f39c12'
        },
        {
            icon: '💬',
            title: 'رسالة جديدة من طالب',
            time: 'منذ يوم',
            color: '#e74c3c'
        }
    ];

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.color}20; color: ${activity.color}">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

function loadImportantNotices() {
    const noticesList = document.getElementById('noticesList');
    if (!noticesList) return;

    const notices = [
        {
            icon: '⚠️',
            title: 'اجتماع لجنة الصعوبات',
            description: 'اجتماع شهري مع لجنة الصعوبات يوم الأحد القادم'
        },
        {
            icon: '📊',
            title: 'تقرير الأداء الشهري',
            description: 'يرجى مراجعة تقرير الأداء الشهري وإرسال الملاحظات'
        },
        {
            icon: '🎓',
            title: 'تدريب جديد متاح',
            description: 'تدريب حول استراتيجيات التعلم النشط متاح الآن'
        }
    ];

    noticesList.innerHTML = notices.map(notice => `
        <div class="notice-item">
            <div class="notice-icon">${notice.icon}</div>
            <div class="notice-content">
                <div class="notice-title">${notice.title}</div>
                <div class="notice-description">${notice.description}</div>
            </div>
        </div>
    `).join('');
}

function loadStudentsData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');
    
    if (!tableBody) return;

    // إظهار حالة التحميل
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

        // تعبئة الجدول
        tableBody.innerHTML = students.map((student, index) => {
            const progress = Math.floor(Math.random() * 100);
            const progressColor = progress >= 80 ? 'success' : progress >= 50 ? 'warning' : 'danger';
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.name}</td>
                    <td>الصف ${student.grade}</td>
                    <td>${student.subject}</td>
                    <td class="progress-cell">
                        <div class="progress-text text-${progressColor}">${progress}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill bg-${progressColor}" style="width: ${progress}%"></div>
                        </div>
                    </td>
                    <td>
                        <div class="student-actions">
                            <button class="btn btn-sm btn-primary" onclick="viewStudent(${student.id})" title="عرض">
                                👁️
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})" title="تعديل">
                                ✏️
                            </button>
                            <button class="btn btn-sm btn-info" onclick="exportStudent(${student.id})" title="تصدير">
                                📤
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="manageLoginData(${student.id})" title="بيانات الدخول">
                                🔑
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})" title="حذف">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }, 1500);
}

function showAddStudentModal() {
    document.getElementById('addStudentModal').classList.add('show');
}

function closeAddStudentModal() {
    document.getElementById('addStudentModal').classList.remove('show');
    document.getElementById('addStudentForm').reset();
}

function showImportStudentModal() {
    document.getElementById('importStudentModal').classList.add('show');
}

function closeImportStudentModal() {
    document.getElementById('importStudentModal').classList.remove('show');
    document.getElementById('studentFile').value = '';
    document.getElementById('fileInfo').style.display = 'none';
}

function addNewStudent() {
    const form = document.getElementById('addStudentForm');
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;

    // التحقق من صحة البيانات
    if (!name || !grade || !subject) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentTeacher = getCurrentUser();

    // إنشاء الطالب الجديد
    const newStudent = {
        id: generateId(),
        teacherId: currentTeacher.id,
        role: 'student',
        name: name,
        grade: grade,
        subject: subject,
        progress: 0,
        createdAt: new Date().toISOString(),
        lastActive: null
    };

    users.push(newStudent);
    localStorage.setItem('users', JSON.stringify(users));

    showAuthNotification('تم إضافة الطالب بنجاح', 'success');
    closeAddStudentModal();
    loadStudentsData();
}

function viewStudent(studentId) {
    // حفظ معرف الطالب في التخزين المؤقت للوصول إليه من صفحة الطالب
    sessionStorage.setItem('currentStudentId', studentId);
    window.location.href = 'student-profile.html';
}

function editStudent(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id === studentId && u.role === 'student');
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }

    // تعبئة النموذج في نافذة منبثقة (سيتم تطويرها بالكامل لاحقاً)
    const newName = prompt('أدخل الاسم الجديد للطالب:', student.name);
    const newGrade = prompt('أدخل الصف الجديد:', student.grade);
    
    if (newName && newGrade) {
        const studentIndex = users.findIndex(u => u.id === studentId);
        users[studentIndex].name = newName;
        users[studentIndex].grade = newGrade;
        
        localStorage.setItem('users', JSON.stringify(users));
        showAuthNotification('تم تحديث بيانات الطالب بنجاح', 'success');
        loadStudentsData();
    }
}

function exportStudent(studentId) {
    showAuthNotification('جاري تجهيز ملف التصدير...', 'info');
    // محاكاة عملية التصدير
    setTimeout(() => {
        showAuthNotification('تم تصدير بيانات الطالب بنجاح', 'success');
    }, 2000);
}

function manageLoginData(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id === studentId && u.role === 'student');
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }

    if (!student.username) {
        // إنشاء بيانات دخول تلقائية
        const username = `student${studentId}`;
        const password = generatePassword();
        
        const studentIndex = users.findIndex(u => u.id === studentId);
        users[studentIndex].username = username;
        users[studentIndex].password = password;
        
        localStorage.setItem('users', JSON.stringify(users));
        
        showAuthNotification(`تم إنشاء بيانات الدخول:<br>اسم المستخدم: ${username}<br>كلمة المرور: ${password}`, 'success');
    } else {
        // عرض بيانات الدخول الحالية
        showAuthNotification(`بيانات الدخول الحالية:<br>اسم المستخدم: ${student.username}<br>كلمة المرور: ${student.password}`, 'info');
    }
}

function deleteStudent(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id === studentId && u.role === 'student');
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }

    if (confirm(`هل أنت متأكد من حذف الطالب ${student.name}؟ هذا الإجراء سيحذف جميع بيانات الطالب ولا يمكن التراجع عنه.`)) {
        const updatedUsers = users.filter(u => u.id !== studentId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        showAuthNotification('تم حذف الطالب بنجاح', 'success');
        loadStudentsData();
    }
}

function searchStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const grade = row.cells[2].textContent.toLowerCase();
        const subject = row.cells[3].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || grade.includes(searchTerm) || subject.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterStudents() {
    const gradeFilter = document.getElementById('gradeFilter').value;
    const subjectFilter = document.getElementById('subjectFilter').value;
    const rows = document.querySelectorAll('#studentsTableBody tr');
    
    rows.forEach(row => {
        const grade = row.cells[2].textContent.includes(gradeFilter);
        const subject = row.cells[3].textContent.includes(subjectFilter);
        
        const gradeMatch = gradeFilter === 'all' || grade;
        const subjectMatch = subjectFilter === 'all' || subject;
        
        if (gradeMatch && subjectMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function downloadTemplate() {
    showAuthNotification('جاري تحميل النموذج...', 'info');
    // محاكاة تحميل النموذج
    setTimeout(() => {
        showAuthNotification('تم تحميل النموذج بنجاح', 'success');
    }, 1000);
}

function importStudents() {
    const fileInput = document.getElementById('studentFile');
    if (!fileInput.files.length) {
        showAuthNotification('يرجى اختيار ملف للاستيراد', 'error');
        return;
    }
    
    showAuthNotification('جاري استيراد البيانات...', 'info');
    // محاكاة عملية الاستيراد
    setTimeout(() => {
        showAuthNotification('تم استيراد الطلاب بنجاح', 'success');
        closeImportStudentModal();
        loadStudentsData();
    }, 2000);
}

function generatePassword() {
    return Math.random().toString(36).slice(-8);
}

// التعامل مع سحب وإفلات الملفات
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.querySelector('.upload-placeholder');
    const fileInput = document.getElementById('studentFile');
    const fileInfo = document.getElementById('fileInfo');

    if (uploadArea && fileInput) {
        // سحب وإفلات
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--primary-color)';
            this.style.background = '#f8f9fa';
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            this.style.background = 'transparent';
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            this.style.background = 'transparent';
            
            const files = e.dataTransfer.files;
            if (files.length) {
                fileInput.files = files;
                updateFileInfo(files[0]);
            }
        });

        // تغيير الملف عبر الزر
        fileInput.addEventListener('change', function() {
            if (this.files.length) {
                updateFileInfo(this.files[0]);
            }
        });
    }

    function updateFileInfo(file) {
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        fileInfo.innerHTML = `
            <div class="file-name">${file.name}</div>
            <div class="file-size">الحجم: ${fileSize} MB</div>
        `;
        fileInfo.style.display = 'block';
    }
});

// تصدير الدوال للاستخدام العالمي
window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.showImportStudentModal = showImportStudentModal;
window.closeImportStudentModal = closeImportStudentModal;
window.viewStudent = viewStudent;
window.editStudent = editStudent;
window.exportStudent = exportStudent;
window.manageLoginData = manageLoginData;
window.deleteStudent = deleteStudent;
window.searchStudents = searchStudents;
window.filterStudents = filterStudents;
window.downloadTemplate = downloadTemplate;
window.importStudents = importStudents;
// إضافة هذه الدوال في نهاية الملف

// دعم مكتبة المحتوى في لوحة التحكم
function loadTeacherStats() {
    // محاكاة تحميل الإحصائيات
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
        const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        
        const currentTeacher = getCurrentUser();
        const students = users.filter(u => u.role === 'student' && u.teacherId === currentTeacher.id);
        const teacherTests = tests.filter(test => test.teacherId === currentTeacher.id);
        const teacherLessons = lessons.filter(lesson => lesson.teacherId === currentTeacher.id);
        const teacherAssignments = assignments.filter(assignment => assignment.teacherId === currentTeacher.id);
        
        document.getElementById('studentsCount').textContent = students.length;
        document.getElementById('lessonsCount').textContent = teacherLessons.length;
        document.getElementById('assignmentsCount').textContent = teacherAssignments.length;
        document.getElementById('unreadMessages').textContent = Math.floor(Math.random() * 5);
        
        // تحديث عدد الإشعارات
        document.getElementById('notificationCount').textContent = Math.floor(Math.random() * 3);
    }, 1000);
}

// دوال حذف المحتوى
function deleteTest(testId) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }

    if (confirm(`هل أنت متأكد من حذف الاختبار "${test.title}"؟`)) {
        const updatedTests = tests.filter(t => t.id !== testId);
        localStorage.setItem('tests', JSON.stringify(updatedTests));
        
        showAuthNotification('تم حذف الاختبار بنجاح', 'success');
        loadTests();
    }
}

function deleteLesson(lessonId) {
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (!lesson) {
        showAuthNotification('الدرس غير موجود', 'error');
        return;
    }

    if (confirm(`هل أنت متأكد من حذف الدرس "${lesson.title}"؟`)) {
        const updatedLessons = lessons.filter(l => l.id !== lessonId);
        localStorage.setItem('lessons', JSON.stringify(updatedLessons));
        
        showAuthNotification('تم حذف الدرس بنجاح', 'success');
        loadLessons();
    }
}

function deleteObjective(objectiveId) {
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const objective = objectives.find(o => o.id === objectiveId);
    
    if (!objective) {
        showAuthNotification('الهدف غير موجود', 'error');
        return;
    }

    if (confirm(`هل أنت متأكد من حذف الهدف "${objective.shortTerm}"؟`)) {
        const updatedObjectives = objectives.filter(o => o.id !== objectiveId);
        localStorage.setItem('objectives', JSON.stringify(updatedObjectives));
        
        showAuthNotification('تم حذف الهدف بنجاح', 'success');
        loadObjectives();
    }
}

function deleteAssignment(assignmentId) {
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const assignment = assignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        showAuthNotification('الواجب غير موجود', 'error');
        return;
    }

    if (confirm(`هل أنت متأكد من حذف الواجب "${assignment.title}"؟`)) {
        const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
        localStorage.setItem('assignments', JSON.stringify(updatedAssignments));
        
        showAuthNotification('تم حذف الواجب بنجاح', 'success');
        loadAssignments();
    }
}

// دوال العرض
function viewTest(testId) {
    showAuthNotification('جاري فتح صفحة عرض الاختبار...', 'info');
    // سيتم تطوير هذه الوظيفة لاحقاً
}

function viewLesson(lessonId) {
    showAuthNotification('جاري فتح صفحة عرض الدرس...', 'info');
    // سيتم تطوير هذه الوظيفة لاحقاً
}

function viewAssignment(assignmentId) {
    showAuthNotification('جاري فتح صفحة عرض الواجب...', 'info');
    // سيتم تطوير هذه الوظيفة لاحقاً
}

function editTest(testId) {
    showAuthNotification('جاري فتح نافذة تعديل الاختبار...', 'info');
    // سيتم تطوير هذه الوظيفة لاحقاً
}

function editLesson(lessonId) {
    showAuthNotification('جاري فتح نافذة تعديل الدرس...', 'info');
    // سيتم تطوير هذه الوظيفة لاحقاً
}

function editObjective(objectiveId) {
    showAuthNotification('جاري فتح نافذة تعديل الهدف...', 'info');
    // سيتم تطوير هذه الوظيفة لاحقاً
}

function editAssignment(assignmentId) {
    showAuthNotification('جاري فتح نافذة تعديل الواجب...', 'info');
    // سيتم تطوير هذه الوظيفة لاحقاً
}

// تصدير الدوال الإضافية
window.deleteTest = deleteTest;
window.deleteLesson = deleteLesson;
window.deleteObjective = deleteObjective;
window.deleteAssignment = deleteAssignment;
window.viewTest = viewTest;
window.viewLesson = viewLesson;
window.viewAssignment = viewAssignment;
window.editTest = editTest;
window.editLesson = editLesson;
window.editObjective = editObjective;
window.editAssignment = editAssignment;
// إضافة هذه الدوال في نهاية الملف

// دوال التنقل لملف الطالب
function openStudentProfile(studentId) {
    window.location.href = `student-profile.html?id=${studentId}`;
}

// دوال إدارة الجدول الدراسي
function openStudySchedule() {
    window.location.href = 'study-schedule.html';
}

// دوال المراسلة
function openMessages() {
    window.location.href = 'messages.html';
}

// دوال التقارير
function openReports() {
    window.location.href = 'reports.html';
}

// دوال لجنة الصعوبات
function openCommittee() {
    window.location.href = 'committee.html';
}

// دالة مساعدة للانتقال بين الصفحات
function navigateTo(page) {
    window.location.href = page;
}

// تصدير الدوال الإضافية
window.openStudentProfile = openStudentProfile;
window.openStudySchedule = openStudySchedule;
window.openMessages = openMessages;
window.openReports = openReports;
window.openCommittee = openCommittee;
window.navigateTo = navigateTo;
// إضافة هذه الدوال في نهاية الملف

// دوال لجنة الصعوبات
function openCommittee() {
    window.location.href = 'committee.html';
}

// دوال المراسلات
function openMessages() {
    window.location.href = 'messages.html';
}

// دالة لإنشاء بيانات تجريبية للجنة (للتطوير)
function createSampleCommitteeData() {
    const currentTeacher = getCurrentUser();
    
    const sampleMembers = [
        {
            id: generateId(),
            teacherId: currentTeacher.id,
            name: "أحمد محمد",
            role: "مدير",
            username: "ahmed_manager",
            password: "123456",
            createdAt: new Date().toISOString(),
            isActive: true
        },
        {
            id: generateId(),
            teacherId: currentTeacher.id,
            name: "فاطمة عبدالله",
            role: "مشرف",
            username: "fatima_supervisor",
            password: "123456",
            createdAt: new Date().toISOString(),
            isActive: true
        }
    ];
    
    localStorage.setItem('committeeMembers', JSON.stringify(sampleMembers));
    
    // إنشاء حسابات مستخدمين للأعضاء
    sampleMembers.forEach(member => {
        createCommitteeUserAccount(member);
    });
    
    showAuthNotification('تم إنشاء بيانات تجريبية للجنة', 'success');
}

// دالة لإنشاء رسائل تجريبية (للتطوير)
function createSampleMessages() {
    const currentTeacher = getCurrentUser();
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const teacherStudents = students.filter(s => s.teacherId === currentTeacher.id);
    
    if (teacherStudents.length === 0) {
        showAuthNotification('لا توجد طلاب لإضافة رسائل تجريبية', 'warning');
        return;
    }
    
    const sampleMessages = [
        {
            id: generateId(),
            teacherId: currentTeacher.id,
            studentId: teacherStudents[0].id,
            subject: "استفسار عن الواجب",
            content: "السلام عليكم أستاذ، عندي استفسار بخصوص الواجب الأخير، هل يمكن توضيح السؤال الثالث؟",
            sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // منذ يومين
            isRead: false,
            hasReply: false
        },
        {
            id: generateId(),
            teacherId: currentTeacher.id,
            studentId: teacherStudents[0].id,
            subject: "تأكيد حضور الحصة",
            content: "أستاذ، هل حصة الغد في الوقت المعتاد؟",
            sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // منذ يوم
            isRead: true,
            hasReply: true,
            repliedAt: new Date().toISOString()
        }
    ];
    
    localStorage.setItem('teacherMessages', JSON.stringify(sampleMessages));
    showAuthNotification('تم إنشاء رسائل تجريبية', 'success');
}

// تصدير الدوال الإضافية
window.openCommittee = openCommittee;
window.openMessages = openMessages;
window.createSampleCommitteeData = createSampleCommitteeData;

window.createSampleMessages = createSampleMessages;
// تحديث ملف teacher.js لإضافة دعم مكتبة المحتوى التعليمي

document.addEventListener('DOMContentLoaded', function() {
    // ... الكود الحالي ...
    
    // إضافة رابط مكتبة المحتوى التعليمي في القائمة الجانبية
    updateSidebarMenu();
});

function updateSidebarMenu() {
    // التأكد من وجود رابط مكتبة المحتوى التعليمي في القائمة الجانبية
    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (sidebarMenu && !sidebarMenu.querySelector('a[href*="educational-library"]')) {
        const libraryItem = `
            <li><a href="educational-library.html"><span class="menu-icon">📚</span>مكتبة المحتوى التعليمي</a></li>
        `;
        
        // إدراج الرابط بعد رابط الطلاب
        const studentsLink = sidebarMenu.querySelector('a[href*="students"]');
        if (studentsLink) {
            studentsLink.closest('li').insertAdjacentHTML('afterend', libraryItem);
        }
    }
}

// دوال إضافية لدعم الأنواع المختلفة للأسئلة
function createWritingArea(questionId) {
    return `
        <div class="writing-area" id="writingArea_${questionId}">
            <div class="writing-tools">
                <button class="btn btn-sm btn-secondary" onclick="clearWritingArea(${questionId})">
                    <span class="btn-icon">🗑️</span> مسح كامل
                </button>
                <div class="color-picker">
                    <span>لون القلم:</span>
                    <input type="color" id="penColor_${questionId}" value="#000000" 
                           onchange="changePenColor(${questionId}, this.value)">
                </div>
                <button class="btn btn-sm btn-secondary" onclick="toggleEraser(${questionId})">
                    <span class="btn-icon">🧽</span> ممحاة
                </button>
            </div>
            <canvas id="writingCanvas_${questionId}" width="600" height="300" 
                    style="border: 1px solid #ddd; background: white; cursor: crosshair;"></canvas>
        </div>
    `;
}

function setupCanvas(questionId) {
    const canvas = document.getElementById(`writingCanvas_${questionId}`);
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let isErasing = false;
    let lastX = 0;
    let lastY = 0;
    
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        [lastX, lastY] = getMousePos(canvas, e);
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        
        const [x, y] = getMousePos(canvas, e);
        ctx.lineTo(x, y);
        
        if (isErasing) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 20;
        } else {
            ctx.strokeStyle = document.getElementById(`penColor_${questionId}`).value;
            ctx.lineWidth = 3;
        }
        
        ctx.stroke();
        [lastX, lastY] = [x, y];
    });
    
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return [
        evt.clientX - rect.left,
        evt.clientY - rect.top
    ];
}

function clearWritingArea(questionId) {
    const canvas = document.getElementById(`writingCanvas_${questionId}`);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function changePenColor(questionId, color) {
    // لون القلم يتم تطبيقه عند الرسم
}

function toggleEraser(questionId) {
    window[`isErasing_${questionId}`] = !window[`isErasing_${questionId}`];
    const btn = document.querySelector(`button[onclick="toggleEraser(${questionId})"]`);
    if (window[`isErasing_${questionId}`]) {
        btn.classList.add('active');
        btn.innerHTML = '<span class="btn-icon">✏️</span> قلم';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span class="btn-icon">🧽</span> ممحاة';
    }
}
