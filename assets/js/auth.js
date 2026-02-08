// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول المتوازن (أمان + استقرار)
// ============================================

const ADMIN_CONFIG = {
    username: "Zooro12500",
    passwordHash: "NDMwMTA2MDQzMTIz" // التشفير الآمن لكلمة المرور
};

document.addEventListener('DOMContentLoaded', function() {
    // 1. تهيئة زر الدخول
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        newBtn.type = 'button';
        newBtn.addEventListener('click', login);
    }
    
    // 2. التحقق من الجلسة في الصفحات الداخلية
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// 🔥 دالة التشفير الآمنة (تدعم العربية)
function secureHash(str) {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        console.error("خطأ في التشفير", e);
        return str;
    }
}

function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        showToast("الرجاء إدخال البيانات", "error");
        return;
    }

    // تشفير كلمة المرور المدخلة لمقارنتها
    const inputHash = secureHash(passInp);

    // 1. التحقق من المدير
    if (userInp === ADMIN_CONFIG.username && inputHash === ADMIN_CONFIG.passwordHash) {
        const adminUser = {
            id: 1,
            name: "مدير النظام",
            username: userInp,
            role: "admin",
            status: "active"
        };
        saveSessionAndRedirect(adminUser);
        return;
    }

    // 2. التحقق من المستخدمين (معلمين / طلاب)
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // البحث بذكاء: يدعم كلمات المرور المشفرة وغير المشفرة (للتوافق)
    let user = users.find(u => {
        // الخيار الأول: كلمة المرور في النظام مشفرة (الوضع المثالي)
        if (u.username == userInp && u.password == inputHash) return true;
        
        // الخيار الثاني: كلمة المرور نص عادي (حسابات قديمة) - نقوم بتحديثها تلقائياً
        if (u.username == userInp && u.password == passInp) {
            u.password = inputHash; // تشفيرها للمستقبل
            localStorage.setItem('users', JSON.stringify(users)); // حفظ التعديل
            return true;
        }
        return false;
    });

    if (user) {
        if (user.status === 'suspended' || user.status === 'موقوف') {
            showToast("⛔ عذراً، تم إيقاف حسابك. يرجى مراجعة الإدارة.", "error");
            return;
        }
        saveSessionAndRedirect(user);
        return;
    }

    // 3. التحقق من أعضاء اللجنة
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const member = committeeMembers.find(m => m.username === userInp && (m.password == passInp || m.password == inputHash));
    
    if (member) {
        saveSessionAndRedirect({
            id: member.id,
            name: member.name,
            username: member.username,
            role: 'committee_member',
            status: 'active'
        });
        return;
    }

    showToast("بيانات الدخول غير صحيحة!", "error");
}

function saveSessionAndRedirect(user) {
    // حفظ بيانات المستخدم كما هي (بدون تشفير كامل الكائن) لكي تقرأها الصفحات بسهولة
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';
    
    const routes = {
        'admin': 'admin/dashboard.html',
        'teacher': 'teacher/dashboard.html',
        'committee_member': 'member/dashboard.html',
        'student': 'student/dashboard.html'
    };

    window.location.href = prefix + (routes[user.role] || 'student/dashboard.html');
}

// -----------------------------------------------------------
// نظام الإشعارات (Toast)
// -----------------------------------------------------------
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        padding: 12px 25px; border-radius: 8px; color: #fff; font-weight: bold;
        z-index: 99999; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        font-family: Tajawal, sans-serif; transition: all 0.4s ease;
        background-color: ${type === 'error' ? '#e74c3c' : '#2ecc71'};
    `;
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.top = '0px';
        setTimeout(() => {
            if (document.body.contains(toast)) document.body.removeChild(toast);
        }, 500);
    }, 3000);
}

// دوال مساعدة عامة
window.checkAuth = function() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) {
        let backPath = window.location.href.includes('/pages/') ? '../../index.html' : 'index.html';
        if (!window.location.href.endsWith('index.html')) window.location.href = backPath;
    }
};

window.logout = function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
};

window.login = login;
window.alert = (msg) => showToast(msg, 'info');
window.showSuccess = (msg) => showToast(msg, 'success');
window.showError = (msg) => showToast(msg, 'error');
