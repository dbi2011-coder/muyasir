// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول (النسخة المعتمدة) + إصلاح دالة الإشعارات
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. ربط زر الدخول
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        loginBtn.type = 'button';
        loginBtn.onclick = login;
    }
    
    // 2. التحقق من الجلسة
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// دالة تسجيل الدخول (نفس المنطق الذي وافقت عليه)
function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        alert("الرجاء إدخال البيانات"); // استبدلنا التنبيه هنا بالمستعرض العادي للأمان
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '[]');

    // ضمان وجود المدير
    if (!users.some(u => u.role === 'admin')) {
        users.push({ id: 1, name: "مدير النظام", username: "admin", password: "123", role: "admin" });
        localStorage.setItem('users', JSON.stringify(users));
    }

    let user = users.find(u => u.username == userInp && u.password == passInp);

    // البحث في أعضاء اللجنة (للحفاظ على دخولهم)
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

    // التوجيه
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        let prefix = '';
        if (window.location.href.includes('/pages/')) {
            prefix = '../'; 
        } else {
            prefix = 'pages/';
        }

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
        // هنا نستخدم الدالة المضافة بالأسفل لتجنب الخطأ
        showAuthNotification("بيانات الدخول غير صحيحة!", "error");
    }
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
    const session = sessionStorage.getItem('currentUser');
    return session ? JSON.parse(session) : null;
}

// 🔥 دالة الإشعارات (تمت إضافتها لحل ReferenceError) 🔥
function showAuthNotification(message, type = 'info') {
    // إنشاء عنصر التنبيه
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
    div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    div.style.transition = 'opacity 0.3s ease';

    // تحديد اللون حسب النوع
    if (type === 'error') {
        div.style.backgroundColor = '#e74c3c'; // أحمر للخطأ
    } else if (type === 'success') {
        div.style.backgroundColor = '#2ecc71'; // أخضر للنجاح
    } else {
        div.style.backgroundColor = '#3498db'; // أزرق للمعلومات
    }

    document.body.appendChild(div);

    // إخفاء الرسالة بعد 3 ثواني
    setTimeout(() => {
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// تصدير الدوال
window.login = login;
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.showAuthNotification = showAuthNotification; // تصدير الدالة
