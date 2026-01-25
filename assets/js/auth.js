// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول الموحد (مع توجيه المسارات الصحيح)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // إصلاح زر الدخول تلقائياً
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        loginBtn.type = 'button';
        loginBtn.onclick = login;
    }
});

function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        alert("الرجاء إدخال البيانات");
        return;
    }

    let user = null;
    let role = '';

    // 1. البحث في جدول المستخدمين (المعلم / الطلاب)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    user = users.find(u => u.username === userInp && u.password === passInp);

    if (user) {
        role = user.role; // admin, teacher, student
    } 
    // 2. البحث في جدول أعضاء اللجنة
    else {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        
        if (member) {
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee_member', // توحيد اسم الدور
                title: member.role
            };
            role = 'committee_member';
        }
    }

    // 3. التوجيه
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // مصفوفة المسارات الصحيحة (من المجلد الرئيسي)
        const paths = {
            'admin': 'pages/teacher/dashboard.html',
            'teacher': 'pages/teacher/dashboard.html',
            'student': 'pages/student/dashboard.html',
            
            // هنا الحل: نوجه أي دور لجنة إلى مجلد member
            'committee': 'pages/member/dashboard.html',
            'committee_member': 'pages/member/dashboard.html' 
        };

        const targetPath = paths[role];

        if(targetPath) {
            console.log('جاري التوجيه إلى:', targetPath);
            window.location.href = targetPath;
        } else {
            alert('يوجد خطأ في تحديد مسار المستخدم، راجع المسؤول.');
        }

    } else {
        alert("بيانات الدخول غير صحيحة!");
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    // العودة للصفحة الرئيسية دائماً
    window.location.href = '../../index.html';
}

function checkAuth() {
    if (!sessionStorage.getItem('currentUser')) {
        window.location.href = '../../index.html';
    }
}
