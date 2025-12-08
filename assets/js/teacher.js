// ============================================
// 📁 الملف: muyasir-main/assets/js/teacher.js
// ============================================

// إدارة لوحة تحكم المعلم
let currentViewingStudentId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeTeacherDashboard();
    setupTeacherTabs();
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
    updateTeacherInterface(user);
    
    // تحميل البيانات حسب الصفحة الحالية
    if (window.location.pathname.includes('dashboard.html')) {
        loadTeacherDashboardStats();
        loadFeaturedStudents();
        loadImportantNotices();
    } else if (window.location.pathname.includes('students.html')) {
        loadStudentsData();
    } else if (window.location.pathname.includes('student-details.html')) {
        initializeStudentDetailsPage();
    } else if (window.location.pathname.includes('library.html')) {
        initializeLibraryPage();
    } else if (window.location.pathname.includes('messages.html')) {
        initializeMessagesPage();
    }
}

function updateTeacherInterface(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
    }
}

function setupTeacherTabs() {
    // إعداد تبويبات لوحة الطالب
    const studentTabBtns = document.querySelectorAll('.student-tabs .tab-btn');
    const studentTabPanes = document.querySelectorAll('.student-tabs .tab-pane');
    
    if (studentTabBtns.length > 0) {
        studentTabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                studentTabBtns.forEach(b => b.classList.remove('active'));
                studentTabPanes.forEach(p => p.classList.remove('active'));
                
                this.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }
    
    // إعداد تبويبات مكتبة المحتوى
    const libraryTabBtns = document.querySelectorAll('.library-tabs .tab-btn');
    const libraryTabPanes = document.querySelectorAll('.library-tabs .tab-pane');
    
    if (libraryTabBtns.length > 0) {
        libraryTabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                libraryTabBtns.forEach(b => b.classList.remove('active'));
                libraryTabPanes.forEach(p => p.classList.remove('active'));
                
                this.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }
}

// ============================================
// لوحة تحكم المعلم الرئيسية
// ============================================

function loadTeacherDashboardStats() {
    setTimeout(() => {
        const currentUser = getCurrentUser();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        const students = users.filter(u => u.role === 'student' && u.teacherId === currentUser.id);
        const activeStudents = students.filter(s => s.status === 'active');
        const completedAssignments = Math.floor(Math.random() * 50) + 30;
        const pendingEvaluations = Math.floor(Math.random() * 10) + 1;
        
        updateStatElement('studentsCount', students.length);
        updateStatElement('activeStudents', activeStudents.length);
        updateStatElement('completedAssignments', completedAssignments);
        updateStatElement('pendingEvaluations', pendingEvaluations);
    }, 1000);
}

