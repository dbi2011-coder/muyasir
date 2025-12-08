// ============================================
// 📁 نظام إدارة المعلمين
// ============================================

// المتغيرات العامة
let currentEditingTeacherId = null;
let currentViewingTeacherId = null;

// ============================================
// التهيئة الرئيسية
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeTeacherSystem();
});

function initializeTeacherSystem() {
    console.log('👨‍🏫 بدء تهيئة نظام المعلمين...');
    
    // التحقق من المصادقة
    const user = checkAuth();
    if (!user) {
        console.error('❌ يجب تسجيل الدخول أولاً');
        showAuthNotification('يجب تسجيل الدخول أولاً', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }
    
    // التحقق من الدور
    if (user.role !== 'admin' && user.role !== 'teacher') {
        console.error('❌ غير مصرح لك بالوصول إلى هذه الصفحة');
        showAuthNotification('غير مصرح لك بالوصول إلى هذه الصفحة', 'error');
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 2000);
        return;
    }
    
    console.log(`✅ تم التحقق من المستخدم: ${user.name} (${user.role})`);
    
    // تحديث واجهة المستخدم
    updateUserInterface(user);
    
    // تهيئة الصفحة بناءً على المسار
    const path = window.location.pathname;
    
    if (path.includes('dashboard.html')) {
        console.log('🏠 تهيئة لوحة تحكم المعلم...');
        initializeTeacherDashboard();
    } else if (path.includes('students.html')) {
        console.log('👨‍🎓 تهيئة صفحة الطلاب...');
        loadStudentsData();
    } else if (path.includes('teachers.html') && user.role === 'admin') {
        console.log('👨‍🏫 تهيئة صفحة إدارة المعلمين...');
        loadTeachersData();
    } else if (path.includes('library.html')) {
        console.log('📚 تهيئة مكتبة المحتوى...');
        loadLibraryContent();
    } else if (path.includes('tests.html')) {
        console.log('📊 تهيئة صفحة الاختبارات...');
        loadDiagnosticTests();
    } else if (path.includes('assignments.html')) {
        console.log('📝 تهيئة صفحة الواجبات...');
        loadAssignmentsData();
    } else if (path.includes('lessons.html')) {
        console.log('📖 تهيئة صفحة الدروس...');
        loadLessonsData();
    } else if (path.includes('committee.html')) {
        console.log('👥 تهيئة صفحة اللجنة...');
        loadCommitteeData();
    }
    
    console.log('✅ تم تهيئة نظام المعلمين بنجاح');
}

// ============================================
// واجهة المستخدم
// ============================================

function updateUserInterface(user) {
    console.log('👤 تحديث واجهة المستخدم...');
    
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        userNameElement.textContent = user.name;
        console.log(`✅ تم تحديث اسم المستخدم: ${user.name}`);
    } else {
        console.log('⚠️ عنصر اسم المستخدم غير موجود');
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0).toUpperCase();
        console.log(`✅ تم تحديث الصورة الرمزية: ${user.name.charAt(0)}`);
    } else {
        console.log('⚠️ عنصر الصورة الرمزية غير موجود');
    }
}

// ============================================
// لوحة تحكم المعلم
// ============================================

function initializeTeacherDashboard() {
    console.log('📊 جاري تحميل لوحة تحكم المعلم...');
    
    // تحميل الإحصائيات
    loadTeacherStats();
    
    // تحميل الطلاب المميزين
    loadFeaturedStudents();
    
    // تحميل الإشعارات المهمة
    loadImportantNotices();
    
    // تحميل النشاط الأخير
    loadRecentActivity();
}

function loadTeacherStats() {
    console.log('📈 جاري تحميل إحصائيات المعلم...');
    
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = getCurrentUser();
        
        // حساب عدد الطلاب للمعلم الحالي
        const teacherStudents = users.filter(u => 
            u.role === 'student' && u.teacherId === currentUser.id
        );
        
        // حساب عدد الدروس
        const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
        const teacherLessons = lessons.filter(l => 
            l.teacherId === currentUser.id
        );
        
        // حساب عدد الواجبات
        const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        const teacherAssignments = assignments.filter(a => 
            a.teacherId === currentUser.id
        );
        
        // تحديث العناصر
        updateStatElement('totalStudents', teacherStudents.length);
        updateStatElement('activeLessons', teacherLessons.length);
        updateStatElement('pendingAssignments', teacherAssignments.length);
        updateStatElement('testResults', Math.floor(Math.random() * 20));
        
        console.log(`✅ تم تحميل إحصائيات المعلم: ${teacherStudents.length} طالب، ${teacherLessons.length} درس`);
    }, 1000);
}

