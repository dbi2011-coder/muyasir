// ============================================
// 📁 المسار: assets/js/auth.js
// الوصف: نظام المصادقة والتوجيه (تم إصلاح مسار المدير)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initSystem();
});

// 1. تهيئة النظام وإنشاء حساب المدير الافتراضي
function initSystem() {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // التأكد من وجود حساب المدير (Admin)
    const adminExists = users.some(u => u.role === 'admin');
    if (!adminExists) {
        const defaultAdmin = {
            id: 1,
            name: "مدير النظام",
            username: "admin",
            password: "123", // كلمة مرور المدير
            role: "admin",
            status: "active"
        };
        users.push(defaultAdmin);
        localStorage.setItem('users', JSON.stringify(users));
        console.log("✅ تم استعادة حساب المدير (admin/123)");
    }
}

// 2. دالة تسجيل الدخول (Login) مع التوجيه الصحيح
function login(username, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        if (user.status === 'suspended' || user.status === 'inactive') {
            alert('⛔ هذا الحساب موقوف أو غير نشط. يرجى مراجعة الإدارة.');
            return;
        }

        // حفظ الجلسة
        const sessionData = { user: user, loginTime: new Date().toISOString() };
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));

        // 🔥 هنا الإصلاح: توجيه كل دور لصفحته الخاصة
        switch(user.role) {
            case 'admin':
                // توجيه المدير إلى مجلد admin
                window.location.href = '../admin/dashboard.html';
                break;
            case 'teacher':
                // توجيه المعلم إلى مجلد teacher
                window.location.href = '../teacher/dashboard.html';
                break;
            case 'student':
                // توجيه الطالب
                window.location.href = '../student/dashboard.html';
                break;
            default:
                alert('عذراً، لا توجد لوحة تحكم مخصصة لهذا الدور!');
        }
    } else {
        alert('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
    }
}

// 3. التحقق من الصلاحية (Check Auth)
function checkAuth() {
    const sessionStr = sessionStorage.getItem('currentUser');
    if (!sessionStr) {
        // إذا لم يكن مسجلاً، أعده لصفحة الدخول
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

// أدوات مساعدة للإشعارات (تستخدم في admin.js و teacher.js)
function showAuthNotification(message, type = 'info') {
    const div = document.createElement('div');
    div.className = `auth-notification ${type}`;
    div.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        padding: 15px 30px; border-radius: 8px; color: white; font-weight: bold;
        z-index: 9999; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
    `;
    div.innerText = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// تصدير الدوال
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
window.showAuthNotification = showAuthNotification;
