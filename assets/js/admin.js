
// ===== admin.js =====
// ============================================
// 📁 الملف: muyasir-main/assets/js/admin.js
// ============================================

// إدارة لوحة تحكم المدير
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
});

function initializeAdminDashboard() {
    // التحقق من المصادقة والدور
    const user = checkAuth();
    if (!user) return;
    
    if (user.role !== 'admin') {
        showAuthNotification('غير مصرح لك بالوصول إلى هذه الصفحة', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }

    // تحديث واجهة المستخدم
    updateUserInterface(user);
    
    // تحميل البيانات
    loadAdminStats();
    loadRecentActivity();
    
    // إذا كانت صفحة المعلمين، تحميل بياناتهم
    if (window.location.pathname.includes('teachers.html')) {
        loadTeachersData();
    }
}

function loadAdminStats() {
    // محاكاة تحميل الإحصائيات
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const teachers = users.filter(u => u.role === 'teacher');
        const students = users.filter(u => u.role === 'student');
        
        document.getElementById('teachersCount').textContent = teachers.length;
        document.getElementById('studentsCount').textContent = students.length;
        document.getElementById('activeSessions').textContent = Math.floor(Math.random() * 10) + 1;
        document.getElementById('pendingActions').textContent = Math.floor(Math.random() * 5);
        
        // تحديث عدد الإشعارات
        document.getElementById('notificationCount').textContent = Math.floor(Math.random() * 3);
    }, 1000);
}

function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    const activities = [
        {
            icon: '👨‍🏫',
            title: 'تم إضافة معلم جديد',
            time: 'منذ 5 دقائق',
            color: '#3498db'
        },
        {
            icon: '🎓',
            title: 'طالب جديد انضم للنظام',
            time: 'منذ ساعة',
            color: '#27ae60'
        },
        {
            icon: '📊',
            title: 'تقرير شهري تم إنشاؤه',
            time: 'منذ 3 ساعات',
            color: '#f39c12'
        },
        {
            icon: '⚠️',
            title: 'حساب معلم تم تعليقه',
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

function loadTeachersData() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('teachersTableBody');
    
    if (!tableBody) return;

    // إظهار حالة التحميل
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const teachers = users.filter(u => u.role === 'teacher');
        
        loadingState.style.display = 'none';
        
        if (teachers.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        // تعبئة الجدول
        tableBody.innerHTML = teachers.map((teacher, index) => {
            const studentCount = users.filter(u => u.role === 'student' && u.teacherId === teacher.id).length;
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${teacher.name}</td>
                    <td>${teacher.username}</td>
                    <td>${teacher.phone}</td>
                    <td>${studentCount}</td>
                    <td>
                        <span class="status-badge status-${teacher.status}">
                            ${getStatusText(teacher.status)}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="editTeacher(${teacher.id})">
                                تعديل
                            </button>
                            <button class="btn btn-sm btn-info" onclick="viewTeacherCredentials(${teacher.id})">
                                بيانات الدخول
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="toggleTeacherStatus(${teacher.id})">
                                ${teacher.status === 'active' ? 'إيقاف' : 'تفعيل'}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})">
                                حذف
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
        'suspended': 'موقوف',
        'inactive': 'غير نشط'
    };
    return statusMap[status] || 'غير معروف';
}

function showAddTeacherModal() {
    document.getElementById('addTeacherModal').classList.add('show');
}

function closeAddTeacherModal() {
    document.getElementById('addTeacherModal').classList.remove('show');
    document.getElementById('addTeacherForm').reset();
}

function showEditTeacherModal() {
    document.getElementById('editTeacherModal').classList.add('show');
}

function closeEditTeacherModal() {
    document.getElementById('editTeacherModal').classList.remove('show');
}

function addNewTeacher() {
    const form = document.getElementById('addTeacherForm');
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

    showAuthNotification('تم إضافة المعلم بنجاح', 'success');
    closeAddTeacherModal();
    loadTeachersData();
    
    // إضافة سجل النظام
    addSystemLog(`تم إضافة معلم جديد: ${name} (${username})`, 'user');
}

function editTeacher(teacherId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
    
    if (!teacher) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }

    // تعبئة النموذج
    document.getElementById('editTeacherId').value = teacher.id;
    document.getElementById('editTeacherName').value = teacher.name;
    document.getElementById('editTeacherPhone').value = teacher.phone;
    document.getElementById('editTeacherStatus').value = teacher.status;

    showEditTeacherModal();
}

