// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول المباشر (يدعم المعلم، الطالب، وعضو اللجنة)
// ============================================

// التأكد من تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // محاولة إصلاح زر الدخول تلقائياً لمنع تحديث الصفحة
    const loginBtn = document.querySelector('button');
    if(loginBtn && loginBtn.innerText.includes('دخول')) {
        loginBtn.type = 'button'; // تحويله لزر عادي
        loginBtn.setAttribute('onclick', 'login()'); // التأكد من ربطه بالدالة
    }
});

// ✅ دالة الدخول الرئيسية (التي يستدعيها الزر في صفحتك)
function login() {
    // 1. جلب البيانات من الحقول
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    // التحقق من تعبئة الحقول
    if (!userInp || !passInp) {
        alert("الرجاء إدخال اسم المستخدم وكلمة المرور");
        return;
    }

    let foundUser = null;
    let redirectUrl = '';

    // 2. البحث أولاً في جدول المستخدمين الأساسيين (المعلم / الطلاب)
    // المصدر: users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    foundUser = users.find(u => u.username === userInp && u.password === passInp);

    if (foundUser) {
        // تحديد التوجيه للمعلم أو الطالب
        if (foundUser.role === 'admin' || foundUser.role === 'teacher') {
            redirectUrl = 'pages/teacher/dashboard.html';
        } else {
            redirectUrl = 'pages/student/dashboard.html';
        }
    } 
    // 3. إذا لم نجد، نبحث في جدول أعضاء اللجنة (الميزة الجديدة)
    else {
        // المصدر: committeeMembers
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        
        if (member) {
            // تجهيز بيانات العضو للجلسة
            foundUser = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee_member', // دور خاص للعضو
                title: member.role
            };
            redirectUrl = 'pages/member/dashboard.html'; // توجيه لصفحة العضو
        }
    }

    // 4. النتيجة النهائية
    if (foundUser && redirectUrl) {
        // حفظ الجلسة
        sessionStorage.setItem('currentUser', JSON.stringify(foundUser));
        // التوجيه
        window.location.href = redirectUrl;
    } else {
        alert("بيانات الدخول غير صحيحة.\nتأكد من اسم المستخدم وكلمة المرور.");
    }
}

// دالة تسجيل الخروج
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

// التحقق من الصلاحية (يوضع في الصفحات الداخلية)
function checkAuth() {
    if (!sessionStorage.getItem('currentUser')) {
        window.location.href = '../../index.html';
    }
}
