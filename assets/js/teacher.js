// ============================================
// 📁 الملف: muyasir-main/assets/js/teacher.js
// ============================================

// نظام لوحة تحكم المعلم المتكاملة
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
    
    // تحميل البيانات حسب الصفحة
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('dashboard.html')) {
        loadDashboardData();
    } else if (currentPath.includes('students.html')) {
        loadStudentsData();
    } else if (currentPath.includes('content-library.html')) {
        loadContentLibrary();
    } else if (currentPath.includes('tests.html')) {
        loadTestsData();
    } else if (currentPath.includes('assignments.html')) {
        loadAssignmentsData();
    } else if (currentPath.includes('reports.html')) {
        loadReportsData();
    } else if (currentPath.includes('committee.html')) {
        loadCommitteeData();
    } else if (currentPath.includes('student-profile.html')) {
        loadStudentProfile();
    }
    
    // تهيئة الأحداث المشتركة
    setupCommonEvents();
}

function updateUserInterface(user) {
    document.getElementById('userName')?.textContent = user.name;
    document.getElementById('userAvatar')?.textContent = user.name.charAt(0);
    document.getElementById('teacherName')?.textContent = user.name;
}

function setupCommonEvents() {
    // معالجة الأزرار العامة
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', logout);
    });
    
    // معالجة الروابط النشطة
    updateActiveMenu();
}

function updateActiveMenu() {
    const currentPath = window.location.pathname.split('/').pop();
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath === href) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ============================================
// دوال لوحة التحكم الرئيسية
// ============================================

function loadDashboardData() {
    loadTeacherStats();
    loadFeaturedStudents();
    loadImportantNotices();
    loadRecentActivity();
}

function loadTeacherStats() {
    setTimeout(() => {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const currentUser = getCurrentUser();
        
        // طلاب المعلم الحالي
        const teacherStudents = students.filter(s => s.teacherId === currentUser.id);
        const activeStudents = teacherStudents.filter(s => s.status === 'active');
        const pendingTests = teacherStudents.reduce((sum, student) => sum + (student.pendingTests || 0), 0);
        const avgProgress = teacherStudents.length > 0 ? 
            Math.round(teacherStudents.reduce((sum, student) => sum + (student.progress || 0), 0) / teacherStudents.length) : 0;
        
        document.getElementById('totalStudents')?.textContent = teacherStudents.length;
        document.getElementById('activeStudents')?.textContent = activeStudents.length;
        document.getElementById('pendingTests')?.textContent = pendingTests;
        document.getElementById('avgProgress')?.textContent = `${avgProgress}%`;
        
        // تحديث شريط التقدم
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${avgProgress}%`;
        }
    }, 1000);
}

function loadFeaturedStudents() {
    const studentsList = document.getElementById('featuredStudentsList');
    if (!studentsList) return;

    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentUser = getCurrentUser();
    const teacherStudents = students.filter(s => s.teacherId === currentUser.id);
    
    // ترتيب الطلاب حسب التقدم
    const featuredStudents = teacherStudents
        .sort((a, b) => (b.progress || 0) - (a.progress || 0))
        .slice(0, 4);
    
    if (featuredStudents.length === 0) {
        studentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍🎓</div>
                <h3>لا توجد طلاب</h3>
                <p>قم بإضافة طلاب لمتابعة تقدمهم</p>
                <button class="btn btn-success" onclick="window.location.href='students.html'">إدارة الطلاب</button>
            </div>
        `;
        return;
    }
    
    studentsList.innerHTML = featuredStudents.map(student => {
        const progress = student.progress || 0;
        const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
        
        return `
            <div class="student-card">
                <div class="student-avatar">${student.name.charAt(0)}</div>
                <div class="student-name">${student.name}</div>
                <div class="student-progress">${progress}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%; background-color: var(--${progressClass}-color);"></div>
                </div>
                <button class="btn btn-sm btn-primary mt-2" onclick="viewStudentProfile(${student.id})">عرض الملف</button>
            </div>
        `;
    }).join('');
}

function loadImportantNotices() {
    const noticesList = document.getElementById('noticesList');
    if (!noticesList) return;

    const notices = [
        {
            icon: '📢',
            title: 'اجتماع لجنة صعوبات التعلم',
            description: 'اجتماع أسبوعي يوم الثلاثاء الساعة 10 صباحاً',
            time: 'غداً'
        },
        {
            icon: '⚠️',
            title: 'تقرير شهري مطلوب',
            description: 'آخر موعد لتسليم التقارير الشهرية 25 من الشهر الجاري',
            time: 'أسبوع'
        },
        {
            icon: '🎯',
            title: 'ورشة عمل جديدة',
            description: 'ورشة "استراتيجيات التعلم النشط" يوم الأحد القادم',
            time: 'أسبوع'
        }
    ];

    noticesList.innerHTML = notices.map(notice => `
        <div class="notice-item">
            <div class="notice-icon">${notice.icon}</div>
            <div class="notice-content">
                <div class="notice-title">${notice.title}</div>
                <div class="notice-description">${notice.description}</div>
                <div class="notice-time">${notice.time}</div>
            </div>
        </div>
    `).join('');
}

function loadRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    if (!activityList) return;

    const activities = [
        {
            icon: '📝',
            title: 'اختبار جديد تم إنشاؤه',
            description: 'اختبار تشخيصي في القراءة للصف الثالث',
            time: 'منذ 2 ساعة',
            color: '#3498db'
        },
        {
            icon: '👨‍🎓',
            title: 'طالب جديد تمت إضافته',
            description: 'تم إضافة الطالب أحمد محمد',
            time: 'منذ يوم',
            color: '#27ae60'
        },
        {
            icon: '📊',
            title: 'تقرير أداء تم إنشاؤه',
            description: 'تقرير أداء شهري لطلاب الصف الرابع',
            time: 'منذ 3 أيام',
            color: '#f39c12'
        }
    ];

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.color}20; color: ${activity.color}">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// دوال إدارة الطلاب
// ============================================

function loadStudentsData() {
    loadStudentsList();
    updateStudentsStats();
}

