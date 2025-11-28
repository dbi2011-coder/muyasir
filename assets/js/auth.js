// نظام المصادقة المعدل - ميسر التعلم
console.log('🔧 تحميل نظام المصادقة...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 نظام المصادقة - جاهز للتشغيل');
    
    // تهيئة النظام أولاً
    initializeAuthSystem();
    
    // ثم إعداد النموذج
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('📝找到了 نموذج تسجيل الدخول');
        loginForm.addEventListener('submit', handleLogin);
        setupLoginForm();
    } else {
        console.log('❌ لم يتم العثور على نموذج تسجيل الدخول');
    }
    
    checkExistingSession();
});

function initializeAuthSystem() {
    console.log('🔧 تهيئة نظام المصادقة...');
    
    // التحقق من دعم التخزين المحلي
    if (!isLocalStorageSupported()) {
        alert('❌ المتصفح لا يدعم التخزين المحلي. يرجى استخدام متصفح حديث.');
        return;
    }
    
    // إنشاء مستخدمين افتراضيين
    createDefaultUsers();
}

function setupLoginForm() {
    console.log('⚙️ إعداد نموذج تسجيل الدخول...');
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput && passwordInput) {
        console.log('✅ تم العثور على حقول الإدخال');
        
        // إضافة زر إظهار/إخفاء كلمة المرور
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.title = 'إظهار/إخفاء كلمة المرور';
        
        toggleBtn.addEventListener('click', function() {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            this.innerHTML = isPassword ? '🙈' : '👁️';
        });
        
        passwordInput.parentElement.style.position = 'relative';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.left = '10px';
        toggleBtn.style.top = '50%';
        toggleBtn.style.transform = 'translateY(-50%)';
        toggleBtn.style.background = 'none';
        toggleBtn.style.border = 'none';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.fontSize = '1.1rem';
        toggleBtn.style.zIndex = '10';
        
        passwordInput.parentElement.appendChild(toggleBtn);
        
        // تعبئة تلقائية للحقول إذا كانت محفوظة
        autoFillLoginForm();
    } else {
        console.log('❌ لم يتم العثور على حقول الإدخال');
        console.log('username input:', usernameInput);
        console.log('password input:', passwordInput);
    }
}

function autoFillLoginForm() {
    const remembered = localStorage.getItem('rememberedUser');
    if (remembered) {
        try {
            const { username } = JSON.parse(remembered);
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.value = username;
            }
        } catch (error) {
            console.error('خطأ في التعبئة التلقائية:', error);
        }
    }
}

