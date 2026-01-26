// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: إدارة الدخول (بدون بيانات تجريبية - يعتمد على حسابك الحقيقي)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // إصلاح زر الدخول تلقائياً
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        loginBtn.type = 'button';
        loginBtn.onclick = login;
    }

    // التحقق من الصلاحية في الصفحات الداخلية
    if (!window.location.href.includes('login.html') && !window.location.href.includes('index.html')) {
        if (!getCurrentUser()) {
            // إذا لم يتم التعرف على المستخدم، نعود لصفحة الدخول
            window.location.href = '../../index.html';
        }
    }
});

// ✅ دالة ذكية لجلب المستخدم الحالي (تحل مشكلة undefined)
function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('currentUser');
        if (!session) return null;

        const parsed = JSON.parse(session);
        // بعض المتصفحات تحفظه داخل property اسمها user، وبعضها مباشرة
        return parsed.user || parsed; 
    } catch (e) {
        return null;
    }
}

function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) return alert("الرجاء إدخال البيانات");

    // 1. البحث في المستخدمين الحقيقيين المسجلين سابقاً
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username == userInp && u.password == passInp);

    // 2. البحث في اللجنة
    if (!user) {
        const members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const m = members.find(m => m.username == userInp && m.password == passInp);
        if (m) user = { id: m.id, name: m.name, username: m.username, role: 'committee_member', title: m.role };
    }

    if (user) {
        // حفظ المستخدم بصيغة موحدة
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // التوجيه
        let prefix = window.location.href.includes('/auth/') ? '../' : 'pages/';
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

// تصدير الدوال لتكون متاحة لكل الملفات
window.getCurrentUser = getCurrentUser;
window.login = login;
window.logout = logout;
