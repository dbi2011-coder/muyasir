// ============================================
// 📁 الملف: assets/js/auth.js (نسخة التشخيص)
// ============================================

// تهيئة النظام وإنشاء حساب افتراضي
(function initializeSystem() {
    console.log("بداية تهيئة النظام...");
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const adminExists = users.some(u => u.role === 'admin');

        if (!adminExists) {
            users.push({
                id: 1,
                name: 'الأستاذ صالح العجلان',
                username: 'admin',
                password: '123',
                role: 'admin'
            });
            localStorage.setItem('users', JSON.stringify(users));
            console.log("تم إنشاء حساب المشرف الافتراضي: admin / 123");
        }
    } catch (e) {
        console.error("خطأ في تهيئة النظام:", e);
        alert("هناك مشكلة في الذاكرة المحلية (LocalStorage).");
    }
})();

function login() {
    // 1. اختبار استجابة الزر
    console.log("تم ضغط زر الدخول");

    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        alert("⚠️ الرجاء إدخال اسم المستخدم وكلمة المرور!");
        return;
    }

    // 2. البحث في المستخدمين (المعلمين/الطلاب)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(u => u.username === userInp && u.password === passInp);

    if (foundUser) {
        alert(`✅ تم العثور على المستخدم: ${foundUser.name}\nسيتم التوجيه الآن...`);
        
        // حفظ الجلسة
        sessionStorage.setItem('currentUser', JSON.stringify({
            id: foundUser.id,
            name: foundUser.name,
            role: foundUser.role,
            user: foundUser
        }));

        // التوجيه (تأكد أن أسماء المجلدات لديك مطابقة لهذه المسارات)
        if (foundUser.role === 'admin') {
            window.location.href = 'pages/teacher/dashboard.html';
        } else {
            window.location.href = 'pages/student/dashboard.html';
        }
        return;
    }

    // 3. البحث في أعضاء اللجنة
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const foundMember = committeeMembers.find(m => m.username === userInp && m.password === passInp);

    if (foundMember) {
        alert(`✅ مرحباً عضو اللجنة: ${foundMember.name}`);
        
        sessionStorage.setItem('currentUser', JSON.stringify({
            id: foundMember.id,
            name: foundMember.name,
            role: 'committee_member',
            title: foundMember.role,
            user: foundMember
        }));

        window.location.href = 'pages/member/dashboard.html';
        return;
    }

    // 4. فشل الدخول
    alert(`❌ فشل الدخول!\nلم يتم العثور على حساب بالبيانات:\nالمستخدم: ${userInp}\nالرمز: ${passInp}\n\nجرب الحساب الافتراضي: admin / 123`);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (!user) {
        window.location.href = '../../index.html';
    }
}
