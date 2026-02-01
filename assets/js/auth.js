// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول (مع تفعيل الحظر للحسابات الموقوفة)
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

    // 🔥🔥 هنا التعديل الجوهري: فحص حالة الحساب 🔥🔥
    if (user) {
        if (user.status === 'suspended' || user.status === 'موقوف') {
            showAuthNotification("⛔ عذراً، تم إيقاف حسابك. يرجى مراجعة الإدارة.", "error");
            return; // 🛑 إيقاف العملية ومنع الدخول
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
                status: 'active' // أعضاء اللجنة فعالين افتراضياً
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

// دالة الإشعارات
function showAuthNotification(message, type = 'info') {
    const div = document.createElement('div');
    div.innerText = message;
    div.style.position = 'fixed';
    div.style.top = '20px';
    div.style.left = '50%';
    div.style.transform = 'translateX(-50%)';
    div.style.padding = '15px 30px';
    div.style.borderRadius = '8px';
    div.style.color = '#fff';
    div.style.fontWeight = 'bold';
    div.style.zIndex = '99999';
    div.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    div.style.fontFamily = 'Tajawal, sans-serif';
    
    // لون أحمر للخطأ/الحظر، وأخضر للنجاح
    div.style.backgroundColor = type === 'error' ? '#e74c3c' : '#2ecc71';
    
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.5s';
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

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
window.showAuthNotification = showAuthNotification;