function loadStudentsList() {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;

    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentUser = getCurrentUser();
    const teacherStudents = students.filter(s => s.teacherId === currentUser.id);
    
    if (teacherStudents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <div class="empty-icon">👨‍🎓</div>
                        <h3>لا توجد طلاب</h3>
                        <p>قم بإضافة طلاب لمتابعة تقدمهم</p>
                        <button class="btn btn-success" onclick="showAddStudentModal()">إضافة أول طالب</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = teacherStudents.map((student, index) => {
        const progress = student.progress || 0;
        const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
        const lastLogin = student.lastLogin ? formatTimeAgo(student.lastLogin) : 'لم يسجل دخول';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="student-info">
                        <div class="student-avatar-small">${student.name.charAt(0)}</div>
                        <span>${student.name}</span>
                    </div>
                </td>
                <td>${student.grade || 'غير محدد'}</td>
                <td>${student.subject || 'غير محدد'}</td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-text">${progress}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%; background-color: var(--${progressClass}-color);"></div>
                        </div>
                    </div>
                </td>
                <td>${lastLogin}</td>
                <td>
                    <span class="status-badge status-${student.status || 'active'}">
                        ${student.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                </td>
                <td>
                    <div class="student-actions">
                        <button class="btn btn-sm btn-primary" onclick="viewStudentProfile(${student.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="assignTestToStudent(${student.id})">
                            <i class="fas fa-clipboard-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStudentsStats() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentUser = getCurrentUser();
    const teacherStudents = students.filter(s => s.teacherId === currentUser.id);
    
    const totalStudents = teacherStudents.length;
    const activeStudents = teacherStudents.filter(s => s.status === 'active').length;
    const avgProgress = teacherStudents.length > 0 ? 
        Math.round(teacherStudents.reduce((sum, s) => sum + (s.progress || 0), 0) / teacherStudents.length) : 0;
    
    document.getElementById('studentsCount')?.textContent = totalStudents;
    document.getElementById('activeStudentsCount')?.textContent = activeStudents;
    document.getElementById('studentsProgress')?.textContent = `${avgProgress}%`;
}

function showAddStudentModal() {
    document.getElementById('addStudentModal').classList.add('show');
    document.getElementById('addStudentForm').reset();
}

function closeAddStudentModal() {
    document.getElementById('addStudentModal').classList.remove('show');
}

function addNewStudent() {
    const form = document.getElementById('addStudentForm');
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;
    const username = document.getElementById('studentUsername').value.trim();
    const password = document.getElementById('studentPassword').value;
    
    if (!name || !grade || !subject || !username || !password) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    
    // التحقق من عدم تكرار اسم المستخدم
    const existingStudent = students.find(s => s.username === username);
    if (existingStudent) {
        showAuthNotification('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }
    
    const newStudent = {
        id: generateId(),
        teacherId: currentUser.id,
        name: name,
        grade: grade,
        subject: subject,
        username: username,
        password: password,
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginAttempts: 0,
        pendingTests: 0,
        completedTests: 0
    };
    
    students.push(newStudent);
    localStorage.setItem('students', JSON.stringify(students));
    
    // إضافة المستخدم إلى قاعدة بيانات المستخدمين
    addUserAccount(newStudent);
    
    showAuthNotification('تم إضافة الطالب بنجاح', 'success');
    closeAddStudentModal();
    loadStudentsData();
    
    // إضافة نشاط
    addTeacherActivity({
        type: 'student',
        title: 'أضاف طالباً جديداً',
        description: name
    });
}

function addUserAccount(student) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const userAccount = {
        id: student.id,
        username: student.username,
        password: student.password,
        role: 'student',
        name: student.name,
        teacherId: student.teacherId,
        status: student.status,
        createdAt: student.createdAt,
        lastLogin: null,
        loginAttempts: 0
    };
    
    users.push(userAccount);
    localStorage.setItem('users', JSON.stringify(users));
}

function viewStudentProfile(studentId) {
    window.location.href = `student-profile.html?id=${studentId}`;
}

function editStudent(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    // تعبئة النموذج
    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentGrade').value = student.grade || '';
    document.getElementById('editStudentSubject').value = student.subject || '';
    document.getElementById('editStudentStatus').value = student.status || 'active';
    
    document.getElementById('editStudentModal').classList.add('show');
}

function closeEditStudentModal() {
    document.getElementById('editStudentModal').classList.remove('show');
}

function updateStudent() {
    const studentId = parseInt(document.getElementById('editStudentId').value);
    const name = document.getElementById('editStudentName').value.trim();
    const grade = document.getElementById('editStudentGrade').value;
    const subject = document.getElementById('editStudentSubject').value;
    const status = document.getElementById('editStudentStatus').value;
    
    if (!name || !grade || !subject) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    // تحديث بيانات الطالب
    students[studentIndex].name = name;
    students[studentIndex].grade = grade;
    students[studentIndex].subject = subject;
    students[studentIndex].status = status;
    
    localStorage.setItem('students', JSON.stringify(students));
    
    // تحديث حساب المستخدم
    updateUserAccount(students[studentIndex]);
    
    showAuthNotification('تم تحديث بيانات الطالب بنجاح', 'success');
    closeEditStudentModal();
    loadStudentsData();
}

function updateUserAccount(student) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === student.id);
    
    if (userIndex !== -1) {
        users[userIndex].name = student.name;
        users[userIndex].status = student.status;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function assignTestToStudent(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    // عرض قائمة الاختبارات المتاحة
    const tests = JSON.parse(localStorage.getItem('teacherTests') || '[]');
    const currentUser = getCurrentUser();
    const teacherTests = tests.filter(t => t.teacherId === currentUser.id);
    
    if (teacherTests.length === 0) {
        showAuthNotification('لا توجد اختبارات متاحة', 'warning');
        showCreateTestModal();
        return;
    }
    
    let testOptions = 'اختر اختباراً:\n';
    teacherTests.forEach((test, index) => {
        testOptions += `${index + 1}. ${test.title} (${test.subject} - ${test.grade})\n`;
    });
    
    const choice = prompt(testOptions + '\nأدخل رقم الاختبار:');
    if (!choice) return;
    
    const testIndex = parseInt(choice) - 1;
    if (testIndex < 0 || testIndex >= teacherTests.length) {
        showAuthNotification('اختيار غير صالح', 'error');
        return;
    }
    
    const selectedTest = teacherTests[testIndex];
    
    // تعيين الاختبار للطالب
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    
    const assignedTest = {
        id: generateId(),
        studentId: studentId,
        testId: selectedTest.id,
        testTitle: selectedTest.title,
        assignedAt: new Date().toISOString(),
        status: 'assigned',
        score: null,
        completedAt: null
    };
    
    studentTests.push(assignedTest);
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    
    // تحديث عدد الاختبارات المعلقة للطالب
    updateStudentPendingTests(studentId);
    
    showAuthNotification(`تم تعيين اختبار "${selectedTest.title}" للطالب ${student.name}`, 'success');
}

function updateStudentPendingTests(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex !== -1) {
        const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        const pendingTests = studentTests.filter(st => 
            st.studentId === studentId && st.status === 'assigned'
        ).length;
        
        students[studentIndex].pendingTests = pendingTests;
        localStorage.setItem('students', JSON.stringify(students));
    }
}

function deleteStudent(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    if (!confirm(`هل أنت متأكد من حذف الطالب ${student.name}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
        return;
    }
    
    // حذف الطالب
    const updatedStudents = students.filter(s => s.id !== studentId);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    
    // حذف حساب المستخدم
    deleteUserAccount(studentId);
    
    // حذف الاختبارات المرتبطة
    deleteStudentTests(studentId);
    
    showAuthNotification('تم حذف الطالب بنجاح', 'success');
    loadStudentsData();
}

function deleteUserAccount(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
}

function deleteStudentTests(studentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const updatedTests = studentTests.filter(st => st.studentId !== studentId);
    localStorage.setItem('studentTests', JSON.stringify(updatedTests));
}

function searchStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    
    rows.forEach(row => {
        if (row.cells.length < 8) return;
        
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

// ============================================
// دوال إدارة مكتبة المحتوى التعليمي
// ============================================

function loadContentLibrary() {
    updateContentStats();
    loadTests();
    loadLessons();
    loadExercises();
}

function updateContentStats() {
    const tests = JSON.parse(localStorage.getItem('teacherTests') || '[]');
    const lessons = JSON.parse(localStorage.getItem('teacherLessons') || '[]');
    const exercises = JSON.parse(localStorage.getItem('teacherExercises') || '[]');
    
    const currentUser = getCurrentUser();
    const userTests = tests.filter(test => test.teacherId === currentUser.id);
    const userLessons = lessons.filter(lesson => lesson.teacherId === currentUser.id);
    const userExercises = exercises.filter(exercise => exercise.teacherId === currentUser.id);
    
    document.getElementById('totalTests')?.textContent = userTests.length;
    document.getElementById('totalLessons')?.textContent = userLessons.length;
    document.getElementById('totalExercises')?.textContent = userExercises.length;
    
    // حساب مرات الاستخدام
    const totalUsage = userTests.reduce((sum, test) => sum + (test.usageCount || 0), 0) +
                      userLessons.reduce((sum, lesson) => sum + (lesson.usageCount || 0), 0) +
                      userExercises.reduce((sum, exercise) => sum + (exercise.usageCount || 0), 0);
    document.getElementById('totalUsage')?.textContent = totalUsage;
}

function loadTests() {
    const testsGrid = document.getElementById('testsGrid');
    if (!testsGrid) return;
    
    const currentUser = getCurrentUser();
    const tests = JSON.parse(localStorage.getItem('teacherTests') || '[]');
    const userTests = tests.filter(test => test.teacherId === currentUser.id);
    
    if (userTests.length === 0) {
        testsGrid.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد اختبارات</h3>
                <p>قم بإنشاء اختبارك الأول لمساعدة طلابك</p>
                <button class="btn btn-success" onclick="showCreateTestModal()">إنشاء اختبار جديد</button>
            </div>
        `;
        return;
    }
    
    testsGrid.innerHTML = userTests.map(test => {
        const questionsCount = test.questions ? test.questions.length : 0;
        const usageCount = test.usageCount || 0;
        
        return `
            <div class="content-card" data-test-id="${test.id}">
                <div class="content-header">
                    <h4>${test.title}</h4>
                    <span class="content-badge subject-${test.subject}">${test.subject}</span>
                </div>
                <div class="content-body">
                    <p>${test.description || 'بدون وصف'}</p>
                    <div class="content-meta">
                        <span class="questions-count">${questionsCount} سؤال</span>
                        <span class="total-grade">الصف ${test.grade}</span>
                        <span class="objectives-status ${test.objectivesLinked ? 'linked' : 'not-linked'}">
                            ${test.objectivesLinked ? 'مرتبط بأهداف' : 'غير مرتبط'}
                        </span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewTest(${test.id})">عرض</button>
                    <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})">تعديل</button>
                    <button class="btn btn-sm btn-success" onclick="assignTest(${test.id})">تعيين</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function loadLessons() {
    const lessonsGrid = document.getElementById('lessonsGrid');
    if (!lessonsGrid) return;
    
    const currentUser = getCurrentUser();
    const lessons = JSON.parse(localStorage.getItem('teacherLessons') || '[]');
    const userLessons = lessons.filter(lesson => lesson.teacherId === currentUser.id);
    
    if (userLessons.length === 0) {
        lessonsGrid.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📚</div>
                <h3>لا توجد دروس</h3>
                <p>قم بإنشاء درسك الأول لتعليم طلابك</p>
                <button class="btn btn-success" onclick="showCreateLessonModal()">إنشاء درس جديد</button>
            </div>
        `;
        return;
    }
    
    lessonsGrid.innerHTML = userLessons.map(lesson => {
        const exercisesCount = lesson.exercises ? lesson.exercises.length : 0;
        const priorityText = lesson.priority === 'high' ? 'أولوية عالية' : 'عادية';
        
        return `
            <div class="content-card" data-lesson-id="${lesson.id}">
                <div class="content-header">
                    <h4>${lesson.title}</h4>
                    <span class="content-badge subject-${lesson.subject}">${lesson.subject}</span>
                </div>
                <div class="content-body">
                    <p>${lesson.description || 'بدون وصف'}</p>
                    <div class="content-meta">
                        <span class="strategy">${lesson.strategy}</span>
                        <span class="priority">${priorityText}</span>
                        <span class="exercises-count">${exercisesCount} تمرين</span>
                        <span class="objectives-status ${lesson.objectivesLinked ? 'linked' : 'not-linked'}">
                            ${lesson.objectivesLinked ? 'مرتبط بأهداف' : 'غير مرتبط'}
                        </span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewLesson(${lesson.id})">عرض</button>
                    <button class="btn btn-sm btn-warning" onclick="editLesson(${lesson.id})">تعديل</button>
                    <button class="btn btn-sm btn-success" onclick="assignLesson(${lesson.id})">تعيين</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.id})">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function loadExercises() {
    const exercisesGrid = document.getElementById('exercisesGrid');
    if (!exercisesGrid) return;
    
    const currentUser = getCurrentUser();
    const exercises = JSON.parse(localStorage.getItem('teacherExercises') || '[]');
    const userExercises = exercises.filter(exercise => exercise.teacherId === currentUser.id);
    
    if (userExercises.length === 0) {
        exercisesGrid.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">💪</div>
                <h3>لا توجد تمارين</h3>
                <p>قم بإنشاء تمرينك الأول لتدريب طلابك</p>
                <button class="btn btn-success" onclick="showCreateExerciseModal()">إنشاء تمرين جديد</button>
            </div>
        `;
        return;
    }
    
    exercisesGrid.innerHTML = userExercises.map(exercise => {
        const usageCount = exercise.usageCount || 0;
        const typeText = getExerciseTypeText(exercise.type);
        
        return `
            <div class="content-card" data-exercise-id="${exercise.id}">
                <div class="content-header">
                    <h4>${exercise.title}</h4>
                    <span class="content-badge subject-${exercise.subject}">${exercise.subject}</span>
                </div>
                <div class="content-body">
                    <p>${exercise.description || 'بدون وصف'}</p>
                    <div class="content-meta">
                        <span class="strategy">${typeText}</span>
                        <span class="total-grade">الصف ${exercise.grade}</span>
                        <span class="exercises-count">${usageCount} استخدام</span>
                        <span class="objectives-status ${exercise.objectivesLinked ? 'linked' : 'not-linked'}">
                            ${exercise.objectivesLinked ? 'مرتبط بأهداف' : 'غير مرتبط'}
                        </span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewExercise(${exercise.id})">عرض</button>
                    <button class="btn btn-sm btn-warning" onclick="editExercise(${exercise.id})">تعديل</button>
                    <button class="btn btn-sm btn-success" onclick="assignExercise(${exercise.id})">تعيين</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteExercise(${exercise.id})">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function getExerciseTypeText(type) {
    const types = {
        'written': 'كتابي',
        'oral': 'شفوي',
        'practical': 'عملي',
        'interactive': 'تفاعلي'
    };
    return types[type] || type;
}

// دوال إنشاء المحتوى
function showCreateTestModal() {
    document.getElementById('createTestModal').classList.add('show');
    document.getElementById('testForm').reset();
    document.getElementById('questionsContainer').innerHTML = '';
    questionCount = 0;
    addQuestion();
}

function closeCreateTestModal() {
    document.getElementById('createTestModal').classList.remove('show');
}

function showCreateLessonModal() {
    document.getElementById('createLessonModal').classList.add('show');
    document.getElementById('lessonForm').reset();
    document.getElementById('exercisesContainer').innerHTML = '';
    exerciseCount = 0;
    addExercise();
}

function closeCreateLessonModal() {
    document.getElementById('createLessonModal').classList.remove('show');
}

function showCreateExerciseModal() {
    alert('إنشاء التمرين قيد التطوير');
}

// إدارة الأسئلة
let questionCount = 0;
let exerciseCount = 0;

function addQuestion() {
    questionCount++;
    const container = document.getElementById('questionsContainer');
    if (!container) return;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <div class="question-header">
            <h5>سؤال ${questionCount}</h5>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeQuestion(this)">حذف</button>
        </div>
        <div class="form-group">
            <input type="text" class="form-control question-text" placeholder="نص السؤال" required>
        </div>
        <div class="form-group">
            <select class="form-control question-type" required>
                <option value="">نوع السؤال</option>
                <option value="multiple-choice">اختيار من متعدد</option>
                <option value="true-false">صح وخطأ</option>
                <option value="short-answer">إجابة قصيرة</option>
            </select>
        </div>
        <div class="choices-container" id="choices-${questionCount}" style="display: none;">
            <div class="form-group">
                <input type="text" class="form-control choice" placeholder="الاختيار ١">
            </div>
            <div class="form-group">
                <input type="text" class="form-control choice" placeholder="الاختيار ٢">
            </div>
            <div class="form-group">
                <input type="text" class="form-control choice" placeholder="الاختيار ٣">
            </div>
            <div class="form-group">
                <input type="text" class="form-control choice" placeholder="الاختيار ٤">
            </div>
            <div class="form-group">
                <label>الإجابة الصحيحة:</label>
                <select class="form-control correct-choice">
                    <option value="1">الاختيار ١</option>
                    <option value="2">الاختيار ٢</option>
                    <option value="3">الاختيار ٣</option>
                    <option value="4">الاختيار ٤</option>
                </select>
            </div>
        </div>
    `;
    container.appendChild(questionDiv);

    // إظهار/إخفاء خيارات الاختيار من متعدد
    const typeSelect = questionDiv.querySelector('.question-type');
    typeSelect.addEventListener('change', function() {
        const choicesContainer = document.getElementById(`choices-${questionCount}`);
        if (choicesContainer) {
            choicesContainer.style.display = this.value === 'multiple-choice' ? 'block' : 'none';
        }
    });
}

function removeQuestion(button) {
    const questionItem = button.closest('.question-item');
    if (questionItem) {
        questionItem.remove();
        questionCount--;
        renumberQuestions();
    }
}

function renumberQuestions() {
    const questions = document.querySelectorAll('.question-item');
    questions.forEach((question, index) => {
        const title = question.querySelector('h5');
        if (title) {
            title.textContent = `سؤال ${index + 1}`;
        }
    });
    questionCount = questions.length;
}

// إدارة التمارين
function addExercise() {
    exerciseCount++;
    const container = document.getElementById('exercisesContainer');
    if (!container) return;
    
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-item';
    exerciseDiv.innerHTML = `
        <div class="exercise-header">
            <h5>تمرين ${exerciseCount}</h5>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeExercise(this)">حذف</button>
        </div>
        <div class="form-group">
            <input type="text" class="form-control exercise-title" placeholder="عنوان التمرين" required>
        </div>
        <div class="form-group">
            <textarea class="form-control exercise-content" rows="3" placeholder="وصف التمرين" required></textarea>
        </div>
        <div class="form-group">
            <label>نوع التمرين:</label>
            <select class="form-control exercise-type" required>
                <option value="">اختر نوع التمرين</option>
                <option value="written">كتابي</option>
                <option value="oral">شفوي</option>
                <option value="practical">عملي</option>
                <option value="interactive">تفاعلي</option>
            </select>
        </div>
    `;
    container.appendChild(exerciseDiv);
}

function removeExercise(button) {
    const exerciseItem = button.closest('.exercise-item');
    if (exerciseItem) {
        exerciseItem.remove();
        exerciseCount--;
        renumberExercises();
    }
}

function renumberExercises() {
    const exercises = document.querySelectorAll('.exercise-item');
    exercises.forEach((exercise, index) => {
        const title = exercise.querySelector('h5');
        if (title) {
            title.textContent = `تمرين ${index + 1}`;
        }
    });
    exerciseCount = exercises.length;
}

// حفظ المحتوى
function saveTest() {
    const title = document.getElementById('testTitle')?.value.trim();
    const subject = document.getElementById('testSubject')?.value;
    const grade = document.getElementById('testGrade')?.value;
    const description = document.getElementById('testDescription')?.value.trim();

    if (!title || !subject || !grade) {
        showAuthNotification('يرجى ملء الحقول الإجبارية', 'error');
        return;
    }

    const questions = [];
    const questionItems = document.querySelectorAll('.question-item');
    
    if (questionItems.length === 0) {
        showAuthNotification('يرجى إضافة سؤال واحد على الأقل', 'error');
        return;
    }

    questionItems.forEach((item, index) => {
        const questionText = item.querySelector('.question-text')?.value.trim();
        const questionType = item.querySelector('.question-type')?.value;
        
        if (questionText && questionType) {
            const question = {
                id: index + 1,
                text: questionText,
                type: questionType
            };

            if (questionType === 'multiple-choice') {
                const choices = item.querySelectorAll('.choice');
                const correctChoice = item.querySelector('.correct-choice')?.value;
                question.choices = Array.from(choices).map((choice, i) => ({
                    id: i + 1,
                    text: choice.value.trim()
                }));
                question.correctAnswer = parseInt(correctChoice) || 1;
            }

            questions.push(question);
        }
    });

    if (questions.length === 0) {
        showAuthNotification('يرجى إكمال بيانات جميع الأسئلة', 'error');
        return;
    }

    const currentUser = getCurrentUser();
    const tests = JSON.parse(localStorage.getItem('teacherTests') || '[]');
    
    const newTest = {
        id: generateId(),
        teacherId: currentUser.id,
        title: title,
        subject: subject,
        grade: grade,
        description: description,
        questions: questions,
        objectivesLinked: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    tests.push(newTest);
    localStorage.setItem('teacherTests', JSON.stringify(tests));
    
    showAuthNotification('تم حفظ الاختبار بنجاح', 'success');
    closeCreateTestModal();
    loadTests();
    updateContentStats();
    
    addTeacherActivity({
        type: 'content',
        title: 'أنشأت اختباراً جديداً',
        description: title
    });
}

function saveLesson() {
    const title = document.getElementById('lessonTitle')?.value.trim();
    const strategy = document.getElementById('lessonStrategy')?.value;
    const subject = document.getElementById('lessonSubject')?.value;
    const grade = document.getElementById('lessonGrade')?.value;
    const description = document.getElementById('lessonDescription')?.value.trim();
    const introduction = document.getElementById('lessonIntroduction')?.value.trim();

    if (!title || !strategy || !subject || !grade) {
        showAuthNotification('يرجى ملء الحقول الإجبارية', 'error');
        return;
    }

    const exercises = [];
    const exerciseItems = document.querySelectorAll('.exercise-item');
    
    exerciseItems.forEach((item, index) => {
        const exerciseTitle = item.querySelector('.exercise-title')?.value.trim();
        const exerciseContent = item.querySelector('.exercise-content')?.value.trim();
        const exerciseType = item.querySelector('.exercise-type')?.value;
        
        if (exerciseTitle && exerciseContent && exerciseType) {
            exercises.push({
                id: index + 1,
                title: exerciseTitle,
                content: exerciseContent,
                type: exerciseType
            });
        }
    });

    const currentUser = getCurrentUser();
    const lessons = JSON.parse(localStorage.getItem('teacherLessons') || '[]');
    
    const newLesson = {
        id: generateId(),
        teacherId: currentUser.id,
        title: title,
        strategy: strategy,
        subject: subject,
        grade: grade,
        description: description,
        introduction: introduction,
        exercises: exercises,
        priority: 'normal',
        objectivesLinked: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    lessons.push(newLesson);
    localStorage.setItem('teacherLessons', JSON.stringify(lessons));
    
    showAuthNotification('تم حفظ الدرس بنجاح', 'success');
    closeCreateLessonModal();
    loadLessons();
    updateContentStats();
    
    addTeacherActivity({
        type: 'content',
        title: 'أنشأت درساً جديداً',
        description: title
    });
}

// عرض المحتوى
function viewTest(testId) {
    const tests = JSON.parse(localStorage.getItem('teacherTests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    document.getElementById('contentModalTitle').textContent = test.title;
    document.getElementById('contentDetailsBody').innerHTML = `
        <div class="test-info-card">
            <h4>${test.title}</h4>
            <div class="test-details">
                <p><strong>المادة:</strong> ${test.subject}</p>
                <p><strong>الصف:</strong> ${test.grade}</p>
                <p><strong>عدد الأسئلة:</strong> ${test.questions.length}</p>
                <p><strong>مرات الاستخدام:</strong> ${test.usageCount || 0}</p>
                <p><strong>تاريخ الإنشاء:</strong> ${formatDate(test.createdAt)}</p>
                <p><strong>الوصف:</strong> ${test.description || 'بدون وصف'}</p>
            </div>
            <h5>الأسئلة:</h5>
            <div class="questions-list">
                ${test.questions.map((q, idx) => `
                    <div class="question-item-small">
                        <strong>سؤال ${idx + 1}:</strong> ${q.text}
                        <small>(${getQuestionTypeText(q.type)})</small>
                    </div>
                `).join('')}
            </div>
            <div class="test-actions">
                <button class="btn btn-primary" onclick="editTest(${test.id})">تعديل</button>
                <button class="btn btn-success" onclick="assignTest(${test.id})">تعيين للطلاب</button>
                <button class="btn btn-danger" onclick="deleteTest(${test.id})">حذف</button>
            </div>
        </div>
    `;
    document.getElementById('contentDetailsModal').classList.add('show');
}

function getQuestionTypeText(type) {
    const types = {
        'multiple-choice': 'اختيار من متعدد',
        'true-false': 'صح وخطأ',
        'short-answer': 'إجابة قصيرة'
    };
    return types[type] || type;
}

function viewLesson(lessonId) {
    const lessons = JSON.parse(localStorage.getItem('teacherLessons') || '[]');
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (!lesson) {
        showAuthNotification('الدرس غير موجود', 'error');
        return;
    }
    
    document.getElementById('contentModalTitle').textContent = lesson.title;
    document.getElementById('contentDetailsBody').innerHTML = `
        <div class="lesson-info-card">
            <h4>${lesson.title}</h4>
            <div class="lesson-details">
                <p><strong>المادة:</strong> ${lesson.subject}</p>
                <p><strong>الصف:</strong> ${lesson.grade}</p>
                <p><strong>الاستراتيجية:</strong> ${lesson.strategy}</p>
                <p><strong>عدد التمارين:</strong> ${lesson.exercises.length}</p>
                <p><strong>تاريخ الإنشاء:</strong> ${formatDate(lesson.createdAt)}</p>
                <p><strong>الوصف:</strong> ${lesson.description || 'بدون وصف'}</p>
            </div>
            <h5>التمهيد:</h5>
            <p>${lesson.introduction || 'لا يوجد تمهيد'}</p>
            <h5>التمارين:</h5>
            <div class="exercises-list">
                ${lesson.exercises.map((ex, idx) => `
                    <div class="exercise-item-small">
                        <strong>تمرين ${idx + 1}:</strong> ${ex.title}
                        <small>(${getExerciseTypeText(ex.type)})</small>
                        <p>${ex.content}</p>
                    </div>
                `).join('')}
            </div>
            <div class="lesson-actions">
                <button class="btn btn-primary" onclick="editLesson(${lesson.id})">تعديل</button>
                <button class="btn btn-success" onclick="assignLesson(${lesson.id})">تعيين للطلاب</button>
                <button class="btn btn-danger" onclick="deleteLesson(${lesson.id})">حذف</button>
            </div>
        </div>
    `;
    document.getElementById('contentDetailsModal').classList.add('show');
}

function viewExercise(exerciseId) {
    const exercises = JSON.parse(localStorage.getItem('teacherExercises') || '[]');
    const exercise = exercises.find(e => e.id === exerciseId);
    
    if (!exercise) {
        showAuthNotification('التمرين غير موجود', 'error');
        return;
    }
    
    document.getElementById('contentModalTitle').textContent = exercise.title;
    document.getElementById('contentDetailsBody').innerHTML = `
        <div class="exercise-info-card">
            <h4>${exercise.title}</h4>
            <div class="exercise-details">
                <p><strong>المادة:</strong> ${exercise.subject}</p>
                <p><strong>الصف:</strong> ${exercise.grade}</p>
                <p><strong>نوع التمرين:</strong> ${getExerciseTypeText(exercise.type)}</p>
                <p><strong>مرات الاستخدام:</strong> ${exercise.usageCount || 0}</p>
                <p><strong>تاريخ الإنشاء:</strong> ${formatDate(exercise.createdAt)}</p>
                <p><strong>الوصف:</strong> ${exercise.description || 'بدون وصف'}</p>
            </div>
            <div class="exercise-actions">
                <button class="btn btn-primary" onclick="editExercise(${exercise.id})">تعديل</button>
                <button class="btn btn-success" onclick="assignExercise(${exercise.id})">تعيين للطلاب</button>
                <button class="btn btn-danger" onclick="deleteExercise(${exercise.id})">حذف</button>
            </div>
        </div>
    `;
    document.getElementById('contentDetailsModal').classList.add('show');
}

function closeContentDetailsModal() {
    document.getElementById('contentDetailsModal').classList.remove('show');
}

// دوال التعديل
function editTest(testId) {
    const tests = JSON.parse(localStorage.getItem('teacherTests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    // تعبئة النموذج
    document.getElementById('testTitle').value = test.title;
    document.getElementById('testSubject').value = test.subject;
    document.getElementById('testGrade').value = test.grade;
    document.getElementById('testDescription').value = test.description || '';
    
    // مسح الأسئلة القديمة
    document.getElementById('questionsContainer').innerHTML = '';
    questionCount = 0;
    
    // إضافة الأسئلة
    test.questions.forEach(question => {
        addQuestion();
        const lastQuestion = document.querySelector('.question-item:last-child');
        if (lastQuestion) {
            lastQuestion.querySelector('.question-text').value = question.text;
            lastQuestion.querySelector('.question-type').value = question.type;
            
            if (question.type === 'multiple-choice' && question.choices) {
                const choices = lastQuestion.querySelectorAll('.choice');
                question.choices.forEach((choice, index) => {
                    if (choices[index]) {
                        choices[index].value = choice.text;
                    }
                });
                lastQuestion.querySelector('.correct-choice').value = question.correctAnswer || 1;
            }
        }
    });
    
    showCreateTestModal();
}

function editLesson(lessonId) {
    const lessons = JSON.parse(localStorage.getItem('teacherLessons') || '[]');
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (!lesson) {
        showAuthNotification('الدرس غير موجود', 'error');
        return;
    }
    
    // تعبئة النموذج
    document.getElementById('lessonTitle').value = lesson.title;
    document.getElementById('lessonStrategy').value = lesson.strategy;
    document.getElementById('lessonSubject').value = lesson.subject;
    document.getElementById('lessonGrade').value = lesson.grade;
    document.getElementById('lessonDescription').value = lesson.description || '';
    document.getElementById('lessonIntroduction').value = lesson.introduction || '';
    
    // مسح التمارين القديمة
    document.getElementById('exercisesContainer').innerHTML = '';
    exerciseCount = 0;
    
    // إضافة التمارين
    lesson.exercises.forEach(exercise => {
        addExercise();
        const lastExercise = document.querySelector('.exercise-item:last-child');
        if (lastExercise) {
            lastExercise.querySelector('.exercise-title').value = exercise.title;
            lastExercise.querySelector('.exercise-content').value = exercise.content;
            lastExercise.querySelector('.exercise-type').value = exercise.type;
        }
    });
    
    showCreateLessonModal();
}

function editExercise(exerciseId) {
    // محاكاة التعديل
    alert('تعديل التمرين قيد التطوير');
}

// دوال التعيين
function assignTest(testId) {
    const tests = JSON.parse(localStorage.getItem('teacherTests') || '[]');
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    // عرض قائمة الطلاب
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentUser = getCurrentUser();
    const teacherStudents = students.filter(s => s.teacherId === currentUser.id);
    
    if (teacherStudents.length === 0) {
        showAuthNotification('لا توجد طلاب لتعيين الاختبار لهم', 'warning');
        return;
    }
    
    let studentList = 'اختر الطلاب لتعيين الاختبار لهم:\n';
    teacherStudents.forEach((student, index) => {
        studentList += `${index + 1}. ${student.name} (${student.grade})\n`;
    });
    studentList += '\nأدخل أرقام الطلاب مفصولة بفاصلة (مثال: 1,3,5):';
    
    const choice = prompt(studentList);
    if (!choice) return;
    
    const selectedIndexes = choice.split(',').map(num => parseInt(num.trim()) - 1);
    const selectedStudents = selectedIndexes
        .filter(idx => idx >= 0 && idx < teacherStudents.length)
        .map(idx => teacherStudents[idx]);
    
    if (selectedStudents.length === 0) {
        showAuthNotification('لم يتم اختيار أي طلاب', 'error');
        return;
    }
    
    // تعيين الاختبار للطلاب المختارين
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    
    selectedStudents.forEach(student => {
        const assignedTest = {
            id: generateId(),
            studentId: student.id,
            testId: test.id,
            testTitle: test.title,
            subject: test.subject,
            grade: test.grade,
            assignedAt: new Date().toISOString(),
            status: 'assigned',
            score: null,
            completedAt: null
        };
        
        studentTests.push(assignedTest);
        
        // تحديث عدد الاختبارات المعلقة للطالب
        updateStudentPendingTests(student.id);
    });
    
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    
    // زيادة عداد الاستخدام
    test.usageCount = (test.usageCount || 0) + 1;
    localStorage.setItem('teacherTests', JSON.stringify(tests));
    
    showAuthNotification(`تم تعيين الاختبار لـ ${selectedStudents.length} طالب`, 'success');
    updateContentStats();
}

function assignLesson(lessonId) {
    const lessons = JSON.parse(localStorage.getItem('teacherLessons') || '[]');
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (!lesson) {
        showAuthNotification('الدرس غير موجود', 'error');
        return;
    }
    
    // محاكاة التعيين
    alert(`تم تعيين درس "${lesson.title}" للطلاب`);
    
    // زيادة عداد الاستخدام
    lesson.usageCount = (lesson.usageCount || 0) + 1;
    localStorage.setItem('teacherLessons', JSON.stringify(lessons));
    
    updateContentStats();
}

function assignExercise(exerciseId) {
    const exercises = JSON.parse(localStorage.getItem('teacherExercises') || '[]');
    const exercise = exercises.find(e => e.id === exerciseId);
    
    if (!exercise) {
        showAuthNotification('التمرين غير موجود', 'error');
        return;
    }
    
    // محاكاة التعيين
    alert(`تم تعيين تمرين "${exercise.title}" للطلاب`);
    
    // زيادة عداد الاستخدام
    exercise.usageCount = (exercise.usageCount || 0) + 1;
    localStorage.setItem('teacherExercises', JSON.stringify(exercises));
    
    updateContentStats();
}

// دوال الحذف
function deleteTest(testId) {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
        return;
    }
    
    const tests = JSON.parse(localStorage.getItem('teacherTests') || '[]');
    const testIndex = tests.findIndex(t => t.id === testId);
    
    if (testIndex === -1) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    const testTitle = tests[testIndex].title;
    tests.splice(testIndex, 1);
    localStorage.setItem('teacherTests', JSON.stringify(tests));
    
    showAuthNotification(`تم حذف الاختبار "${testTitle}"`, 'success');
    loadTests();
    updateContentStats();
}

function deleteLesson(lessonId) {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
        return;
    }
    
    const lessons = JSON.parse(localStorage.getItem('teacherLessons') || '[]');
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);
    
    if (lessonIndex === -1) {
        showAuthNotification('الدرس غير موجود', 'error');
        return;
    }
    
    const lessonTitle = lessons[lessonIndex].title;
    lessons.splice(lessonIndex, 1);
    localStorage.setItem('teacherLessons', JSON.stringify(lessons));
    
    showAuthNotification(`تم حذف الدرس "${lessonTitle}"`, 'success');
    loadLessons();
    updateContentStats();
}

function deleteExercise(exerciseId) {
    if (!confirm('هل أنت متأكد من حذف هذا التمرين؟')) {
        return;
    }
    
    const exercises = JSON.parse(localStorage.getItem('teacherExercises') || '[]');
    const exerciseIndex = exercises.findIndex(e => e.id === exerciseId);
    
    if (exerciseIndex === -1) {
        showAuthNotification('التمرين غير موجود', 'error');
        return;
    }
    
    const exerciseTitle = exercises[exerciseIndex].title;
    exercises.splice(exerciseIndex, 1);
    localStorage.setItem('teacherExercises', JSON.stringify(exercises));
    
    showAuthNotification(`تم حذف التمرين "${exerciseTitle}"`, 'success');
    loadExercises();
    updateContentStats();
}

// البحث والتصفية
function searchContent() {
    const searchTerm = document.getElementById('contentSearch')?.value.toLowerCase();
    if (!searchTerm) return;
    
    const contentCards = document.querySelectorAll('.content-card');
    
    contentCards.forEach(card => {
        const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
        const description = card.querySelector('p')?.textContent.toLowerCase() || '';
        const subject = card.querySelector('.content-badge')?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm) || 
            description.includes(searchTerm) || 
            subject.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterContentByType(type) {
    // تحديث أزرار التصفية
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // تصفية المحتوى
    filterContent();
}

function filterContent() {
    const type = document.querySelector('.type-btn.active')?.textContent;
    const subject = document.getElementById('subjectFilter')?.value;
    const grade = document.getElementById('gradeFilter')?.value;
    
    const sections = document.querySelectorAll('.library-section');
    
    sections.forEach(section => {
        const contentCards = section.querySelectorAll('.content-card');
        let sectionVisible = false;
        
        contentCards.forEach(card => {
            const cardSubject = card.querySelector('.content-badge')?.textContent;
            const cardGrade = card.querySelector('.total-grade')?.textContent || '';
            const gradeMatch = cardGrade.includes(grade);
            
            let showCard = true;
            
            // تصفية حسب النوع
            if (type && type !== 'الكل') {
                const sectionTitle = section.querySelector('h2')?.textContent;
                if (!sectionTitle?.includes(type)) {
                    showCard = false;
                }
            }
            
            // تصفية حسب المادة
            if (subject && subject !== 'all' && cardSubject !== subject) {
                showCard = false;
            }
            
            // تصفية حسب الصف
            if (grade && grade !== 'all' && !gradeMatch) {
                showCard = false;
            }
            
            card.style.display = showCard ? 'block' : 'none';
            if (showCard) sectionVisible = true;
        });
        
        section.style.display = sectionVisible ? 'block' : 'none';
    });
}

// ============================================
// دوال إدارة الاختبارات
// ============================================

function loadTestsData() {
    loadTeacherTests();
    updateTestsStats();
}

function loadTeacherTests() {
    const tableBody = document.getElementById('testsTableBody');
    if (!tableBody) return;
    
    const currentUser = getCurrentUser();
    const tests = JSON.parse(localStorage.getItem('teacherTests') || '[]');
    const userTests = tests.filter(test => test.teacherId === currentUser.id);
    
    if (userTests.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <h3>لا توجد اختبارات</h3>
                        <p>قم بإنشاء اختبارك الأول</p>
                        <button class="btn btn-success" onclick="showCreateTestModal()">إنشاء اختبار جديد</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = userTests.map(test => {
        const usageCount = test.usageCount || 0;
        const questionsCount = test.questions ? test.questions.length : 0;
        
        return `
            <tr>
                <td>${test.title}</td>
                <td>${test.subject}</td>
                <td>${test.grade}</td>
                <td>${questionsCount}</td>
                <td>${usageCount}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="viewTest(${test.id})">عرض</button>
                        <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})">تعديل</button>
                        <button class="btn btn-sm btn-success" onclick="assignTest(${test.id})">تعيين</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})">حذف</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateTestsStats() {
    const currentUser = getCurrentUser();
    const tests = JSON.parse(localStorage.getItem('teacherTests') || '[]');
    const userTests = tests.filter(test => test.teacherId === currentUser.id);
    
    const totalTests = userTests.length;
    const totalQuestions = userTests.reduce((sum, test) => sum + (test.questions?.length || 0), 0);
    const totalUsage = userTests.reduce((sum, test) => sum + (test.usageCount || 0), 0);
    const avgQuestions = totalTests > 0 ? Math.round(totalQuestions / totalTests) : 0;
    
    document.getElementById('totalTestsCount')?.textContent = totalTests;
    document.getElementById('totalQuestionsCount')?.textContent = totalQuestions;
    document.getElementById('totalTestsUsage')?.textContent = totalUsage;
    document.getElementById('avgQuestionsCount')?.textContent = avgQuestions;
}

// ============================================
// دوال إدارة الواجبات
// ============================================

function loadAssignmentsData() {
    loadAssignmentsList();
    updateAssignmentsStats();
}

function loadAssignmentsList() {
    const tableBody = document.getElementById('assignmentsTableBody');
    if (!tableBody) return;
    
    const currentUser = getCurrentUser();
    const assignments = JSON.parse(localStorage.getItem('teacherAssignments') || '[]');
    const userAssignments = assignments.filter(a => a.teacherId === currentUser.id);
    
    if (userAssignments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <h3>لا توجد واجبات</h3>
                        <p>قم بإنشاء واجبك الأول</p>
                        <button class="btn btn-success" onclick="showCreateAssignmentModal()">إنشاء واجب جديد</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = userAssignments.map(assignment => {
        const statusText = getAssignmentStatusText(assignment.status);
        const statusClass = getAssignmentStatusClass(assignment.status);
        
        return `
            <tr>
                <td>${assignment.title}</td>
                <td>${assignment.subject}</td>
                <td>${assignment.grade}</td>
                <td>${formatDateShort(assignment.dueDate)}</td>
                <td>
                    <span class="status-badge status-${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="viewAssignment(${assignment.id})">عرض</button>
                        <button class="btn btn-sm btn-warning" onclick="editAssignment(${assignment.id})">تعديل</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${assignment.id})">حذف</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getAssignmentStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'completed': 'منتهي',
        'draft': 'مسودة'
    };
    return statusMap[status] || status;
}

function getAssignmentStatusClass(status) {
    const classMap = {
        'active': 'success',
        'completed': 'warning',
        'draft': 'secondary'
    };
    return classMap[status] || 'secondary';
}

function updateAssignmentsStats() {
    const currentUser = getCurrentUser();
    const assignments = JSON.parse(localStorage.getItem('teacherAssignments') || '[]');
    const userAssignments = assignments.filter(a => a.teacherId === currentUser.id);
    
    const totalAssignments = userAssignments.length;
    const activeAssignments = userAssignments.filter(a => a.status === 'active').length;
    const completedAssignments = userAssignments.filter(a => a.status === 'completed').length;
    
    document.getElementById('totalAssignments')?.textContent = totalAssignments;
    document.getElementById('activeAssignments')?.textContent = activeAssignments;
    document.getElementById('completedAssignments')?.textContent = completedAssignments;
}

function showCreateAssignmentModal() {
    alert('إنشاء الواجب قيد التطوير');
}

// ============================================
// دوال إدارة التقارير
// ============================================

function loadReportsData() {
    loadStudentReports();
    updateReportsStats();
}

function loadStudentReports() {
    const tableBody = document.getElementById('reportsTableBody');
    if (!tableBody) return;
    
    const currentUser = getCurrentUser();
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const teacherStudents = students.filter(s => s.teacherId === currentUser.id);
    
    if (teacherStudents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <div class="empty-icon">📊</div>
                        <h3>لا توجد تقارير</h3>
                        <p>لا توجد طلاب لعرض تقاريرهم</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = teacherStudents.map(student => {
        const progress = student.progress || 0;
        const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
        
        return `
            <tr>
                <td>
                    <div class="student-info">
                        <div class="student-avatar-small">${student.name.charAt(0)}</div>
                        <span>${student.name}</span>
                    </div>
                </td>
                <td>${student.grade}</td>
                <td>${student.subject}</td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-text">${progress}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%; background-color: var(--${progressClass}-color);"></div>
                        </div>
                    </div>
                </td>
                <td>${student.completedTests || 0} / ${student.pendingTests || 0}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="generateStudentReport(${student.id})">
                            <i class="fas fa-file-pdf"></i> تقرير
                        </button>
                        <button class="btn btn-sm btn-success" onclick="viewStudentProgress(${student.id})">
                            <i class="fas fa-chart-line"></i> تقدم
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateReportsStats() {
    const currentUser = getCurrentUser();
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const teacherStudents = students.filter(s => s.teacherId === currentUser.id);
    
    const totalStudents = teacherStudents.length;
    const avgProgress = totalStudents > 0 ? 
        Math.round(teacherStudents.reduce((sum, s) => sum + (s.progress || 0), 0) / totalStudents) : 0;
    const totalTests = teacherStudents.reduce((sum, s) => sum + (s.completedTests || 0), 0);
    
    document.getElementById('reportsStudentsCount')?.textContent = totalStudents;
    document.getElementById('reportsAvgProgress')?.textContent = `${avgProgress}%`;
    document.getElementById('reportsTotalTests')?.textContent = totalTests;
}

function generateStudentReport(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    showAuthNotification('جاري إنشاء تقرير الطالب...', 'info');
    
    setTimeout(() => {
        // محاكاة إنشاء التقرير
        const reportContent = `
            تقرير أداء الطالب
            =================
            
            اسم الطالب: ${student.name}
            الصف: ${student.grade}
            المادة: ${student.subject}
            
            نسبة التقدم: ${student.progress || 0}%
            الاختبارات المكتملة: ${student.completedTests || 0}
            الاختبارات المعلقة: ${student.pendingTests || 0}
            
            تاريخ التقرير: ${formatDate(new Date())}
        `;
        
        // محاكاة تحميل الملف
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير-${student.name}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAuthNotification('تم إنشاء التقرير بنجاح', 'success');
    }, 1500);
}

function viewStudentProgress(studentId) {
    window.location.href = `student-profile.html?id=${studentId}&tab=progress`;
}

// ============================================
// دوال لجنة صعوبات التعلم
// ============================================

function loadCommitteeData() {
    loadCommitteeMembers();
    loadCommitteeNotes();
    updateCommitteeStats();
}

function loadCommitteeMembers() {
    const membersList = document.getElementById('committeeMembersList');
    if (!membersList) return;
    
    const currentUser = getCurrentUser();
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const teacherMembers = committeeMembers.filter(member => member.teacherId === currentUser.id);
    
    if (teacherMembers.length === 0) {
        membersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>لا توجد أعضاء في اللجنة</h3>
                <p>قم بإضافة أعضاء لجنة صعوبات التعلم</p>
                <button class="btn btn-success" onclick="showAddCommitteeMemberModal()">إضافة عضو جديد</button>
            </div>
        `;
        return;
    }
    
    membersList.innerHTML = teacherMembers.map(member => {
        return `
            <div class="member-card">
                <div class="member-info">
                    <div class="member-avatar">${member.name.charAt(0)}</div>
                    <div class="member-details">
                        <h4>${member.name}</h4>
                        <div class="member-meta">
                            <span class="member-role">${member.role}</span>
                            <span class="member-username">${member.username}</span>
                        </div>
                    </div>
                </div>
                <div class="member-actions">
                    <button class="btn btn-sm btn-primary" onclick="editCommitteeMember(${member.id})">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCommitteeMember(${member.id})">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function loadCommitteeNotes() {
    const notesList = document.getElementById('committeeNotesList');
    if (!notesList) return;
    
    const currentUser = getCurrentUser();
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const teacherNotes = committeeNotes.filter(note => note.teacherId === currentUser.id);
    
    if (teacherNotes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد ملاحظات</h3>
                <p>لم يتم إرسال أي ملاحظات من أعضاء اللجنة</p>
            </div>
        `;
        return;
    }
    
    notesList.innerHTML = teacherNotes.map(note => {
        const member = getCommitteeMemberById(note.memberId);
        const isRead = note.isRead || false;
        
        return `
            <div class="note-card ${isRead ? 'read' : 'unread'}">
                <div class="note-header">
                    <div class="note-sender">
                        <strong>${member?.name || 'عضو اللجنة'}</strong>
                        <span class="sender-role">${member?.role || ''}</span>
                    </div>
                    <div class="note-date">${formatDateShort(note.sentAt)}</div>
                </div>
                <div class="note-content">
                    <p>${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
                </div>
                <div class="note-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewCommitteeNote(${note.id})">عرض</button>
                    ${!isRead ? `<button class="btn btn-sm btn-success" onclick="markCommitteeNoteAsRead(${note.id})">تعليم كمقروء</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteCommitteeNote(${note.id})">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateCommitteeStats() {
    const currentUser = getCurrentUser();
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    
    const teacherMembers = committeeMembers.filter(member => member.teacherId === currentUser.id);
    const teacherNotes = committeeNotes.filter(note => note.teacherId === currentUser.id);
    const unreadNotes = teacherNotes.filter(note => !note.isRead).length;
    
    document.getElementById('committeeMembersCount')?.textContent = teacherMembers.length;
    document.getElementById('committeeNotesCount')?.textContent = teacherNotes.length;
    document.getElementById('committeeUnreadNotes')?.textContent = unreadNotes;
}

function getCommitteeMemberById(memberId) {
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    return committeeMembers.find(m => m.id === memberId);
}

function showAddCommitteeMemberModal() {
    document.getElementById('addCommitteeMemberModal').classList.add('show');
    document.getElementById('addCommitteeMemberForm').reset();
}

function closeAddCommitteeMemberModal() {
    document.getElementById('addCommitteeMemberModal').classList.remove('show');
}

function addNewCommitteeMember() {
    const name = document.getElementById('committeeMemberName').value.trim();
    const role = document.getElementById('committeeMemberRole').value;
    const username = document.getElementById('committeeMemberUsername').value.trim();
    const password = document.getElementById('committeeMemberPassword').value;
    
    if (!name || !role || !username || !password) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    
    // التحقق من عدم تكرار اسم المستخدم
    const existingMember = committeeMembers.find(m => m.username === username);
    if (existingMember) {
        showAuthNotification('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }
    
    const newMember = {
        id: generateId(),
        teacherId: currentUser.id,
        name: name,
        role: role,
        username: username,
        password: password,
        createdAt: new Date().toISOString(),
        status: 'active'
    };
    
    committeeMembers.push(newMember);
    localStorage.setItem('committeeMembers', JSON.stringify(newMember));
    
    // إضافة حساب المستخدم
    addCommitteeUserAccount(newMember);
    
    showAuthNotification('تم إضافة عضو اللجنة بنجاح', 'success');
    closeAddCommitteeMemberModal();
    loadCommitteeData();
}

function addCommitteeUserAccount(member) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const userAccount = {
        id: member.id,
        username: member.username,
        password: member.password,
        role: 'committee',
        name: member.name,
        teacherId: member.teacherId,
        position: member.role,
        status: member.status,
        createdAt: member.createdAt,
        lastLogin: null,
        loginAttempts: 0
    };
    
    users.push(userAccount);
    localStorage.setItem('users', JSON.stringify(users));
}

function editCommitteeMember(memberId) {
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const member = committeeMembers.find(m => m.id === memberId);
    
    if (!member) {
        showAuthNotification('عضو اللجنة غير موجود', 'error');
        return;
    }
    
    // تعبئة النموذج
    document.getElementById('editCommitteeMemberId').value = member.id;
    document.getElementById('editCommitteeMemberName').value = member.name;
    document.getElementById('editCommitteeMemberRole').value = member.role;
    document.getElementById('editCommitteeMemberStatus').value = member.status;
    
    document.getElementById('editCommitteeMemberModal').classList.add('show');
}

function closeEditCommitteeMemberModal() {
    document.getElementById('editCommitteeMemberModal').classList.remove('show');
}

function updateCommitteeMember() {
    const memberId = parseInt(document.getElementById('editCommitteeMemberId').value);
    const name = document.getElementById('editCommitteeMemberName').value.trim();
    const role = document.getElementById('editCommitteeMemberRole').value;
    const status = document.getElementById('editCommitteeMemberStatus').value;
    
    if (!name || !role) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const memberIndex = committeeMembers.findIndex(m => m.id === memberId);
    
    if (memberIndex === -1) {
        showAuthNotification('عضو اللجنة غير موجود', 'error');
        return;
    }
    
    // تحديث البيانات
    committeeMembers[memberIndex].name = name;
    committeeMembers[memberIndex].role = role;
    committeeMembers[memberIndex].status = status;
    
    localStorage.setItem('committeeMembers', JSON.stringify(committeeMembers));
    
    // تحديث حساب المستخدم
    updateCommitteeUserAccount(committeeMembers[memberIndex]);
    
    showAuthNotification('تم تحديث بيانات عضو اللجنة بنجاح', 'success');
    closeEditCommitteeMemberModal();
    loadCommitteeData();
}

function updateCommitteeUserAccount(member) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === member.id);
    
    if (userIndex !== -1) {
        users[userIndex].name = member.name;
        users[userIndex].position = member.role;
        users[userIndex].status = member.status;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function deleteCommitteeMember(memberId) {
    if (!confirm('هل أنت متأكد من حذف عضو اللجنة؟')) {
        return;
    }
    
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const memberIndex = committeeMembers.findIndex(m => m.id === memberId);
    
    if (memberIndex === -1) {
        showAuthNotification('عضو اللجنة غير موجود', 'error');
        return;
    }
    
    const memberName = committeeMembers[memberIndex].name;
    committeeMembers.splice(memberIndex, 1);
    localStorage.setItem('committeeMembers', JSON.stringify(committeeMembers));
    
    // حذف حساب المستخدم
    deleteUserAccount(memberId);
    
    showAuthNotification(`تم حذف عضو اللجنة "${memberName}"`, 'success');
    loadCommitteeData();
}

function viewCommitteeNote(noteId) {
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const note = committeeNotes.find(n => n.id === noteId);
    
    if (!note) {
        showAuthNotification('الملاحظة غير موجودة', 'error');
        return;
    }
    
    const member = getCommitteeMemberById(note.memberId);
    
    document.getElementById('viewNoteModalTitle').textContent = 'ملاحظة من عضو اللجنة';
    document.getElementById('viewNoteContent').innerHTML = `
        <div class="note-details">
            <p><strong>المرسل:</strong> ${member?.name || 'عضو اللجنة'}</p>
            <p><strong>الدور:</strong> ${member?.role || ''}</p>
            <p><strong>التاريخ:</strong> ${formatDate(note.sentAt)}</p>
            <div class="note-content-full">
                <h5>محتوى الملاحظة:</h5>
                <p>${note.content}</p>
            </div>
        </div>
    `;
    document.getElementById('viewNoteModal').classList.add('show');
    
    // تعليم الملاحظة كمقروءة
    markCommitteeNoteAsRead(noteId);
}

function closeViewNoteModal() {
    document.getElementById('viewNoteModal').classList.remove('show');
}

function markCommitteeNoteAsRead(noteId) {
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const noteIndex = committeeNotes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1) {
        committeeNotes[noteIndex].isRead = true;
        localStorage.setItem('committeeNotes', JSON.stringify(committeeNotes));
        loadCommitteeNotes();
        updateCommitteeStats();
    }
}

function deleteCommitteeNote(noteId) {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
        return;
    }
    
    const committeeNotes = JSON.parse(localStorage.getItem('committeeNotes') || '[]');
    const noteIndex = committeeNotes.findIndex(n => n.id === noteId);
    
    if (noteIndex === -1) {
        showAuthNotification('الملاحظة غير موجودة', 'error');
        return;
    }
    
    committeeNotes.splice(noteIndex, 1);
    localStorage.setItem('committeeNotes', JSON.stringify(committeeNotes));
    
    showAuthNotification('تم حذف الملاحظة', 'success');
    loadCommitteeNotes();
    updateCommitteeStats();
}

// ============================================
// دوال ملف الطالب
// ============================================

function loadStudentProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = parseInt(urlParams.get('id'));
    
    if (!studentId) {
        showAuthNotification('لم يتم تحديد طالب', 'error');
        setTimeout(() => {
            window.location.href = 'students.html';
        }, 2000);
        return;
    }
    
    loadStudentData(studentId);
    setupStudentTabs();
}

function loadStudentData(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        setTimeout(() => {
            window.location.href = 'students.html';
        }, 2000);
        return;
    }
    
    // تحديث واجهة الطالب
    document.getElementById('studentProfileName').textContent = student.name;
    document.getElementById('studentAvatar').textContent = student.name.charAt(0);
    document.getElementById('studentGrade').textContent = student.grade;
    document.getElementById('studentSubject').textContent = student.subject;
    document.getElementById('studentProgress').textContent = `${student.progress || 0}%`;
    
    // تحميل البيانات الأخرى
    loadStudentTests(studentId);
    loadStudentLessons(studentId);
    loadStudentAssignments(studentId);
    loadStudentProgress(studentId);
}

function setupStudentTabs() {
    const tabBtns = document.querySelectorAll('.student-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.student-tabs .tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // إزالة النشاط من جميع الأزرار
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // إضافة النشاط للزر والتبويب المحدد
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // التحقق من وجود تبويب في الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
        const tabBtn = document.querySelector(`.student-tabs .tab-btn[data-tab="${tab}"]`);
        if (tabBtn) {
            tabBtn.click();
        }
    }
}

function loadStudentTests(studentId) {
    const testsList = document.getElementById('studentTestsList');
    if (!testsList) return;
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const studentTestItems = studentTests.filter(st => st.studentId === studentId);
    
    if (studentTestItems.length === 0) {
        testsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد اختبارات</h3>
                <p>لم يتم تعيين أي اختبارات للطالب</p>
            </div>
        `;
        return;
    }
    
    testsList.innerHTML = studentTestItems.map(test => {
        const statusText = getTestStatusText(test.status);
        const statusClass = getTestStatusClass(test.status);
        const scoreText = test.score !== null ? `${test.score}%` : 'لم يتم التصحيح';
        
        return `
            <div class="test-card ${test.status}">
                <div class="test-header">
                    <h5>${test.testTitle}</h5>
                    <span class="test-status status-${statusClass}">${statusText}</span>
                </div>
                <div class="test-details">
                    <p><strong>المادة:</strong> ${test.subject || 'غير محدد'}</p>
                    <p><strong>الصف:</strong> ${test.grade || 'غير محدد'}</p>
                    <p><strong>تاريخ التعيين:</strong> ${formatDateShort(test.assignedAt)}</p>
                    <p><strong>النتيجة:</strong> ${scoreText}</p>
                </div>
                <div class="test-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewStudentTest(${test.id})">عرض</button>
                    ${test.status === 'assigned' ? `<button class="btn btn-sm btn-success" onclick="markTestAsCompleted(${test.id})">تأكيد الإكمال</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getTestStatusText(status) {
    const statusMap = {
        'assigned': 'معلقة',
        'completed': 'مكتملة',
        'graded': 'مصححة'
    };
    return statusMap[status] || status;
}

function getTestStatusClass(status) {
    const classMap = {
        'assigned': 'warning',
        'completed': 'info',
        'graded': 'success'
    };
    return classMap[status] || 'secondary';
}

function loadStudentLessons(studentId) {
    const lessonsList = document.getElementById('studentLessonsList');
    if (!lessonsList) return;
    
    // محاكاة بيانات الدروس
    const lessons = [
        {
            id: 1,
            title: 'درس الحروف المتصلة',
            subject: 'لغتي',
            status: 'completed',
            completedAt: '2024-01-15'
        },
        {
            id: 2,
            title: 'درس الجمع البسيط',
            subject: 'رياضيات',
            status: 'in-progress',
            progress: 60
        }
    ];
    
    lessonsList.innerHTML = lessons.map(lesson => {
        const statusText = lesson.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ';
        const statusClass = lesson.status === 'completed' ? 'success' : 'warning';
        const progressText = lesson.progress ? `(${lesson.progress}%)` : '';
        
        return `
            <div class="lesson-item ${lesson.status}">
                <div class="lesson-header">
                    <h5>${lesson.title}</h5>
                    <span class="lesson-status status-${statusClass}">${statusText} ${progressText}</span>
                </div>
                <div class="lesson-details">
                    <p><strong>المادة:</strong> ${lesson.subject}</p>
                    ${lesson.completedAt ? `<p><strong>تاريخ الإكمال:</strong> ${formatDateShort(lesson.completedAt)}</p>` : ''}
                </div>
                <div class="lesson-actions">
                    <button class="btn btn-sm btn-primary">عرض</button>
                    <button class="btn btn-sm btn-success">متابعة</button>
                </div>
            </div>
        `;
    }).join('');
}

function loadStudentAssignments(studentId) {
    const assignmentsList = document.getElementById('studentAssignmentsList');
    if (!assignmentsList) return;
    
    // محاكاة بيانات الواجبات
    const assignments = [
        {
            id: 1,
            title: 'واجب القراءة',
            subject: 'لغتي',
            dueDate: '2024-01-20',
            status: 'pending'
        },
        {
            id: 2,
            title: 'واجب العمليات الحسابية',
            subject: 'رياضيات',
            dueDate: '2024-01-18',
            status: 'completed'
        }
    ];
    
    assignmentsList.innerHTML = assignments.map(assignment => {
        const statusText = assignment.status === 'completed' ? 'مكتمل' : 'معلق';
        const statusClass = assignment.status === 'completed' ? 'success' : 'warning';
        const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed';
        
        return `
            <div class="assignment-item ${assignment.status} ${isOverdue ? 'overdue' : ''}">
                <div class="assignment-header">
                    <h5>${assignment.title}</h5>
                    <span class="assignment-status status-${statusClass}">${statusText}</span>
                </div>
                <div class="assignment-details">
                    <p><strong>المادة:</strong> ${assignment.subject}</p>
                    <p><strong>موعد التسليم:</strong> ${formatDateShort(assignment.dueDate)}</p>
                    ${isOverdue ? '<p class="text-danger"><strong>✗ تأخر في التسليم</strong></p>' : ''}
                </div>
                <div class="assignment-actions">
                    <button class="btn btn-sm btn-primary">عرض</button>
                    ${assignment.status === 'pending' ? `<button class="btn btn-sm btn-success">تسليم</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function loadStudentProgress(studentId) {
    const progressChart = document.getElementById('studentProgressChart');
    const progressTimeline = document.getElementById('studentProgressTimeline');
    
    if (!progressChart && !progressTimeline) return;
    
    // محاكاة بيانات التقدم
    if (progressChart) {
        progressChart.innerHTML = `
            <div class="chart-placeholder">
                <i class="fas fa-chart-line" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <p>مخطط تقدم الطالب</p>
                <p class="text-muted">سيظهر هنا تقدم الطالب عبر الوقت</p>
            </div>
        `;
    }
    
    if (progressTimeline) {
        const timelineData = [
            {
                title: 'بدأ البرنامج التعليمي',
                date: '2024-01-01',
                status: 'completed',
                description: 'بداية المشاركة في برنامج صعوبات التعلم'
            },
            {
                title: 'الاختبار التشخيصي الأول',
                date: '2024-01-05',
                status: 'completed',
                description: 'نتيجة الاختبار: 65%'
            },
            {
                title: 'تحسن في مهارات القراءة',
                date: '2024-01-10',
                status: 'completed',
                description: 'تحسن ملحوظ في سرعة القراءة'
            },
            {
                title: 'الهدف الحالي',
                date: '2024-01-15',
                status: 'in-progress',
                description: 'تحسين مهارات الكتابة'
            }
        ];
        
        progressTimeline.innerHTML = timelineData.map(item => {
            return `
                <div class="timeline-item ${item.status}">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h6>${item.title}</h6>
                        <p>${item.description}</p>
                        <div class="timeline-meta">
                            <span class="timeline-date">${formatDateShort(item.date)}</span>
                            <span class="timeline-status">${item.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function viewStudentTest(testId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const test = studentTests.find(st => st.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    document.getElementById('contentModalTitle').textContent = test.testTitle;
    document.getElementById('contentDetailsBody').innerHTML = `
        <div class="test-info-card">
            <h4>${test.testTitle}</h4>
            <div class="test-details">
                <p><strong>المادة:</strong> ${test.subject || 'غير محدد'}</p>
                <p><strong>الصف:</strong> ${test.grade || 'غير محدد'}</p>
                <p><strong>تاريخ التعيين:</strong> ${formatDate(test.assignedAt)}</p>
                <p><strong>الحالة:</strong> ${getTestStatusText(test.status)}</p>
                ${test.score !== null ? `<p><strong>النتيجة:</strong> ${test.score}%</p>` : ''}
                ${test.completedAt ? `<p><strong>تاريخ الإكمال:</strong> ${formatDate(test.completedAt)}</p>` : ''}
            </div>
            <div class="test-actions">
                <button class="btn btn-primary" onclick="gradeStudentTest(${test.id})">تصحيح</button>
                <button class="btn btn-success" onclick="downloadTestResults(${test.id})">تحميل النتائج</button>
            </div>
        </div>
    `;
    document.getElementById('contentDetailsModal').classList.add('show');
}

function markTestAsCompleted(testId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const testIndex = studentTests.findIndex(st => st.id === testId);
    
    if (testIndex === -1) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    studentTests[testIndex].status = 'completed';
    studentTests[testIndex].completedAt = new Date().toISOString();
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    
    // تحديث إحصائيات الطالب
    updateStudentTestStats(studentTests[testIndex].studentId);
    
    showAuthNotification('تم تأكيد إكمال الاختبار', 'success');
    loadStudentTests(studentTests[testIndex].studentId);
    closeContentDetailsModal();
}

function gradeStudentTest(testId) {
    const score = prompt('أدخل درجة الطالب (0-100):');
    if (!score) return;
    
    const numericScore = parseInt(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        showAuthNotification('يرجى إدخال درجة صحيحة بين 0 و 100', 'error');
        return;
    }
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const testIndex = studentTests.findIndex(st => st.id === testId);
    
    if (testIndex === -1) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    studentTests[testIndex].status = 'graded';
    studentTests[testIndex].score = numericScore;
    localStorage.setItem('studentTests', JSON.stringify(studentTests));
    
    // تحديث إحصائيات الطالب
    updateStudentTestStats(studentTests[testIndex].studentId);
    
    showAuthNotification(`تم تصحيح الاختبار، النتيجة: ${numericScore}%`, 'success');
    closeContentDetailsModal();
    loadStudentTests(studentTests[testIndex].studentId);
}

function updateStudentTestStats(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) return;
    
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const studentTestItems = studentTests.filter(st => st.studentId === studentId);
    
    const completedTests = studentTestItems.filter(st => st.status === 'completed' || st.status === 'graded').length;
    const pendingTests = studentTestItems.filter(st => st.status === 'assigned').length;
    
    // حساب متوسط التقدم بناءً على النتائج
    const gradedTests = studentTestItems.filter(st => st.status === 'graded');
    const avgScore = gradedTests.length > 0 ? 
        Math.round(gradedTests.reduce((sum, t) => sum + (t.score || 0), 0) / gradedTests.length) : 
        students[studentIndex].progress || 0;
    
    students[studentIndex].completedTests = completedTests;
    students[studentIndex].pendingTests = pendingTests;
    students[studentIndex].progress = avgScore;
    
    localStorage.setItem('students', JSON.stringify(students));
}

function downloadTestResults(testId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const test = studentTests.find(st => st.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    const resultsContent = `
        نتائج الاختبار
        =============
        
        اسم الاختبار: ${test.testTitle}
        المادة: ${test.subject || 'غير محدد'}
        الصف: ${test.grade || 'غير محدد'}
        الحالة: ${getTestStatusText(test.status)}
        ${test.score !== null ? `النتيجة: ${test.score}%` : 'لم يتم التصحيح بعد'}
        تاريخ التعيين: ${formatDate(test.assignedAt)}
        ${test.completedAt ? `تاريخ الإكمال: ${formatDate(test.completedAt)}` : ''}
        
        تاريخ التقرير: ${formatDate(new Date())}
    `;
    
    const blob = new Blob([resultsContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نتائج-${test.testTitle}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAuthNotification('تم تحميل النتائج', 'success');
}

// ============================================
// دوال المساعدة العامة
// ============================================

function addTeacherActivity(activity) {
    const currentUser = getCurrentUser();
    const teacherActivities = JSON.parse(localStorage.getItem('teacherActivities') || '[]');
    
    teacherActivities.push({
        ...activity,
        teacherId: currentUser.id,
        timestamp: new Date().toISOString()
    });
    
    // الاحتفاظ فقط بآخر 50 نشاط
    if (teacherActivities.length > 50) {
        teacherActivities.splice(0, teacherActivities.length - 50);
    }
    
    localStorage.setItem('teacherActivities', JSON.stringify(teacherActivities));
}

function showNotifications() {
    alert('نظام الإشعارات قيد التطوير');
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// تصدير الدوال للاستخدام العالمي
window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.addNewStudent = addNewStudent;
window.editStudent = editStudent;
window.closeEditStudentModal = closeEditStudentModal;
window.updateStudent = updateStudent;
window.assignTestToStudent = assignTestToStudent;
window.deleteStudent = deleteStudent;
window.searchStudents = searchStudents;
window.showCreateTestModal = showCreateTestModal;
window.closeCreateTestModal = closeCreateTestModal;
window.showCreateLessonModal = showCreateLessonModal;
window.closeCreateLessonModal = closeCreateLessonModal;
window.addQuestion = addQuestion;
window.removeQuestion = removeQuestion;
window.addExercise = addExercise;
window.removeExercise = removeExercise;
window.saveTest = saveTest;
window.saveLesson = saveLesson;
window.viewTest = viewTest;
window.viewLesson = viewLesson;
window.viewExercise = viewExercise;
window.closeContentDetailsModal = closeContentDetailsModal;
window.editTest = editTest;
window.editLesson = editLesson;
window.assignTest = assignTest;
window.assignLesson = assignLesson;
window.assignExercise = assignExercise;
window.deleteTest = deleteTest;
window.deleteLesson = deleteLesson;
window.deleteExercise = deleteExercise;
window.searchContent = searchContent;
window.filterContentByType = filterContentByType;
window.filterContent = filterContent;
window.generateStudentReport = generateStudentReport;
window.viewStudentProgress = viewStudentProgress;
window.showAddCommitteeMemberModal = showAddCommitteeMemberModal;
window.closeAddCommitteeMemberModal = closeAddCommitteeMemberModal;
window.addNewCommitteeMember = addNewCommitteeMember;
window.editCommitteeMember = editCommitteeMember;
window.closeEditCommitteeMemberModal = closeEditCommitteeMemberModal;
window.updateCommitteeMember = updateCommitteeMember;
window.deleteCommitteeMember = deleteCommitteeMember;
window.viewCommitteeNote = viewCommitteeNote;
window.closeViewNoteModal = closeViewNoteModal;
window.markCommitteeNoteAsRead = markCommitteeNoteAsRead;
window.deleteCommitteeNote = deleteCommitteeNote;
window.viewStudentTest = viewStudentTest;
window.markTestAsCompleted = markTestAsCompleted;
window.gradeStudentTest = gradeStudentTest;
window.downloadTestResults = downloadTestResults;
window.showNotifications = showNotifications;
window.toggleSidebar = toggleSidebar;
window.showCreateAssignmentModal = showCreateAssignmentModal;
