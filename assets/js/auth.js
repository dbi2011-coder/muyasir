document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.querySelector('button[type="submit"]') || document.querySelector('.auth-btn');
    if(loginBtn) {
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        newBtn.type = 'button'; 
        newBtn.addEventListener('click', login);
    }
    
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// تحويل الدالة إلى async لتتعامل مع Supabase
async function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();
    const btnLoading = document.querySelector('.btn-loading');
    const btnText = document.querySelector('.btn-text');

    if (!userInp || !passInp) {
        showAuthNotification("الرجاء إدخال البيانات", "error");
        return;
    }

    if(btnText) btnText.style.display = 'none';
    if(btnLoading) btnLoading.style.display = 'inline-block';

    try {
        // البحث عن المستخدم في جدول المستخدمين في Supabase
        const { data: users, error } = await window.supabase
            .from('users')
            .select('*')
            .eq('username', userInp)
            .eq('password', passInp);

        if (error) throw error;

        let user = users.length > 0 ? users[0] : null;

        // التحقق من حالة الحساب
        if (user && (user.status === 'suspended' || user.status === 'موقوف')) {
            showAuthNotification("⛔ عذراً، تم إيقاف حسابك. يرجى مراجعة الإدارة.", "error");
            resetLoginButton(btnText, btnLoading);
            return; 
        }

        // إذا لم يكن مستخدماً عادياً، نبحث في جدول أعضاء اللجنة
        if (!user) {
            const { data: committeeMembers, err } = await window.supabase
                .from('committee_members')
                .select('*')
                .eq('username', userInp)
                .eq('password', passInp);

            if (committeeMembers && committeeMembers.length > 0) {
                const member = committeeMembers[0];
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

        // التوجيه حسب الدور
        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';
            
            if (user.role === 'admin') window.location.href = prefix + 'admin/dashboard.html';
            else if (user.role === 'teacher') window.location.href = prefix + 'teacher/dashboard.html';
            else if (user.role === 'committee_member') window.location.href = prefix + 'member/dashboard.html'; 
            else window.location.href = prefix + 'student/dashboard.html';
        } else {
            showAuthNotification("بيانات الدخول غير صحيحة!", "error");
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthNotification("حدث خطأ في الاتصال بقاعدة البيانات", "error");
    } finally {
        resetLoginButton(btnText, btnLoading);
    }
}

function resetLoginButton(btnText, btnLoading) {
    if(btnText) btnText.style.display = 'inline-block';
    if(btnLoading) btnLoading.style.display = 'none';
}

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

window.alert = function(message) { showToast(message, 'info'); };
window.showSuccess = (msg) => showToast(msg, 'success');
window.showError = (msg) => showToast(msg, 'error');
window.showAuthNotification = function(message, type) { 
    showToast(message, type === 'success' ? 'success' : 'error'); 
};

function checkAuth() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) { 
        window.location.href = '../../index.html'; 
        return null; 
    }
    return JSON.parse(session);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function getCurrentUser() { 
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); 
}

window.login = login;
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
