// ============================================
// 📁 الملف: assets/js/teacher.js
// الوصف: إدارة مهام المعلم (عرض الطلاب المسندين له فقط)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. جلب بيانات المعلم الحالي من الجلسة
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // التحقق من الصلاحية (اختياري لكن مفضل)
    if (!currentUser || currentUser.role !== 'teacher') {
        console.warn('تنبيه: المستخدم الحالي ليس معلماً');
        // يمكن تفعيل التوجيه للخروج إذا أردت
        // window.location.href = '../../index.html';
    }

    // 2. تحديث اسم المعلم في أعلى الصفحة
    if (currentUser && document.getElementById('teacherName')) {
        document.getElementById('teacherName').textContent = currentUser.name;
    }

    // 3. إذا كنا في صفحة الطلاب، شغل دالة الجلب
    if (document.getElementById('myStudentsTable')) {
        loadMyStudents(currentUser ? currentUser.id : null);
    }
});

function loadMyStudents(teacherId) {
    const tableBody = document.getElementById('myStudentsTable');
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');

    // التأكد من وجود العناصر قبل العمل عليها
    if (!tableBody) return;

    // إذا لم يكن هناك معرف معلم (خطأ في الدخول)، نخفي التحميل ونخرج
    if (!teacherId) {
        if(loading) loading.style.display = 'none';
        return;
    }

    // 1. جلب كافة المستخدمين من قاعدة البيانات المحلية
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 2. 🔥 الفلترة: استخراج الطلاب المرتبطين بهذا المعلم فقط
    // الشرط: الدور = طالب AND معرف المعلم = معرفي
    const myStudents = allUsers.filter(u => u.role === 'student' && u.teacherId == teacherId);

    // 3. ✅ الخطوة الأهم: إخفاء مؤشر التحميل فوراً
    if(loading) loading.style.display = 'none';

    // 4. معالجة حالة عدم وجود طلاب
    if (myStudents.length === 0) {
        if(empty) empty.style.display = 'block';
        tableBody.innerHTML = '';
        return;
    }

    // 5. إخفاء رسالة الفراغ وعرض الجدول
    if(empty) empty.style.display = 'none';

    // 6. رسم الجدول
    tableBody.innerHTML = myStudents.map((student, index) => {
        return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div style="font-weight:bold;">${student.name}</div>
                    <div style="font-size:0.85em; color:#666;">${student.username}</div>
                </td>
                <td>${student.grade || 'غير محدد'}</td>
                <td>${student.subject || 'عام'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.location.href='student-profile.html?id=${student.id}'">
                        <i class="fas fa-file-alt"></i> الملف والخطة
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// تصدير الدالة لتكون متاحة (في حال الاحتياج)
window.loadMyStudents = loadMyStudents;
