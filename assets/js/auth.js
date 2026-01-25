// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول الموحد (يمنع تحديث الصفحة ويدعم اللجنة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // ✅ إصلاح تلقائي: تحويل زر الدخول لمنع تحديث الصفحة
    const loginBtn = document.querySelector('button[onclick="login()"]');
    if(loginBtn) {
        loginBtn.type = 'button'; // هذا السطر يمنع المسح
    }
});

function login() {
    // 1. جلب البيانات
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        alert("الرجاء إدخال اسم المستخدم وكلمة المرور");
        return;
    }

    // 2. البحث في المستخدمين الأساسيين (المعلم / الطلاب)
    // المصدر: users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username === userInp && u.password === passInp);

    // 3. إذا لم نجده، نبحث في أعضاء اللجنة (الميزة الجديدة)
    if (!user) {
        // المصدر: committeeMembers
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        
        if (member) {
            // تجهيز بيانات العضو
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee_member', // دور خاص
                title: member.role
            };
        }
    }

    // 4. التوجيه حسب الصلاحية
    if (user) {
        // حفظ الجلسة
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        if (user.role === 'admin') {
            window.location.href = 'pages/teacher/dashboard.html';
        } else if (user.role === 'committee_member') {
            window.location.href = 'pages/member/dashboard.html'; // بوابة العضو الجديدة
        } else {
            window.location.href = 'pages/student/dashboard.html';
        }
    } else {
        alert("بيانات الدخول غير صحيحة! (للمعلم جرب: admin / 123)");
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function checkAuth() {
    if (!sessionStorage.getItem('currentUser')) {
        window.location.href = '../../index.html';
    }
}
