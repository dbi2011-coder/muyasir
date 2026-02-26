// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول المتوافق تماماً مع الذاكرة المحلية (تم تصحيح توجيه اللجنة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); 
            window.login();
        });
    } else {
        const loginBtn = document.querySelector('button');
        if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('تسجيل'))) {
            const newBtn = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newBtn, loginBtn);
            newBtn.type = 'button';
            newBtn.addEventListener('click', window.login);
        }
    }
    
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

window.login = function() {
    const userEl = document.getElementById('username');
    const passEl = document.getElementById('password');

    if (!userEl || !passEl) return;

    const userInp = userEl.value.trim();
    const passInp = passEl.value.trim();

    if (!userInp || !passInp) {
        showAuthNotification("الرجاء إدخال اسم المستخدم وكلمة المرور", "error");
        return;
    }

    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    if(btnText && btnLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
    }

    setTimeout(() => {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (!users.some(u => u.role === 'admin')) {
            users.push({ id: 1, name: "مدير النظام", username: "Zooro12500", password: "430106043", role: "admin", status: "active" });
            localStorage.setItem('users', JSON.stringify(users));
        }

        let user = users.find(u => String(u.username).toLowerCase() === String(userInp).toLowerCase() && String(u.password) === String(passInp));

        if (user && (user.status === 'suspended' || user.status === 'موقوف')) {
            showAuthNotification("⛔ عذراً، تم إيقاف حسابك.", "error");
            resetLoginButton(btnText, btnLoading);
            return; 
        }

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

        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';
            
            if (user.role === 'admin') window.location.href = prefix + 'admin/dashboard.html';
            else if (user.role === 'teacher') window.location.href = prefix + 'teacher/dashboard.html';
            // 🔥 هنا تم التوجيه للنموذج الحديث (member) بدلاً من القديم 🔥
            else if (user.role === 'committee_member') window.location.href = prefix + 'member/dashboard.html';
            else window.location.href = prefix + 'student/dashboard.html';
        } else {
            showAuthNotification("بيانات الدخول غير صحيحة!", "error");
            resetLoginButton(btnText, btnLoading);
        }
    }, 300);
};

function resetLoginButton(btnText, btnLoading) {
    if(btnText) btnText.style.display = 'inline-block';
    if(btnLoading) btnLoading.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerText = message;
    toast.style.position = 'fixed'; toast.style.top = '20px'; toast.style.left = '50%'; toast.style.transform = 'translate(-50%, 0)'; toast.style.padding = '10px 20px'; toast.style.borderRadius = '5px'; toast.style.color = '#fff'; toast.style.zIndex = '10000'; toast.style.transition = 'all 0.3s ease'; toast.style.fontWeight = "bold"; toast.style.fontFamily = "'Tajawal', sans-serif";
    
    if (type === 'success') toast.style.backgroundColor = '#28a745';
    else if (type === 'error') toast.style.backgroundColor = '#dc3545';
    else toast.style.backgroundColor = '#17a2b8';

    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translate(-50%, -20px)'; setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 500); }, 3000);
}

window.alert = function(message) { showToast(message, 'info'); };
window.showSuccess = (msg) => showToast(msg, 'success');
window.showError = (msg) => showToast(msg, 'error');
window.showAuthNotification = function(message, type) { showToast(message, type === 'success' ? 'success' : 'error'); };

window.checkAuth = function() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) { window.location.href = '../../index.html'; return null; }
    return JSON.parse(session);
};

window.logout = function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
};

window.getCurrentUser = function() { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); };
