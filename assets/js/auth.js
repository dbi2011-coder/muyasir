// نظام المصادقة المحسّن - ميسر التعلم
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
    
    // التحقق من دعم التخزين المحلي
    if (!isLocalStorageSupported()) {
        showAuthNotification('المتصفح لا يدعم التخزين المحلي. بعض الميزات قد لا تعمل بشكل صحيح.', 'error', 10000);
        return;
    }
    
    // تهيئة البيانات إذا لزم الأمر
    initializeAuthData();
    
    // مراقبة انتهاء الجلسة
    startSessionMonitor();
}

function setupLoginForm() {
    // إضافة تأثيرات للشكل
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // إظهار/إخفاء كلمة المرور
        if (input.type === 'password') {
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle';
            toggleBtn.innerHTML = '👁️';
            toggleBtn.title = 'إظهار/إخفاء كلمة المرور';
            
            toggleBtn.addEventListener('click', function() {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                this.innerHTML = isPassword ? '🙈' : '👁️';
            });
            
            input.parentElement.style.position = 'relative';
            toggleBtn.style.position = 'absolute';
            toggleBtn.style.left = '10px';
            toggleBtn.style.top = '50%';
            toggleBtn.style.transform = 'translateY(-50%)';
            toggleBtn.style.background = 'none';
            toggleBtn.style.border = 'none';
            toggleBtn.style.cursor = 'pointer';
            toggleBtn.style.fontSize = '1.1rem';
            
            input.parentElement.appendChild(toggleBtn);
        }
    });
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    // التحقق من صحة المدخلات
    if (!validateLoginInputs(username, password)) {
        return;
    }
    
    // إظهار حالة التحميل
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.querySelector('.btn-text').textContent;
    const loadingText = submitBtn.querySelector('.btn-loading');
    
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    loadingText.style.display = 'inline';
    
    // محاكاة تأخير الشبكة
    setTimeout(() => {
        const authResult = authenticateUser(username, password);
        
        if (authResult.success) {
            // حفظ بيانات الجلسة
            saveUserSession(authResult.user, rememberMe);
            
            // تسجيل محاولة الدخول الناجحة
            logLoginAttempt(username, true);
            
            showAuthNotification(`مرحباً ${authResult.user.name}!`, 'success');
            
            // توجيه المستخدم للواجهة المناسبة بعد تأخير بسيط
            setTimeout(() => {
                redirectToDashboard(authResult.user.role);
            }, 1500);
        } else {
            // تسجيل محاولة الدخول الفاشلة
            logLoginAttempt(username, false);
            
            showAuthNotification(authResult.message, 'error');
            resetLoginForm(submitBtn, originalText);
            
            // زيادة عامل الأمان بعد محاولات فاشلة
            handleFailedLogin(username);
        }
    }, 1500);
}

function validateLoginInputs(username, password) {
    if (!username || !password) {
        showAuthNotification('يرجى ملء جميع الحقول', 'error');
        return false;
    }
    
    if (username.length < 3) {
        showAuthNotification('اسم المستخدم يجب أن يكون 3 أحرف على الأقل', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showAuthNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return false;
    }
    
    return true;
}

function authenticateUser(username, password) {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // إذا لم يكن هناك مستخدمين، إنشاء مستخدمين افتراضيين
        if (users.length === 0) {
            createDefaultUsers();
            return authenticateUser(username, password); // إعادة المحاولة
        }
        
        // البحث عن المستخدم
        const user = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === password
        );
        
        if (user) {
            // التحقق من حالة الحساب
            if (user.status === 'suspended') {
                return {
                    success: false,
                    message: 'الحساب موقوف. يرجى التواصل مع المدير.'
                };
            }
            
            if (user.status === 'inactive') {
                return {
                    success: false,
                    message: 'الحساب غير نشط.'
                };
            }
            
            return {
                success: true,
                user: user
            };
        } else {
            return {
                success: false,
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
            };
        }
    } catch (error) {
        console.error('خطأ في المصادقة:', error);
        return {
            success: false,
            message: 'حدث خطأ في النظام. يرجى المحاولة لاحقاً.'
        };
    }
}

