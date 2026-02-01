// ============================================
// 📁 الملف: assets/js/admin.js
// الوصف: لوحة المدير (إصلاح الأخطاء وضمان الـ ID الفريد)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من الصلاحية
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        window.location.href = '../../index.html';
        return;
    }
    
    // 2. تشغيل الدوال فقط إذا كانت العناصر موجودة (لمنع خطأ null)
    if (document.getElementById('totalTeachers')) loadAdminStats();
    if (document.getElementById('teachersTableBody')) loadTeachersList();
});

// عرض الإحصائيات (مع حماية ضد الأخطاء)
function loadAdminStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teachersCount = users.filter(u => u.role === 'teacher').length;
    const studentsCount = users.filter(u => u.role === 'student').length;

    // 🔥 الحماية: التأكد من وجود العنصر قبل الكتابة فيه
    const tEl = document.getElementById('totalTeachers');
    const sEl = document.getElementById('totalStudents');

    if (tEl) tEl.textContent = teachersCount;
    if (sEl) sEl.textContent = studentsCount;
}

// عرض قائمة المعلمين
function loadTeachersList() {
    const tbody = document.getElementById('teachersTableBody');
    if (!tbody) return; // حماية

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teachers = users.filter(u => u.role === 'teacher');

    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">لا يوجد معلمون</td></tr>';
        return;
    }

    tbody.innerHTML = teachers.map((teacher, index) => {
        // حساب عدد طلاب هذا المعلم (للتأكد من العزل)
        const myStudents = users.filter(u => u.role === 'student' && u.teacherId == teacher.id).length;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${teacher.name}</td>
                <td>${teacher.username}</td>
                <td>${teacher.password}</td>
                <td>${myStudents}</td> <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

// إضافة معلم جديد
function addNewTeacher() {
    const name = document.getElementById('newTeacherName').value.trim();
    const username = document.getElementById('newTeacherUsername').value.trim();
    const password = document.getElementById('newTeacherPassword').value.trim();

    if (!name || !username || !password) {
        // استخدام الدالة الموجودة في auth.js الآن
        if(typeof showAuthNotification === 'function') showAuthNotification('يرجى تعبئة الحقول', 'error');
        else alert('يرجى تعبئة الحقول');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.some(u => u.username === username)) {
        if(typeof showAuthNotification === 'function') showAuthNotification('اسم المستخدم موجود مسبقاً', 'error');
        else alert('اسم المستخدم موجود مسبقاً');
        return;
    }

    // 🔥 إنشاء المعلم مع ID فريد (أساس العزل)
    const newTeacher = {
        id: Date.now(), // هذا الرقم هو الذي سيفصل بياناته عن غيره
        role: 'teacher',
        name: name,
        username: username,
        password: password,
        createdAt: new Date().toISOString()
    };

    users.push(newTeacher);
    localStorage.setItem('users', JSON.stringify(users));

    if(typeof showAuthNotification === 'function') showAuthNotification('تمت الإضافة بنجاح', 'success');
    else alert('تمت الإضافة بنجاح');

    // إغلاق النافذة (حسب المتاح)
    if (document.getElementById('addTeacherModal')) {
        document.getElementById('addTeacherModal').classList.remove('show');
    }
    
    // تحديث البيانات
    loadTeachersList();
    loadAdminStats();
    
    // تفريغ الحقول
    document.getElementById('newTeacherName').value = '';
    document.getElementById('newTeacherUsername').value = '';
    document.getElementById('newTeacherPassword').value = '';
}

function deleteTeacher(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المعلم؟ سيتم حذف جميع طلابه أيضاً.')) return;

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // حذف المعلم
    users = users.filter(u => u.id !== id);
    
    // حذف طلاب المعلم أيضاً (للحفاظ على نظافة البيانات)
    users = users.filter(u => !(u.role === 'student' && u.teacherId == id));

    localStorage.setItem('users', JSON.stringify(users));

    loadTeachersList();
    loadAdminStats();
    if(typeof showAuthNotification === 'function') showAuthNotification('تم الحذف بنجاح', 'success');
}

// تصدير الدوال
window.addNewTeacher = addNewTeacher;
window.deleteTeacher = deleteTeacher;
