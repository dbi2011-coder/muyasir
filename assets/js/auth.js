// ============================================
// 📁 المسار: assets/js/auth.js
// الوصف: نظام المصادقة الشامل (4 أدوار: مدير، لجنة، معلم، طالب)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. تهيئة بيانات النظام وإنشاء الحسابات الافتراضية
    initSystem();

    // 2. محاولة ربط زر الدخول تلقائياً (لحل مشكلة التحديث)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // منع تحديث الصفحة
            login(e);
        });
    }
    
    // ربط الزر إذا كان خارج الفورم
    const loginBtn = document.getElementById('loginBtn'); // تأكد من وجود id للزر إذا لم يكن داخل فورم
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            login(e);
        });
    }
});

// --- 1. تهيئة النظام وإنشاء الحسابات ---
function initSystem() {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    let dataChanged = false;

    // 1. إنشاء المدير (Admin)
    if (!users.some(u => u.role === 'admin')) {
        users.push({
            id: 1, name: "مدير النظام", username: "admin", password: "123", role: "admin", status: "active"
        });
        console.log("✅ تم إنشاء حساب المدير: admin");
        dataChanged = true;
    }

    // 2. إنشاء عضو اللجنة (Committee)
    if (!users.some(u => u.role === 'committee')) {
        users.push({
            id: 99, name: "عضو اللجنة", username: "comm", password: "123", role: "committee", status: "active"
        });
        console.log("✅ تم إنشاء حساب اللجنة: comm");
        dataChanged = true;
    }

    // 3. إنشاء معلم تجريبي (Teacher)
    if (!users.some(u => u.role === 'teacher')) {
        users.push({
            id: 2, name: "معلم تجريبي", username: "teacher", password: "123", role: "teacher", status: "active"
        });
        console.log("✅ تم إنشاء حساب معلم: teacher");
        dataChanged = true;
    }

    // 4. إنشاء طالب تجريبي (Student) - تم إضافته ✅
    if (!users.some(u => u.role === 'student')) {
        users.push({
            id: 3, 
            name: "طالب مجتهد", 
            username: "student", 
            password: "123", 
            role: "student", 
            status: "active",
            teacherId: 2, // ربطه بالمعلم التجريبي
            grade: "الصف الأول",
            subject: "لغتي"
        });
        console.log("✅ تم إنشاء حساب طالب: student");
        dataChanged = true;
    }

    if (dataChanged) {
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// --- 2. دالة تسجيل الدخول ---
function login(event) {
    // منع تحديث الصفحة
    if (event) event.preventDefault();

    // جلب الحقول (ندعم عدة احتمالات للـ ID لضمان العمل)
    const usernameInput = document.getElementById('username') || document.querySelector('input[type="text"]');
    const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');
    
    if (!usernameInput || !passwordInput) {
        console.error("خطأ: حقول الإدخال غير موجودة في الصفحة!");
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('يرجى إدخال اسم المستخدم وكلمة المرور');
        return;
    }

    // التحقق من المستخدم
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    // البحث غير حساس لحالة الأحرف
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (user) {
        if (user.status === 'suspended') {
            alert('⛔ هذا الحساب موقوف، يرجى مراجعة الإدارة');
            return;
        }

        // حفظ الجلسة
        const sessionData = { user: user, loginTime: new Date().toISOString() };
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));

        // تحديد مسار التوجيه (Routing Logic)
        let basePath = 'pages/';
        // إذا كنا داخل مجلد فرعي (مثل pages/teacher/...)، نعود للخلف
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
            case 'committee':
                window.location.href = basePath + 'committee/dashboard.html';
                break;
            case 'student': // ✅ مسار الطالب
                window.location.href = basePath + 'student/dashboard.html';
                break;
            default:
                alert('خطأ: لا توجد لوحة تحكم مخصصة لهذا الدور!');
        }
    } else {
        alert('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
    }
}

// --- 3. التحقق من الصلاحية ---
function checkAuth() {
    const sessionStr = sessionStorage.getItem('currentUser');
    if (!sessionStr) {
        // إذا لم يكن مسجلاً، أعده للصفحة الرئيسية (تجنب التكرار إذا كنا أصلاً فيها)
        if (window.location.href.includes('/pages/')) {
            window.location.href = '../../index.html'; 
        }
        return null;
    }
    return JSON.parse(sessionStr).user;
}

// --- 4. تسجيل الخروج ---
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

// تصدير الدوال للنطاق العام
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
