// ============================================
// 📁 الملف: assets/js/auth.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        newBtn.type = 'button'; 
        newBtn.addEventListener('click', login);
    }
    
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

async function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        showAuthNotification("الرجاء إدخال البيانات", "error");
        return;
    }

    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    if(btnText && btnLoading) { btnText.style.display = 'none'; btnLoading.style.display = 'block'; }

    try {
        // البحث عن المستخدم في Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', userInp)
            .eq('password', passInp)
            .single();

        if (error || !user) {
            // التحقق إذا كان أول دخول لإنشاء مدير افتراضي
            if(userInp === 'Zooro12500' && passInp === '430106043') {
                const adminData = {
                    id: Date.now(),
                    username: "Zooro12500",
                    password: "430106043",
                    name: "مدير النظام",
                    role: "admin",
                    status: "active"
                };
                await supabase.from('users').insert([adminData]);
                sessionStorage.setItem('currentUser', JSON.stringify({ user: adminData }));
                window.location.href = '../admin/dashboard.html';
                return;
            }

            showAuthNotification("بيانات الدخول غير صحيحة!", "error");
            if(btnText && btnLoading) { btnText.style.display = 'block'; btnLoading.style.display = 'none'; }
            return;
        }

        if (user.status === 'suspended' || user.status === 'موقوف') {
            showAuthNotification("⛔ عذراً، تم إيقاف حسابك. يرجى مراجعة الإدارة.", "error");
            if(btnText && btnLoading) { btnText.style.display = 'block'; btnLoading.style.display = 'none'; }
            return; 
        }

        // تسجيل الدخول ناجح
        sessionStorage.setItem('currentUser', JSON.stringify({ user: user }));
        let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';
        
        if (user.role === 'admin') window.location.href = prefix + 'admin/dashboard.html';
        else if (user.role === 'teacher') window.location.href = prefix + 'teacher/dashboard.html';
        else if (user.role === 'committee_member') window.location.href = prefix + 'member/dashboard.html'; 
        else window.location.href = prefix + 'student/dashboard.html';

    } catch (err) {
        showAuthNotification("حدث خطأ في الاتصال بالسيرفر", "error");
        if(btnText && btnLoading) { btnText.style.display = 'block'; btnLoading.style.display = 'none'; }
    }
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
        setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 500);
    }, 3000);
}

window.showAuthNotification = function(message, type) { showToast(message, type === 'success' ? 'success' : 'error'); };

function checkAuth() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) { 
        window.location.href = '../../index.html'; 
        return null; 
    }
    return JSON.parse(session).user || JSON.parse(session);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function getCurrentUser() { 
    const session = sessionStorage.getItem('currentUser');
    if(!session) return null;
    const parsed = JSON.parse(session);
    return parsed.user ? parsed.user : parsed;
}

window.login = login;
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