function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        console.log(`📊 ${elementId}: ${value}`);
    }
}

function loadFeaturedStudents() {
    const studentsList = document.getElementById('featuredStudentsList');
    if (!studentsList) return;
    
    console.log('⭐ جاري تحميل الطلاب المميزين...');
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = getCurrentUser();
    
    const teacherStudents = users.filter(u => 
        u.role === 'student' && u.teacherId === currentUser.id
    ).slice(0, 6); // عرض أول 6 طلاب فقط
    
    if (teacherStudents.length === 0) {
        studentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍🎓</div>
                <h3>لا توجد طلاب</h3>
                <p>قم بإضافة طلاب للبدء</p>
                <button class="btn btn-primary" onclick="window.location.href='students.html'">
                    <i class="fas fa-plus"></i> إضافة طالب
                </button>
            </div>
        `;
        return;
    }
    
    studentsList.innerHTML = teacherStudents.map((student, index) => {
        const progress = student.progress || Math.floor(Math.random() * 100);
        const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
        
        return `
            <div class="student-card" onclick="viewStudent(${student.id})">
                <div class="student-avatar" style="background: ${getRandomColor(index)}">
                    ${student.name.charAt(0).toUpperCase()}
                </div>
                <div class="student-name">${student.name}</div>
                <div class="student-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background-color: var(--${progressClass}-color);"></div>
                    </div>
                    <span>${progress}%</span>
                </div>
            </div>
        `;
    }).join('');
    
    console.log(`✅ تم تحميل ${teacherStudents.length} طالب مميز`);
}

function getRandomColor(index) {
    const colors = [
        '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
        '#9b59b6', '#1abc9c', '#d35400', '#34495e'
    ];
    return colors[index % colors.length];
}

function loadImportantNotices() {
    const noticesList = document.getElementById('importantNoticesList');
    if (!noticesList) return;
    
    console.log('📢 جاري تحميل الإشعارات المهمة...');
    
    const notices = [
        {
            icon: '📅',
            title: 'موعد اجتماع لجنة صعوبات التعلم',
            description: 'الاثنين القادم الساعة 10 صباحاً',
            color: '#3498db'
        },
        {
            icon: '📊',
            title: 'تقرير نصف الفصل الدراسي',
            description: 'آخر موعد للتسليم: نهاية هذا الأسبوع',
            color: '#2ecc71'
        },
        {
            icon: '📝',
            title: 'ورشة عمل للمعلمين',
            description: 'كيفية استخدام الاختبارات التشخيصية',
            color: '#f39c12'
        },
        {
            icon: '⚠️',
            title: 'تحديث النظام',
            description: 'سيتم إغلاق النظام للصيانة ليلة الجمعة',
            color: '#e74c3c'
        }
    ];
    
    noticesList.innerHTML = notices.map(notice => `
        <div class="notice-item">
            <div class="notice-icon" style="background: ${notice.color}">
                ${notice.icon}
            </div>
            <div class="notice-content">
                <div class="notice-title">${notice.title}</div>
                <div class="notice-description">${notice.description}</div>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ تم تحميل ${notices.length} إشعار`);
}

function loadRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    if (!activityList) return;
    
    console.log('📝 جاري تحميل النشاط الأخير...');
    
    const activities = [
        {
            icon: '👨‍🎓',
            title: 'تم تسجيل طالب جديد',
            time: 'منذ 2 ساعة',
            color: '#3498db'
        },
        {
            icon: '📝',
            title: 'تم إنشاء واجب جديد',
            time: 'منذ 5 ساعات',
            color: '#2ecc71'
        },
        {
            icon: '📊',
            title: 'تم تصحيح اختبار تشخيصي',
            time: 'منذ يوم',
            color: '#f39c12'
        },
        {
            icon: '💬',
            title: 'رسالة جديدة من لجنة الصعوبات',
            time: 'منذ يومين',
            color: '#9b59b6'
        }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.color}">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ تم تحميل ${activities.length} نشاط`);
}

// ============================================
// إدارة الطلاب (للمعلم)
// ============================================

