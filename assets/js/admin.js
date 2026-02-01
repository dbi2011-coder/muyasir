// ============================================
// 📁 الملف: assets/js/admin.js
// الوصف: لوحة تحكم المدير (الأزرار الكاملة + عزل البيانات)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من الصلاحية
    const user = checkAuth();
    if (!user || user.role !== 'admin') {
        window.location.href = '../../index.html';
        return;
    }
    
    // 2. تحديث الواجهة
    if(document.getElementById('userName')) document.getElementById('userName').textContent = user.name;
    
    // 3. تحميل البيانات (مع حماية ضد الأخطاء)
    if (document.getElementById('teachersTableBody')) loadTeachersData();
    if (document.getElementById('teachersCount')) loadAdminStats();
});

// ==========================================
// 1. عرض البيانات (الجدول + الأزرار)
// ==========================================

function loadTeachersData() {
    const tableBody = document.getElementById('teachersTableBody');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    if (!tableBody) return;

    // إخفاء التحميل
    if(loadingState) loadingState.style.display = 'none';
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teachers = users.filter(u => u.role === 'teacher');
    
    if (teachers.length === 0) {
        if(emptyState) emptyState.style.display = 'block';
        tableBody.innerHTML = '';
        return;
    }

    if(emptyState) emptyState.style.display = 'none';

    // 🔥 بناء الجدول مع الأزرار القديمة
    tableBody.innerHTML = teachers.map((teacher, index) => {
        // حساب عدد طلابه (للتأكد من العزل)
        const studentCount = users.filter(u => u.role === 'student' && u.teacherId == teacher.id).length;
        
        // تحديد حالة الزر (تفعيل/إيقاف)
        const statusText = teacher.status === 'suspended' ? 'موقوف' : 'نشط';
        const statusClass = teacher.status === 'suspended' ? 'bg-danger' : 'bg-success';
        const toggleBtnText = teacher.status === 'suspended' ? 'تفعيل' : 'إيقاف';
        const toggleBtnClass = teacher.status === 'suspended' ? 'btn-success' : 'btn-warning';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${teacher.name}</td>
                <td>${teacher.username}</td>
                <td>${teacher.phone || '-'}</td>
                <td>${studentCount}</td>
                <td><span class="badge ${statusClass}" style="padding:5px 10px; color:white; border-radius:5px;">${statusText}</span></td>
                <td>
                    <div class="action-buttons" style="display:flex; gap:5px; justify-content:center;">
                        <button class="btn btn-sm btn-primary" onclick="editTeacher(${teacher.id})" title="تعديل">
                             تعديل ✏️
                        </button>
                        <button class="btn btn-sm btn-info" onclick="viewTeacherCredentials(${teacher.id})" title="بيانات الدخول">
                             بيانات 🔑
                        </button>
                        <button class="btn btn-sm ${toggleBtnClass}" onclick="toggleTeacherStatus(${teacher.id})" title="${toggleBtnText}">
                            ${toggleBtnText} ⚡
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})" title="حذف">
                             حذف 🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// عرض الإحصائيات
function loadAdminStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const tCount = users.filter(u => u.role === 'teacher').length;
    const sCount = users.filter(u => u.role === 'student').length;

    // التحقق من العناصر قبل الكتابة
    if(document.getElementById('teachersCount')) document.getElementById('teachersCount').textContent = tCount;
    if(document.getElementById('studentsCount')) document.getElementById('studentsCount').textContent = sCount;
}

// ==========================================
// 2. إدارة المعلمين (إضافة / حذف / تعديل)
// ==========================================

