// ============================================
// 📁 المسار: assets/js/auth.js
// الوصف: نظام المصادقة الموحد (مدير، معلم، لجنة) - النسخة المصلحة
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // عند تحميل الصفحة، تأكد من وجود البيانات الأساسية
    initSystem();
    
    // ربط نموذج تسجيل الدخول بالدالة إذا كنا في صفحة الدخول
    const loginBtn = document.querySelector('button[onclick="login()"]'); // محاولة للعثور على الزر القديم
    if (!loginBtn) {
        // إذا كان النموذج يستخدم ID
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', login);
        }
    }
});

// 1. تهيئة النظام وإنشاء المستخدمين الافتراضيين
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
        console.log("✅ تم إنشاء حساب المدير: admin / 123");
        dataChanged = true;
    }

    // ب) التأكد من وجود "عضو لجنة" (الطلب الجديد)
    if (!users.some(u => u.role === 'committee')) {
        users.push({
            id: 99, 
            name: "عضو اللجنة", 
            username: "comm", 
            password: "123", 
            role: "committee", 
            status: "active"
        });
        console.log("✅ تم إنشاء حساب عضو اللجنة: comm / 123");
        dataChanged = true;
    }

    if (dataChanged) {
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// 2. دالة تسجيل الدخول (مع حل مشكلة التحديث والمسارات)
function login(event) {
    // 🔥 منع تحديث الصفحة (هذا هو الحل لمشكلة مسح البيانات)
    if (event) event.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    // التحقق من وجود الحقول
    if (!usernameInput || !passwordInput) {
        console.error("حقول اسم المستخدم أو كلمة المرور غير موجودة!");
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('يرجى إدخال اسم المستخدم وكلمة المرور');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // البحث عن المستخدم (بدون حساسية لحالة الأحرف)
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (user) {
        // التحقق من حالة الحساب
        if (user.status === 'suspended' || user.status === 'inactive') {
            alert('⛔ هذا الحساب موقوف، يرجى مراجعة الإدارة.');
            return;
        }

        // حفظ الجلسة
        const sessionData = { user: user, loginTime: new Date().toISOString() };
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));

        // 🔥 نظام التوجيه الذكي (Routing)
        // نحدد المسار بناءً على مكاننا الحالي (هل نحن في الرئيسية أم في صفحة داخلية؟)
        let basePath = '';
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
            basePath = 'pages/'; // نحن في الصفحة الرئيسية
        } else if (window.location.pathname.includes('/pages/')) {
            basePath = '../'; // نحن داخل مجلد pages ونريد التبديل
        } else {
            basePath = 'pages/'; // احتياط
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
            case 'committee':
                // ✅ تمت إضافة توجيه عضو اللجنة
                window.location.href = basePath + 'committee/dashboard.html';
                break;
            default:
                alert('عذراً، دور المستخدم غير معروف!');
        }

    } else {
        alert('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
    }
}

// 3. التحقق من الصلاحية (للاستخدام داخل الصفحات)
function checkAuth() {
    const sessionStr = sessionStorage.getItem('currentUser');
    
    if (!sessionStr) {
        // إذا لم يكن مسجلاً، أعد توجيهه لصفحة الدخول
        // نتأكد ألا نقوم بالتوجيه إذا كنا أصلاً في صفحة الدخول
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

// أدوات مساعدة
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