function loadStudentsData() {
    console.log('👨‍🎓 جاري تحميل بيانات الطلاب...');
    
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('studentsTableBody');
    
    if (!tableBody) {
        console.error('❌ عنصر جدول الطلاب غير موجود');
        return;
    }
    
    // إظهار حالة التحميل
    if (loadingState) loadingState.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    tableBody.innerHTML = '';
    
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = getCurrentUser();
        
        // تصفية طلاب المعلم الحالي فقط
        const teacherStudents = users.filter(u => 
            u.role === 'student' && u.teacherId === currentUser.id
        );
        
        // إخفاء حالة التحميل
        if (loadingState) loadingState.style.display = 'none';
        
        if (teacherStudents.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            console.log('ℹ️ لا توجد طلاب للمعلم الحالي');
            return;
        }
        
        // تعبئة الجدول
        tableBody.innerHTML = teacherStudents.map((student, index) => {
            const progress = student.progress || 0;
            const progressClass = progress < 30 ? 'danger' : progress < 60 ? 'warning' : 'success';
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.name}</td>
                    <td>${student.grade || 'غير محدد'}</td>
                    <td>${student.subject || 'غير محدد'}</td>
                    <td>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${progress}%; background-color: var(--${progressClass}-color);"></div>
                            <span class="progress-text">${progress}%</span>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge status-${student.status || 'active'}">
                            ${getStatusText(student.status || 'active')}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="viewStudent(${student.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editStudent(${student.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="viewStudentProgress(${student.id})">
                                <i class="fas fa-chart-line"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        console.log(`✅ تم تحميل ${teacherStudents.length} طالب`);
    }, 1500);
}

function getStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'inactive': 'غير نشط',
        'suspended': 'موقوف'
    };
    return statusMap[status] || status;
}

function viewStudent(studentId) {
    console.log(`👁️ جاري عرض بيانات الطالب ${studentId}`);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id === studentId && u.role === 'student');
    
    if (!student) {
        showAuthNotification('الطالب غير موجود', 'error');
        return;
    }
    
    // حفظ معرف الطالب المعروض
    sessionStorage.setItem('viewingStudentId', studentId);
    
    // توجيه إلى صفحة ملف الطالب
    window.location.href = `student-profile.html?id=${studentId}`;
}

function editStudent(studentId) {
    console.log(`✏️ جاري تحميل بيانات الطالب ${studentId} للتعديل`);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const student = users.find(u => u.id === studentId && u.role === 'student');
    
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
    
    // عرض النافذة المنبثقة
    showModal('editStudentModal');
}

function viewStudentProgress(studentId) {
    console.log(`📊 جاري عرض تقدم الطالب ${studentId}`);
    
    // حفظ معرف الطالب
    sessionStorage.setItem('progressStudentId', studentId);
    
    // توجيه إلى صفحة التقدم
    window.location.href = `student-progress.html?id=${studentId}`;
}

// ============================================
// إدارة المعلمين (للمدير فقط)
// ============================================

function loadTeachersData() {
    console.log('👨‍🏫 جاري تحميل بيانات المعلمين...');
    
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('teachersTableBody');
    
    if (!tableBody) {
        console.error('❌ عنصر جدول المعلمين غير موجود');
        return;
    }
    
    // إظهار حالة التحميل
    if (loadingState) loadingState.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    tableBody.innerHTML = '';
    
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const teachers = users.filter(u => u.role === 'teacher');
        
        // إخفاء حالة التحميل
        if (loadingState) loadingState.style.display = 'none';
        
        if (teachers.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            console.log('ℹ️ لا توجد معلمين في النظام');
            return;
        }
        
        // تعبئة الجدول
        tableBody.innerHTML = teachers.map((teacher, index) => {
            // حساب عدد الطلاب للمعلم
            const studentCount = users.filter(u => 
                u.role === 'student' && u.teacherId === teacher.id
            ).length;
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${teacher.name}</td>
                    <td>${teacher.username}</td>
                    <td>${teacher.phone || 'غير محدد'}</td>
                    <td>${studentCount}</td>
                    <td>
                        <span class="status-badge status-${teacher.status || 'active'}">
                            ${getStatusText(teacher.status || 'active')}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="editTeacher(${teacher.id})">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                            <button class="btn btn-sm btn-info" onclick="viewTeacherCredentials(${teacher.id})">
                                <i class="fas fa-key"></i> بيانات الدخول
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="toggleTeacherStatus(${teacher.id})">
                                ${teacher.status === 'active' ? '<i class="fas fa-pause"></i> إيقاف' : '<i class="fas fa-play"></i> تفعيل'}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        console.log(`✅ تم تحميل ${teachers.length} معلم`);
    }, 1500);
}

