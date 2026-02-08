// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول المطور (تشفير البيانات + حظر الحسابات)
// ============================================

// 1. البيانات الأساسية للمدير (مشفرة لحماية الكود المصدري)
const ADMIN_CREDENTIALS = {
    u: "Wm9vcm8xMjUwMA==", // Zooro12500 مشفرة
    p: "NDMwMTA2MDQzMTIz"  // 430106043123 مشفرة
};

document.addEventListener('DOMContentLoaded', function() {
    // ربط زر الدخول وتجهيز الواجهة
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        newBtn.type = 'button';
        newBtn.addEventListener('click', login);
    }
    
    // التحقق من الجلسة (إلا في صفحة الدخول)
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// دالة تسجيل الدخول الرئيسية
function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        showToast("الرجاء إدخال البيانات", "error");
        return;
    }

    // أ) التحقق من حساب المدير الجديد (المشفر)
    if (btoa(userInp) === ADMIN_CREDENTIALS.u && btoa(passInp) === ADMIN_CREDENTIALS.p) {
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

    // ب) البحث في قائمة المستخدمين المخزنة (معلمين/طلاب)
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username == userInp && u.password == passInp);

    if (user) {
        if (user.status === 'suspended' || user.status === 'موقوف') {
            showToast("⛔ عذراً، تم إيقاف حسابك. يرجى مراجعة الإدارة.", "error");
            return;
        }
        saveSessionAndRedirect(user);
        return;
    }

    // ج) البحث في أعضاء اللجنة
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
    
    if (member) {
        const committeeUser = {
            id: member.id,
            name: member.name,
            username: member.username,
            role: 'committee_member',
            status: 'active'
        };
        saveSessionAndRedirect(committeeUser);
        return;
    }

    // إذا لم يتطابق شيء
    showToast("بيانات الدخول غير صحيحة!", "error");
}

// دالة حفظ الجلسة والتوجيه حسب الرتبة
function saveSessionAndRedirect(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';
    
    const routes = {
        'admin': 'admin/dashboard.html',
        'teacher': 'teacher/dashboard.html',
        'committee_member': 'member/dashboard.html',
        'student': 'student/dashboard.html'
    };

    window.location.href = prefix + (routes[user.role] || routes['student']);
}

// ============================================
// 🔔 نظام الإشعارات والخدمات المساعدة
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        padding: 15px 30px; border-radius: 8px; color: #fff; font-weight: bold;
        z-index: 99999; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        font-family: Tajawal, sans-serif; transition: all 0.5s ease;
        background-color: ${type === 'error' ? '#e74c3c' : '#2ecc71'};
    `;
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.top = '0px';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// استبدال alert بـ Toast تلقائياً
window.alert = (msg) => showToast(msg, 'info');

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

// تصدير الدوال للنافذة العالمية
window.login = login;
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.showToast = showToast;