function updateTeacher() {
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

    showAuthNotification('تم تحديث بيانات المعلم بنجاح', 'success');
    closeEditTeacherModal();
    loadTeachersData();
    
    // إضافة سجل النظام
    addSystemLog(`تم تحديث بيانات المعلم: ${name}`, 'user');
}

function toggleTeacherStatus(teacherId) {
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
        
        showAuthNotification(`تم ${actionText} حساب المعلم بنجاح`, 'success');
        loadTeachersData();
        
        // إضافة سجل النظام
        addSystemLog(`تم ${actionText} حساب المعلم: ${teacher.name}`, 'security');
    }
}

function deleteTeacher(teacherId) {
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
        
        showAuthNotification('تم حذف المعلم بنجاح', 'success');
        loadTeachersData();
        
        // إضافة سجل النظام
        addSystemLog(`تم حذف المعلم: ${teacher.name}`, 'user');
    }
}

function searchTeachers() {
    const searchTerm = document.getElementById('teacherSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#teachersTableBody tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const username = row.cells[2].textContent.toLowerCase();
        const phone = row.cells[3].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || username.includes(searchTerm) || phone.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterTeachers() {
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#teachersTableBody tr');
    
    rows.forEach(row => {
        const status = row.cells[5].querySelector('.status-badge').className.includes(statusFilter);
        
        if (statusFilter === 'all' || status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function generateId() {
    return Math.floor(Math.random() * 1000000) + 1;
}

function showSystemStats() {
    alert('نظام الإحصائيات المتقدمة سيتم تطويره في المراحل القادمة');
}

function showNotifications() {
    alert('نظام الإشعارات المتكامل سيتم تطويره في المراحل القادمة');
}

// دوال مساعدة
function updateUserInterface(user) {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.charAt(0);
}

// ============================================
// وظائف إدارة بيانات الدخول للمعلمين
// ============================================

function viewTeacherCredentials(teacherId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
    
    if (!teacher) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }

    // تعبئة النموذج
    document.getElementById('viewTeacherId').value = teacher.id;
    document.getElementById('viewTeacherName').textContent = teacher.name;
    document.getElementById('viewTeacherUsername').textContent = teacher.username;
    document.getElementById('viewTeacherPassword').value = teacher.password;
    
    // إخفاء/إظهار كلمة المرور
    const passwordField = document.getElementById('viewTeacherPassword');
    passwordField.type = 'password';
    
    document.getElementById('viewCredentialsModal').classList.add('show');
    
    // إضافة سجل النظام
    addSystemLog(`عرض بيانات دخول المعلم: ${teacher.name}`, 'security');
}

function closeViewCredentialsModal() {
    document.getElementById('viewCredentialsModal').classList.remove('show');
}

function togglePasswordVisibility() {
    const passwordField = document.getElementById('viewTeacherPassword');
    const toggleBtn = document.querySelector('.toggle-password-btn');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleBtn.innerHTML = '🙈 إخفاء';
    } else {
        passwordField.type = 'password';
        toggleBtn.innerHTML = '👁️ إظهار';
    }
}

function copyToClipboard(text, type) {
    navigator.clipboard.writeText(text).then(() => {
        showAuthNotification(`تم نسخ ${type === 'username' ? 'اسم المستخدم' : 'كلمة المرور'}`, 'success');
    }).catch(err => {
        console.error('فشل النسخ: ', err);
        showAuthNotification('فشل النسخ، يرجى المحاولة يدوياً', 'error');
    });
}

function resetTeacherPassword() {
    const teacherId = parseInt(document.getElementById('viewTeacherId').value);
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
    const teacherIndex = users.findIndex(u => u.id === teacherId && u.role === 'teacher');
    
    if (teacherIndex === -1) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }
    
    users[teacherIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    
    // تحديث العرض
    document.getElementById('viewTeacherPassword').value = newPassword;
    document.getElementById('viewTeacherPassword').type = 'password';
    document.querySelector('.toggle-password-btn').innerHTML = '👁️ إظهار';
    
    showAuthNotification('تم تحديث كلمة المرور بنجاح', 'success');
    
    // إضافة سجل النظام
    addSystemLog(`تم إعادة تعيين كلمة مرور المعلم ${users[teacherIndex].name}`, 'security');
}

function editTeacherCredentials() {
    const teacherId = parseInt(document.getElementById('viewTeacherId').value);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
    
    if (!teacher) {
        showAuthNotification('المعلم غير موجود', 'error');
        return;
    }

    // تعبئة نموذج التعديل
    document.getElementById('editCredTeacherId').value = teacher.id;
    document.getElementById('editCredTeacherName').value = teacher.name;
    document.getElementById('editCredTeacherUsername').value = teacher.username;
    document.getElementById('editCredTeacherPassword').value = '';
    
    document.getElementById('viewCredentialsModal').classList.remove('show');
    setTimeout(() => {
        document.getElementById('editCredentialsModal').classList.add('show');
    }, 300);
}

function closeEditCredentialsModal() {
    document.getElementById('editCredentialsModal').classList.remove('show');
}

function saveTeacherCredentials() {
    const teacherId = parseInt(document.getElementById('editCredTeacherId').value);
    const username = document.getElementById('editCredTeacherUsername').value.trim();
    const password = document.getElementById('editCredTeacherPassword').value;
    
    if (!username) {
        showAuthNotification('يرجى إدخال اسم المستخدم', 'error');
        return;
    }
    
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
// دالة مساعدة لإضافة سجل النظام
// ============================================

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

// ============================================
// دوال إضافية
// ============================================

// دالة للوصول إلى صفحة الإعدادات
function showSettings() {
    window.location.href = 'settings.html';
}

// تحديث القائمة الجانبية
document.querySelectorAll('.sidebar-menu a').forEach(link => {
    if (link.getAttribute('href') === 'settings.html') {
        link.addEventListener('click', function(e) {
            if (!getCurrentUser()) {
                e.preventDefault();
                showAuthNotification('يجب تسجيل الدخول أولاً', 'error');
            }
        });
    }
});

// معالجة الروابط المكسورة
function handleBrokenLinks() {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.includes('.html')) {
                // يمكن إضافة تحقق إضافي هنا إذا لزم الأمر
            }
        });
    });
}

