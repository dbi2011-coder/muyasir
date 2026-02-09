// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول + نافذة التأكيد الموحدة (Custom Confirm Modal)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. ربط زر الدخول
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        newBtn.type = 'button';
        newBtn.addEventListener('click', login);
    }
    
    // 2. التحقق من الجلسة
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }

    // 3. 🔥 حقن نافذة الحذف الموحدة في الصفحة
    injectGlobalConfirmModal();
});

// دالة تسجيل الدخول
function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        showAuthNotification("الرجاء إدخال البيانات", "error");
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (!users.some(u => u.role === 'admin')) {
        users.push({ id: 1, name: "مدير النظام", username: "admin", password: "123", role: "admin", status: "active" });
        localStorage.setItem('users', JSON.stringify(users));
    }

    let user = users.find(u => u.username == userInp && u.password == passInp);

    if (user) {
        if (user.status === 'suspended' || user.status === 'موقوف') {
            showAuthNotification("⛔ عذراً، تم إيقاف حسابك. يرجى مراجعة الإدارة.", "error");
            return; 
        }
    }

    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        
        if (member) {
            user = {
                id: member.id, name: member.name, username: member.username, role: 'committee_member', title: member.role, status: 'active', ownerId: member.ownerId 
            };
        }
    }

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
}

// ============================================
// 🗑️ نظام نافذة الحذف الموحدة (Global Confirm Modal)
// ============================================

let confirmCallback = null; // متغير لحفظ العملية المراد تنفيذها

function injectGlobalConfirmModal() {
    if (document.getElementById('globalConfirmModal')) return;

    const modalHtml = `
    <div id="globalConfirmModal" class="modal" style="z-index: 100000;">
        <div class="modal-content" style="max-width: 400px; text-align: center; border-radius: 12px; overflow: hidden; padding: 0;">
            <div style="background: #dc3545; color: white; padding: 15px;">
                <i class="fas fa-exclamation-triangle fa-3x mb-2"></i>
                <h3 style="margin: 0;">تأكيد الحذف</h3>
            </div>
            <div style="padding: 25px;">
                <p id="globalConfirmMessage" style="font-size: 1.1rem; color: #555; margin-bottom: 20px;">هل أنت متأكد؟</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-secondary" onclick="closeConfirmModal()">إلغاء</button>
                    <button class="btn btn-danger" onclick="executeConfirmAction()">نعم، احذف</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 🔥 الدالة الجديدة التي ستستخدمها بدلاً من confirm()
window.showConfirmModal = function(message, callback) {
    const modal = document.getElementById('globalConfirmModal');
    const msgElem = document.getElementById('globalConfirmMessage');
    
    if (modal && msgElem) {
        msgElem.textContent = message;
        confirmCallback = callback; // حفظ الوظيفة لتنفيذها لاحقاً
        modal.classList.add('show');
    } else {
        // احتياطي في حال لم يتم تحميل النافذة
        if(confirm(message)) callback();
    }
};

window.closeConfirmModal = function() {
    document.getElementById('globalConfirmModal').classList.remove('show');
    confirmCallback = null;
};

window.executeConfirmAction = function() {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
};

// ============================================
// 🔔 نظام الإشعارات (Toast)
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20px)';
        setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 500);
    }, 3000);
}

window.alert = function(message) { showToast(message, 'info'); };
window.showSuccess = (msg) => showToast(msg, 'success');
window.showError = (msg) => showToast(msg, 'error');
window.showAuthNotification = function(message, type) { showToast(message, type === 'success' ? 'success' : 'error'); };

function checkAuth() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) { window.location.href = '../../index.html'; return null; }
    return JSON.parse(session);
}
function logout() {
    showConfirmModal('هل أنت متأكد من تسجيل الخروج؟', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = '../../index.html';
    });
}
function getCurrentUser() { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); }

window.login = login;
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
