// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول (مع إصلاح مسارات التوجيه 404)
// ============================================

// دالة الدخول التي يستدعيها الزر
function login() {
    console.log("بدء عملية الدخول...");

    // 1. جلب البيانات
    var userInp = document.getElementById('username').value;
    var passInp = document.getElementById('password').value;

    if(userInp) userInp = userInp.trim();
    if(passInp) passInp = passInp.trim();

    if (!userInp || !passInp) {
        alert("الرجاء إدخال اسم المستخدم وكلمة المرور");
        return;
    }

    // 2. البحث عن المستخدم
    // البحث في المعلمين والطلاب
    var users = JSON.parse(localStorage.getItem('users') || '[]');
    var foundUser = users.find(function(u) { return u.username == userInp && u.password == passInp; });

    // البحث في اللجنة إذا لم نجد معلم/طالب
    if (!foundUser) {
        var committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        var member = committeeMembers.find(function(m) { return m.username == userInp && m.password == passInp; });
        if (member) {
            foundUser = {
                id: member.id, name: member.name, username: member.username,
                role: 'committee_member', title: member.role
            };
        }
    }

    // 3. التوجيه (هنا كان سبب المشكلة 404)
    if (foundUser) {
        sessionStorage.setItem('currentUser', JSON.stringify(foundUser));
        
        // تحديد "البادئة" الصحيحة للمسار
        // إذا كنا داخل مجلد "pages/auth"، نحتاج للرجوع خطوة واحدة (../)
        var pathPrefix = "../"; 
        
        // إذا كنا في الصفحة الرئيسية (index.html)، المسار يبدأ بـ (pages/)
        if (window.location.pathname.indexOf('auth') === -1 && window.location.pathname.indexOf('pages') === -1) {
            pathPrefix = "pages/";
        }

        if (foundUser.role === 'admin' || foundUser.role === 'teacher') {
            window.location.href = pathPrefix + 'teacher/dashboard.html';
        } else if (foundUser.role === 'committee_member') {
            window.location.href = pathPrefix + 'member/dashboard.html';
        } else {
            window.location.href = pathPrefix + 'student/dashboard.html';
        }

    } else {
        alert("بيانات الدخول غير صحيحة");
    }
}

// دالة تسجيل الخروج
function logout() {
    sessionStorage.removeItem('currentUser');
    // العودة للصفحة الرئيسية دائماً
    window.location.href = '../../index.html';
}