// استدعاء الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', handleBrokenLinks);

// تصدير الدوال للاستخدام العالمي
window.showAddTeacherModal = showAddTeacherModal;
window.closeAddTeacherModal = closeAddTeacherModal;
window.editTeacher = editTeacher;
window.toggleTeacherStatus = toggleTeacherStatus;
window.deleteTeacher = deleteTeacher;
window.searchTeachers = searchTeachers;
window.filterTeachers = filterTeachers;
window.showSettings = showSettings;

// تصدير دوال إدارة بيانات الدخول
window.viewTeacherCredentials = viewTeacherCredentials;
window.closeViewCredentialsModal = closeViewCredentialsModal;
window.togglePasswordVisibility = togglePasswordVisibility;
window.copyToClipboard = copyToClipboard;
window.resetTeacherPassword = resetTeacherPassword;
window.editTeacherCredentials = editTeacherCredentials;
window.closeEditCredentialsModal = closeEditCredentialsModal;
window.saveTeacherCredentials = saveTeacherCredentials;



// ===== admin-settings.js =====
// ============================================
// 📁 الملف: muyasir-main/assets/js/admin-settings.js
// ============================================

// إدارة إعدادات النظام للمدير
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('settings.html')) {
        initializeAdminSettings();
    }
});

function initializeAdminSettings() {
    loadSystemSettings();
    setupSettingsForm();
    loadBackupHistory();
    loadSystemLogs();
}