function handleLogin(event) {
    event.preventDefault();
    console.log('🔐 بدء عملية تسجيل الدخول...');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    console.log('📨 بيانات الإدخال:', { username, password });
    
    if (!username || !password) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // إظهار حالة التحميل
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ جاري التسجيل...';
    
    // محاكاة تأخير بسيط
    setTimeout(() => {
        const authResult = authenticateUser(username, password);
        
        if (authResult.success) {
            showMessage(`🎉 مرحباً ${authResult.user.name}!`, 'success');
            saveUserSession(authResult.user);
            
            setTimeout(() => {
                redirectToDashboard(authResult.user.role);
            }, 1500);
        } else {
            showMessage(`❌ ${authResult.message}`, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }, 800);
}

function authenticateUser(username, password) {
    try {
        console.log('🔍 البحث عن المستخدم...');
        const usersJSON = localStorage.getItem('users');
        console.log('📊 بيانات المستخدمين في localStorage:', usersJSON);
        
        if (!usersJSON) {
            console.log('❌ لا توجد بيانات مستخدمين');
            return { success: false, message: 'لا توجد بيانات مستخدمين في النظام' };
        }
        
        const users = JSON.parse(usersJSON);
        console.log('👥 عدد المستخدمين:', users.length);
        console.log('📋 قائمة المستخدمين:', users);
        
        const user = users.find(u => {
            const usernameMatch = u.username.toLowerCase() === username.toLowerCase();
            const passwordMatch = u.password === password;
            console.log(`🔍 التحقق من ${u.username}: ${usernameMatch} & ${passwordMatch}`);
            return usernameMatch && passwordMatch;
        });
        
        if (user) {
            console.log('✅ تم العثور على المستخدم:', user);
            
            if (user.status === 'suspended') {
                return { success: false, message: 'الحساب موقوف. يرجى التواصل مع المدير.' };
            }
            
            if (user.status === 'inactive') {
                return { success: false, message: 'الحساب غير نشط.' };
            }
            
            console.log('🎉 تم المصادقة بنجاح:', user.name);
            return { success: true, user: user };
        } else {
            console.log('❌ لم يتم العثور على مستخدم بهذه البيانات');
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }
    } catch (error) {
        console.error('💥 خطأ في المصادقة:', error);
        return { success: false, message: 'حدث خطأ في النظام. يرجى المحاولة لاحقاً.' };
    }
}

function createDefaultUsers() {
    console.log('👥 فحص وجود مستخدمين افتراضيين...');
    
    let users = [];
    try {
        const usersJSON = localStorage.getItem('users');
        if (usersJSON) {
            users = JSON.parse(usersJSON);
            console.log('✅ يوجد مستخدمون مسبقاً:', users.length);
        }
    } catch (error) {
        console.error('❌ خطأ في قراءة بيانات المستخدمين:', error);
        users = [];
    }
    
    if (users.length === 0) {
        console.log('🔨 إنشاء المستخدمين الافتراضيين...');
        
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                password: '1234',
                role: 'admin',
                name: 'مدير النظام',
                phone: '0500000000',
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLogin: null
            },
            {
                id: 2,
                username: 'teacher1',
                password: '1234',
                role: 'teacher',
                name: 'المعلم الأول',
                phone: '0511111111',
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLogin: null
            },
            {
                id: 3,
                username: 'student1',
                password: '1234',
                role: 'student',
                name: 'الطالب الأول',
                phone: '0522222222',
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLogin: null
            },
            {
                id: 4,
                username: 'committee1',
                password: '1234',
                role: 'committee',
                name: 'عضو اللجنة الأول',
                phone: '0533333333',
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLogin: null
            }
        ];
        
        try {
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            console.log('✅ تم إنشاء المستخدمين الافتراضيين بنجاح');
            
            // عرض بيانات الدخول في ال console
            console.log('🔐 بيانات الدخول الافتراضية:');
            defaultUsers.forEach(user => {
                console.log(`   👤 ${user.name} - اسم المستخدم: "${user.username}" - كلمة المرور: "${user.password}"`);
            });
            
            console.log('💡 استخدم أي من هذه الحسابات لتسجيل الدخول');
            
        } catch (error) {
            console.error('❌ فشل في حفظ المستخدمين:', error);
        }
    } else {
        console.log('✅ المستخدمون موجودون مسبقاً');
        console.log('📋 المستخدمون المتاحون:');
        users.forEach(user => {
            console.log(`   👤 ${user.name} (${user.role}): ${user.username} / ${user.password}`);
        });
    }
}

function saveUserSession(user) {
    console.log('💾 حفظ بيانات الجلسة للمستخدم:', user.name);
    
    const sessionData = {
        user: user,
        loginTime: new Date().toISOString()
    };
    
    sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
    
    // تحديث آخر وقت دخول
    updateUserLastLogin(user.id);
}

function updateUserLastLogin(userId) {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex].lastLogin = new Date().toISOString();
            localStorage.setItem('users', JSON.stringify(users));
            console.log('🕒 تم تحديث وقت آخر دخول');
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث آخر دخول:', error);
    }
}

function redirectToDashboard(role) {
    console.log('🔄 التوجيه إلى لوحة التحكم:', role);
    
    const dashboards = {
        'admin': '../admin/dashboard.html',
        'teacher': '../teacher/dashboard.html', 
        'student': '../student/dashboard.html',
        'committee': '../committee/dashboard.html'
    };
    
    const dashboardUrl = dashboards[role];
    if (dashboardUrl) {
        console.log('📍 الانتقال إلى:', dashboardUrl);
        window.location.href = dashboardUrl;
    } else {
        console.error('❌ نوع المستخدم غير معروف:', role);
        showMessage('نوع المستخدم غير معروف', 'error');
    }
}