function createDefaultUsers() {
    const defaultUsers = [
        {
            id: 1,
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'مدير النظام',
            phone: '0500000000',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginAttempts: 0
        },
        {
            id: 2,
            username: 'teacher1',
            password: 'teacher123',
            role: 'teacher',
            name: 'المعلم الأول',
            phone: '0511111111',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginAttempts: 0
        },
        {
            id: 3,
            username: 'student1',
            password: 'student123',
            role: 'student',
            name: 'الطالب الأول',
            grade: 'الصف الأول',
            subject: 'لغتي',
            teacherId: 2,
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginAttempts: 0
        },
        {
            id: 4,
            username: 'committee1',
            password: 'committee123',
            role: 'committee',
            name: 'عضو اللجنة الأول',
            position: 'مشرف',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginAttempts: 0
        }
    ];
    
    localStorage.setItem('users', JSON.stringify(defaultUsers));
    console.log('✅ تم إنشاء المستخدمين الافتراضيين بنجاح');
}

function saveUserSession(user, rememberMe) {
    // تحديث آخر دخول للمستخدم
    updateUserLastLogin(user.id);
    
    // حفظ بيانات الجلسة
    const sessionData = {
        user: user,
        loginTime: new Date().toISOString(),
        rememberMe: rememberMe
    };
    
    sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
    
    if (rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify({
            userId: user.id,
            username: user.username,
            rememberUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 يوم
        }));
    }
}

function updateUserLastLogin(userId) {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex].lastLogin = new Date().toISOString();
            users[userIndex].loginAttempts = 0; // إعادة تعيين محاولات الدخول
            localStorage.setItem('users', JSON.stringify(users));
        }
    } catch (error) {
        console.error('خطأ في تحديث آخر دخول:', error);
    }
}

function redirectToDashboard(role) {
    const dashboards = {
        'admin': '../admin/dashboard.html',
        'teacher': '../teacher/dashboard.html',
        'student': '../student/dashboard.html',
        'committee': '../committee/dashboard.html'
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
        const { user, loginTime } = JSON.parse(sessionData);
        
        // التحقق من انتهاء الجلسة
        if (isSessionExpired(loginTime)) {
            sessionStorage.removeItem('currentUser');
            showAuthNotification('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى', 'warning');
            return;
        }
        
        // إذا كان المستخدم في صفحة تسجيل الدخول وهو مسجل دخول، توجيهه مباشرة
        if (window.location.pathname.includes('login.html')) {
            showAuthNotification(`مرحباً بعودتك ${user.name}`, 'info');
            setTimeout(() => {
                redirectToDashboard(user.role);
            }, 1500);
        }
    } else {
        // التحقق من وجود مستخدم مُذكر
        checkRememberedUser();
    }
}

function checkRememberedUser() {
    const remembered = localStorage.getItem('rememberedUser');
    
    if (remembered) {
        const { userId, username, rememberUntil } = JSON.parse(remembered);
        
        // التحقق من انتهاء مدة التذكر
        if (new Date(rememberUntil) > new Date()) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.id === userId && u.username === username);
            
            if (user && user.status === 'active') {
                // تسجيل الدخول التلقائي
                saveUserSession(user, true);
                
                if (window.location.pathname.includes('login.html')) {
                    showAuthNotification(`تم تسجيل الدخول تلقائياً، مرحباً ${user.name}`, 'info');
                    setTimeout(() => {
                        redirectToDashboard(user.role);
                    }, 2000);
                }
            }
        } else {
            // إزالة بيانات التذكر المنتهية
            localStorage.removeItem('rememberedUser');
        }
    }
}

function isSessionExpired(loginTime) {
    const loginDate = new Date(loginTime);
    const now = new Date();
    const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
    return hoursDiff > 8; // 8 ساعات
}

