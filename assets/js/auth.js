// ============================================
// 📁 المسار: assets/js/auth.js
// الوصف: نظام المصادقة الموحد (يضمن عمل جميع الأدوار)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initSystem();
});

// 1. تهيئة النظام وإنشاء الحسابات المفقودة
function initSystem() {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    let dataChanged = false;

    // أ) التأكد من وجود "مدير النظام" (المالك)
    if (!users.some(u => u.role === 'admin')) {
        users.push({
            id: 1, 
            name: "مدير النظام", 
            username: "admin", 
            password: "123", 
            role: "admin", 
            status: "active"
        });
        console.log("✅ تم إنشاء حساب المدير: admin");
        dataChanged = true;
    }

    // ب) التأكد من وجود "عضو اللجنة" (هذا ما كان مفقوداً)
    if (!users.some(u => u.role === 'committee')) {
        users.push({
            id: 99, 
            name: "عضو لجنة الصعوبات", 
            username: "comm", 
            password: "123", 
            role: "committee", 
            status: "active"
        });
        console.log("✅ تم إنشاء حساب عضو اللجنة: comm");
        dataChanged = true;
    }

    if (dataChanged) {
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// 2. دالة تسجيل الدخول
function login(event) {
    if (event) event.preventDefault(); // منع تحديث الصفحة

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // البحث عن المستخدم
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (user) {
        if (user.status === 'suspended') {
            alert('⛔ هذا الحساب موقوف');
            return;
        }

        // حفظ الجلسة
        sessionStorage.setItem('currentUser', JSON.stringify({ user: user, loginTime: new Date().toISOString() }));

        // تحديد المسار الصحيح (Routing)
        let basePath = 'pages/';
        // إذا كنا داخل مجلد فرعي (مثل pages/teacher)، نعود للخلف
        if (window.location.pathname.includes('/pages/')) {
            basePath = '../'; 
        }

        // التوجيه حسب الصلاحية
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
            case 'committee': // ✅ تم إعادة تفعيل توجيه اللجنة
                window.location.href = basePath + 'committee/dashboard.html';
                break;
            default:
                alert('لا توجد لوحة تحكم لهذا الدور');
        }
    } else {
        alert('❌ اسم المستخدم أو كلمة المرور خاطئة');
    }
}

// 3. التحقق من الصلاحية (للاستخدام داخل الصفحات)
function checkAuth() {
    const sessionStr = sessionStorage.getItem('currentUser');
    if (!sessionStr) {
        if (window.location.href.includes('/pages/')) {
            window.location.href = '../../index.html'; 
        }
        return null;
    }
    return JSON.parse(sessionStr).user;
}

// 4. تسجيل الخروج
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

// تصدير الدوال
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
