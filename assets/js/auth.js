// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول الموحد (معلم - طالب - عضو لجنة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // إصلاح زر الدخول لمنع تحديث الصفحة
    const loginBtn = document.querySelector('button[onclick="login()"]');
    if(loginBtn) {
        loginBtn.type = 'button';
        loginBtn.onclick = handleLogin;
    }
});

function handleLogin(event) {
    if(event) event.preventDefault();

    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        alert("الرجاء إدخال البيانات");
        return;
    }

    // 1. البحث في جدول المستخدمين (المعلم / الطلاب)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username === userInp && u.password === passInp);

    // 2. إذا لم نجد، نبحث في جدول أعضاء اللجنة
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        
        if (member) {
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee_member', // دور خاص للعضو
                title: member.role
            };
        }
    }

    // 3. التوجيه حسب الصلاحية
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        if (user.role === 'admin') {
            window.location.href = 'pages/teacher/dashboard.html';
        } else if (user.role === 'committee_member') {
            window.location.href = 'pages/member/dashboard.html'; // مسار بوابة العضو
        } else {
            window.location.href = 'pages/student/dashboard.html';
        }
    } else {
        alert("بيانات الدخول غير صحيحة!");
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function checkAuth() {
    if (!sessionStorage.getItem('currentUser')) {
        window.location.href = '../../index.html';
    }
}
