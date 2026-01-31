// ============================================
// 📁 المسار: assets/js/auth.js
// الوصف: نظام المصادقة (تم إصلاح المسارات ومنع التحديث)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initSystem();
});

// 1. تهيئة النظام
function initSystem() {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // التأكد من وجود المدير
    if (!users.some(u => u.role === 'admin')) {
        users.push({
            id: 1, name: "مدير النظام", username: "admin", password: "123", role: "admin", status: "active"
        });
        localStorage.setItem('users', JSON.stringify(users));
        console.log("✅ تم إنشاء المدير (admin/123)");
    }
}

// 2. دالة تسجيل الدخول
function login(event) {
    // 🔥 منع تحديث الصفحة عند الضغط
    if(event) event.preventDefault();

    const usernameInput = document.getElementById('username'); // تأكد أن id الحقل هو username
    const passwordInput = document.getElementById('password'); // تأكد أن id الحقل هو password
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        if (user.status === 'suspended' || user.status === 'inactive') {
            alert('⛔ الحساب موقوف أو غير نشط');
            return;
        }

        // حفظ الجلسة
        const sessionData = { user: user, loginTime: new Date().toISOString() };
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));

        // 🔥 إصلاح المسارات: التوجيه من الصفحة الرئيسية (index.html)
        // نتحقق أولاً هل نحن داخل مجلد pages أم في الجذر
        let basePath = 'pages/';
        if (window.location.pathname.includes('/pages/')) {
            basePath = '../'; // إذا كنا في صفحة فرعية ونريد الانتقال لصفحة أخرى
        }

        switch(user.role) {
            case 'admin':
                window.location.href = basePath + 'admin/dashboard.html';
                break;
            case 'teacher':
                window.location.href = basePath + 'teacher/dashboard.html';
                break;
            case 'student':
                window.location.href = basePath + 'student/dashboard.html';
                break;
            case 'committee':
                window.location.href = basePath + 'committee/dashboard.html';
                break;
            default:
                alert('لا توجد لوحة تحكم لهذا الدور');
        }
    } else {
        alert('❌ اسم المستخدم أو كلمة المرور خطأ');
    }
}

// 3. التحقق من الصلاحية
function checkAuth() {
    const sessionStr = sessionStorage.getItem('currentUser');
    if (!sessionStr) {
        // إذا لم يكن مسجلاً، أعده للصفحة الرئيسية
        if (window.location.href.includes('/pages/')) {
            window.location.href = '../../index.html'; 
        }
        return null;
    }
    return JSON.parse(sessionStr).user;
}

// 4. خروج
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

// أدوات مساعدة
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
