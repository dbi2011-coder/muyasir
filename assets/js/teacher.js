// ============================================
// 📁 الملف: muyasir-main/assets/js/teacher.js
// ============================================

// إدارة لوحة تحكم المعلم
let selectedStudents = new Set();
let currentViewingStudentId = null;
let currentViewingTestId = null;
let currentViewingLessonId = null;
let currentViewingAssignmentId = null;

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من المصادقة
    const user = checkAuth();
    if (!user) {
        window.location.href = '../../index.html';
        return;
    }

    // تهيئة واجهة المستخدم
    updateTeacherInterface(user);
    
    // إعداد القائمة الجانبية
    setupTeacherMenu();
    
    // تحميل البيانات حسب الصفحة
    if (window.location.pathname.includes('dashboard.html')) {
        initializeTeacherDashboard();
    } else if (window.location.pathname.includes('students.html')) {
        loadStudentsData();
    } else if (window.location.pathname.includes('library.html')) {
        loadEducationalContent();
    } else if (window.location.pathname.includes('messages.html')) {
        loadTeacherMessages();
    } else if (window.location.pathname.includes('schedule.html')) {
        loadTeacherSchedule();
    } else if (window.location.pathname.includes('student-file.html')) {
        loadStudentFile();
    } else if (window.location.pathname.includes('committee.html')) {
        loadCommitteeData();
    } else if (window.location.pathname.includes('diagnostic-tests.html')) {
        // يتم التعامل معه في ملف diagnostic-tests.js
        return;
    }

    // إعداد القائمة المتنقلة
    setupMobileMenu();
});

function setupTeacherMenu() {
    const menuContainer = document.getElementById('sidebarMenu');
    if (!menuContainer) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const menuItems = [
        {
            icon: '🏠',
            text: 'لوحة التحكم',
            href: 'dashboard.html',
            active: window.location.pathname.includes('dashboard.html')
        },
        {
            icon: '📊',
            text: 'الاختبارات التشخيصية',
            href: 'diagnostic-tests.html',
            active: window.location.pathname.includes('diagnostic-tests.html')
        },
        {
            icon: '👨‍🎓',
            text: 'الطلاب',
            href: 'students.html',
            active: window.location.pathname.includes('students.html')
        },
        {
            icon: '📚',
            text: 'المحتوى التعليمي',
            href: 'library.html',
            active: window.location.pathname.includes('library.html')
        },
        {
            icon: '📅',
            text: 'الجدول الدراسي',
            href: 'schedule.html',
            active: window.location.pathname.includes('schedule.html')
        },
        {
            icon: '💬',
            text: 'المراسلات',
            href: 'messages.html',
            active: window.location.pathname.includes('messages.html')
        },
        {
            icon: '👥',
            text: 'لجنة صعوبات التعلم',
            href: 'committee.html',
            active: window.location.pathname.includes('committee.html')
        },
        {
            icon: '⚙️',
            text: 'الإعدادات',
            href: 'settings.html',
            active: window.location.pathname.includes('settings.html')
        },
        {
            icon: '🚪',
            text: 'تسجيل الخروج',
            href: '#',
            onClick: 'logout()'
        }
    ];

    menuContainer.innerHTML = menuItems.map(item => `
        <li>
            <a href="${item.href}" 
               class="${item.active ? 'active' : ''}"
               ${item.onClick ? `onclick="${item.onClick}; return false;"` : ''}>
                <span class="menu-icon">${item.icon}</span>
                <span>${item.text}</span>
            </a>
        </li>
    `).join('');
}

function initializeTeacherDashboard() {
    loadTeacherStats();
    loadFeaturedStudents();
    loadImportantNotices();
    loadUpcomingAssignments();
}

function updateTeacherInterface(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    const welcomeTextElement = document.getElementById('welcomeText');
    
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
    }
    
    if (welcomeTextElement) {
        welcomeTextElement.textContent = `مرحباً بعودتك، ${user.name}`;
    }
}

function loadTeacherStats() {
    const currentUser = getCurrentUser();
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const teacherStudents = students.filter(student => student.teacherId === currentUser.id);
    
    const stats = {
        totalStudents: teacherStudents.length,
        activeStudents: teacherStudents.filter(s => s.status === 'active').length,
        completedTests: teacherStudents.reduce((sum, student) => sum + (student.completedTests || 0), 0),
        pendingAssignments: teacherStudents.reduce((sum, student) => sum + (student.pendingAssignments || 0), 0)
    };
    
    updateStatsElements(stats);
}