function showAddTeacherModal() {
    console.log('➕ عرض نافذة إضافة معلم جديد');
    showModal('addTeacherModal');
    
    // إعادة تعيين النموذج
    const form = document.getElementById('addTeacherForm');
    if (form) {
        form.reset();
    }
}

function closeAddTeacherModal() {
    console.log('❌ إغلاق نافذة إضافة معلم');
    hideModal('addTeacherModal');
}

function addNewTeacher() {
    console.log('🔄 جاري إضافة معلم جديد...');
    
    const form = document.getElementById('addTeacherForm');
    if (!form) {
        console.error('❌ نموذج إضافة معلم غير موجود');
        return;
    }
    
    const name = document.getElementById('teacherName').value.trim();
    const phone = document.getElementById('teacherPhone').value.trim();
    const username = document.getElementById('teacherUsername').value.trim();
    const password = document.getElementById('teacherPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // التحقق من صحة البيانات
    if (!name || !phone || !username || !password) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthNotification('كلمات المرور غير متطابقة', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    // التحقق من عدم تكرار اسم المستخدم
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        showAuthNotification('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }
    
    // إنشاء المعلم الجديد
    const newTeacher = {
        id: generateId(),
        username: username,
        password: password,
        role: 'teacher',
        name: name,
        phone: phone,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginAttempts: 0
    };
    
    users.push(newTeacher);
    localStorage.setItem('users', JSON.stringify(users));
    
    // إضافة سجل النظام
    addSystemLog(`تم إضافة معلم جديد: ${name} (${username})`, 'user');
    
    showAuthNotification('تم إضافة المعلم بنجاح', 'success');
    closeAddTeacherModal();
    loadTeachersData();
}

function editTeacher(teacherId) {
    console.log(`✏️ جاري تحميل بيانات المعلم ${teacherId} للتعديل`);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
    
    if (!teacher) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }
    
    currentEditingTeacherId = teacherId;
    
    // تعبئة النموذج
    document.getElementById('editTeacherId').value = teacher.id;
    document.getElementById('editTeacherName').value = teacher.name;
    document.getElementById('editTeacherPhone').value = teacher.phone;
    document.getElementById('editTeacherStatus').value = teacher.status;
    
    showModal('editTeacherModal');
}

function updateTeacher() {
    if (!currentEditingTeacherId) {
        showAuthNotification('لم يتم تحديد معلم للتعديل', 'error');
        return;
    }
    
    console.log(`🔄 جاري تحديث بيانات المعلم ${currentEditingTeacherId}`);
    
    const teacherId = parseInt(document.getElementById('editTeacherId').value);
    const name = document.getElementById('editTeacherName').value.trim();
    const phone = document.getElementById('editTeacherPhone').value.trim();
    const status = document.getElementById('editTeacherStatus').value;
    
    if (!name || !phone) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacherIndex = users.findIndex(u => u.id === teacherId && u.role === 'teacher');
    
    if (teacherIndex === -1) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }
    
    // تحديث البيانات
    users[teacherIndex].name = name;
    users[teacherIndex].phone = phone;
    users[teacherIndex].status = status;
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // إضافة سجل النظام
    addSystemLog(`تم تحديث بيانات المعلم: ${name}`, 'user');
    
    showAuthNotification('تم تحديث بيانات المعلم بنجاح', 'success');
    hideModal('editTeacherModal');
    loadTeachersData();
    
    currentEditingTeacherId = null;
}

function toggleTeacherStatus(teacherId) {
    console.log(`🔄 جاري تبديل حالة المعلم ${teacherId}`);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacherIndex = users.findIndex(u => u.id === teacherId && u.role === 'teacher');
    
    if (teacherIndex === -1) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }
    
    const teacher = users[teacherIndex];
    const newStatus = teacher.status === 'active' ? 'suspended' : 'active';
    const actionText = newStatus === 'active' ? 'تفعيل' : 'إيقاف';
    
    if (confirm(`هل أنت متأكد من ${actionText} حساب المعلم ${teacher.name}؟`)) {
        users[teacherIndex].status = newStatus;
        localStorage.setItem('users', JSON.stringify(users));
        
        // إضافة سجل النظام
        addSystemLog(`تم ${actionText} حساب المعلم: ${teacher.name}`, 'security');
        
        showAuthNotification(`تم ${actionText} حساب المعلم بنجاح`, 'success');
        loadTeachersData();
    }
}

