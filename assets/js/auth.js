// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام المصادقة الموحد (مع تحديث المسارات)
// ============================================

function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        alert("الرجاء إدخال اسم المستخدم وكلمة المرور");
        return;
    }

    // 1. البحث في جدول المستخدمين (معلمين وطلاب)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(u => u.username === userInp && u.password === passInp);

    if (foundUser) {
        // حفظ الجلسة
        sessionStorage.setItem('currentUser', JSON.stringify({
            id: foundUser.id,
            name: foundUser.name,
            role: foundUser.role,
            teacherId: foundUser.teacherId || null,
            user: foundUser
        }));

        // التوجيه (مسارات تبدأ من المجلد الرئيسي)
        if (foundUser.role === 'admin') {
            window.location.href = 'pages/teacher/dashboard.html';
        } else {
            window.location.href = 'pages/student/dashboard.html';
        }
        return;
    }

    // 2. البحث في جدول أعضاء اللجنة (NEW)
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const foundMember = committeeMembers.find(m => m.username === userInp && m.password === passInp);

    if (foundMember) {
        // حفظ جلسة عضو اللجنة
        sessionStorage.setItem('currentUser', JSON.stringify({
            id: foundMember.id,
            name: foundMember.name,
            role: 'committee_member',
            title: foundMember.role,
            user: foundMember
        }));

        // التوجيه لبوابة الأعضاء
        window.location.href = 'pages/member/dashboard.html';
        return;
    }

    alert("بيانات الدخول غير صحيحة، يرجى التأكد من الاسم وكلمة المرور.");
}

function logout() {
    sessionStorage.removeItem('currentUser');
    // العودة للصفحة الرئيسية (تعديل المسار حسب مكان الملف الذي يتم تسجيل الخروج منه)
    // إذا كنت داخل مجلد pages/teacher/ ستعود بمستويين للخلف
    window.location.href = '../../index.html';
}

function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (!user) {
        window.location.href = '../../index.html';
    }
}
