// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول الذكي (يصلح تعارض البيانات القديمة والجديدة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. إصلاح زر الدخول تلقائياً
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        loginBtn.type = 'button';
        loginBtn.onclick = login;
    }

    // 2. التحقق من المستخدم في الصفحات الداخلية
    // (نتأكد أننا لسنا في صفحة الدخول أو الرئيسية)
    if (!window.location.href.includes('login.html') && !window.location.href.includes('index.html')) {
        const user = getCurrentUser();
        if (!user) {
            // لم نجد مستخدم، نرجع للدخول
            window.location.href = '../../index.html';
        }
    }
});

// ✅ الدالة الذكية لجلب المستخدم (تحل مشكلة undefined)
function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('currentUser');
        if (!session) return null;

        const parsed = JSON.parse(session);

        // الصيغة الجديدة: { user: {id: ...} }
        if (parsed.user && parsed.user.id) {
            return parsed.user;
        }
        
        // الصيغة القديمة: { id: ... } (نقوم بإصلاحها تلقائياً)
        if (parsed.id && parsed.username) {
            sessionStorage.setItem('currentUser', JSON.stringify({ user: parsed }));
            return parsed;
        }

        return null;
    } catch (e) {
        console.error("خطأ في قراءة الجلسة:", e);
        return null;
    }
}

function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) return alert("الرجاء إدخال البيانات");

    // 1. البحث في المستخدمين (المدير/المعلم/الطالب)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username == userInp && u.password == passInp);

    // 2. البحث في اللجنة (إذا لم نجد سابقاً)
    if (!user) {
        const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const m = members.find(m => m.username == userInp && m.password == passInp);
        if (m) user = { id: m.id, name: m.name, username: m.username, role: 'committee_member', title: m.role };
    }

    if (user) {
        // حفظ بصيغة موحدة
        sessionStorage.setItem('currentUser', JSON.stringify({ user: user }));
        
        // التوجيه الصحيح
        let prefix = window.location.href.includes('/auth/') ? '../' : 'pages/';
        // تصحيح المسار إذا كنا في الجذر
        if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) prefix = 'pages/';

        if (user.role === 'admin' || user.role === 'teacher') window.location.href = prefix + 'teacher/dashboard.html';
        else if (user.role === 'committee_member') window.location.href = prefix + 'member/dashboard.html';
        else window.location.href = prefix + 'student/dashboard.html';
    } else {
        alert("بيانات الدخول غير صحيحة!");
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

// تصدير الدوال
window.getCurrentUser = getCurrentUser;
window.login = login;
window.logout = logout;