function deleteTeacher(teacherId) {
    console.log(`🗑️ جاري حذف المعلم ${teacherId}`);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
    
    if (!teacher) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }
    
    // التحقق من وجود طلاب مرتبطين بالمعلم
    const teacherStudents = users.filter(u => u.role === 'student' && u.teacherId === teacherId);
    
    if (teacherStudents.length > 0) {
        showAuthNotification('لا يمكن حذف المعلم لأنه لديه طلاب مرتبطين به', 'error');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف المعلم ${teacher.name}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
        const updatedUsers = users.filter(u => u.id !== teacherId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // إضافة سجل النظام
        addSystemLog(`تم حذف المعلم: ${teacher.name}`, 'user');
        
        showAuthNotification('تم حذف المعلم بنجاح', 'success');
        loadTeachersData();
    }
}

function searchTeachers() {
    const searchTerm = document.getElementById('teacherSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#teachersTableBody tr');
    
    console.log(`🔍 البحث عن: ${searchTerm}`);
    
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.cells.length < 7) return;
        
        const name = row.cells[1].textContent.toLowerCase();
        const username = row.cells[2].textContent.toLowerCase();
        const phone = row.cells[3].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || username.includes(searchTerm) || phone.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    console.log(`🔍 تم العثور على ${visibleCount} نتيجة`);
}

function filterTeachers() {
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#teachersTableBody tr');
    
    console.log(`🎚️ التصفية حسب الحالة: ${statusFilter}`);
    
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.cells.length < 7) return;
        
        const statusElement = row.cells[5].querySelector('.status-badge');
        if (!statusElement) return;
        
        const status = statusElement.className.includes(statusFilter);
        
        if (statusFilter === 'all' || status) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    console.log(`🎚️ عرض ${visibleCount} معلم بعد التصفية`);
}

// ============================================
// إدارة بيانات الدخول للمعلمين
// ============================================

function viewTeacherCredentials(teacherId) {
    console.log(`🔑 جاري عرض بيانات دخول المعلم ${teacherId}`);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
    
    if (!teacher) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }
    
    currentViewingTeacherId = teacherId;
    
    // تعبئة البيانات
    document.getElementById('viewTeacherId').value = teacher.id;
    document.getElementById('viewTeacherName').textContent = teacher.name;
    document.getElementById('viewTeacherUsername').textContent = teacher.username;
    document.getElementById('viewTeacherPassword').value = teacher.password;
    
    // إعداد كلمة المرور المخفية
    const passwordField = document.getElementById('viewTeacherPassword');
    if (passwordField) {
        passwordField.type = 'password';
    }
    
    showModal('viewCredentialsModal');
    
    // إضافة سجل النظام
    addSystemLog(`عرض بيانات دخول المعلم: ${teacher.name}`, 'security');
}

function closeViewCredentialsModal() {
    console.log('❌ إغلاق نافذة عرض بيانات الدخول');
    hideModal('viewCredentialsModal');
    currentViewingTeacherId = null;
}

function togglePasswordVisibility() {
    const passwordField = document.getElementById('viewTeacherPassword');
    const toggleBtn = document.querySelector('.toggle-password-btn');
    
    if (!passwordField || !toggleBtn) return;
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> إخفاء';
        console.log('👁️ إظهار كلمة المرور');
    } else {
        passwordField.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> إظهار';
        console.log('🙈 إخفاء كلمة المرور');
    }
}

function copyToClipboard(text, type) {
    if (!navigator.clipboard) {
        console.error('❌ نظام الحافظة غير مدعوم');
        showAuthNotification('نظام الحافظة غير مدعوم في هذا المتصفح', 'error');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        const typeText = type === 'username' ? 'اسم المستخدم' : 'كلمة المرور';
        showAuthNotification(`تم نسخ ${typeText}`, 'success');
        console.log(`📋 تم نسخ ${typeText}: ${text}`);
    }).catch(err => {
        console.error('❌ فشل النسخ: ', err);
        showAuthNotification('فشل النسخ، يرجى المحاولة يدوياً', 'error');
    });
}

