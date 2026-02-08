// ============================================
// 📁 الملف: assets/js/admin.js
// الوصف: لوحة تحكم المدير (إدارة المعلمين + الطلاب)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التحقق من الصلاحية (اختياري)
    // const user = getAdminSession();
    // if (!user || user.role !== 'admin') { window.location.href = '../../index.html'; }

    // 2. تحديث الاسم في الهيدر
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if(document.getElementById('userName') && user.name) {
        document.getElementById('userName').textContent = user.name;
    }

    // 3. التوجيه حسب الصفحة المفتوحة
    if (document.getElementById('teachersTableBody')) loadTeachersData();
    if (document.getElementById('studentsTableBody')) loadStudentsData(); // ✅ هذا السطر كان ناقصاً
    if (document.getElementById('teachersCount')) loadAdminStats();
});

// ---------------------------------------------------------
// 1. إدارة المعلمين (الكود السابق كما هو)
// ---------------------------------------------------------
function loadTeachersData() {
    const tableBody = document.getElementById('teachersTableBody');
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');

    if (!tableBody) return;
    if (loading) loading.style.display = 'none'; // إخفاء التحميل

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
        const statusBadge = isActive 
            ? '<span class="badge bg-success" style="color:white;">نشط</span>' 
            : '<span class="badge bg-danger" style="color:white;">موقوف</span>';
            
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${teacher.name}</td>
                <td>${teacher.username}</td>
                <td>${teacher.phone || '-'}</td>
                <td>${sCount}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editTeacher(${teacher.id})">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${teacher.id})">حذف</button>
                    <button class="btn btn-sm btn-dark" onclick="exportTeacherData(${teacher.id})">تصدير</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ---------------------------------------------------------
// 2. 🔥 إدارة الطلاب (الكود الجديد المضاف)
// ---------------------------------------------------------
function loadStudentsData() {
    const tableBody = document.getElementById('studentsTableBody');
    // محاولة إخفاء عناصر التحميل إن وجدت
    const loading = document.querySelector('.loading-state') || document.getElementById('loadingState');
    const empty = document.querySelector('.empty-state') || document.getElementById('emptyState');

    if (!tableBody) return;
    if (loading) loading.style.display = 'none';

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student');

    if (students.length === 0) {
        if (empty) empty.style.display = 'block';
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد طلاب مضافين حالياً</td></tr>';
        return;
    }
    if (empty) empty.style.display = 'none';

    tableBody.innerHTML = students.map((student, index) => {
        // البحث عن اسم المعلم المرتبط بالطالب
        const teacher = users.find(u => u.id == student.teacherId);
        const teacherName = teacher ? teacher.name : '<span class="text-muted">غير محدد</span>';
        const isActive = student.status !== 'suspended';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div style="font-weight:bold;">${student.name}</div>
                    <div class="text-muted small">${student.username}</div>
                </td>
                <td>${student.grade || '-'}</td>
                <td>${teacherName}</td>
                <td>
                    ${isActive 
                        ? '<span class="badge bg-success" style="color:white">نشط</span>' 
                        : '<span class="badge bg-danger" style="color:white">موقوف</span>'}
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="window.location.href='student-profile.html?id=${student.id}'">
                        👤 الملف
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editStudent(${student.id})">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${student.id})">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ---------------------------------------------------------
// 3. دوال عامة (للمعلمين والطلاب)
// ---------------------------------------------------------

// دالة حذف موحدة
function deleteUser(id) {
    if(!confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
    
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.filter(u => u.id != id);
    localStorage.setItem('users', JSON.stringify(users));
    
    // تحديث الجدول الموجود حالياً
    if (document.getElementById('teachersTableBody')) loadTeachersData();
    if (document.getElementById('studentsTableBody')) loadStudentsData();
    loadAdminStats();
    
    alert('تم الحذف بنجاح');
}

// دالة إحصائيات المدير
function loadAdminStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const tCount = users.filter(u => u.role === 'teacher').length;
    const sCount = users.filter(u => u.role === 'student').length;

    if(document.getElementById('teachersCount')) document.getElementById('teachersCount').textContent = tCount;
    if(document.getElementById('studentsCount')) document.getElementById('studentsCount').textContent = sCount;
}

// تصدير الدوال للاستخدام في HTML
window.loadTeachersData = loadTeachersData;
window.loadStudentsData = loadStudentsData;
window.deleteUser = deleteUser;
