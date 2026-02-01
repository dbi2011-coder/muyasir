// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام المصادقة (إصلاح المدير + اللجنة + دالة الإشعارات)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. ربط زر الدخول
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
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

    // أ) البحث في المستخدمين الأساسيين (مدير / معلم)
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // ضمان وجود المدير
    if (!users.some(u => u.role === 'admin')) {
        users.push({ id: 1, name: "مدير النظام", username: "admin", password: "123", role: "admin" });
        localStorage.setItem('users', JSON.stringify(users));
    }

    let user = users.find(u => u.username == userInp && u.password == passInp);

    // ب) البحث في أعضاء اللجنة (النظام القديم)
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        
        if (member) {
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee_member', 
                title: member.role
            };
        }
    }

    // ج) التوجيه
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
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

// 🔥 دالة الإشعارات (هذه التي كانت مفقودة وتسبب الخطأ)
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
    div.style.zIndex = '9999';
    div.style.backgroundColor = type === 'error' ? '#e74c3c' : '#2ecc71';
    
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
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

window.login = login;
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.showAuthNotification = showAuthNotification;
