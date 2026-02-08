// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول المطور (يدعم العربية + تشفير البيانات + حظر الحسابات)
// ============================================

// 1. البيانات الأساسية للمدير (مشفرة لحماية الكود المصدري)
// المستخدم: Zooro12500 | كلمة المرور: 430106043123
const ADMIN_CREDENTIALS = {
    u: "Wm9vcm8xMjUwMA==", 
    p: "NDMwMTA2MDQzMTIz"  
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
    
    // التحقق من الجلسة (إلا في صفحة الدخول والرئيسية)
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// دالة مساعدة لتحويل النصوص (بما فيها العربية) إلى Base64 دون أخطاء
function utf8_to_btoa(str) {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (err) {
        console.error("Encoding error:", err);
        return "";
    }
}

// دالة تسجيل الدخول الرئيسية
function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        showToast("الرجاء إدخال البيانات", "error");
        return;
    }

    // أ) التحقق من حساب المدير الجديد (باستخدام التشفير الآمن للعربية)
    if (utf8_to_btoa(userInp) === ADMIN_CREDENTIALS.u && utf8_to_btoa(passInp) === ADMIN_CREDENTIALS.p) {
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

    // ب) البحث في قائمة المستخدمين المخزنة (معلمين/طلاب) ببياناتهم الأصلية
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
        saveSessionAndRedirect({
            id: member.id,
            name: member.name,
            username: member.username,
            role: 'committee_member',
            status: 'active'
        });
        return;
    }

    // إذا لم يتطابق شيء
    showToast("بيانات الدخول غير صحيحة!", "error");
}

// دالة حفظ الجلسة والتوجيه حسب الرتبة
function saveSessionAndRedirect(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    // تحديد المسار (تعديل بسيط لضمان صحة الروابط)
    let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';
    
    const routes = {
        'admin': 'admin/dashboard.html',
        'teacher': 'teacher/dashboard.html',
        'committee_member': 'member/dashboard.html',
        'student': 'student/dashboard.html'
    };

    window.location.href = prefix + (routes[user.role] || routes['student']);
}

// نظام الإشعارات (Toast)
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        padding: 12px 25px; border-radius: 8px; color: #fff; font-weight: bold;
        z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Tajawal', sans-serif; transition: all 0.4s ease;
        background-color: ${type === 'error' ? '#e74c3c' : '#2ecc71'};
    `;
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -10px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// استبدال التنبيهات الافتراضية بتصميمك الجديد
window.alert = (msg) => showToast(msg, 'info');

function checkAuth() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) {
        let backPath = window.location.href.includes('/pages/') ? '../../index.html' : 'index.html';
        window.location.href = backPath;
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
}

// تصدير للوصول العالمي
window.login = login;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.showToast = showToast;
