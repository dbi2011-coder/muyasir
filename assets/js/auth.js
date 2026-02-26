// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول المتوافق تماماً مع نظامك المحلي (LocalStorage)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التقاط نموذج الإرسال (Form) لمنع تحديث الصفحة
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); 
            window.login();
        });
    } else {
        // احتياطي في حال لم يكن هناك Form
        const loginBtn = document.querySelector('button');
        if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('تسجيل'))) {
            const newBtn = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newBtn, loginBtn);
            newBtn.type = 'button';
            newBtn.addEventListener('click', window.login);
        }
    }
    
    // 2. التحقق من الجلسة في الصفحات الداخلية
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// ============================================
// 🔐 دالة تسجيل الدخول
// ============================================
window.login = function() {
    const userEl = document.getElementById('username');
    const passEl = document.getElementById('password');

    // التأكد من أننا في صفحة الدخول
    if (!userEl || !passEl) return;

    const userInp = userEl.value.trim();
    const passInp = passEl.value.trim();

    // التحقق من إدخال البيانات
    if (!userInp || !passInp) {
        showAuthNotification("الرجاء إدخال اسم المستخدم وكلمة المرور", "error");
        return;
    }

    // إظهار رسالة جاري التحميل
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    if(btnText && btnLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
    }

    setTimeout(() => {
        // 1. جلب المستخدمين الأساسيين من التخزين المحلي
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // إنشاء حساب المدير الافتراضي إذا لم يكن موجوداً
        if (!users.some(u => u.role === 'admin')) {
            users.push({ id: 1, name: "مدير النظام", username: "Zooro12500", password: "430106043", role: "admin", status: "active" });
            localStorage.setItem('users', JSON.stringify(users));
        }

        // 2. البحث عن المدير أو المعلم أو الطالب (مع تجاهل حالة الأحرف)
        let user = users.find(u => String(u.username).toLowerCase() === String(userInp).toLowerCase() && String(u.password) === String(passInp));

        if (user && (user.status === 'suspended' || user.status === 'موقوف')) {
            showAuthNotification("⛔ عذراً، تم إيقاف حسابك. يرجى مراجعة الإدارة.", "error");
            resetLoginButton(btnText, btnLoading);
            return; 
        }

        // 3. 🔥 البحث في جدول أعضاء اللجنة إذا لم نجده في المستخدمين الأساسيين 🔥
        if (!user) {
            const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
            const member = committeeMembers.find(m => String(m.username).toLowerCase() === String(userInp).toLowerCase() && String(m.password) === String(passInp));
            
            if (member) {
                user = {
                    id: member.id, 
                    name: member.name, 
                    username: member.username, 
                    role: 'committee_member', 
                    title: member.role || 'عضو لجنة', 
                    status: 'active', 
                    ownerId: member.ownerId 
                };
            }
        }

        // 4. التوجيه السليم لكل مستخدم
        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';
            
            if (user.role === 'admin') {
                window.location.href = prefix + 'admin/dashboard.html';
            } else if (user.role === 'teacher') {
                window.location.href = prefix + 'teacher/dashboard.html';
            } else if (user.role === 'committee_member') {
                // 🔥 تم تصحيح المسار ليوجه إلى مجلد committee 🔥
                window.location.href = prefix + 'committee/dashboard.html';
            } else {
                window.location.href = prefix + 'student/dashboard.html';
            }
        } else {
            showAuthNotification("بيانات الدخول غير صحيحة!", "error");
            resetLoginButton(btnText, btnLoading);
        }
    }, 500); // تأخير بسيط لمحاكاة التحميل ولإعطاء فرصة لقراءة البيانات
};

function resetLoginButton(btnText, btnLoading) {
    if(btnText) btnText.style.display = 'inline-block';
    if(btnLoading) btnLoading.style.display = 'none';
}

// ============================================
// 🔔 نظام الإشعارات (Toast Notifications)
// ============================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerText = message;
    
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translate(-50%, 0)';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.color = '#fff';
    toast.style.zIndex = '10000';
    toast.style.transition = 'all 0.3s ease';
    toast.style.fontFamily = "'Tajawal', sans-serif";
    toast.style.fontWeight = "bold";
    
    if (type === 'success') toast.style.backgroundColor = '#28a745';
    else if (type === 'error') toast.style.backgroundColor = '#dc3545';
    else toast.style.backgroundColor = '#17a2b8';

    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20px)';
        setTimeout(() => { 
            if (document.body.contains(toast)) document.body.removeChild(toast); 
        }, 500);
    }, 3000);
}

// دوال مساعدة للإشعارات
window.alert = function(message) { showToast(message, 'info'); };
window.showSuccess = (msg) => showToast(msg, 'success');
window.showError = (msg) => showToast(msg, 'error');
window.showAuthNotification = function(message, type) { 
    showToast(message, type === 'success' ? 'success' : 'error'); 
};

// ============================================
// 🛠️ دوال مساعدة (Helpers)
// ============================================
window.checkAuth = function() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) { 
        window.location.href = '../../index.html'; 
        return null; 
    }
    return JSON.parse(session);
};

window.logout = function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
};

window.getCurrentUser = function() { 
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); 
};