function handleFailedLogin(username) {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (userIndex !== -1) {
            users[userIndex].loginAttempts = (users[userIndex].loginAttempts || 0) + 1;
            
            // إذا كانت المحاولات أكثر من 5، تعليق الحساب مؤقتاً
            if (users[userIndex].loginAttempts >= 5) {
                users[userIndex].status = 'suspended';
                showAuthNotification('تم تعليق الحساب due to multiple failed attempts. Please contact administrator.', 'error', 10000);
            }
            
            localStorage.setItem('users', JSON.stringify(users));
        }
    } catch (error) {
        console.error('خطأ في معالجة الدخول الفاشل:', error);
    }
}

function logLoginAttempt(username, success, ipAddress = '127.0.0.1') {
    const logs = JSON.parse(localStorage.getItem('loginLogs') || '[]');
    
    logs.push({
        username,
        success,
        ipAddress,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    });
    
    // الاحتفاظ فقط بآخر 1000 محاولة
    if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
    }
    
    localStorage.setItem('loginLogs', JSON.stringify(logs));
}

function resetLoginForm(submitBtn, originalText) {
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').textContent = originalText;
    submitBtn.querySelector('.btn-text').style.display = 'inline';
    submitBtn.querySelector('.btn-loading').style.display = 'none';
}