function loadSystemSettings() {
    const settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    
    // تعبئة النموذج بالإعدادات الحالية
    if (settings) {
        document.getElementById('systemName').value = settings.systemName || 'ميسر التعلم';
        document.getElementById('systemEmail').value = settings.systemEmail || '';
        document.getElementById('sessionTimeout').value = settings.sessionTimeout || 60;
        document.getElementById('maxLoginAttempts').value = settings.maxLoginAttempts || 5;
        document.getElementById('enableNotifications').checked = settings.enableNotifications !== false;
        document.getElementById('enableAutoBackup').checked = settings.enableAutoBackup || false;
        document.getElementById('backupFrequency').value = settings.backupFrequency || 'daily';
    }
}

function setupSettingsForm() {
    const form = document.getElementById('systemSettingsForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveSystemSettings();
    });
}

function saveSystemSettings() {
    const settings = {
        systemName: document.getElementById('systemName').value.trim(),
        systemEmail: document.getElementById('systemEmail').value.trim(),
        sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
        maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
        enableNotifications: document.getElementById('enableNotifications').checked,
        enableAutoBackup: document.getElementById('enableAutoBackup').checked,
        backupFrequency: document.getElementById('backupFrequency').value,
        lastUpdated: new Date().toISOString()
    };

    // التحقق من صحة البيانات
    if (!settings.systemName) {
        showAuthNotification('يرجى إدخال اسم النظام', 'error');
        return;
    }

    if (settings.systemEmail && !isValidEmail(settings.systemEmail)) {
        showAuthNotification('البريد الإلكتروني غير صالح', 'error');
        return;
    }

    if (settings.sessionTimeout < 5 || settings.sessionTimeout > 480) {
        showAuthNotification('مهلة الجلسة يجب أن تكون بين 5 و 480 دقيقة', 'error');
        return;
    }

    // حفظ الإعدادات
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    
    // إضافة سجل
    addSystemLog('تم تحديث إعدادات النظام', 'settings');
    
    showAuthNotification('تم حفظ الإعدادات بنجاح', 'success');
    
    // إعادة تحميل الإعدادات لعرض التغييرات
    setTimeout(() => {
        loadSystemSettings();
    }, 1000);
}

function resetSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات إلى القيم الافتراضية؟')) {
        const defaultSettings = {
            systemName: 'ميسر التعلم',
            systemEmail: '',
            sessionTimeout: 60,
            maxLoginAttempts: 5,
            enableNotifications: true,
            enableAutoBackup: false,
            backupFrequency: 'daily',
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('systemSettings', JSON.stringify(defaultSettings));
        
        // إضافة سجل
        addSystemLog('تم إعادة تعيين إعدادات النظام', 'settings');
        
        showAuthNotification('تم إعادة تعيين الإعدادات بنجاح', 'success');
        
        // إعادة تحميل النموذج
        setTimeout(() => {
            loadSystemSettings();
        }, 500);
    }
}

