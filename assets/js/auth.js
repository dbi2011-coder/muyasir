// ============================================
// 📁 المسار: assets/js/auth.js
// الوصف: نظام المصادقة الموحد (يدعم المستخدمين وأعضاء اللجنة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. تهيئة النظام (لضمان وجود المدير)
    initSystem();

    // 2. ربط زر الدخول تلقائياً (سواء كان داخل فورم أو زر عادي)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login(e);
        });
    }
    
    const loginBtn = document.getElementById('loginBtn') || document.querySelector('button[onclick="login()"]');
    if (loginBtn && !loginForm) {
        // نلغي الحدث القديم ونضع الجديد
        loginBtn.onclick = null; 
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            login(e);
        });
    }

    // دعم مفتاح Enter
    document.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const activeElement = document.activeElement;
            if (activeElement.tagName === 'INPUT') {
                login(e);
            }
        }
    });
});

// --- 1. تهيئة النظام ---
function initSystem() {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // ضمان وجود المدير (Admin)
    if (!users.some(u => u.role === 'admin')) {
        users.push({
            id: 1, name: "مدير النظام", username: "admin", password: "123", role: "admin", status: "active"
        });
        localStorage.setItem('users', JSON.stringify(users));
        console.log("✅ تم تأكيد حساب المدير");
    }
}

// --- 2. دالة تسجيل الدخول (النسخة الذكية) ---
function login(event) {
    if (event) event.preventDefault(); // منع تحديث الصفحة

    // محاولة العثور على الحقول بأكثر من طريقة
    const usernameInput = document.getElementById('username') || document.querySelector('input[type="text"]');
    const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');

    if (!usernameInput || !passwordInput) {
        console.error("حقول الإدخال غير موجودة");
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('يرجى إدخال اسم المستخدم وكلمة المرور');
        return;
    }

    // --- أ) البحث في المستخدمين الأساسيين (مدير، معلم، طالب) ---
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    // --- ب) إذا لم نجد المستخدم، نبحث في قائمة أعضاء اللجنة (كما في النسخة القديمة) ---
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username.toLowerCase() === username.toLowerCase() && m.password === password);
        
        if (member) {
            // تحويل عضو اللجنة إلى صيغة مستخدم للنظام
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee', // نوحد الدور هنا
                status: 'active'
            };
        }
    }

    // --- ج) معالجة الدخول ---
    if (user) {
        if (user.status === 'suspended') {
            alert('⛔ هذا الحساب موقوف');
            return;
        }

        // حفظ الجلسة
        const sessionData = { user: user, loginTime: new Date().toISOString() };
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));

        // تحديد المسار (Routing)
        let basePath = 'pages/';
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
            case 'committee':
            case 'committee_member': // لدعم التسميات القديمة
                // تأكد أن المجلد اسمه committee كما أنشأناه سابقاً
                window.location.href = basePath + 'committee/dashboard.html';
                break;
            default:
                alert('لا توجد صفحة مخصصة لهذا الدور');
        }
    } else {
        alert('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
    }
}

// --- 3. التحقق والخروج ---
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

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function getCurrentUser() {
    return checkAuth();
}

// تصدير الدوال
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
window.getCurrentUser = getCurrentUser;