function updateStatsElements(stats) {
    const elements = {
        'totalStudentsCount': stats.totalStudents,
        'activeStudentsCount': stats.activeStudents,
        'completedTestsCount': stats.completedTests,
        'pendingAssignmentsCount': stats.pendingAssignments
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
}

function loadFeaturedStudents() {
    const container = document.getElementById('featuredStudentsList');
    if (!container) return;
    
    const currentUser = getCurrentUser();
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const teacherStudents = students.filter(student => student.teacherId === currentUser.id);
    
    // أخذ أفضل 4 طلاب حسب التقدم
    const featuredStudents = teacherStudents
        .sort((a, b) => (b.progress || 0) - (a.progress || 0))
        .slice(0, 4);
    
    if (featuredStudents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍🎓</div>
                <h3>لا توجد طلاب</h3>
                <p>لم يتم إضافة أي طلاب بعد</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = featuredStudents.map(student => `
        <div class="student-card">
            <div class="student-avatar">${student.name.charAt(0)}</div>
            <div class="student-name">${student.name}</div>
            <div class="student-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${student.progress || 0}%"></div>
                </div>
                <span>${student.progress || 0}%</span>
            </div>
        </div>
    `).join('');
}

function loadImportantNotices() {
    const container = document.getElementById('importantNoticesList');
    if (!container) return;
    
    // محاكاة بيانات الإشعارات
    const notices = [
        {
            icon: '⚠️',
            title: 'اختبار نهائي',
            description: 'الاختبار النهائي للفصل الأول يوم الأحد القادم',
            color: 'warning'
        },
        {
            icon: '📅',
            title: 'اجتماع المعلمين',
            description: 'اجتماع مهم مع مدير المدرسة غداً الساعة 10 صباحاً',
            color: 'primary'
        },
        {
            icon: '🎓',
            title: 'تسليم التقارير',
            description: 'آخر موعد لتسليم تقارير الطلاب نهاية هذا الأسبوع',
            color: 'info'
        }
    ];
    
    container.innerHTML = notices.map(notice => `
        <div class="notice-item">
            <div class="notice-icon" style="background: var(--${notice.color}-color)">
                ${notice.icon}
            </div>
            <div class="notice-content">
                <div class="notice-title">${notice.title}</div>
                <div class="notice-description">${notice.description}</div>
            </div>
        </div>
    `).join('');
}

function loadUpcomingAssignments() {
    const container = document.getElementById('upcomingAssignments');
    if (!container) return;
    
    // محاكاة بيانات الواجبات
    const assignments = [
        {
            title: 'تمرين الحروف',
            subject: 'لغتي',
            dueDate: 'غداً',
            students: '5 طلاب'
        },
        {
            title: 'تمارين الجمع',
            subject: 'رياضيات',
            dueDate: 'بعد غد',
            students: '8 طلاب'
        }
    ];
    
    container.innerHTML = assignments.map(assignment => `
        <tr>
            <td>${assignment.title}</td>
            <td>${assignment.subject}</td>
            <td>${assignment.dueDate}</td>
            <td>${assignment.students}</td>
            <td>
                <button class="btn btn-sm btn-primary">عرض</button>
            </td>
        </tr>
    `).join('');
}

function loadStudentsData() {
    const tableBody = document.getElementById('studentsTableBody');
    const currentUser = getCurrentUser();
    
    if (!tableBody) return;
    
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const teacherStudents = students.filter(student => student.teacherId === currentUser.id);
    
    if (teacherStudents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <div class="empty-icon">👨‍🎓</div>
                        <h3>لا توجد طلاب</h3>
                        <p>لم يتم إضافة أي طلاب بعد</p>
                        <button class="btn btn-primary" onclick="showAddStudentModal()">إضافة طالب جديد</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = teacherStudents.map((student, index) => {
        const progress = student.progress || 0;
        const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
        
        return `
            <tr data-student-id="${student.id}">
                <td>${index + 1}</td>
                <td>
                    <div class="student-info">
                        <div class="student-avatar-small">${student.name.charAt(0)}</div>
                        <div class="student-details">
                            <div class="student-name">${student.name}</div>
                            <div class="student-grade">${student.grade || 'غير محدد'}</div>
                        </div>
                    </div>
                </td>
                <td>${student.subject || 'غير محدد'}</td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%; background-color: var(--${progressClass}-color)"></div>
                        </div>
                        <span class="progress-text">${progress}%</span>
                    </div>
                </td>
                <td>${student.completedTests || 0}</td>
                <td>${student.pendingAssignments || 0}</td>
                <td>
                    <div class="student-actions">
                        <button class="btn btn-icon btn-primary" onclick="viewStudent(${student.id})" title="عرض">
                            👁️
                        </button>
                        <button class="btn btn-icon btn-success" onclick="assignTest(${student.id})" title="تعيين اختبار">
                            📝
                        </button>
                        <button class="btn btn-icon btn-warning" onclick="sendMessage(${student.id})" title="إرسال رسالة">
                            💬
                        </button>
                        <button class="btn btn-icon btn-info" onclick="viewStudentFile(${student.id})" title="الملف الشخصي">
                            📋
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function showAddStudentModal() {
    document.getElementById('addStudentModal').classList.add('show');
}

function closeAddStudentModal() {
    document.getElementById('addStudentModal').classList.remove('show');
    document.getElementById('addStudentForm').reset();
}

function addNewStudent() {
    const form = document.getElementById('addStudentForm');
    const name = document.getElementById('studentName').value.trim();
    const grade = document.getElementById('studentGrade').value;
    const subject = document.getElementById('studentSubject').value;
    const username = document.getElementById('studentUsername').value.trim();
    const password = document.getElementById('studentPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // التحقق من صحة البيانات
    if (!name || !grade || !subject || !username || !password) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAuthNotification('كلمات المرور غير متطابقة', 'error');
        return;
    }

    // التحقق من عدم تكرار اسم المستخدم
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        showAuthNotification('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }

    const currentUser = getCurrentUser();
    
    // إنشاء المستخدم الطالب
    const newStudentUser = {
        id: generateId(),
        username: username,
        password: password,
        role: 'student',
        name: name,
        grade: grade,
        subject: subject,
        teacherId: currentUser.id,
        status: 'active',
        createdAt: new Date().toISOString()
    };

    // حفظ المستخدم
    users.push(newStudentUser);
    localStorage.setItem('users', JSON.stringify(users));

    // إضافة إلى قائمة الطلاب
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    students.push({
        id: newStudentUser.id,
        name: name,
        grade: grade,
        subject: subject,
        teacherId: currentUser.id,
        progress: 0,
        completedTests: 0,
        pendingAssignments: 0,
        lastLogin: null
    });
    
    localStorage.setItem('students', JSON.stringify(students));

    showAuthNotification('تم إضافة الطالب بنجاح', 'success');
    closeAddStudentModal();
    loadStudentsData();
    
    // إضافة سجل النظام
    addSystemLog(`تم إضافة طالب جديد: ${name}`, 'user');
}

function viewStudent(studentId) {
    currentViewingStudentId = studentId;
    const student = getStudentById(studentId);
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    document.getElementById('viewStudentName').textContent = student.name;
    document.getElementById('viewStudentGrade').textContent = student.grade || 'غير محدد';
    document.getElementById('viewStudentSubject').textContent = student.subject || 'غير محدد';
    document.getElementById('viewStudentProgress').textContent = (student.progress || 0) + '%';
    document.getElementById('viewStudentTests').textContent = student.completedTests || 0;
    document.getElementById('viewStudentAssignments').textContent = student.pendingAssignments || 0;
    
    // تحديث شريط التقدم
    const progressBar = document.getElementById('viewStudentProgressBar');
    const progress = student.progress || 0;
    const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
    progressBar.style.width = progress + '%';
    progressBar.style.backgroundColor = `var(--${progressClass}-color)`;
    
    document.getElementById('viewStudentModal').classList.add('show');
}

function closeViewStudentModal() {
    document.getElementById('viewStudentModal').classList.remove('show');
    currentViewingStudentId = null;
}

function assignTest(studentId) {
    currentViewingStudentId = studentId;
    showTestAssignmentModal();
}

function showTestAssignmentModal() {
    // تحميل قائمة الاختبارات المتاحة
    const tests = getDiagnosticTests();
    const testSelect = document.getElementById('testToAssign');
    
    if (testSelect) {
        testSelect.innerHTML = '<option value="">اختر الاختبار</option>';
        tests.forEach(test => {
            const option = document.createElement('option');
            option.value = test.id;
            option.textContent = `${test.title} (${test.subject})`;
            testSelect.appendChild(option);
        });
    }
    
    document.getElementById('assignTestModal').classList.add('show');
}

function closeAssignTestModal() {
    document.getElementById('assignTestModal').classList.remove('show');
    currentViewingStudentId = null;
}

function assignTestToStudent() {
    const testId = parseInt(document.getElementById('testToAssign').value);
    const dueDate = document.getElementById('testDueDate').value;
    
    if (!testId || !dueDate) {
        showAuthNotification('يرجى اختيار الاختبار وتحديد التاريخ', 'error');
        return;
    }
    
    if (!currentViewingStudentId) {
        showAuthNotification('لم يتم تحديد طالب', 'error');
        return;
    }
    
    // حفظ التعيين
    const assignments = JSON.parse(localStorage.getItem('testAssignments') || '[]');
    const newAssignment = {
        id: generateId(),
        studentId: currentViewingStudentId,
        testId: testId,
        dueDate: dueDate,
        assignedAt: new Date().toISOString(),
        status: 'pending',
        score: null,
        completedAt: null
    };
    
    assignments.push(newAssignment);
    localStorage.setItem('testAssignments', JSON.stringify(assignments));
    
    // تحديث عدد الواجبات المعلقة للطالب
    updateStudentPendingAssignments(currentViewingStudentId, 1);
    
    showAuthNotification('تم تعيين الاختبار بنجاح', 'success');
    closeAssignTestModal();
    loadStudentsData();
}

function updateStudentPendingAssignments(studentId, increment) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex !== -1) {
        students[studentIndex].pendingAssignments = (students[studentIndex].pendingAssignments || 0) + increment;
        localStorage.setItem('students', JSON.stringify(students));
    }
}

function sendMessage(studentId) {
    currentViewingStudentId = studentId;
    document.getElementById('sendMessageModal').classList.add('show');
}

function closeSendMessageModal() {
    document.getElementById('sendMessageModal').classList.remove('show');
    currentViewingStudentId = null;
}

function sendMessageToStudent() {
    const message = document.getElementById('messageContent').value.trim();
    
    if (!message) {
        showAuthNotification('يرجى كتابة الرسالة', 'error');
        return;
    }
    
    if (!currentViewingStudentId) {
        showAuthNotification('لم يتم تحديد طالب', 'error');
        return;
    }
    
    // حفظ الرسالة
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const newMessage = {
        id: generateId(),
        senderId: getCurrentUser().id,
        receiverId: currentViewingStudentId,
        message: message,
        sentAt: new Date().toISOString(),
        isRead: false
    };
    
    messages.push(newMessage);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    showAuthNotification('تم إرسال الرسالة بنجاح', 'success');
    closeSendMessageModal();
}

function viewStudentFile(studentId) {
    window.location.href = `student-file.html?id=${studentId}`;
}

function searchStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    
    rows.forEach(row => {
        const studentName = row.querySelector('.student-name')?.textContent.toLowerCase() || '';
        const studentGrade = row.querySelector('.student-grade')?.textContent.toLowerCase() || '';
        
        if (studentName.includes(searchTerm) || studentGrade.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterStudents() {
    const gradeFilter = document.getElementById('gradeFilter').value;
    const subjectFilter = document.getElementById('subjectFilter').value;
    const progressFilter = document.getElementById('progressFilter').value;
    
    const rows = document.querySelectorAll('#studentsTableBody tr[data-student-id]');
    
    rows.forEach(row => {
        const grade = row.cells[2].textContent;
        const subject = row.cells[3].textContent;
        const progressText = row.querySelector('.progress-text')?.textContent || '0%';
        const progress = parseInt(progressText);
        
        let showRow = true;
        
        // فلترة حسب الصف
        if (gradeFilter && gradeFilter !== 'all' && grade !== gradeFilter) {
            showRow = false;
        }
        
        // فلترة حسب المادة
        if (subjectFilter && subjectFilter !== 'all' && subject !== subjectFilter) {
            showRow = false;
        }
        
        // فلترة حسب التقدم
        if (progressFilter && progressFilter !== 'all') {
            const [min, max] = progressFilter.split('-').map(Number);
            if (progress < min || progress > max) {
                showRow = false;
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

function getStudentById(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    return students.find(s => s.id === studentId);
}

function loadEducationalContent() {
    const arabicContent = document.getElementById('arabicContent');
    const mathContent = document.getElementById('mathContent');
    
    if (arabicContent) {
        loadSubjectContent(arabicContent, 'لغتي');
    }
    
    if (mathContent) {
        loadSubjectContent(mathContent, 'رياضيات');
    }
}

function loadSubjectContent(container, subject) {
    // محاكاة بيانات المحتوى التعليمي
    const contentItems = [
        {
            id: 1,
            title: 'الدرس الأول: الحروف العربية',
            description: 'تعلم نطق وكتابة الحروف العربية',
            questions: 10,
            exercises: 5,
            strategy: 'التعلم باللعب',
            priority: 'عالي',
            totalGrade: 100
        },
        {
            id: 2,
            title: 'الدرس الثاني: الحركات',
            description: 'التعرف على الحركات في اللغة العربية',
            questions: 8,
            exercises: 4,
            strategy: 'التعلم المرئي',
            priority: 'متوسط',
            totalGrade: 80
        }
    ];
    
    if (subject === 'رياضيات') {
        contentItems[0].title = 'الدرس الأول: الأرقام من 1 إلى 10';
        contentItems[0].description = 'تعلم الأرقام والعد';
        contentItems[1].title = 'الدرس الثاني: الجمع البسيط';
        contentItems[1].description = 'تعلم عمليات الجمع';
    }
    
    container.innerHTML = contentItems.map(item => `
        <div class="content-card">
            <div class="content-header">
                <h4>${item.title}</h4>
                <span class="content-badge subject-${subject === 'لغتي' ? 'لغتي' : 'رياضيات'}">
                    ${subject}
                </span>
            </div>
            <div class="content-body">
                <p>${item.description}</p>
                <div class="content-meta">
                    <span class="questions-count">${item.questions} سؤال</span>
                    <span class="exercises-count">${item.exercises} تمرين</span>
                    <span class="strategy">${item.strategy}</span>
                    <span class="priority">${item.priority}</span>
                    <span class="total-grade">${item.totalGrade} درجة</span>
                    <span class="objectives-status not-linked">لم يتم الربط</span>
                </div>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary">عرض</button>
                <button class="btn btn-sm btn-warning">تعديل</button>
                <button class="btn btn-sm btn-info">ربط الأهداف</button>
                <button class="btn btn-sm btn-success">تعيين</button>
            </div>
        </div>
    `).join('');
}

function loadTeacherMessages() {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    // محاكاة بيانات الرسائل
    const messages = [
        {
            id: 1,
            sender: 'لجنة صعوبات التعلم',
            subject: 'ملاحظة حول الطالب أحمد',
            preview: 'نود إعلامكم بملاحظة هامة حول أداء الطالب أحمد...',
            date: '2024-01-15',
            unread: true
        },
        {
            id: 2,
            sender: 'مدير النظام',
            subject: 'تحديث جديد للنظام',
            preview: 'تم إضافة ميزات جديدة للنظام...',
            date: '2024-01-14',
            unread: false
        }
    ];
    
    messagesList.innerHTML = messages.map(msg => `
        <div class="message-item ${msg.unread ? 'unread' : ''}">
            <div class="message-sender">
                <div class="sender-avatar">${msg.sender.charAt(0)}</div>
                <div class="sender-info">
                    <strong>${msg.sender}</strong>
                    <span class="message-subject">${msg.subject}</span>
                </div>
            </div>
            <div class="message-meta">
                <span class="message-date">${formatDateShort(msg.date)}</span>
                <span class="message-status">${msg.unread ? '📬' : '📭'}</span>
            </div>
            <div class="message-preview">
                ${msg.preview}
            </div>
            <div class="message-actions">
                <button class="btn btn-sm btn-primary" onclick="viewMessage(${msg.id})">عرض</button>
                <button class="btn btn-sm btn-danger" onclick="deleteMessage(${msg.id})">حذف</button>
                ${msg.unread ? `<button class="btn btn-sm btn-success" onclick="markAsRead(${msg.id})">تعليم كمقروء</button>` : ''}
            </div>
        </div>
    `).join('');
}

function loadTeacherSchedule() {
    const scheduleTable = document.getElementById('scheduleTable');
    if (!scheduleTable) return;
    
    // محاكاة بيانات الجدول
    const schedule = [
        {
            time: '8:00 - 9:00',
            sunday: 'لغتي - أحمد',
            monday: 'رياضيات - محمد',
            tuesday: 'مراجعة',
            wednesday: 'لغتي - سارة',
            thursday: 'رياضيات - خالد'
        },
        {
            time: '9:00 - 10:00',
            sunday: 'رياضيات - علي',
            monday: 'لغتي - فاطمة',
            tuesday: 'أنشطة',
            wednesday: 'رياضيات - نور',
            thursday: 'لغتي - عمر'
        }
    ];
    
    const tbody = scheduleTable.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = schedule.map(session => `
            <tr>
                <td class="period-name">${session.time}</td>
                <td class="schedule-cell booked">
                    <div class="session-info">
                        <div class="session-subject">${session.sunday}</div>
                        <button class="btn btn-sm btn-outline-secondary">تعديل</button>
                    </div>
                </td>
                <td class="schedule-cell booked">
                    <div class="session-info">
                        <div class="session-subject">${session.monday}</div>
                        <button class="btn btn-sm btn-outline-secondary">تعديل</button>
                    </div>
                </td>
                <td class="schedule-cell break">
                    <div class="cell-placeholder">${session.tuesday}</div>
                </td>
                <td class="schedule-cell booked">
                    <div class="session-info">
                        <div class="session-subject">${session.wednesday}</div>
                        <button class="btn btn-sm btn-outline-secondary">تعديل</button>
                    </div>
                </td>
                <td class="schedule-cell booked">
                    <div class="session-info">
                        <div class="session-subject">${session.thursday}</div>
                        <button class="btn btn-sm btn-outline-secondary">تعديل</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

function loadStudentFile() {
    const studentId = getUrlParameter('id');
    if (!studentId) {
        showAuthNotification('لم يتم تحديد طالب', 'error');
        window.location.href = 'students.html';
        return;
    }
    
    const student = getStudentById(parseInt(studentId));
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        window.location.href = 'students.html';
        return;
    }
    
    updateStudentFileUI(student);
    loadStudentFileData(student.id);
}

function updateStudentFileUI(student) {
    document.getElementById('studentFileName').textContent = student.name;
    document.getElementById('studentFileAvatar').textContent = student.name.charAt(0);
    document.getElementById('studentFileGrade').textContent = student.grade || 'غير محدد';
    document.getElementById('studentFileSubject').textContent = student.subject || 'غير محدد';
}

function loadStudentFileData(studentId) {
    loadStudentTests(studentId);
    loadStudentLessons(studentId);
    loadStudentAssignments(studentId);
    loadStudentIEP(studentId);
}

function loadStudentTests(studentId) {
    const container = document.getElementById('studentTestsList');
    if (!container) return;
    
    // محاكاة بيانات الاختبارات
    const tests = [
        {
            id: 1,
            title: 'الاختبار التشخيصي الأول',
            subject: 'لغتي',
            date: '2024-01-10',
            score: 85,
            status: 'مكتمل'
        },
        {
            id: 2,
            title: 'اختبار الحروف',
            subject: 'لغتي',
            date: '2024-01-15',
            score: null,
            status: 'معلق'
        }
    ];
    
    container.innerHTML = tests.map(test => `
        <div class="test-info-card">
            <div class="test-header">
                <h4>${test.title}</h4>
                <span class="test-status ${test.status === 'مكتمل' ? 'completed' : 'assigned'}">
                    ${test.status}
                </span>
            </div>
            <div class="test-details">
                <p>المادة: ${test.subject}</p>
                <p>التاريخ: ${test.date}</p>
                ${test.score ? `<p>الدرجة: ${test.score}/100</p>` : ''}
            </div>
            <div class="test-actions">
                <button class="btn btn-sm btn-primary" onclick="viewTestDetails(${test.id})">عرض</button>
                ${test.status !== 'مكتمل' ? `<button class="btn btn-sm btn-warning" onclick="gradeTest(${test.id})">تصحيح</button>` : ''}
            </div>
        </div>
    `).join('');
}

function loadCommitteeData() {
    loadCommitteeMembers();
    loadCommitteeNotes();
}

function loadCommitteeMembers() {
    const container = document.getElementById('committeeMembersList');
    if (!container) return;
    
    // محاكاة بيانات أعضاء اللجنة
    const members = [
        {
            id: 1,
            name: 'د. أحمد محمد',
            role: 'مشرف',
            username: 'ahmed_committee'
        },
        {
            id: 2,
            name: 'أ. فاطمة علي',
            role: 'عضو',
            username: 'fatma_committee'
        }
    ];
    
    container.innerHTML = members.map(member => `
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
                <button class="btn btn-sm btn-primary">مراسلة</button>
                <button class="btn btn-sm btn-info" onclick="viewMemberCredentials(${member.id})">عرض بيانات الدخول</button>
            </div>
        </div>
    `).join('');
}

function loadCommitteeNotes() {
    const container = document.getElementById('committeeNotesList');
    if (!container) return;
    
    // محاكاة بيانات الملاحظات
    const notes = [
        {
            id: 1,
            from: 'د. أحمد محمد',
            role: 'مشرف',
            date: '2024-01-15',
            content: 'نود توجيه انتباهكم لأداء الطالب في القراءة...',
            isRead: false
        }
    ];
    
    container.innerHTML = notes.map(note => `
        <div class="note-card ${note.isRead ? 'read' : 'unread'}">
            <div class="note-header">
                <div class="note-sender">
                    <strong>${note.from}</strong>
                    <span class="sender-role">${note.role}</span>
                </div>
                <div class="note-date">${note.date}</div>
            </div>
            <div class="note-content">
                <p>${note.content}</p>
            </div>
            <div class="note-actions">
                <button class="btn btn-sm btn-primary" onclick="viewNote(${note.id})">عرض</button>
                <button class="btn btn-sm btn-success" onclick="replyToNote(${note.id})">رد</button>
                ${!note.isRead ? `<button class="btn btn-sm btn-warning" onclick="markNoteAsRead(${note.id})">تعليم كمقروء</button>` : ''}
            </div>
        </div>
    `).join('');
}

function setupMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', function(event) {
        if (sidebar && sidebar.classList.contains('active') && 
            !sidebar.contains(event.target) && 
            !event.target.classList.contains('mobile-menu-btn')) {
            sidebar.classList.remove('active');
        }
    });
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function getDiagnosticTests() {
    return JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
}

function addSystemLog(message, type = 'info', user = null) {
    try {
        const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
        const currentUser = getCurrentUser();
        
        logs.push({
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            user: user || (currentUser ? currentUser.name : 'النظام')
        });
        
        // الاحتفاظ فقط بآخر 1000 سجل
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        localStorage.setItem('systemLogs', JSON.stringify(logs));
    } catch (error) {
        console.error('خطأ في إضافة سجل النظام:', error);
    }
}

// دوال الواجهة العامة
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

function showSettings() {
    window.location.href = 'settings.html';
}

function showNotifications() {
    alert('نظام الإشعارات سيتم تفعيله قريباً');
}

// تصدير الدوال للاستخدام العالمي
window.showAddStudentModal = showAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.addNewStudent = addNewStudent;
window.viewStudent = viewStudent;
window.closeViewStudentModal = closeViewStudentModal;
window.assignTest = assignTest;
window.closeAssignTestModal = closeAssignTestModal;
window.assignTestToStudent = assignTestToStudent;
window.sendMessage = sendMessage;
window.closeSendMessageModal = closeSendMessageModal;
window.sendMessageToStudent = sendMessageToStudent;
window.viewStudentFile = viewStudentFile;
window.searchStudents = searchStudents;
window.filterStudents = filterStudents;
window.toggleSidebar = toggleSidebar;
window.showSettings = showSettings;
window.showNotifications = showNotifications;
