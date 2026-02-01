// ============================================
// 📁 الملف: assets/js/admin.js
// الوصف: لوحة تحكم المدير (إصلاح مشكلة التكرار RangeError + الأزرار الكاملة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من الصلاحية (تم تغيير اسم الدالة لمنع التضارب)
    const user = getAdminSession(); 
    if (!user || user.role !== 'admin') {
        window.location.href = '../../index.html';
        return;
    }
    
    // 2. تحديث الواجهة باسم المدير
    if(document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.name;
    }
    
    // 3. تحميل البيانات
    if (document.getElementById('teachersTableBody')) loadTeachersData();
    if (document.getElementById('teachersCount')) loadAdminStats();
});

// ==========================================
// 1. دالة المصادقة الآمنة (بديلة لـ checkAuth المسببة للمشكلة)
// ==========================================
function getAdminSession() {
    try {
        const session = sessionStorage.getItem('currentUser');
        return session ? JSON.parse(session) : null;
    } catch (e) {
        return null;
    }
}

// ==========================================
// 2. عرض البيانات (الجدول + الأزرار الكاملة)
// ==========================================

function loadTeachersData() {
    const tableBody = document.getElementById('teachersTableBody');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    if (!tableBody) return;

    // إخفاء مؤشر التحميل إن وجد
    if(loadingState) loadingState.style.display = 'none';
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teachers = users.filter(u => u.role === 'teacher');
    
    if (teachers.length === 0) {
        if(emptyState) emptyState.style.display = 'block';
        tableBody.innerHTML = '';
        return;
    }

    if(emptyState) emptyState.style.display = 'none';

    // 🔥 بناء الجدول مع كافة الأزرار المطلوبة
    tableBody.innerHTML = teachers.map((teacher, index) => {
        // عدد طلابه (للتأكد من العزل)
        const studentCount = users.filter(u => u.role === 'student' && u.teacherId == teacher.id).length;
        
        // حالة الزر واللون
        const isActive = teacher.status !== 'suspended';
        const statusBadge = isActive 
            ? '<span class="badge bg-success" style="padding:5px 10px; color:white; border-radius:5px;">نشط</span>' 
            : '<span class="badge bg-danger" style="padding:5px 10px; color:white; border-radius:5px;">موقوف</span>';
            
        const toggleBtnText = isActive ? 'إيقاف' : 'تفعيل';
        const toggleBtnClass = isActive ? 'btn-warning' : 'btn-success';
        const toggleIcon = isActive ? '⚡' : '✅';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${teacher.name}</td>
                <td>${teacher.username}</td>
                <td>${teacher.phone || '-'}</td>
                <td>${studentCount}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons" style="display:flex; gap:5px; justify-content:center;">
                        <button class="btn btn-sm btn-primary" onclick="editTeacher(${teacher.id})" title="تعديل البيانات">
                             تعديل ✏️
                        </button>
                        
                        <button class="btn btn-sm btn-info" onclick="viewTeacherCredentials(${teacher.id})" title="عرض وتعديل كلمة المرور">
                             بيانات 🔑
                        </button>
                        
                        <button class="btn btn-sm ${toggleBtnClass}" onclick="toggleTeacherStatus(${teacher.id})" title="${toggleBtnText} الحساب">
                            ${toggleBtnText} ${toggleIcon}
                        </button>
                        
                        <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})" title="حذف نهائي">
                             حذف 🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// عرض الإحصائيات في البطاقات العلوية
function loadAdminStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const tCount = users.filter(u => u.role === 'teacher').length;
    const sCount = users.filter(u => u.role === 'student').length;

    if(document.getElementById('teachersCount')) document.getElementById('teachersCount').textContent = tCount;
    if(document.getElementById('studentsCount')) document.getElementById('studentsCount').textContent = sCount;
}

// ==========================================
// 3. إدارة المعلمين (إضافة / حذف / تعديل الحالة)
// ==========================================

function addNewTeacher() {
    const nameInp = document.getElementById('teacherName'); // تأكد أن الـ ID في HTML هو teacherName أو newTeacherName
    const userInp = document.getElementById('teacherUsername');
    const passInp = document.getElementById('teacherPassword');
    const phoneInp = document.getElementById('teacherPhone');

    // دعم المسميات المختلفة في الـ HTML
    const name = (nameInp ? nameInp.value : document.getElementById('newTeacherName').value).trim();
    const username = (userInp ? userInp.value : document.getElementById('newTeacherUsername').value).trim();
    const password = (passInp ? passInp.value : document.getElementById('newTeacherPassword').value).trim();
    const phone = phoneInp ? phoneInp.value.trim() : '';

    if (!name || !username || !password) {
        alert('يرجى تعبئة الحقول الأساسية (الاسم، اسم المستخدم، كلمة المرور)');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.some(u => u.username === username)) {
        alert('اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر.');
        return;
    }

    // 🔥 إنشاء المعلم مع ID فريد (أساس عزل البيانات)
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

    alert('تم إضافة المعلم بنجاح ✅');
    
    // إغلاق النافذة (دعم لأكثر من طريقة إغلاق حسب الكود لديك)
    if(typeof closeAddTeacherModal === 'function') closeAddTeacherModal();
    else if(document.getElementById('addTeacherModal')) document.getElementById('addTeacherModal').classList.remove('show');
    
    // تفريغ الحقول
    if(nameInp) nameInp.value = '';
    if(userInp) userInp.value = '';
    if(passInp) passInp.value = '';
    
    loadTeachersData();
    loadAdminStats();
}

