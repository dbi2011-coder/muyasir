// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام المصادقة المحسّن (يدعم المعلمين، الطلاب، وأعضاء اللجنة)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        setupLoginForm();
    }
    
    // التحقق من وجود مستخدم مسجل دخوله
    checkExistingSession();
    
    // تهيئة نظام المصادقة
    initializeAuthSystem();
});

function initializeAuthSystem() {
    console.log('🚀 نظام المصادقة - جاهز للتشغيل');
    
    if (!isLocalStorageSupported()) {
        showAuthNotification('المتصفح لا يدعم التخزين المحلي.', 'error', 10000);
        return;
    }
    
    initializeAuthData();
    startSessionMonitor();
}

function setupLoginForm() {
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('focus', function() { this.parentElement.classList.add('focused'); });
        input.addEventListener('blur', function() { if (!this.value) this.parentElement.classList.remove('focused'); });
        
        if (input.type === 'password') {
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle';
            toggleBtn.innerHTML = '👁️';
            toggleBtn.style.cssText = 'position:absolute; left:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer;';
            
            toggleBtn.addEventListener('click', function() {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                this.innerHTML = isPassword ? '🙈' : '👁️';
            });
            
            input.parentElement.style.position = 'relative';
            input.parentElement.appendChild(toggleBtn);
        }
    });
}

function handleLogin(event) {
    event.preventDefault(); // منع تحديث الصفحة
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    if (!validateLoginInputs(username, password)) return;
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.querySelector('.btn-text') ? submitBtn.querySelector('.btn-text').textContent : submitBtn.innerText;
    
    // محاكاة التحميل
    submitBtn.disabled = true;
    if(submitBtn.querySelector('.btn-text')) submitBtn.querySelector('.btn-text').textContent = 'جاري الدخول...';
    
    setTimeout(() => {
        const authResult = authenticateUser(username, password);
        
        if (authResult.success) {
            saveUserSession(authResult.user, rememberMe);
            logLoginAttempt(username, true);
            showAuthNotification(`مرحباً ${authResult.user.name}!`, 'success');
            
            setTimeout(() => {
                redirectToDashboard(authResult.user.role);
            }, 1000);
        } else {
            logLoginAttempt(username, false);
            showAuthNotification(authResult.message, 'error');
            submitBtn.disabled = false;
            if(submitBtn.querySelector('.btn-text')) submitBtn.querySelector('.btn-text').textContent = originalText;
            handleFailedLogin(username);
        }
    }, 800);
}

function validateLoginInputs(username, password) {
    if (!username || !password) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return false;
    }
    return true;
}

// ==========================================
// 🔐 دالة التحقق من المستخدم (تم التعديل هنا)
// ==========================================
function authenticateUser(username, password) {
    try {
        // 1. البحث في جدول المستخدمين (المعلم والطالب)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // إذا لم يوجد مستخدمين، ننشئ الافتراضيين
        if (users.length === 0) {
            createDefaultUsers();
            return authenticateUser(username, password);
        }
        
        let user = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === password
        );
        
        // 2. إذا لم نجده، نبحث في جدول أعضاء اللجنة (NEW)
        if (!user) {
            const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
            const member = committeeMembers.find(m => m.username === username && m.password === password);
            
            if (member) {
                // تحويل بيانات العضو لتناسب هيكل الجلسة
                user = {
                    id: member.id,
                    username: member.username,
                    name: member.name,
                    role: 'committee_member', // الدور الخاص للتوجيه
                    title: member.role, // الصفة (مدير، معلم..)
                    status: 'active'
                };
            }
        }
        
        if (user) {
            if (user.status === 'suspended') return { success: false, message: 'الحساب موقوف.' };
            return { success: true, user: user };
        } else {
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }
    } catch (error) {
        console.error('خطأ:', error);
        return { success: false, message: 'حدث خطأ في النظام.' };
    }
}

function createDefaultUsers() {
    const defaultUsers = [
        { id: 1, username: 'admin', password: '123', role: 'admin', name: 'الأستاذ صالح العجلان', status: 'active' }
    ];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
}

function saveUserSession(user, rememberMe) {
    const sessionData = {
        user: user,
        loginTime: new Date().toISOString(),
        rememberMe: rememberMe
    };
    sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
}

// ==========================================
// 🧭 دالة التوجيه (تم ضبط المسارات)
// ==========================================
function redirectToDashboard(role) {
    // المسارات تعتمد على أن ملف index.html في المجلد الرئيسي
    const dashboards = {
        'admin': 'pages/teacher/dashboard.html',
        'teacher': 'pages/teacher/dashboard.html',
        'student': 'pages/student/dashboard.html',
        'committee_member': 'pages/member/dashboard.html' // المسار الجديد
    };
    
    const dashboardUrl = dashboards[role];
    if (dashboardUrl) {
        window.location.href = dashboardUrl;
    } else {
        showAuthNotification('نوع المستخدم غير معروف', 'error');
    }
}

function checkExistingSession() {
    const sessionData = sessionStorage.getItem('currentUser');
    if (sessionData) {
        const { user } = JSON.parse(sessionData);
        if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
            showAuthNotification(`مرحباً بعودتك ${user.name}`, 'info');
            setTimeout(() => redirectToDashboard(user.role), 1000);
        }
    }
}

function handleFailedLogin(username) {
    // منطق بسيط لتسجيل المحاولات الفاشلة
    console.log(`فشل الدخول للمستخدم: ${username}`);
}

function logLoginAttempt(username, success) {
    // تسجيل المحاولات (اختياري)
}

function showAuthNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: ${type === 'error' ? '#f8d7da' : '#d4edda'};
        color: ${type === 'error' ? '#721c24' : '#155724'};
        padding: 15px 25px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999; border: 1px solid ${type === 'error' ? '#f5c6cb' : '#c3e6cb'};
        font-weight: bold;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
}

// التحقق من الصلاحية داخل الصفحات الداخلية
function checkAuth() {
    const sessionData = sessionStorage.getItem('currentUser');
    if (!sessionData) {
        // إذا لم يكن هناك جلسة، نعود للصفحة الرئيسية
        // نستخدم ../../ للعودة من داخل المجلدات الفرعية
        window.location.href = '../../index.html'; 
        return null;
    }
    return JSON.parse(sessionData).user;
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

// دوال مساعدة
function isLocalStorageSupported() {
    try { localStorage.setItem('test', 'test'); localStorage.removeItem('test'); return true; } catch (e) { return false; }
}
function initializeAuthData() { /* ... */ }
function startSessionMonitor() { /* ... */ }