function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function loadFeaturedStudents() {
    const studentsList = document.getElementById('featuredStudentsList');
    if (!studentsList) return;
    
    const currentUser = getCurrentUser();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const teacherStudents = users.filter(u => 
        u.role === 'student' && 
        u.teacherId === currentUser.id
    ).slice(0, 6); // عرض أول 6 طلاب فقط
    
    if (teacherStudents.length === 0) {
        studentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍🎓</div>
                <h3>لا توجد طلاب</h3>
                <p>قم بإضافة طلاب لمتابعتهم</p>
            </div>
        `;
        return;
    }
    
    studentsList.innerHTML = teacherStudents.map(student => {
        const progress = student.progress || Math.floor(Math.random() * 100);
        const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
        
        return `
            <div class="student-card" onclick="viewStudentDetails(${student.id})">
                <div class="student-avatar">${student.name.charAt(0)}</div>
                <div class="student-name">${student.name}</div>
                <div class="student-progress">${progress}% إنجاز</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%; background-color: var(--${progressClass}-color);"></div>
                </div>
                <div class="student-meta">
                    <span>${student.grade || 'غير محدد'}</span>
                    <span>${student.subject || 'غير محدد'}</span>
                </div>
            </div>
        `;
    }).join('');
}

function loadImportantNotices() {
    const noticesList = document.getElementById('importantNoticesList');
    if (!noticesList) return;
    
    const notices = [
        {
            icon: '⚠️',
            title: 'موعد تسليم التقارير',
            description: 'ينتهي موعد تسليم تقارير التقدم الأسبوعية يوم الجمعة',
            time: 'منذ يوم'
        },
        {
            icon: '📢',
            title: 'اجتماع لجنة صعوبات التعلم',
            description: 'اجتماع لجنة صعوبات التعلم يوم الإثنين القادم الساعة 10 صباحاً',
            time: 'منذ 3 أيام'
        },
        {
            icon: '🎓',
            title: 'طالب جديد',
            description: 'تم إضافة طالب جديد إلى قائمة متابعتك',
            time: 'منذ أسبوع'
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

// ============================================
// إدارة الطلاب
// ============================================

function loadStudentsData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');
    
    // التحقق من وجود العناصر
    if (!loadingState || !emptyState || !tableBody) {
        console.error('Missing required elements in students page');
        return;
    }

    // إظهار حالة التحميل
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    setTimeout(() => {
        const currentUser = getCurrentUser();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        const teacherStudents = users.filter(u => 
            u.role === 'student' && 
            u.teacherId === currentUser.id
        );
        
        loadingState.style.display = 'none';
        
        if (teacherStudents.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        // تعبئة الجدول
        tableBody.innerHTML = teacherStudents.map((student, index) => {
            const progress = student.progress || Math.floor(Math.random() * 100);
            const lastActive = student.lastLogin ? formatTimeAgo(student.lastLogin) : 'لم يسجل دخول';
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <div class="student-info-cell">
                            <div class="student-avatar-small">${student.name.charAt(0)}</div>
                            <div class="student-details">
                                <div class="student-name">${student.name}</div>
                                <div class="student-meta-small">
                                    ${student.grade || 'غير محدد'} | ${student.subject || 'غير محدد'}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>${student.username}</td>
                    <td>
                        <div class="progress-cell">
                            <div class="progress-text">${progress}%</div>
                            <div class="progress-bar-small">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>${lastActive}</td>
                    <td>
                        <span class="status-badge status-${student.status || 'active'}">
                            ${getStatusText(student.status || 'active')}
                        </span>
                    </td>
                    <td>
                        <div class="student-actions">
                            <button class="btn-icon btn-primary" onclick="viewStudentDetails(${student.id})" title="عرض">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon btn-info" onclick="sendMessageToStudent(${student.id})" title="مراسلة">
                                <i class="fas fa-comment"></i>
                            </button>
                            <button class="btn-icon btn-warning" onclick="editStudent(${student.id})" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-danger" onclick="removeStudent(${student.id})" title="إزالة">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }, 1500);
}

function getStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'inactive': 'غير نشط',
        'suspended': 'موقوف'
    };
    return statusMap[status] || 'غير معروف';
}

function viewStudentDetails(studentId) {
    currentViewingStudentId = studentId;
    window.location.href = `student-details.html?id=${studentId}`;
}

function initializeStudentDetailsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = parseInt(urlParams.get('id'));
    
    if (!studentId) {
        showAuthNotification('لم يتم تحديد طالب', 'error');
        setTimeout(() => {
            window.location.href = 'students.html';
        }, 2000);
        return;
    }
    
    loadStudentDetails(studentId);
}

function loadStudentDetails(studentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id === studentId && u.role === 'student');
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        setTimeout(() => {
            window.location.href = 'students.html';
        }, 2000);
        return;
    }
    
    // تحديث معلومات الطالب
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentGrade').textContent = student.grade || 'غير محدد';
    document.getElementById('studentSubject').textContent = student.subject || 'غير محدد';
    document.getElementById('studentUsername').textContent = student.username;
    document.getElementById('studentStatus').textContent = getStatusText(student.status);
    
    // تحديث الصورة الرمزية
    const avatar = document.getElementById('studentAvatar');
    if (avatar) {
        avatar.textContent = student.name.charAt(0);
    }
    
    // تحميل البيانات الأخرى
    loadStudentProgress(studentId);
    loadStudentTests(studentId);
    loadStudentLessons(studentId);
    loadStudentAssignments(studentId);
}

function loadStudentProgress(studentId) {
    // محاكاة بيانات التقدم
    setTimeout(() => {
        const progress = Math.floor(Math.random() * 100);
        document.getElementById('overallProgress').textContent = `${progress}%`;
        
        // تحديث مخطط التقدم
        const progressBar = document.querySelector('.progress-fill-large');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }, 1000);
}

function loadStudentTests(studentId) {
    // محاكاة بيانات الاختبارات
    const testsContainer = document.getElementById('testsList');
    if (!testsContainer) return;
    
    const tests = [
        { title: 'اختبار تشخيصي - القراءة', status: 'مكتمل', score: 85, date: '2024-01-15' },
        { title: 'اختبار تشخيصي - الإملاء', status: 'مكتمل', score: 72, date: '2024-01-10' },
        { title: 'اختبار تشخيصي - الرياضيات', status: 'قيد التقدم', score: null, date: '2024-01-20' }
    ];
    
    testsContainer.innerHTML = tests.map(test => `
        <div class="test-info-card">
            <div class="test-header">
                <h4>${test.title}</h4>
                <span class="test-status status-${test.status === 'مكتمل' ? 'completed' : 'in-progress'}">
                    ${test.status}
                </span>
            </div>
            <div class="test-details">
                ${test.score ? `<p>الدرجة: ${test.score}/100</p>` : '<p>لم يتم التصحيح بعد</p>'}
                <p>التاريخ: ${test.date}</p>
            </div>
            <div class="test-actions">
                <button class="btn btn-sm btn-primary">عرض النتائج</button>
                ${test.status !== 'مكتمل' ? '<button class="btn btn-sm btn-warning">متابعة الاختبار</button>' : ''}
            </div>
        </div>
    `).join('');
}

function loadStudentLessons(studentId) {
    // محاكاة بيانات الدروس
}

function loadStudentAssignments(studentId) {
    // محاكاة بيانات الواجبات
}

function sendMessageToStudent(studentId) {
    showSendMessageModal(studentId);
}

function editStudent(studentId) {
    showEditStudentModal(studentId);
}

function removeStudent(studentId) {
    if (!confirm('هل أنت متأكد من إزالة هذا الطالب من قائمة متابعتك؟')) {
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const studentIndex = users.findIndex(u => u.id === studentId && u.role === 'student');
    
    if (studentIndex !== -1) {
        users[studentIndex].teacherId = null;
        localStorage.setItem('users', JSON.stringify(users));
        
        showAuthNotification('تم إزالة الطالب من المتابعة', 'success');
        loadStudentsData();
    }
}

// ============================================
// مكتبة المحتوى التعليمي
// ============================================

function initializeLibraryPage() {
    loadContentLibrary();
}

function loadContentLibrary() {
    loadLessons();
    loadExercises();
    loadTeachingObjectives();
}

function loadLessons() {
    const lessonsList = document.getElementById('lessonsList');
    if (!lessonsList) return;
    
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const currentUser = getCurrentUser();
    const userLessons = lessons.filter(lesson => lesson.teacherId === currentUser.id);
    
    if (userLessons.length === 0) {
        lessonsList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">📚</div>
                <h3>لا توجد دروس</h3>
                <p>قم بإضافة أول درس لمكتبة المحتوى</p>
                <button class="btn btn-primary" onclick="showCreateLessonModal()">
                    <i class="fas fa-plus"></i> إضافة درس جديد
                </button>
            </div>
        `;
        return;
    }
    
    lessonsList.innerHTML = userLessons.map(lesson => `
        <div class="content-card">
            <div class="content-header">
                <h4>${lesson.title}</h4>
                <span class="content-badge subject-${lesson.subject}">
                    ${lesson.subject}
                </span>
            </div>
            <div class="content-body">
                <p>${lesson.description || 'لا يوجد وصف'}</p>
            </div>
            <div class="content-meta">
                <span class="questions-count">${lesson.questions || 0} سؤال</span>
                <span class="exercises-count">${lesson.exercises || 0} تمرين</span>
                <span class="objectives-status ${lesson.objectivesLinked ? 'linked' : 'not-linked'}">
                    ${lesson.objectivesLinked ? 'مربوط بأهداف' : 'غير مربوط'}
                </span>
            </div>
            <div class="content-actions">
                <button class="btn btn-sm btn-primary" onclick="viewLesson(${lesson.id})">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="btn btn-sm btn-warning" onclick="editLesson(${lesson.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-sm btn-info" onclick="linkLessonObjectives(${lesson.id})">
                    <i class="fas fa-link"></i> ربط أهداف
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

function loadExercises() {
    const exercisesList = document.getElementById('exercisesList');
    if (!exercisesList) return;
    
    exercisesList.innerHTML = `
        <div class="empty-content-state">
            <div class="empty-icon">🏃‍♂️</div>
            <h3>لا توجد تمارين</h3>
            <p>سيتم تطوير نظام التمارين في المراحل القادمة</p>
        </div>
    `;
}

function loadTeachingObjectives() {
    const objectivesList = document.getElementById('objectivesList');
    if (!objectivesList) return;
    
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const currentUser = getCurrentUser();
    const userObjectives = objectives.filter(obj => obj.teacherId === currentUser.id);
    
    if (userObjectives.length === 0) {
        objectivesList.innerHTML = `
            <div class="empty-content-state">
                <div class="empty-icon">🎯</div>
                <h3>لا توجد أهداف تعليمية</h3>
                <p>قم بإضافة أهداف تعليمية لتوجيه عملية التعليم</p>
                <button class="btn btn-primary" onclick="showCreateObjectiveModal()">
                    <i class="fas fa-plus"></i> إضافة هدف جديد
                </button>
            </div>
        `;
        return;
    }
    
    objectivesList.innerHTML = userObjectives.map(objective => `
        <div class="objective-item">
            <div class="objective-header">
                <h4>${objective.title}</h4>
                <span class="objective-badge subject-${objective.subject}">
                    ${objective.subject}
                </span>
            </div>
            <div class="objective-body">
                <p>${objective.description}</p>
            </div>
            <div class="objective-meta">
                <span>${objective.type || 'هدف عام'}</span>
                <span>${objective.priority || 'متوسط'}</span>
            </div>
            <div class="objective-actions">
                <button class="btn btn-sm btn-primary" onclick="viewObjective(${objective.id})">
                    عرض
                </button>
                <button class="btn btn-sm btn-warning" onclick="editObjective(${objective.id})">
                    تعديل
                </button>
            </div>
        </div>
    `).join('');
}

function showCreateLessonModal() {
    const modal = document.getElementById('createLessonModal');
    if (modal) {
        modal.classList.add('show');
    } else {
        console.error('Modal not found');
        alert('نافذة إنشاء الدرس غير متاحة حالياً');
    }
}

function closeCreateLessonModal() {
    const modal = document.getElementById('createLessonModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showCreateTestModal() {
    const modal = document.getElementById('createTestModal');
    if (modal) {
        modal.classList.add('show');
    } else {
        console.error('Create test modal not found');
        window.location.href = 'create-test.html';
    }
}

function closeCreateTestModal() {
    const modal = document.getElementById('createTestModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showCreateObjectiveModal() {
    const modal = document.getElementById('createObjectiveModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeCreateObjectiveModal() {
    const modal = document.getElementById('createObjectiveModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ============================================
// نظام المراسلات
// ============================================

function initializeMessagesPage() {
    loadMessages();
    loadCommitteeMessages();
}

function loadMessages() {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const currentUser = getCurrentUser();
    
    const userMessages = messages.filter(msg => 
        msg.receiverId === currentUser.id || 
        msg.senderId === currentUser.id
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (userMessages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✉️</div>
                <h3>لا توجد رسائل</h3>
                <p>لم تستلم أو ترسل أي رسائل بعد</p>
            </div>
        `;
        return;
    }
    
    messagesList.innerHTML = userMessages.map(message => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const sender = users.find(u => u.id === message.senderId);
        const receiver = users.find(u => u.id === message.receiverId);
        const isSent = message.senderId === currentUser.id;
        const isRead = message.isRead || false;
        
        return `
            <div class="message-item ${isRead ? 'read' : 'unread'} ${isSent ? 'sent' : 'received'}">
                <div class="message-header">
                    <div class="message-sender">
                        <div class="sender-avatar">${isSent ? receiver?.name?.charAt(0) : sender?.name?.charAt(0)}</div>
                        <div class="sender-info">
                            <strong>${isSent ? `إلى: ${receiver?.name || 'مستلم'}` : `من: ${sender?.name || 'مرسل'}`}</strong>
                            <div class="message-subject">${message.subject}</div>
                        </div>
                    </div>
                    <div class="message-meta">
                        <span class="message-date">${formatDateShort(message.timestamp)}</span>
                        <span class="message-status">${isSent ? 'مرسلة' : 'واردة'}</span>
                    </div>
                </div>
                <div class="message-preview">
                    ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}
                </div>
                <div class="message-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewMessage(${message.id})">
                        عرض
                    </button>
                    ${!isSent && !isRead ? 
                        `<button class="btn btn-sm btn-success" onclick="markAsRead(${message.id})">
                            تعليم كمقروء
                        </button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteMessage(${message.id})">
                        حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function loadCommitteeMessages() {
    // تحميل رسائل لجنة صعوبات التعلم
    const committeeMessages = document.getElementById('committeeMessages');
    if (!committeeMessages) return;
    
    // محتوى مماثل
}

function showSendMessageModal(receiverId = null) {
    const modal = document.getElementById('sendMessageModal');
    if (!modal) return;
    
    if (receiverId) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const receiver = users.find(u => u.id === receiverId);
        
        if (receiver) {
            document.getElementById('messageReceiver').value = receiverId;
            document.getElementById('receiverName').textContent = receiver.name;
        }
    }
    
    modal.classList.add('show');
}

function closeSendMessageModal() {
    const modal = document.getElementById('sendMessageModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function sendMessage() {
    const receiverId = parseInt(document.getElementById('messageReceiver').value);
    const subject = document.getElementById('messageSubject').value.trim();
    const content = document.getElementById('messageContent').value.trim();
    
    if (!receiverId || !subject || !content) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const currentUser = getCurrentUser();
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    
    const newMessage = {
        id: generateId(),
        senderId: currentUser.id,
        receiverId: receiverId,
        subject: subject,
        content: content,
        timestamp: new Date().toISOString(),
        isRead: false
    };
    
    messages.push(newMessage);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    showAuthNotification('تم إرسال الرسالة بنجاح', 'success');
    closeSendMessageModal();
    loadMessages();
}

function viewMessage(messageId) {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const message = messages.find(m => m.id === messageId);
    
    if (!message) {
        showAuthNotification('الرسالة غير موجودة', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const sender = users.find(u => u.id === message.senderId);
    const receiver = users.find(u => u.id === message.receiverId);
    const currentUser = getCurrentUser();
    
    document.getElementById('viewMessageSubject').textContent = message.subject;
    document.getElementById('viewMessageFrom').textContent = `من: ${sender?.name || 'مرسل غير معروف'}`;
    document.getElementById('viewMessageTo').textContent = `إلى: ${receiver?.name || 'مستلم غير معروف'}`;
    document.getElementById('viewMessageDate').textContent = `التاريخ: ${formatDate(message.timestamp)}`;
    document.getElementById('viewMessageContent').textContent = message.content;
    
    // تعليم كمقروء إذا كان المستخدم هو المستقبل
    if (message.receiverId === currentUser.id && !message.isRead) {
        markAsRead(messageId);
    }
    
    document.getElementById('viewMessageModal').classList.add('show');
}

function closeViewMessageModal() {
    const modal = document.getElementById('viewMessageModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function markAsRead(messageId) {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex !== -1) {
        messages[messageIndex].isRead = true;
        localStorage.setItem('messages', JSON.stringify(messages));
        loadMessages();
    }
}

function deleteMessage(messageId) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
        return;
    }
    
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const updatedMessages = messages.filter(m => m.id !== messageId);
    
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
    
    showAuthNotification('تم حذف الرسالة', 'success');
    loadMessages();
}

// ============================================
// دوال مساعدة
// ============================================

function generateId() {
    return Math.floor(Math.random() * 1000000) + 1;
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateShort(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'منذ فترة';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
}

// ============================================
// تصدير الدوال للاستخدام العالمي
// ============================================

window.viewStudentDetails = viewStudentDetails;
window.sendMessageToStudent = sendMessageToStudent;
window.editStudent = editStudent;
window.removeStudent = removeStudent;

window.showCreateLessonModal = showCreateLessonModal;
window.closeCreateLessonModal = closeCreateLessonModal;
window.showCreateTestModal = showCreateTestModal;
window.closeCreateTestModal = closeCreateTestModal;
window.showCreateObjectiveModal = showCreateObjectiveModal;
window.closeCreateObjectiveModal = closeCreateObjectiveModal;

window.showSendMessageModal = showSendMessageModal;
window.closeSendMessageModal = closeSendMessageModal;
window.sendMessage = sendMessage;
window.viewMessage = viewMessage;
window.closeViewMessageModal = closeViewMessageModal;
window.markAsRead = markAsRead;
window.deleteMessage = deleteMessage;

window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.formatTimeAgo = formatTimeAgo;
window.generateId = generateId;

// ============================================
// تهيئة النظام عند تحميل الصفحة
// ============================================

// التأكد من تهيئة لوحة التحكم
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTeacherDashboard);
} else {
    initializeTeacherDashboard();
}