function loadBackupHistory() {
    const backupList = document.getElementById('backupList');
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    
    if (backups.length === 0) {
        backupList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="empty-state">
                        <div class="empty-icon">💾</div>
                        <h3>لا توجد نسخ احتياطية</h3>
                        <p>لم يتم إنشاء أي نسخ احتياطية بعد</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // ترتيب النسخ الاحتياطية من الأحدث إلى الأقدم
    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    backupList.innerHTML = backups.map((backup, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${formatDate(backup.createdAt)}</td>
            <td>${backup.type === 'manual' ? 'يدوي' : 'تلقائي'}</td>
            <td>${backup.size || 'غير معروف'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="downloadBackup(${index})">تحميل</button>
                    <button class="btn btn-sm btn-warning" onclick="restoreBackup(${index})">استعادة</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBackup(${index})">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function createBackup() {
    showAuthNotification('جاري إنشاء نسخة احتياطية...', 'info');
    
    setTimeout(() => {
        // جمع جميع البيانات من localStorage
        const backupData = {};
        const keys = [
            'users', 'teachers', 'students', 'tests', 'lessons', 
            'assignments', 'systemSettings', 'committeeMembers',
            'committeeNotes', 'committeeReports', 'loginLogs'
        ];
        
        keys.forEach(key => {
            if (localStorage.getItem(key)) {
                backupData[key] = JSON.parse(localStorage.getItem(key));
            }
        });
        
        // إنشاء كائن النسخة الاحتياطية
        const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
        const newBackup = {
            id: generateId(),
            createdAt: new Date().toISOString(),
            type: 'manual',
            data: backupData,
            size: JSON.stringify(backupData).length + ' bytes'
        };
        
        backups.push(newBackup);
        localStorage.setItem('systemBackups', JSON.stringify(backups));
        
        // حفظ البيانات في ملف تنزيل (محاكاة)
        const blob = new Blob([JSON.stringify(backupData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // إضافة سجل
        addSystemLog('تم إنشاء نسخة احتياطية يدوية', 'backup');
        
        showAuthNotification('تم إنشاء النسخة الاحتياطية بنجاح', 'success');
        loadBackupHistory();
    }, 2000);
}

function downloadBackup(backupIndex) {
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    const backup = backups[backupIndex];
    
    if (!backup) {
        showAuthNotification('النسخة الاحتياطية غير موجودة', 'error');
        return;
    }
    
    const blob = new Blob([JSON.stringify(backup.data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // إضافة سجل
    addSystemLog(`تم تحميل النسخة الاحتياطية ${backup.id}`, 'backup');
    
    showAuthNotification('تم تحميل النسخة الاحتياطية', 'success');
}

function restoreBackup(backupIndex) {
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    const backup = backups[backupIndex];
    
    if (!backup) {
        showAuthNotification('النسخة الاحتياطية غير موجودة', 'error');
        return;
    }
    
    if (!confirm('⚠️ تحذير: استعادة النسخة الاحتياطية ستحل محل جميع البيانات الحالية. هل أنت متأكد؟')) {
        return;
    }
    
    showAuthNotification('جاري استعادة البيانات...', 'warning');
    
    setTimeout(() => {
        // استعادة البيانات من النسخة الاحتياطية
        Object.keys(backup.data).forEach(key => {
            localStorage.setItem(key, JSON.stringify(backup.data[key]));
        });
        
        // إضافة سجل
        addSystemLog(`تم استعادة النسخة الاحتياطية ${backup.id}`, 'backup');
        
        showAuthNotification('تم استعادة النسخة الاحتياطية بنجاح', 'success');
        
        // إعادة تحميل الصفحة بعد التأكيد
        setTimeout(() => {
            if (confirm('تمت الاستعادة بنجاح. هل تريد إعادة تحميل الصفحة؟')) {
                location.reload();
            }
        }, 1000);
    }, 1500);
}

function deleteBackup(backupIndex) {
    const backups = JSON.parse(localStorage.getItem('systemBackups') || '[]');
    
    if (backupIndex >= backups.length) {
        showAuthNotification('النسخة الاحتياطية غير موجودة', 'error');
        return;
    }
    
    const backup = backups[backupIndex];
    
    if (!confirm(`هل أنت متأكد من حذف النسخة الاحتياطية المؤرخة ${formatDate(backup.createdAt)}؟`)) {
        return;
    }
    
    backups.splice(backupIndex, 1);
    localStorage.setItem('systemBackups', JSON.stringify(backups));
    
    // إضافة سجل
    addSystemLog(`تم حذف النسخة الاحتياطية ${backup.id}`, 'backup');
    
    showAuthNotification('تم حذف النسخة الاحتياطية بنجاح', 'success');
    loadBackupHistory();
}

function loadSystemLogs() {
    const logsList = document.getElementById('logsList');
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    
    if (logs.length === 0) {
        logsList.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <h3>لا توجد سجلات نظام</h3>
                        <p>سيظهر هنا سجل الأنشطة والنظام</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // ترتيب السجلات من الأحدث إلى الأقدم
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // عرض آخر 50 سجل فقط
    const recentLogs = logs.slice(0, 50);
    
    logsList.innerHTML = recentLogs.map(log => `
        <tr>
            <td>${formatDate(log.timestamp)}</td>
            <td>
                <span class="log-type-${log.type}">${getLogTypeText(log.type)}</span>
            </td>
            <td>${log.message}</td>
            <td>${log.user || 'النظام'}</td>
        </tr>
    `).join('');
}

function addSystemLog(message, type = 'info', user = null) {
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
    
    // تحديث عرض السجلات إذا كانت الصفحة مفتوحة
    if (window.location.pathname.includes('settings.html')) {
        loadSystemLogs();
    }
}

function clearLogs() {
    if (!confirm('هل أنت متأكد من مسح جميع سجلات النظام؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }
    
    localStorage.removeItem('systemLogs');
    
    // إضافة سجل للمسح نفسه
    addSystemLog('تم مسح جميع سجلات النظام', 'warning');
    
    showAuthNotification('تم مسح سجلات النظام بنجاح', 'success');
    loadSystemLogs();
}

function exportLogs() {
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    
    if (logs.length === 0) {
        showAuthNotification('لا توجد سجلات للتصدير', 'warning');
        return;
    }
    
    const logText = logs.map(log => 
        `${formatDate(log.timestamp)} - ${getLogTypeText(log.type)} - ${log.user || 'النظام'}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAuthNotification('تم تصدير سجلات النظام بنجاح', 'success');
}

// دوال مساعدة
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function getLogTypeText(type) {
    const types = {
        'info': 'معلومات',
        'warning': 'تحذير',
        'error': 'خطأ',
        'success': 'نجاح',
        'settings': 'إعدادات',
        'backup': 'نسخ احتياطي',
        'user': 'مستخدم',
        'security': 'أمان'
    };
    return types[type] || type;
}

function filterLogs() {
    const filterType = document.getElementById('logFilter').value;
    const searchTerm = document.getElementById('logSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#logsList tr');
    
    rows.forEach(row => {
        if (row.cells.length < 4) return; // تخطى صفوف الرسائل الفارغة
        
        const type = row.cells[1].querySelector('span')?.className || '';
        const message = row.cells[2].textContent.toLowerCase();
        const user = row.cells[3].textContent.toLowerCase();
        
        let showRow = true;
        
        // الفلترة حسب النوع
        if (filterType !== 'all' && !type.includes(filterType)) {
            showRow = false;
        }
        
        // البحث في النص
        if (searchTerm && !message.includes(searchTerm) && !user.includes(searchTerm)) {
            showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

function clearSearch() {
    document.getElementById('logSearch').value = '';
    filterLogs();
}

// تصدير الدوال للاستخدام العالمي
window.resetSettings = resetSettings;
window.createBackup = createBackup;
window.downloadBackup = downloadBackup;
window.restoreBackup = restoreBackup;
window.deleteBackup = deleteBackup;
window.clearLogs = clearLogs;
window.exportLogs = exportLogs;
window.filterLogs = filterLogs;
window.clearSearch = clearSearch;


