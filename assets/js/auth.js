// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول (محدث: تمرير ownerId لعزل بيانات عضو اللجنة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. ربط زر الدخول
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        // استنساخ الزر لإزالة أي أحداث سابقة وتجنب التكرار
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        newBtn.type = 'button';
        newBtn.addEventListener('click', login);
    }
    
    // 2. التحقق من الجلسة (إلا في صفحة الدخول)
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// دالة تسجيل الدخول
function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        showAuthNotification("الرجاء إدخال البيانات", "error");
        return;
    }

    // أ) البحث في المستخدمين الأساسيين (مدير / معلم / طالب)
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // ضمان وجود المدير دائماً
    if (!users.some(u => u.role === 'admin')) {
        users.push({ id: 1, name: "مدير النظام", username: "admin", password: "123", role: "admin", status: "active" });
        localStorage.setItem('users', JSON.stringify(users));
    }

    let user = users.find(u => u.username == userInp && u.password == passInp);

    // التحقق من حالة الحظر
    if (user) {
        if (user.status === 'suspended' || user.status === 'موقوف') {
            showAuthNotification("⛔ عذراً، تم إيقاف حسابك. يرجى مراجعة الإدارة.", "error");
            return; 
        }
    }

    // ب) البحث في أعضاء اللجنة (إذا لم يكن مستخدماً عادياً)
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        
        if (member) {
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee_member', 
                title: member.role,
                status: 'active',
                // 🔥 التعديل الهام: تمرير معرف المعلم (المالك) للجلسة
                ownerId: member.ownerId 
            };
        }
    }

    // ج) التوجيه (إذا تم العثور على المستخدم وكان غير موقوف)
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // تحديد مسار التوجيه
        let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';

        if (user.role === 'admin') {
            window.location.href = prefix + 'admin/dashboard.html';
        } else if (user.role === 'teacher') {
            window.location.href = prefix + 'teacher/dashboard.html';
        } else if (user.role === 'committee_member') {
            window.location.href = prefix + 'member/dashboard.html'; 
        } else {
            window.location.href = prefix + 'student/dashboard.html';
        }
    } else {
        showAuthNotification("بيانات الدخول غير صحيحة!", "error");
    }
}

// ============================================
// 🔔 نظام الإشعارات الموحد (استبدال Alert)
// ============================================

// 1. دالة إنشاء الإشعار بالتصميم الجديد
function showToast(message, type = 'info') {
    // إنشاء العنصر
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerText = message;

    // إضافته للصفحة
    document.body.appendChild(toast);

    // الحذف التلقائي بعد 3 ثوانٍ
    setTimeout(() => {
        toast.style.opacity = '0'; // اختفاء تدريجي
        toast.style.transform = 'translate(-50%, -20px)'; // حركة للأعلى
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 500); // انتظار انتهاء الأنيميشن
    }, 3000);
}

// 2. استبدال دالة alert الأصلية
window.alert = function(message) {
    showToast(message, 'info'); 
};

// 3. دوال مساعدة لرسائل النجاح والخطأ
window.showSuccess = (msg) => showToast(msg, 'success');
window.showError = (msg) => showToast(msg, 'error');

// 4. تحديث دالة showAuthNotification لتعمل بالتصميم الجديد
window.showAuthNotification = function(message, type) {
    const styleType = (type === 'success') ? 'success' : 'error';
    showToast(message, styleType);
};

// دوال إدارة الجلسة
function checkAuth() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) {
        window.location.href = '../../index.html';
        return null;
    }
    return JSON.parse(session);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
}

// تصدير الدوال
window.login = login;
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
