// ============================================
// 📁 المسار: assets/js/auth.js
// الوصف: نظام المصادقة المدمج (المالك + اللجنة + المعلم + الطالب)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. تهيئة النظام (لضمان وجود المدير دائماً)
    initSystem();

    // 2. ربط زر الدخول تلقائياً (سواء كان داخل فورم أو زر عادي)
    // نبحث عن الزر ونلغي الأحداث القديمة لنضع الحدث الجديد
    const loginBtn = document.querySelector('button') || document.getElementById('loginBtn');
    
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        // استنساخ الزر لإزالة أي مستمعي أحداث سابقين (Clean Slate)
        const newBtn = loginBtn.cloneNode(true);
        if(loginBtn.parentNode) {
            loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        }
        
        // إضافة نوع button لمنع التحديث إذا كان داخل فورم
        newBtn.type = 'button'; 
        
        // إضافة حدث النقر الجديد
        newBtn.addEventListener('click', function(e) {
            e.preventDefault(); // منع تحديث الصفحة
            login(e);
        });

        // دعم مفتاح Enter في حقول الإدخال
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') login(e);
            });
        });
    }
});

// --- 1. تهيئة النظام ---
function initSystem() {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // ضمان وجود المدير (Admin) - هذا يحل مشكلة دخول المالك
    if (!users.some(u => u.role === 'admin')) {
        users.push({
            id: 1, 
            name: "مدير النظام", 
            username: "admin", 
            password: "123", 
            role: "admin", 
            status: "active"
        });
        localStorage.setItem('users', JSON.stringify(users));
        console.log("✅ تم تأكيد حساب المدير (admin/123)");
    }
}

// --- 2. دالة تسجيل الدخول (النسخة الذكية) ---
function login(event) {
    if (event) event.preventDefault(); // خطوة هامة جداً لمنع مسح البيانات

    // محاولة العثور على الحقول بأكثر من طريقة لضمان العمل مع أي تصميم HTML
    const usernameInput = document.getElementById('username') || document.querySelector('input[type="text"]');
    const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');

    if (!usernameInput || !passwordInput) {
        console.error("حقول الإدخال غير موجودة");
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('الرجاء إدخال اسم المستخدم وكلمة المرور');
        return;
    }

    // --- أ) البحث أولاً في المستخدمين الأساسيين (للمدير والمعلم والطالب) ---
    // هذا يضمن دخول "مدير النظام" الذي أصلحناه
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    // --- ب) إذا لم نجد المستخدم، نبحث في قائمة "أعضاء اللجنة" (كما في النسخة القديمة) ---
    // هذا يضمن دخول عضو اللجنة حتى لو لم يكن في قائمة Users
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username.toLowerCase() === username.toLowerCase() && m.password === password);
        
        if (member) {
            // تحويل بيانات العضو لصيغة موحدة للنظام
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee', // توحيد اسم الدور
                status: 'active'
            };
        }
    }

    // --- ج) معالجة الدخول والتوجيه ---
    if (user) {
        if (user.status === 'suspended' || user.status === 'inactive') {
            alert('⛔ هذا الحساب موقوف، يرجى مراجعة الإدارة');
            return;
        }

        // حفظ الجلسة
        const sessionData = { user: user, loginTime: new Date().toISOString() };
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));

        // حساب المسار الصحيح (Routing Logic من النسخة المرفقة)
        let prefix = '';
        if (window.location.href.includes('/pages/')) {
            prefix = '../'; // نحن داخل مجلد فرعي ونريد الخروج منه
        } else {
            prefix = 'pages/'; // نحن في الصفحة الرئيسية
        }

        // التوجيه حسب الصلاحية
        switch(user.role) {
            case 'admin':
                // ✅ المالك يذهب للوحته الخاصة
                window.location.href = prefix + 'admin/dashboard.html';
                break;
                
            case 'teacher':
                window.location.href = prefix + 'teacher/dashboard.html';
                break;
                
            case 'student':
                window.location.href = prefix + 'student/dashboard.html';
                break;
                
            case 'committee':
            case 'committee_member': // لدعم التسميات القديمة في قاعدة البيانات
                // ✅ عضو اللجنة يذهب للواجهة الجديدة المتكاملة (اجتماعات + تقارير)
                // تأكد أنك وضعت ملفات اللجنة الجديدة في مجلد pages/committee
                window.location.href = prefix + 'committee/dashboard.html';
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
        // إذا لم يكن مسجلاً، نتأكد ألا نعيد توجيهه إذا كان أصلاً في صفحة الدخول
        if (!window.location.href.includes('index.html') && !window.location.href.endsWith('/')) {
            // نحدد مسار العودة للصفحة الرئيسية بدقة
            let backPath = '../../index.html';
            if (!window.location.href.includes('/pages/')) backPath = './index.html';
            
            window.location.href = backPath; 
        }
        return null;
    }
    return JSON.parse(sessionStr).user;
}

function logout() {
    sessionStorage.removeItem('currentUser');
    // العودة للصفحة الرئيسية
    let backPath = '../../index.html';
    // حساب المسار بناءً على الموقع الحالي
    if (!window.location.href.includes('/pages/')) backPath = './index.html';
    
    window.location.href = backPath;
}

// دالة مساعدة للحصول على المستخدم الحالي في الصفحات الأخرى
function getCurrentUser() {
    return checkAuth();
}

// تصدير الدوال للنطاق العام (Window) لتعمل مع HTML onclick إذا لزم الأمر
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
window.getCurrentUser = getCurrentUser;
