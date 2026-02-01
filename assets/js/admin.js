// ============================================
// 📁 الملف: assets/js/admin.js
// الوصف: لوحة تحكم المدير (شاملة الإصلاحات + إدارة بيانات الدخول)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من الصلاحية (استخدام الدالة الآمنة)
    const user = getAdminSession();
    if (!user || user.role !== 'admin') {
        window.location.href = '../../index.html';
        return;
    }

    // 2. تحديث الاسم
    if(document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.name;
    }

    // 3. تحميل البيانات
    if (document.getElementById('teachersTableBody')) loadTeachersData();
    if (document.getElementById('teachersCount')) loadAdminStats();
});

// ---------------------------------------------------------
// 1. المصادقة الآمنة (لمنع مشكلة RangeError)
// ---------------------------------------------------------
function getAdminSession() {
    try {
        const session = sessionStorage.getItem('currentUser');
        return session ? JSON.parse(session) : null;
    } catch (e) { return null; }
}

// ---------------------------------------------------------
// 2. عرض الجدول والأزرار
// ---------------------------------------------------------
function loadTeachersData() {
    const tableBody = document.getElementById('teachersTableBody');
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');

    if (!tableBody) return;
    if (loading) loading.style.display = 'none';

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teachers = users.filter(u => u.role === 'teacher');

    if (teachers.length === 0) {
        if (empty) empty.style.display = 'block';
        tableBody.innerHTML = '';
        return;
    }
    if (empty) empty.style.display = 'none';

    tableBody.innerHTML = teachers.map((teacher, index) => {
        const sCount = users.filter(u => u.role === 'student' && u.teacherId == teacher.id).length;
        const isActive = teacher.status !== 'suspended';
        
        // الأزرار وتنسيق الحالة
        const statusBadge = isActive 
            ? '<span class="badge bg-success" style="color:white; padding:5px;">نشط</span>' 
            : '<span class="badge bg-danger" style="color:white; padding:5px;">موقوف</span>';
        const toggleClass = isActive ? 'btn-warning' : 'btn-success';
        const toggleText = isActive ? 'إيقاف' : 'تفعيل';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${teacher.name}</td>
                <td>${teacher.username}</td>
                <td>${teacher.phone || '-'}</td>
                <td>${sCount}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <button class="btn btn-sm btn-primary" onclick="editTeacher(${teacher.id})">تعديل ✏️</button>
                        <button class="btn btn-sm btn-info" onclick="viewTeacherCredentials(${teacher.id})">بيانات 🔑</button>
                        <button class="btn btn-sm ${toggleClass}" onclick="toggleTeacherStatus(${teacher.id})">${toggleText}</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})">حذف 🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function loadAdminStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(document.getElementById('teachersCount')) 
        document.getElementById('teachersCount').textContent = users.filter(u => u.role === 'teacher').length;
    if(document.getElementById('studentsCount')) 
        document.getElementById('studentsCount').textContent = users.filter(u => u.role === 'student').length;
}

// ---------------------------------------------------------
// 3. إدارة المعلمين (إضافة / حذف / حالة)
// ---------------------------------------------------------
function addNewTeacher() {
    // دعم معرفات مختلفة للحقول
    const nameVal = getValue('teacherName') || getValue('newTeacherName');
    const userVal = getValue('teacherUsername') || getValue('newTeacherUsername');
    const passVal = getValue('teacherPassword') || getValue('newTeacherPassword');
    const phoneVal = getValue('teacherPhone') || '';

    if (!nameVal || !userVal || !passVal) return alert('البيانات ناقصة');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.username === userVal)) return alert('اسم المستخدم مسجل مسبقاً');

    users.push({
        id: Date.now(),
        role: 'teacher',
        name: nameVal,
        username: userVal,
        password: passVal,
        phone: phoneVal,
        status: 'active',
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('users', JSON.stringify(users));
    alert('تمت الإضافة بنجاح');
    
    // محاولة إغلاق النافذة بأكثر من طريقة
    if(typeof closeAddTeacherModal === 'function') closeAddTeacherModal();
    else closeModalElement('addTeacherModal');

    // تفريغ الحقول
    clearValue('teacherName'); clearValue('newTeacherName');
    clearValue('teacherUsername'); clearValue('newTeacherUsername');
    clearValue('teacherPassword'); clearValue('newTeacherPassword');
    clearValue('teacherPhone');

    loadTeachersData();
    loadAdminStats();
}

function deleteTeacher(id) {
    if(!confirm('هل أنت متأكد من حذف المعلم وجميع طلابه؟')) return;
    
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.filter(u => u.id !== id); // حذف المعلم
    users = users.filter(u => !(u.role === 'student' && u.teacherId == id)); // حذف طلابه
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // تنظيف الجداول
    let sch = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    localStorage.setItem('teacherSchedule', JSON.stringify(sch.filter(s => s.teacherId != id)));

    alert('تم الحذف');
    loadTeachersData();
    loadAdminStats();
}

function toggleTeacherStatus(id) {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.id === id);
    if(idx !== -1) {
        users[idx].status = (users[idx].status === 'active' ? 'suspended' : 'active');
        localStorage.setItem('users', JSON.stringify(users));
        loadTeachersData();
    }
}

