// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول الموحد (إصلاح مشكلة التحديث)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 🛠️ إصلاح تلقائي: تحويل زر الدخول لمنع تحديث الصفحة
    // يبحث عن أي زر يحتوي على دالة login() ويحوله إلى زر عادي
    const loginBtn = document.querySelector('button[onclick="login()"]');
    if(loginBtn) {
        loginBtn.setAttribute('type', 'button'); 
    }
    
    // التأكد من وجود حساب المعلم (المدير) دائماً
    ensureAdminExists();
});

function login() {
    // 1. جلب البيانات
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    // منع الدخول ببيانات فارغة
    if (!userInp || !passInp) {
        alert("الرجاء إدخال اسم المستخدم وكلمة المرور");
        return;
    }

    // 2. البحث في جدول المستخدمين الأساسيين (المعلم / الطلاب)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username === userInp && u.password === passInp);

    // 3. إذا لم نجده، نبحث في جدول أعضاء اللجنة (الميزة الجديدة)
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        
        if (member) {
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee_member', // دور خاص للعضو
                title: member.role
            };
        }
    }

    // 4. التوجيه حسب الصلاحية
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        if (user.role === 'admin') {
            window.location.href = 'pages/teacher/dashboard.html';
        } else if (user.role === 'committee_member') {
            window.location.href = 'pages/member/dashboard.html';
        } else {
            window.location.href = 'pages/student/dashboard.html';
        }
    } else {
        alert("بيانات الدخول غير صحيحة! \n(للمعلم جرب: admin / 123)");
    }
}

// دالة لضمان وجود حساب المدير (المعلم) حتى لو تم مسح البيانات
function ensureAdminExists() {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    if (!users.some(u => u.role === 'admin')) {
        users.push({
            id: 1,
            name: 'الأستاذ صالح العجلان',
            username: 'admin',
            password: '123',
            role: 'admin'
        });
        localStorage.setItem('users', JSON.stringify(users));
        console.log("تم استعادة حساب المدير الافتراضي: admin / 123");
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function checkAuth() {
    if (!sessionStorage.getItem('currentUser')) {
        // إذا كنا داخل مجلد صفحات، نعود للخلف مرتين
        if (window.location.href.includes('/pages/')) {
            window.location.href = '../../index.html';
        } else {
            // إذا كنا في الجذر
            window.location.href = 'index.html';
        }
    }
}