function deleteTeacher(id) {
    if (!confirm('⚠️ تحذير هام:\nسيتم حذف حساب المعلم وجميع الطلاب المرتبطين به وجميع التقارير والجداول الخاصة به.\n\nهل أنت متأكد تماماً؟')) return;

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 1. حذف المعلم
    users = users.filter(u => u.id !== id);
    
    // 2. حذف طلاب هذا المعلم (تنظيف البيانات المعزولة)
    users = users.filter(u => !(u.role === 'student' && u.teacherId == id));

    localStorage.setItem('users', JSON.stringify(users));
    
    // 3. تنظيف الجداول الخاصة به (اختياري لكن مفضل للنظافة)
    let schedules = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    schedules = schedules.filter(s => s.teacherId != id);
    localStorage.setItem('teacherSchedule', JSON.stringify(schedules));

    alert('تم الحذف وتنظيف البيانات بنجاح 🗑️');
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
        loadTeachersData(); // إعادة رسم الجدول لتحديث الزر
    }
}

// دالة تعديل (Placeholder) - يمكنك تطويرها لفتح مودال تعديل
function editTeacher(id) {
    // هنا يمكنك فتح نافذة تعديل، سأضع تنبيهاً مؤقتاً
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.id === id);
    if(teacher) {
        const newName = prompt('تعديل اسم المعلم:', teacher.name);
        if(newName) {
            teacher.name = newName;
            localStorage.setItem('users', JSON.stringify(users));
            loadTeachersData();
        }
    }
}

// ==========================================
// 4. بيانات الدخول (View Credentials)
// ==========================================

function viewTeacherCredentials(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teacher = users.find(u => u.id === id);
    
    if (!teacher) return;

    // تعبئة النافذة (Modal) الموجودة في HTML
    const idInput = document.getElementById('viewTeacherId');
    const nameEl = document.getElementById('viewTeacherName');
    const userEl = document.getElementById('viewTeacherUsername');
    const passInput = document.getElementById('viewTeacherPassword');

    if(idInput) idInput.value = teacher.id;
    if(nameEl) nameEl.textContent = teacher.name;
    if(userEl) {
        userEl.textContent = teacher.username;
        // نسخ اسم المستخدم للحقل المخفي إن وجد للتعديل
        if(document.getElementById('editCredTeacherUsername')) document.getElementById('editCredTeacherUsername').value = teacher.username;
    }
    
    if(passInput) {
        passInput.value = teacher.password;
        passInput.type = 'password'; // إخفاء مبدئي
    }

    const modal = document.getElementById('viewCredentialsModal');
    if(modal) modal.classList.add('show');
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('viewTeacherPassword');
    const toggleBtn = document.querySelector('.toggle-password-btn');
    
    if(passInput) {
        if (passInput.type === 'password') {
            passInput.type = 'text';
            if(toggleBtn) toggleBtn.textContent = '🙈 إخفاء';
        } else {
            passInput.type = 'password';
            if(toggleBtn) toggleBtn.textContent = '👁️ إظهار';
        }
    }
}

function copyToClipboard(type) {
    let text = '';
    if (type === 'username') {
        const el = document.getElementById('viewTeacherUsername');
        text = el ? el.textContent : '';
    }
    if (type === 'password') {
        const el = document.getElementById('viewTeacherPassword');
        text = el ? el.value : '';
    }
    
    if(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('تم النسخ: ' + text);
        });
    }
}

function closeViewCredentialsModal() {
    const modal = document.getElementById('viewCredentialsModal');
    if(modal) modal.classList.remove('show');
}

// حفظ تعديلات بيانات الدخول (إذا قمت بتعديلها من النافذة)
function saveTeacherCredentials() {
    const id = document.getElementById('viewTeacherId').value;
    const newPass = document.getElementById('viewTeacherPassword').value;
    
    if(!newPass || newPass.length < 3) return alert('كلمة المرور قصيرة جداً');

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.id == id);
    
    if(idx !== -1) {
        users[idx].password = newPass;
        localStorage.setItem('users', JSON.stringify(users));
        alert('تم تحديث كلمة المرور بنجاح');
        closeViewCredentialsModal();
        loadTeachersData();
    }
}

// تصدير الدوال لتكون متاحة للـ HTML
window.addNewTeacher = addNewTeacher;
window.deleteTeacher = deleteTeacher;
window.editTeacher = editTeacher;
window.toggleTeacherStatus = toggleTeacherStatus;
window.viewTeacherCredentials = viewTeacherCredentials;
window.togglePasswordVisibility = togglePasswordVisibility;
window.copyToClipboard = copyToClipboard;
window.closeViewCredentialsModal = closeViewCredentialsModal;
window.saveTeacherCredentials = saveTeacherCredentials;
// تصدير دالة الإغلاق للإضافة أيضاً
window.closeAddTeacherModal = function() {
    const m = document.getElementById('addTeacherModal');
    if(m) m.classList.remove('show');
};
