// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول الأساسي + دعم عضو اللجنة
// ============================================

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // 1. ربط زر الدخول (لمنع تحديث الصفحة)
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        loginBtn.type = 'button';
        loginBtn.onclick = login;
    }
    
    // 2. التحقق من الجلسة (إلا في صفحة الدخول والرئيسية)
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// دالة تسجيل الدخول
function login() {
    // جلب البيانات من الحقول
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        alert("الرجاء إدخال البيانات");
        return;
    }

    // 1. البحث في المستخدمين الأساسيين (المعلم / الطلاب)
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username == userInp && u.password == passInp);

    // 2. === (الجديد) البحث في أعضاء اللجنة ===
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        
        if (member) {
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee_member', // الدور الجديد
                title: member.role
            };
        }
    }

    // 3. التوجيه حسب الصلاحية
    if (user) {
        // حفظ المستخدم في الجلسة
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // تحديد المسار الصحيح (مع مراعاة مكان الملف الحالي)
        let prefix = '';
        if (window.location.href.includes('/pages/')) {
            prefix = '../'; // نحن داخل مجلد فرعي
        } else {
            prefix = 'pages/'; // نحن في الجذر
        }

        // التوجيه
        if (user.role === 'admin' || user.role === 'teacher') {
            window.location.href = prefix + 'teacher/dashboard.html';
        } else if (user.role === 'committee_member') {
            window.location.href = prefix + 'member/dashboard.html'; // سننشئ هذه الصفحة في الخطوة القادمة
        } else {
            window.location.href = prefix + 'student/dashboard.html';
        }
    } else {
        alert("بيانات الدخول غير صحيحة!");
    }
}

// دالة التحقق من الصلاحية
function checkAuth() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) {
        window.location.href = '../../index.html';
        return null;
    }
    return JSON.parse(session);
}

// دالة تسجيل الخروج
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

// دالة مساعدة لجلب المستخدم الحالي
function getCurrentUser() {
    const session = sessionStorage.getItem('currentUser');
    return session ? JSON.parse(session) : null;
}

// تصدير الدوال لتكون متاحة للنظام
window.login = login;
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
