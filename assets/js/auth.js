// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول وإدارة الجلسات (نسختك المحلية الآمنة 100%)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. التقاط نموذج الإرسال (Form) لمنع تحديث الصفحة
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); 
            window.login();
        });
    }

    // 2. التقاط زر الدخول بشكل مباشر كإجراء احتياطي
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.innerText.includes('دخول') || btn.innerText.includes('تسجيل')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                window.login();
            });
        }
    });
    
    // 3. التحقق من الجلسة في الصفحات الداخلية
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// ============================================
// 🔐 دالة تسجيل الدخول الموحدة
// ============================================
window.login = function() {
    const userEl = document.getElementById('username');
    const passEl = document.getElementById('password');

    // التأكد من أننا في صفحة الدخول لتجنب الأخطاء
    if (!userEl || !passEl) return;

    const userInp = userEl.value.trim();
    const passInp = passEl.value.trim();

    // التحقق من إدخال البيانات
    if (!userInp || !passInp) {
        showAuthNotification("الرجاء إدخال البيانات", "error");
        return;
    }

    // جلب المستخدمين من التخزين المحلي
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // إنشاء حساب المدير (المالك) الافتراضي إذا لم يكن موجوداً
    if (!users.some(u => u.role === 'admin')) {
        users.push({ id: 1, name: "مدير النظام", username: "Zooro12500", password: "430106043", role: "admin", status: "active" });
        localStorage.setItem('users', JSON.stringify(users));
    }

    // 🔥 البحث مع تجاهل حالة الأحرف في اسم المستخدم (دعم حروف كبيرة/صغيرة)
    let user = users.find(u => String(u.username).toLowerCase() === String(userInp).toLowerCase() && String(u.password) === String(passInp));

    // التحقق من حالة حساب المدير أو المعلم أو الطالب
    if (user) {
        if (user.status === 'suspended' || user.status === 'موقوف') {
            showAuthNotification("⛔ عذراً، تم إيقاف حسابك. يرجى مراجعة الإدارة.", "error");
            return; 
        }
    }

    // 🔥 البحث في أعضاء اللجنة إذا لم يتم العثور عليه في المستخدمين الأساسيين
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => String(m.username).toLowerCase() === String(userInp).toLowerCase() && String(m.password) === String(passInp));
        
        if (member) {
            user = {
                id: member.id, 
                name: member.name, 
                username: member.username, 
                role: 'committee_member', 
                title: member.role, 
                status: 'active', 
                ownerId: member.ownerId 
            };
        }
    }

    // التوجيه السليم لكل مستخدم للمسار الخاص به
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';
        
        if (user.role === 'admin') window.location.href = prefix + 'admin/dashboard.html';
        else if (user.role === 'teacher') window.location.href = prefix + 'teacher/dashboard.html';
        else if (user.role === 'committee_member') window.location.href = prefix + 'member/dashboard.html'; // التوجيه للنموذج الصحيح للجنة
        else window.location.href = prefix + 'student/dashboard.html';
    } else {
        showAuthNotification("بيانات الدخول غير صحيحة!", "error");
    }
};

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
