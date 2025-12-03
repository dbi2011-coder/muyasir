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