function showAuthNotification(message, type = 'info', duration = 5000) {
    // إزالة أي إشعارات سابقة
    const existingNotifications = document.querySelectorAll('.auth-notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `auth-notification auth-notification-${type}`;
    notification.innerHTML = `
        <div class="auth-notification-content">
            <span class="auth-notification-message">${message}</span>
            <button class="auth-notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // إضافة الأنماط إذا لم تكن موجودة
    if (!document.querySelector('#auth-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'auth-notification-styles';
        styles.textContent = `
            .auth-notification {
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 10000;
                border-right: 4px solid #3498db;
                transform: translateY(-100px);
                opacity: 0;
                transition: all 0.3s ease;
            }
            .auth-notification-show {
                transform: translateY(0);
                opacity: 1;
            }
            .auth-notification-success { 
                border-right-color: #27ae60;
                background: #d5f4e6;
            }
            .auth-notification-error { 
                border-right-color: #e74c3c;
                background: #fadbd8;
            }
            .auth-notification-info { 
                border-right-color: #3498db;
                background: #d6eaf8;
            }
            .auth-notification-warning { 
                border-right-color: #f39c12;
                background: #fdebd0;
            }
            .auth-notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .auth-notification-message {
                font-weight: 500;
                color: #2c3e50;
            }
            .auth-notification-close {
                background: none;
                border: none;
                font-size: 1.3rem;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 25px;
                height: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.3s ease;
            }
            .auth-notification-close:hover {
                color: #333;
                background-color: rgba(0,0,0,0.1);
            }
            @media (min-width: 768px) {
                .auth-notification {
                    left: auto;
                    width: 400px;
                    right: 20px;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // إظهار الإشعار مع تأثير
    setTimeout(() => {
        notification.classList.add('auth-notification-show');
    }, 100);
    
    // إزالة الإشعار تلقائياً بعد المدة المحددة
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('auth-notification-show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
}

// التحقق من صلاحية الجلسة في الصفحات المحمية
function checkAuth() {
    const sessionData = sessionStorage.getItem('currentUser');
    
    if (!sessionData) {
        showAuthNotification('يجب تسجيل الدخول أولاً', 'warning');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return null;
    }
    
    const { user, loginTime } = JSON.parse(sessionData);
    
    // التحقق من انتهاء الجلسة
    if (isSessionExpired(loginTime)) {
        sessionStorage.removeItem('currentUser');
        showAuthNotification('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى', 'warning');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return null;
    }
    
    return user;
}

// تسجيل الخروج
function logout() {
    const sessionData = sessionStorage.getItem('currentUser');
    const userName = sessionData ? JSON.parse(sessionData).user.name : '';
    
    // مسح بيانات الجلسة
    sessionStorage.removeItem('currentUser');
    
    // إذا لم يكن "تذكرني" مفعل، مسح بيانات التذكر
    const remembered = localStorage.getItem('rememberedUser');
    if (!remembered || !JSON.parse(remembered).rememberMe) {
        localStorage.removeItem('rememberedUser');
    }
    
    showAuthNotification(`تم تسجيل الخروج بنجاح، إلى اللقاء ${userName}`, 'info');
    
    setTimeout(() => {
        window.location.href = '../../index.html';
    }, 1500);
}

// دوال مساعدة
function isLocalStorageSupported() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function initializeAuthData() {
    const initialData = {
        users: [],
        loginAttempts: []
    };
    
    Object.keys(initialData).forEach(key => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(initialData[key]));
        }
    });
}

function startSessionMonitor() {
    // مراقبة انتهاء الجلسة كل دقيقة
    setInterval(() => {
        const sessionData = sessionStorage.getItem('currentUser');
        
        if (sessionData) {
            const { loginTime } = JSON.parse(sessionData);
            const loginDate = new Date(loginTime);
            const now = new Date();
            const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
            
            // إظهار تحذير قبل 10 دقائق من انتهاء الجلسة
            if (hoursDiff > 7.8 && !document.getElementById('sessionWarning')) {
                showSessionWarning();
            }
        }
    }, 60000); // التحقق كل دقيقة
}

function showSessionWarning() {
    const warning = document.createElement('div');
    warning.id = 'sessionWarning';
    warning.className = 'session-warning';
    warning.innerHTML = `
        <div class="warning-content">
            <span>⚠️ جلسة العمل ستنتهي خلال 10 دقائق. يرجى حفظ العمل الحالي.</span>
            <button onclick="this.parentElement.parentElement.remove()">✕</button>
        </div>
    `;
    
    // إضافة الأنماط
    if (!document.querySelector('#session-warning-styles')) {
        const styles = document.createElement('style');
        styles.id = 'session-warning-styles';
        styles.textContent = `
            .session-warning {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                color: #856404;
            }
            .warning-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .warning-content button {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #856404;
                padding: 0;
                width: 25px;
                height: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            .warning-content button:hover {
                background-color: rgba(0,0,0,0.1);
            }
            @media (min-width: 768px) {
                .session-warning {
                    left: auto;
                    width: 400px;
                    right: 300px;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(warning);
    
    // إزالة التحذير تلقائياً بعد 30 ثانية
    setTimeout(() => {
        if (warning.parentElement) {
            warning.remove();
        }
    }, 30000);
}

// دالة مساعدة للحصول على معلومات المستخدم الحالي
function getCurrentUser() {
    const sessionData = sessionStorage.getItem('currentUser');
    return sessionData ? JSON.parse(sessionData).user : null;
}

// دالة مساعدة للحصول على بيانات الجلسة الكاملة
function getSessionData() {
    const sessionData = sessionStorage.getItem('currentUser');
    return sessionData ? JSON.parse(sessionData) : null;
}

// دالة لتجديد الجلسة
function renewSession() {
    const sessionData = getSessionData();
    if (sessionData) {
        sessionData.loginTime = new Date().toISOString();
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
        console.log('✅ تم تجديد الجلسة');
    }
}

// التحقق من محاولات تسجيل الدخول الفاشلة المتتالية
function checkFailedLoginAttempts(username, threshold = 5) {
    const logs = JSON.parse(localStorage.getItem('loginLogs') || '[]');
    const recentFailures = logs.filter(log => 
        log.username === username && 
        !log.success &&
        new Date(log.timestamp) > new Date(Date.now() - 30 * 60 * 1000) // آخر 30 دقيقة
    );
    
    return recentFailures.length >= threshold;
}

/**
 * تسجيل تسجيلات الخروج
 */
function logLogout(userId) {
    const logs = JSON.parse(localStorage.getItem('logoutLogs') || '[]');
    
    logs.push({
        userId,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('logoutLogs', JSON.stringify(logs));
}

// دالة مساعدة لإنشاء معرف فريد
function generateId() {
    return Math.floor(Math.random() * 1000000) + 1;
}

// دالة مساعدة لتنسيق الوقت
function formatTimeAgo(dateString) {
    if (!dateString) return 'منذ فترة';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
}

// دالة مساعدة لتنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// دالة مساعدة لتنسيق التاريخ المختصر
function formatDateShort(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

// ============================================
// دالة إضافة سجل النظام (محدثة)
// ============================================

/**
 * إضافة سجل جديد في نظام السجلات
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع السجل (info, warning, error, success, settings, backup, user, security, test)
 * @param {string} user - اسم المستخدم (اختياري، إذا لم يتم توفيره يتم استخدام المستخدم الحالي)
 */
function addSystemLog(message, type = 'info', user = null) {
    try {
        // جلب السجلات الحالية أو إنشاء مصفوفة فارغة
        const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
        
        // الحصول على معلومات المستخدم الحالي إذا لم يتم توفير اسم مستخدم
        const currentUser = getCurrentUser();
        const userName = user || (currentUser ? currentUser.name : 'النظام');
        
        // إنشاء كائن السجل الجديد
        const newLog = {
            id: generateId(), // توليد معرف فريد للسجل
            timestamp: new Date().toISOString(), // تاريخ ووقت إضافة السجل
            type: type, // نوع السجل
            message: message, // نص الرسالة
            user: userName, // المستخدم المسؤول عن السجل
            ip: '127.0.0.1', // عنوان IP (في تطبيق حقيقي سيتم جلب العنوان الفعلي)
            userAgent: navigator.userAgent // معلومات متصفح المستخدم
        };
        
        // إضافة السجل الجديد إلى المصفوفة
        logs.push(newLog);
        
        // الاحتفاظ فقط بآخر 1000 سجل للحفاظ على أداء النظام
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        // حفظ السجلات المحدثة في localStorage
        localStorage.setItem('systemLogs', JSON.stringify(logs));
        
        // تسجيل في وحدة التحكم للمطورين
        console.log(`📝 سجل النظام [${type.toUpperCase()}]: ${message} - بواسطة: ${userName}`);
        
        // تحديث واجهة سجلات النظام إذا كانت الصفحة مفتوحة
        if (window.location.pathname.includes('settings.html') && typeof window.filterLogs === 'function') {
            window.filterLogs();
        }
        
        // إرسال إشعار للواجهة إذا كان نوع السجل مهم
        if (type === 'error' || type === 'warning') {
            showAuthNotification(`سجل نظام: ${message}`, type, 3000);
        }
        
        return newLog.id; // إرجاع معرف السجل الجديد
        
    } catch (error) {
        console.error('❌ خطأ في إضافة سجل النظام:', error);
        
        // محاولة بديلة في حالة فشل حفظ السجل
        try {
            // إنشاء سجل بسيط في حالة الطوارئ
            const emergencyLog = {
                timestamp: new Date().toISOString(),
                type: 'error',
                message: 'فشل في إضافة سجل النظام: ' + error.message,
                user: 'النظام'
            };
            
            // محاولة الحفظ في sessionStorage كبديل مؤقت
            const emergencyLogs = JSON.parse(sessionStorage.getItem('emergencySystemLogs') || '[]');
            emergencyLogs.push(emergencyLog);
            
            if (emergencyLogs.length > 50) {
                emergencyLogs.splice(0, emergencyLogs.length - 50);
            }
            
            sessionStorage.setItem('emergencySystemLogs', JSON.stringify(emergencyLogs));
            
        } catch (emergencyError) {
            console.error('❌ فشل حتى في تسجيل سجل الطوارئ:', emergencyError);
        }
        
        return null;
    }
}

// ============================================
// دالة مساعدة للحصول على نص نوع السجل
// ============================================

/**
 * تحويل نوع السجل من الإنجليزية إلى العربية
 * @param {string} type - نوع السجل بالإنجليزية
 * @returns {string} نوع السجل بالعربية
 */
function getLogTypeText(type) {
    const typeMap = {
        'info': 'معلومات',
        'warning': 'تحذير',
        'error': 'خطأ',
        'success': 'نجاح',
        'settings': 'إعدادات',
        'backup': 'نسخ احتياطي',
        'user': 'مستخدم',
        'security': 'أمان',
        'test': 'اختبار',
        'login': 'دخول',
        'logout': 'خروج',
        'create': 'إنشاء',
        'update': 'تحديث',
        'delete': 'حذف'
    };
    
    return typeMap[type] || type;
}

// ============================================
// دالة لتصدير سجلات النظام
// ============================================

/**
 * تصدير سجلات النظام إلى ملف نصي
 */
function exportSystemLogs() {
    try {
        const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
        
        if (logs.length === 0) {
            showAuthNotification('لا توجد سجلات نظام للتصدير', 'warning');
            return;
        }
        
        // تنسيق السجلات كنص
        const logText = logs.map(log => {
            const date = formatDate(log.timestamp);
            const type = getLogTypeText(log.type);
            return `[${date}] [${type}] ${log.user}: ${log.message}`;
        }).join('\n');
        
        // إضافة رأس الملف
        const header = `سجلات نظام ميسر التعلم\nتم التصدير في: ${formatDate(new Date().toISOString())}\nعدد السجلات: ${logs.length}\n\n`;
        const fullText = header + logText;
        
        // إنشاء ملف للتحميل
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // إضافة سجل للتصدير نفسه
        addSystemLog('تم تصدير سجلات النظام', 'backup');
        
        showAuthNotification(`تم تصدير ${logs.length} سجل بنجاح`, 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تصدير سجلات النظام:', error);
        showAuthNotification('فشل تصدير سجلات النظام', 'error');
    }
}

// ============================================
// دالة لتصفية سجلات النظام
// ============================================

/**
 * تصفية سجلات النظام حسب النوع والتاريخ
 * @param {string} type - نوع السجل المراد تصفيته
 * @param {Date} startDate - تاريخ البدء
 * @param {Date} endDate - تاريخ الانتهاء
 * @returns {Array} السجلات المصفاة
 */
function filterSystemLogs(type = 'all', startDate = null, endDate = null) {
    try {
        const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
        
        return logs.filter(log => {
            // التصفية حسب النوع
            if (type !== 'all' && log.type !== type) {
                return false;
            }
            
            // التصفية حسب التاريخ
            const logDate = new Date(log.timestamp);
            
            if (startDate && logDate < startDate) {
                return false;
            }
            
            if (endDate && logDate > endDate) {
                return false;
            }
            
            return true;
        });
        
    } catch (error) {
        console.error('❌ خطأ في تصفية سجلات النظام:', error);
        return [];
    }
}

// ============================================
// دالة لمسح سجلات النظام القديمة
// ============================================

/**
 * مسح سجلات النظام الأقدم من عدد معين من الأيام
 * @param {number} days - عدد الأيام (الافتراضي: 30 يوم)
 */
function clearOldSystemLogs(days = 30) {
    try {
        const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const newLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
        const deletedCount = logs.length - newLogs.length;
        
        localStorage.setItem('systemLogs', JSON.stringify(newLogs));
        
        // إضافة سجل للمسح
        addSystemLog(`تم مسح ${deletedCount} سجل أقدم من ${days} يوم`, 'maintenance');
        
        showAuthNotification(`تم مسح ${deletedCount} سجل قديم`, 'success');
        
        return deletedCount;
        
    } catch (error) {
        console.error('❌ خطأ في مسح السجلات القديمة:', error);
        showAuthNotification('فشل مسح السجلات القديمة', 'error');
        return 0;
    }
}

// ============================================
// تصدير الدوال للاستخدام العالمي
// ============================================

window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.getSessionData = getSessionData;
window.renewSession = renewSession;
window.generateId = generateId;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.formatTimeAgo = formatTimeAgo;
window.addSystemLog = addSystemLog;
window.getLogTypeText = getLogTypeText;
window.exportSystemLogs = exportSystemLogs;
window.filterSystemLogs = filterSystemLogs;
window.clearOldSystemLogs = clearOldSystemLogs;