function resetTeacherPassword() {
    if (!currentViewingTeacherId) {
        showAuthNotification('لم يتم تحديد معلم', 'error');
        return;
    }
    
    console.log(`🔄 جاري إعادة تعيين كلمة مرور المعلم ${currentViewingTeacherId}`);
    
    const newPassword = prompt('أدخل كلمة المرور الجديدة (6 أحرف على الأقل):');
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        showAuthNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    const confirmPassword = prompt('تأكيد كلمة المرور الجديدة:');
    if (newPassword !== confirmPassword) {
        showAuthNotification('كلمات المرور غير متطابقة', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacherIndex = users.findIndex(u => u.id === currentViewingTeacherId && u.role === 'teacher');
    
    if (teacherIndex === -1) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }
    
    users[teacherIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    
    // تحديث العرض
    const passwordField = document.getElementById('viewTeacherPassword');
    if (passwordField) {
        passwordField.value = newPassword;
        passwordField.type = 'password';
    }
    
    const toggleBtn = document.querySelector('.toggle-password-btn');
    if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> إظهار';
    }
    
    // إضافة سجل النظام
    addSystemLog(`تم إعادة تعيين كلمة مرور المعلم ${users[teacherIndex].name}`, 'security');
    
    showAuthNotification('تم تحديث كلمة المرور بنجاح', 'success');
}

function editTeacherCredentials() {
    if (!currentViewingTeacherId) {
        showAuthNotification('لم يتم تحديد معلم', 'error');
        return;
    }
    
    console.log(`✏️ جاري تعديل بيانات دخول المعلم ${currentViewingTeacherId}`);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.id === currentViewingTeacherId && u.role === 'teacher');
    
    if (!teacher) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }
    
    // تعبئة نموذج التعديل
    document.getElementById('editCredTeacherId').value = teacher.id;
    document.getElementById('editCredTeacherName').value = teacher.name;
    document.getElementById('editCredTeacherUsername').value = teacher.username;
    document.getElementById('editCredTeacherPassword').value = '';
    
    hideModal('viewCredentialsModal');
    setTimeout(() => {
        showModal('editCredentialsModal');
    }, 300);
}

function closeEditCredentialsModal() {
    console.log('❌ إغلاق نافذة تعديل بيانات الدخول');
    hideModal('editCredentialsModal');
}

function saveTeacherCredentials() {
    const teacherId = parseInt(document.getElementById('editCredTeacherId').value);
    const username = document.getElementById('editCredTeacherUsername').value.trim();
    const password = document.getElementById('editCredTeacherPassword').value;
    
    if (!username) {
        showAuthNotification('يرجى إدخال اسم المستخدم', 'error');
        return;
    }
    
    console.log(`💾 جاري حفظ بيانات دخول المعلم ${teacherId}`);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacherIndex = users.findIndex(u => u.id === teacherId && u.role === 'teacher');
    
    if (teacherIndex === -1) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }
    
    // التحقق من عدم تكرار اسم المستخدم (باستثناء المعلم الحالي)
    const existingUser = users.find(u => 
        u.username === username && 
        u.id !== teacherId && 
        u.role === 'teacher'
    );
    
    if (existingUser) {
        showAuthNotification('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }
    
    // تحديث اسم المستخدم
    users[teacherIndex].username = username;
    
    // تحديث كلمة المرور إذا تم إدخال واحدة جديدة
    if (password) {
        if (password.length < 6) {
            showAuthNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }
        users[teacherIndex].password = password;
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // إضافة سجل النظام
    addSystemLog(`تم تحديث بيانات دخول المعلم ${users[teacherIndex].name}`, 'security');
    
    showAuthNotification('تم تحديث بيانات الدخول بنجاح', 'success');
    closeEditCredentialsModal();
    loadTeachersData();
    
    // إعادة فتح نافذة عرض البيانات المحدثة
    setTimeout(() => {
        viewTeacherCredentials(teacherId);
    }, 500);
}

// ============================================
// مكتبة المحتوى
// ============================================

function loadLibraryContent() {
    console.log('📚 جاري تحميل محتوى المكتبة...');
    
    // هذا هو المكان المناسب لتحميل المحتوى
    // حالياً سنقوم بمحاكاة التحميل
    
    setTimeout(() => {
        console.log('✅ تم تحميل مكتبة المحتوى');
        showAuthNotification('تم تحميل مكتبة المحتوى بنجاح', 'success');
    }, 1500);
}

// ============================================
// الاختبارات التشخيصية
// ============================================

function loadDiagnosticTests() {
    console.log('📊 جاري تحميل الاختبارات التشخيصية...');
    
    // سيتم تنفيذ هذا في tests.js
    console.log('ℹ️ سيتم تحميل الاختبارات من ملف tests.js');
}

// ============================================
// الواجبات
// ============================================

function loadAssignmentsData() {
    console.log('📝 جاري تحميل بيانات الواجبات...');
    
    // محاكاة تحميل البيانات
    setTimeout(() => {
        console.log('✅ تم تحميل الواجبات');
        showAuthNotification('تم تحميل الواجبات بنجاح', 'success');
    }, 1500);
}

// ============================================
// الدروس
// ============================================

function loadLessonsData() {
    console.log('📖 جاري تحميل بيانات الدروس...');
    
    // محاكاة تحميل البيانات
    setTimeout(() => {
        console.log('✅ تم تحميل الدروس');
        showAuthNotification('تم تحميل الدروس بنجاح', 'success');
    }, 1500);
}

// ============================================
// لجنة صعوبات التعلم
// ============================================

function loadCommitteeData() {
    console.log('👥 جاري تحميل بيانات اللجنة...');
    
    // محاكاة تحميل البيانات
    setTimeout(() => {
        console.log('✅ تم تحميل بيانات اللجنة');
        showAuthNotification('تم تحميل بيانات اللجنة بنجاح', 'success');
    }, 1500);
}

// ============================================
// دوال مساعدة عامة
// ============================================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        console.log(`✅ عرض نافذة: ${modalId}`);
    } else {
        console.error(`❌ النافذة غير موجودة: ${modalId}`);
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        console.log(`✅ إخفاء نافذة: ${modalId}`);
    }
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
        console.log(`📝 سجل النظام: ${message}`);
    } catch (error) {
        console.error('❌ خطأ في إضافة سجل النظام:', error);
    }
}

