// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول الأساسي + دعم عضو اللجنة (تم إصلاح المدير)
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

    // 1. البحث في المستخدمين الأساسيين (المعلم / الطلاب / المدير)
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 🔥 إصلاح المدير: التأكد من وجود حساب المدير في القائمة
    if (!users.some(u => u.role === 'admin')) {
        // إذا لم يكن المدير موجوداً، ننشئه مؤقتاً للتحقق
        users.push({
            id: 1, name: "مدير النظام", username: "admin", password: "123", role: "admin"
        });
        // (اختياري: يمكننا حفظه في localStorage لضمان بقائه)
        localStorage.setItem('users', JSON.stringify(users));
    }

    let user = users.find(u => u.username == userInp && u.password == passInp);

    // 2. === البحث في أعضاء اللجنة (كما في النسخة السابقة تماماً) ===
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        
        if (member) {
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee_member', // الدور كما هو في النسخة السابقة
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
        if (user.role === 'admin') {
            // ✅ إصلاح توجيه المدير: يذهب للوحة المدير
            window.location.href = prefix + 'admin/dashboard.html';
        } else if (user.role === 'teacher') {
            window.location.href = prefix + 'teacher/dashboard.html';
        } else if (user.role === 'committee_member') {
            // ✅ توجيه عضو اللجنة (لم نغيره، بقي كما كان)
            window.location.href = prefix + 'member/dashboard.html'; 
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
