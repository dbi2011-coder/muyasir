// ============================================
// 📁 الملف: assets/js/auth.js (نسخة الإصلاح النهائي)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. إصلاح زر الدخول في HTML تلقائياً
    const loginBtn = document.querySelector('button[onclick="login()"]');
    if(loginBtn) {
        loginBtn.type = 'button'; // منع تحديث الصفحة
        loginBtn.onclick = handleLogin; // ربط الدالة الجديدة
    }

    // 2. التحقق من وجود المستخدمين وإصلاحهم
    forceInitializeUsers();
});

// ✅ دالة الإصلاح الإجباري (تضمن وجود المعلم دائماً)
function forceInitializeUsers() {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // هل يوجد مدير/معلم؟
    const adminExists = users.some(u => u.username === 'admin');

    if (!adminExists) {
        console.log("⚠️ لم يتم العثور على المعلم! جاري الإنشاء...");
        users.push({
            id: 1,
            name: 'الأستاذ صالح العجلان',
            username: 'admin',
            password: '123', // كلمة المرور الموحدة
            role: 'admin',
            status: 'active'
        });
        localStorage.setItem('users', JSON.stringify(users));
        console.log("✅ تم إصلاح حساب المعلم: admin / 123");
    }
}

function handleLogin(event) {
    if(event) event.preventDefault();

    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        alert("الرجاء إدخال البيانات");
        return;
    }

    // 1. البحث في جدول المستخدمين (المعلم / الطلاب)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username === userInp && u.password === passInp);

    // 2. البحث في جدول أعضاء اللجنة
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        if (member) {
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee_member',
                title: member.role
            };
        }
    }

    // 3. نتيجة البحث
    if (user) {
        // حفظ الجلسة
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // التوجيه حسب الصلاحية
        if (user.role === 'admin') {
            window.location.href = 'pages/teacher/dashboard.html';
        } else if (user.role === 'committee_member') {
            window.location.href = 'pages/member/dashboard.html';
        } else {
            window.location.href = 'pages/student/dashboard.html';
        }
    } else {
        alert("بيانات الدخول غير صحيحة.\nللمعلم جرب: admin / 123");
    }
}

// دالة تسجيل الخروج
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

// التحقق من الصلاحية (يوضع في صفحات لوحة التحكم)
function checkAuth() {
    if (!sessionStorage.getItem('currentUser')) {
        window.location.href = '../../index.html';
    }
}