function editTeacher(id) {
    // دالة مبسطة للتعديل السريع
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const t = users.find(u => u.id === id);
    if(t) {
        const newName = prompt('تعديل الاسم:', t.name);
        if(newName) {
            t.name = newName;
            localStorage.setItem('users', JSON.stringify(users));
            loadTeachersData();
        }
    }
}

// ---------------------------------------------------------
// 4. إدارة بيانات الدخول (View & Edit Credentials)
// ---------------------------------------------------------

// أ) عرض بيانات الدخول (View Modal)
function viewTeacherCredentials(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const t = users.find(u => u.id === id);
    if(!t) return;

    // تعبئة حقول العرض
    setValue('viewTeacherId', t.id);
    setText('viewTeacherName', t.name);
    setText('viewTeacherUsername', t.username);
    setValue('viewTeacherPassword', t.password);

    // إظهار النافذة
    const modal = document.getElementById('viewCredentialsModal');
    if(modal) modal.classList.add('show');
}

// ب) الانتقال لنافذة التعديل (الدالة المفقودة Edit Modal)
function editTeacherCredentials() {
    const id = document.getElementById('viewTeacherId').value;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const t = users.find(u => u.id == id);
    
    if(!t) return;

    // إخفاء نافذة العرض
    closeModalElement('viewCredentialsModal');

    // تعبئة نافذة التعديل
    setValue('editCredTeacherId', t.id);
    setValue('editCredTeacherName', t.name); // للعرض فقط
    setValue('editCredTeacherUsername', t.username);
    setValue('editCredTeacherPassword', ''); // نتركها فارغة للكتابة

    // إظهار نافذة التعديل (مع تأخير بسيط للتأثير الحركي)
    setTimeout(() => {
        const editModal = document.getElementById('editCredentialsModal');
        if(editModal) editModal.classList.add('show');
    }, 200);
}

// ج) حفظ التعديلات (Save Credentials)
function saveTeacherCredentials() {
    const id = document.getElementById('editCredTeacherId').value;
    const newUser = document.getElementById('editCredTeacherUsername').value.trim();
    const newPass = document.getElementById('editCredTeacherPassword').value.trim();

    if(!newUser) return alert('اسم المستخدم مطلوب');

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.id == id);
    if(idx === -1) return;

    // التحقق من تكرار الاسم (مع استثناء نفس المستخدم)
    const exists = users.some(u => u.username === newUser && u.id != id);
    if(exists) return alert('اسم المستخدم محجوز');

    // التحديث
    users[idx].username = newUser;
    if(newPass && newPass.length >= 3) {
        users[idx].password = newPass;
    }

    localStorage.setItem('users', JSON.stringify(users));
    alert('تم تحديث بيانات الدخول بنجاح');
    
    closeModalElement('editCredentialsModal');
    
    // إعادة فتح نافذة العرض لرؤية التغييرات
    setTimeout(() => viewTeacherCredentials(parseInt(id)), 300);
    loadTeachersData();
}

// ---------------------------------------------------------
// 5. دوال مساعدة عامة
// ---------------------------------------------------------
function getValue(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setValue(id, val) { const el = document.getElementById(id); if(el) el.value = val; }
function setText(id, txt) { const el = document.getElementById(id); if(el) el.textContent = txt; }
function clearValue(id) { const el = document.getElementById(id); if(el) el.value = ''; }

function closeModalElement(id) {
    const m = document.getElementById(id);
    if(m) m.classList.remove('show');
}

function togglePasswordVisibility() {
    const el = document.getElementById('viewTeacherPassword');
    if(el) el.type = (el.type === 'password' ? 'text' : 'password');
}

function copyToClipboard(type) {
    let txt = '';
    if(type === 'username') txt = document.getElementById('viewTeacherUsername').innerText;
    if(type === 'password') txt = document.getElementById('viewTeacherPassword').value;
    navigator.clipboard.writeText(txt).then(() => alert('تم النسخ: ' + txt));
}

// ---------------------------------------------------------
// 6. تصدير الدوال (Global Scope)
// ---------------------------------------------------------
window.addNewTeacher = addNewTeacher;
window.deleteTeacher = deleteTeacher;
window.toggleTeacherStatus = toggleTeacherStatus;
window.editTeacher = editTeacher;
// دوال بيانات الدخول
window.viewTeacherCredentials = viewTeacherCredentials;
window.editTeacherCredentials = editTeacherCredentials; // ✅ تم إضافتها
window.saveTeacherCredentials = saveTeacherCredentials; // ✅ تم إضافتها
window.closeViewCredentialsModal = () => closeModalElement('viewCredentialsModal');
window.closeEditCredentialsModal = () => closeModalElement('editCredentialsModal');
window.togglePasswordVisibility = togglePasswordVisibility;
window.copyToClipboard = copyToClipboard;
