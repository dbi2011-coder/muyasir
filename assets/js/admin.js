// ============================================
// 📁 الملف: assets/js/admin.js
// الوصف: لوحة تحكم المدير (إصلاح الأزرار + عزل البيانات)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من أن المستخدم هو المدير
    checkAdminAccess();

    // 2. تحميل البيانات (فقط إذا كانت العناصر موجودة في الصفحة)
    if (document.getElementById('teachersTableBody')) {
        loadTeachersList();
    }
    
    if (document.getElementById('totalTeachers')) {
        loadAdminStats();
    }
});

// دالة التحقق من الصلاحية
function checkAdminAccess() {
    let user = null;
    try {
        user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    } catch (e) { console.error(e); }

    // إذا لم يكن مسجلاً أو ليس مديراً، أخرجه
    if (!user || user.role !== 'admin') {
        window.location.href = '../../index.html';
    }
}

// عرض قائمة المعلمين (مع الأزرار المفقودة)
function loadTeachersList() {
    const tbody = document.getElementById('teachersTableBody');
    if (!tbody) return;

    // جلب البيانات
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teachers = users.filter(u => u.role === 'teacher');

    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">لا يوجد معلمون مضافون حالياً</td></tr>';
        return;
    }

    // بناء الجدول
    tbody.innerHTML = teachers.map((teacher, index) => {
        // حساب عدد طلاب هذا المعلم
        const studentCount = users.filter(u => u.role === 'student' && u.teacherId == teacher.id).length;

        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${teacher.name}</strong></td>
                <td>${teacher.username}</td>
                <td>${teacher.password}</td>
                <td style="text-align:center;">${studentCount}</td>
                <td>
                    <div class="action-buttons" style="display:flex; gap:5px; justify-content:center;">
                        <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})" title="حذف المعلم">
                            حذف 🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// عرض الإحصائيات (محمي ضد الأخطاء)
function loadAdminStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const teachersCount = users.filter(u => u.role === 'teacher').length;
    const studentsCount = users.filter(u => u.role === 'student').length;

    // التحقق من وجود العنصر قبل تعديله لمنع خطأ (null)
    const tEl = document.getElementById('totalTeachers');
    const sEl = document.getElementById('totalStudents');

    if (tEl) tEl.textContent = teachersCount;
    if (sEl) sEl.textContent = studentsCount;
}

// إضافة معلم جديد (مع ID فريد للعزل)
function addNewTeacher() {
    const nameInp = document.getElementById('newTeacherName');
    const userInp = document.getElementById('newTeacherUsername');
    const passInp = document.getElementById('newTeacherPassword');

    if (!nameInp || !userInp || !passInp) return;

    const name = nameInp.value.trim();
    const username = userInp.value.trim();
    const password = passInp.value.trim();

    if (!name || !username || !password) {
        alert('يرجى تعبئة جميع الحقول');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // التحقق من تكرار اسم المستخدم
    if (users.some(u => u.username === username)) {
        alert('اسم المستخدم موجود مسبقاً، اختر اسماً آخر');
        return;
    }

    // إنشاء المعلم (ID يعتمد على الوقت لضمان عدم التكرار)
    const newTeacher = {
        id: Date.now(), 
        role: 'teacher',
        name: name,
        username: username,
        password: password,
        createdAt: new Date().toISOString()
    };

    users.push(newTeacher);
    localStorage.setItem('users', JSON.stringify(users));

    alert('تم إضافة المعلم بنجاح ✅');

    // إغلاق النافذة وتحديث الجدول
    const modal = document.getElementById('addTeacherModal');
    if (modal) modal.classList.remove('show');

    // تفريغ الحقول
    nameInp.value = '';
    userInp.value = '';
    passInp.value = '';

    loadTeachersList();
    loadAdminStats();
}

// حذف معلم (مع حذف طلابه لضمان نظافة البيانات)
function deleteTeacher(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المعلم؟\n⚠️ سيتم حذف جميع الطلاب المرتبطين به أيضاً!')) {
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '[]');

    // 1. حذف المعلم
    const initialLength = users.length;
    users = users.filter(u => u.id !== id);

    // 2. حذف طلاب هذا المعلم (تنظيف البيانات المعزولة)
    users = users.filter(u => !(u.role === 'student' && u.teacherId == id));

    if (users.length < initialLength) {
        localStorage.setItem('users', JSON.stringify(users));
        alert('تم الحذف بنجاح');
        loadTeachersList();
        loadAdminStats();
    }
}

// تصدير الدوال لتكون متاحة لملف HTML
window.addNewTeacher = addNewTeacher;
window.deleteTeacher = deleteTeacher;
