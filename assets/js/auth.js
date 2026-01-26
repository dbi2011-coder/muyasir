// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول الموحد (يدعم المعلم، الطالب، واللجنة)
// ============================================

function login() {
    console.log("جاري محاولة الدخول...");

    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        alert("الرجاء إدخال البيانات");
        return;
    }

    // 1. البحث في المعلمين والطلاب
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    let foundUser = users.find(u => u.username == userInp && u.password == passInp);

    // 2. البحث في أعضاء اللجنة
    if (!foundUser) {
        let committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        let member = committeeMembers.find(m => m.username == userInp && m.password == passInp);
        if (member) {
            foundUser = {
                id: member.id, name: member.name, username: member.username,
                role: 'committee_member', title: member.role
            };
        }
    }

    // 3. التوجيه (مع إصلاح المسارات 404)
    if (foundUser) {
        sessionStorage.setItem('currentUser', JSON.stringify(foundUser));
        
        // تحديد البادئة: بما أننا في pages/auth/ نحتاج للرجوع خطوة واحدة
        let prefix = "../"; 
        
        if (foundUser.role === 'admin' || foundUser.role === 'teacher') {
            window.location.href = prefix + 'teacher/dashboard.html';
        } else if (foundUser.role === 'committee_member') {
            window.location.href = prefix + 'member/dashboard.html';
        } else {
            window.location.href = prefix + 'student/dashboard.html';
        }
    } else {
        alert("بيانات الدخول غير صحيحة");
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