function checkExistingSession() {
    console.log('🔍 فحص الجلسات النشطة...');
    
    const sessionData = sessionStorage.getItem('currentUser');
    
    if (sessionData) {
        try {
            const { user, loginTime } = JSON.parse(sessionData);
            console.log('✅ يوجد جلسة نشطة للمستخدم:', user.name);
            
            if (isSessionExpired(loginTime)) {
                console.log('⏰ انتهت مدة الجلسة');
                sessionStorage.removeItem('currentUser');
                showMessage('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى', 'warning');
            } else if (window.location.pathname.includes('login.html')) {
                console.log('🔄 توجيه المستخدم إلى لوحة التحكم');
                showMessage(`مرحباً بعودتك ${user.name}`, 'info');
                setTimeout(() => {
                    redirectToDashboard(user.role);
                }, 2000);
            }
        } catch (error) {
            console.error('❌ خطأ في فحص الجلسة:', error);
            sessionStorage.removeItem('currentUser');
        }
    } else {
        console.log('ℹ️ لا توجد جلسات نشطة');
    }
}

function isSessionExpired(loginTime) {
    const loginDate = new Date(loginTime);
    const now = new Date();
    const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
    return hoursDiff > 8;
}

function showMessage(message, type = 'info') {
    console.log(`💬 رسالة [${type}]:`, message);
    
    // إزالة أي رسائل سابقة
    const existingMessages = document.querySelectorAll('.auth-message');
    existingMessages.forEach(msg => msg.remove());
    
    // إنشاء رسالة جديدة
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message auth-message-${type}`;
    messageDiv.innerHTML = `
        <div class="auth-message-content">
            <span class="auth-message-text">${message}</span>
            <button class="auth-message-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // إضافة الأنماط إذا لم تكن موجودة
    if (!document.querySelector('#auth-message-styles')) {
        const styles = document.createElement('style');
        styles.id = 'auth-message-styles';
        styles.textContent = `
            .auth-message {
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
            .auth-message-show {
                transform: translateY(0);
                opacity: 1;
            }
            .auth-message-success { 
                border-right-color: #27ae60;
                background: #d5f4e6;
            }
            .auth-message-error { 
                border-right-color: #e74c3c;
                background: #fadbd8;
            }
            .auth-message-info { 
                border-right-color: #3498db;
                background: #d6eaf8;
            }
            .auth-message-warning { 
                border-right-color: #f39c12;
                background: #fdebd0;
            }
            .auth-message-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .auth-message-text {
                font-weight: 500;
                color: #2c3e50;
            }
            .auth-message-close {
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
            }
            .auth-message-close:hover {
                background: rgba(0,0,0,0.1);
            }
            @media (min-width: 768px) {
                .auth-message {
                    left: auto;
                    width: 400px;
                    right: 20px;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(messageDiv);
    
    // إظهار الرسالة مع تأثير
    setTimeout(() => {
        messageDiv.classList.add('auth-message-show');
    }, 100);
    
    // إزالة الرسالة تلقائياً بعد 5 ثواني
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.classList.remove('auth-message-show');
            setTimeout(() => {
                if (messageDiv.parentElement) {
                    messageDiv.remove();
                }
            }, 300);
        }
    }, 5000);
}

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

// دالة تسجيل الخروج
function logout() {
    console.log('🚪 تسجيل الخروج...');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('rememberedUser');
    showMessage('تم تسجيل الخروج بنجاح', 'info');
    setTimeout(() => {
        window.location.href = '../../index.html';
    }, 1500);
}

// جعل الدوال متاحة globally
window.logout = logout;
window.showMessage = showMessage;

console.log('✅ نظام المصادقة تم تحميله بنجاح');