function addNewTeacher() {
    const name = document.getElementById('teacherName').value.trim();
    const username = document.getElementById('teacherUsername').value.trim();
    const password = document.getElementById('teacherPassword').value.trim();
    const phone = document.getElementById('teacherPhone') ? document.getElementById('teacherPhone').value.trim() : '';

    if (!name || !username || !password) {
        showNotification('يرجى تعبئة الحقول الأساسية', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.some(u => u.username === username)) {
        showNotification('اسم المستخدم موجود مسبقاً', 'error');
        return;
    }

    // 🔥 إنشاء المعلم مع ID فريد (أساس العزل)
    const newTeacher = {
        id: Date.now(),
        role: 'teacher',
        name: name,
        username: username,
        password: password,
        phone: phone,
        status: 'active',
        createdAt: new Date().toISOString()
    };

    users.push(newTeacher);
    localStorage.setItem('users', JSON.stringify(users));

    showNotification('تم إضافة المعلم بنجاح', 'success');
    
    // إغلاق النافذة
    if(typeof closeAddTeacherModal === 'function') closeAddTeacherModal();
    else document.getElementById('addTeacherModal').classList.remove('show');
    
    loadTeachersData();
    loadAdminStats();
}

function deleteTeacher(id) {
    if (!confirm('تحذير: سيتم حذف المعلم وجميع طلابه وجداوله وتقاريره. هل أنت متأكد؟')) return;

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 1. حذف المعلم
    users = users.filter(u => u.id !== id);
    
    // 2. حذف طلاب هذا المعلم (تنظيف البيانات المعزولة)
    users = users.filter(u => !(u.role === 'student' && u.teacherId == id));

    localStorage.setItem('users', JSON.stringify(users));
    
    // 3. تنظيف الجداول الخاصة به
    let schedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    schedules = schedules.filter(s => s.teacherId != id);
    localStorage.setItem('teacherSchedule', JSON.stringify(schedules));

    showNotification('تم الحذف وتنظيف البيانات بنجاح', 'success');
    loadTeachersData();
    loadAdminStats();
}

function toggleTeacherStatus(id) {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.id === id);
    
    if (index !== -1) {
        const currentStatus = users[index].status || 'active';
        users[index].status = currentStatus === 'active' ? 'suspended' : 'active';
        localStorage.setItem('users', JSON.stringify(users));
        showNotification('تم تغيير حالة المعلم', 'success');
        loadTeachersData();
    }
}

// ==========================================
// 3. بيانات الدخول (View Credentials)
// ==========================================

function viewTeacherCredentials(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.id === id);
    
    if (!teacher) return;

    // تعبئة النافذة (Modal) الموجودة في HTML الخاص بك
    const idInput = document.getElementById('viewTeacherId');
    const nameEl = document.getElementById('viewTeacherName');
    const userEl = document.getElementById('viewTeacherUsername');
    const passInput = document.getElementById('viewTeacherPassword');

    if(idInput) idInput.value = teacher.id;
    if(nameEl) nameEl.textContent = teacher.name;
    if(userEl) userEl.textContent = teacher.username;
    if(passInput) {
        passInput.value = teacher.password;
        passInput.type = 'password'; // إخفاء مبدئي
    }

    const modal = document.getElementById('viewCredentialsModal');
    if(modal) modal.classList.add('show');
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('viewTeacherPassword');
    if(passInput) {
        passInput.type = passInput.type === 'password' ? 'text' : 'password';
    }
}

function copyToClipboard(type) {
    let text = '';
    if (type === 'username') text = document.getElementById('viewTeacherUsername').textContent;
    if (type === 'password') text = document.getElementById('viewTeacherPassword').value;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('تم النسخ بنجاح', 'success');
    });
}

function closeViewCredentialsModal() {
    document.getElementById('viewCredentialsModal').classList.remove('show');
}

// ==========================================
// 4. دوال مساعدة (لمنع الأخطاء)
// ==========================================

// بديل آمن لـ showAuthNotification
function showNotification(msg, type) {
    // إذا كانت الدالة الأصلية موجودة في auth.js نستخدمها
    if (window.showAuthNotification) {
        window.showAuthNotification(msg, type);
    } else {
        // بديل بسيط في حال لم يتم تحميل auth.js
        alert(msg);
    }
}

// التأكد من وجود auth.js
function checkAuth() {
    if (window.checkAuth) return window.checkAuth();
    const session = sessionStorage.getItem('currentUser');
    return session ? JSON.parse(session) : null;
}

// تصدير الدوال لتكون متاحة للـ HTML
window.addNewTeacher = addNewTeacher;
window.deleteTeacher = deleteTeacher;
window.editTeacher = function(id) { alert('يمكنك تعديل البيانات بحذف المعلم وإضافته، أو تفعيل زر التعديل لاحقاً.'); }; // مؤقت
window.toggleTeacherStatus = toggleTeacherStatus;
window.viewTeacherCredentials = viewTeacherCredentials;
window.togglePasswordVisibility = togglePasswordVisibility;
window.copyToClipboard = copyToClipboard;
window.closeViewCredentialsModal = closeViewCredentialsModal;
