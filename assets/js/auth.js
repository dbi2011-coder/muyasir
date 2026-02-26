// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول وإدارة الجلسات السحابي (Supabase)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. ربط زر الدخول
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        newBtn.type = 'button'; // تحويله لزر عادي لمنع إعادة تحميل الصفحة
        newBtn.addEventListener('click', login);
    }
    
    // 2. التحقق من الجلسة (باستثناء صفحات الدخول والرئيسية)
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// ============================================
// 🔐 دالة تسجيل الدخول السحابية (Supabase)
// ============================================
async function login(event) {
    if(event) event.preventDefault();

    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    // التحقق من إدخال البيانات
    if (!userInp || !passInp) {
        showAuthNotification("الرجاء إدخال اسم المستخدم وكلمة المرور", "error");
        return;
    }

    // إظهار رسالة تحميل
    const btn = event ? event.target : document.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "جاري التحقق...";
    btn.disabled = true;

    try {
        // 1. البحث في جدول المستخدمين (المدير، المعلم، الطالب)
        const { data: users, error: err1 } = await window.supabase
            .from('users')
            .select('*')
            .eq('username', userInp)
            .eq('password', passInp);

        if (users && users.length > 0) {
            const user = users[0];
            
            // التحقق من حالة الحساب
            if (user.status === 'suspended' || user.status === 'موقوف') {
                showAuthNotification("⛔ عذراً، تم إيقاف حسابك. يرجى مراجعة الإدارة.", "error");
                btn.innerText = originalText;
                btn.disabled = false;
                return;
            }

            sessionStorage.setItem('currentUser', JSON.stringify(user));
            let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';
            
            if (user.role === 'admin') window.location.href = prefix + 'admin/dashboard.html';
            else if (user.role === 'teacher') window.location.href = prefix + 'teacher/dashboard.html';
            else window.location.href = prefix + 'student/dashboard.html';
            return;
        }

        // 2. إذا لم نجده، البحث في جدول أعضاء اللجنة
        const { data: committee, error: err2 } = await window.supabase
            .from('committee_members')
            .select('*')
            .eq('username', userInp)
            .eq('password', passInp);

        if (committee && committee.length > 0) {
            const commUser = committee[0];
            
            // تجهيز بيانات الجلسة لعضو اللجنة
            const sessionUser = {
                id: commUser.id, 
                name: commUser.name, 
                username: commUser.username, 
                role: 'committee_member', // توحيد اسم الصلاحية
                status: 'active', 
                ownerId: commUser.ownerId 
            };
            
            sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
            
            let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';
            window.location.href = prefix + 'member/dashboard.html'; 
            return;
        }

        // 3. إذا لم يتم العثور عليه في أي جدول
        showAuthNotification("بيانات الدخول غير صحيحة!", "error");
        btn.innerText = originalText;
        btn.disabled = false;

    } catch (error) {
        console.error('Login Error:', error);
        showAuthNotification("حدث خطأ في الاتصال بقاعدة البيانات", "error");
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ============================================
// 🔔 نظام الإشعارات (Toast Notifications)
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerText = message;
    
    // تنسيق الإشعار
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
    
    // إخفاء الإشعار بعد 3 ثواني
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

function checkAuth() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) { 
        window.location.href = '../../index.html'; 
        return null; 
    }
    return JSON.parse(session);
}

// تسجيل الخروج
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function getCurrentUser() { 
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); 
}

// تصدير الدوال للنطاق العام (Global Scope)
window.login = login;
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