// ============================================
// إدارة تسجيل الخروج
// ============================================

// تأكد من أن دالة logout متاحة
if (typeof logout !== 'function') {
    console.log('⚠️ دالة تسجيل الخروج غير موجودة، سيتم إنشاء دالة بديلة');
    
    window.logout = function() {
        console.log('🚪 جاري تسجيل الخروج...');
        
        // مسح بيانات الجلسة
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('rememberedUser');
        
        // إضافة سجل النظام
        const currentUser = getCurrentUser();
        if (currentUser) {
            addSystemLog(`تم تسجيل خروج المستخدم: ${currentUser.name}`, 'security');
        }
        
        // عرض رسالة
        showAuthNotification('تم تسجيل الخروج بنجاح', 'success');
        
        // توجيه إلى صفحة تسجيل الدخول
        setTimeout(() => {
            console.log('✅ تم تسجيل الخروج، التوجيه إلى صفحة تسجيل الدخول');
            window.location.href = '../../index.html';
        }, 1500);
    };
}

// ============================================
// تصدير الدوال للاستخدام العالمي
// ============================================

// تصدير دوال إدارة المعلمين (للمدير)
window.showAddTeacherModal = showAddTeacherModal;
window.closeAddTeacherModal = closeAddTeacherModal;
window.editTeacher = editTeacher;
window.toggleTeacherStatus = toggleTeacherStatus;
window.deleteTeacher = deleteTeacher;
window.searchTeachers = searchTeachers;
window.filterTeachers = filterTeachers;

// تصدير دوال إدارة بيانات الدخول
window.viewTeacherCredentials = viewTeacherCredentials;
window.closeViewCredentialsModal = closeViewCredentialsModal;
window.togglePasswordVisibility = togglePasswordVisibility;
window.copyToClipboard = copyToClipboard;
window.resetTeacherPassword = resetTeacherPassword;
window.editTeacherCredentials = editTeacherCredentials;
window.closeEditCredentialsModal = closeEditCredentialsModal;
window.saveTeacherCredentials = saveTeacherCredentials;

// تصدير دوال إدارة الطلاب (للمعلم)
window.viewStudent = viewStudent;
window.editStudent = editStudent;
window.viewStudentProgress = viewStudentProgress;

// تصدير دوال عامة
window.addNewTeacher = addNewTeacher;
window.updateTeacher = updateTeacher;
window.updateUserInterface = updateUserInterface;

console.log('📤 تم تحميل ملف teacher.js بنجاح');
