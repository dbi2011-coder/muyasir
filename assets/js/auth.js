// ============================================
// 📁 المسار: assets/js/auth.js
// الوصف: نظام المصادقة الموحد (المالك + اللجنة + المعلم + الطالب)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. تهيئة النظام
    initSystem();

    // 2. ربط زر الدخول
    const loginBtn = document.querySelector('button') || document.getElementById('loginBtn');
    
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        const newBtn = loginBtn.cloneNode(true);
        if(loginBtn.parentNode) {
            loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        }
        newBtn.type = 'button'; 
        newBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            login(e);
        });

        // دعم مفتاح Enter
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') login(e);
            });
        });
    }
});

// --- 1. تهيئة النظام ---
function initSystem() {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // ضمان وجود المدير (Admin)
    if (!users.some(u => u.role === 'admin')) {
        users.push({
            id: 1, name: "مدير النظام", username: "admin", password: "123", role: "admin", status: "active"
        });
        localStorage.setItem('users', JSON.stringify(users));
        console.log("✅ تم تأكيد حساب المدير");
    }
}

// --- 2. دالة تسجيل الدخول ---
function login(event) {
    if (event) event.preventDefault();

    const usernameInput = document.getElementById('username') || document.querySelector('input[type="text"]');
    const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');

    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('الرجاء إدخال اسم المستخدم وكلمة المرور');
        return;
    }

    // أ) البحث في المستخدمين الأساسيين
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    // ب) البحث في أعضاء اللجنة
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username.toLowerCase() === username.toLowerCase() && m.password === password);
        
        if (member) {
            user = {
                id: member.id,
                name: member.name,
                username: member.username,
                role: 'committee',
                status: 'active'
            };
        }
    }

    // ج) التوجيه
    if (user) {
        if (user.status === 'suspended') {
            alert('⛔ هذا الحساب موقوف');
            return;
        }

        // حفظ الجلسة
        sessionStorage.setItem('currentUser', JSON.stringify({ user: user, loginTime: new Date().toISOString() }));

        // 🔥 تحديد المسار الأساسي (Base Path) بدقة
        let basePath = '';
        const currentPath = window.location.pathname;

        // إذا كنا في الصفحة الرئيسية (الجذر)
        if (currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
            basePath = 'pages/';
        } 
        // إذا كنا داخل مجلد فرعي (مثل pages/admin)
        else if (currentPath.includes('/pages/')) {
            basePath = '../';
        }
        // احتياط لأي حالة أخرى
        else {
            basePath = 'pages/';
        }

        // التوجيه حسب الصلاحية
        switch(user.role) {
            case 'admin':
                window.location.href = basePath + 'admin/dashboard.html';
                break;
                
            case 'teacher':
                window.location.href = basePath + 'teacher/dashboard.html';
                break;
                
            case 'student':
                window.location.href = basePath + 'student/dashboard.html';
                break;
                
            case 'committee':
            case 'committee_member':
                // ✅ هنا التغيير الجذري: إجبار النظام على الذهاب للمجلد الجديد
                // إذا كنا في الجذر نذهب لـ pages/committee/dashboard.html
                // إذا كنا في مجلد فرعي نعود للخلف ثم committee/dashboard.html
                
                if (basePath === 'pages/') {
                    window.location.href = 'pages/committee/dashboard.html';
                } else {
                    window.location.href = '../committee/dashboard.html';
                }
                break;
                
            default:
                alert('لا توجد صفحة لهذا الدور');
        }
    } else {
        alert('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
    }
}

// --- 3. التحقق والخروج ---
function checkAuth() {
    const sessionStr = sessionStorage.getItem('currentUser');
    if (!sessionStr) {
        if (!window.location.href.includes('index.html')) {
            let backPath = '../../index.html';
            if (!window.location.href.includes('/pages/')) backPath = './index.html';
            window.location.href = backPath; 
        }
        return null;
    }
    return JSON.parse(sessionStr).user;
}

function logout() {
    sessionStorage.removeItem('currentUser');
    let backPath = '../../index.html';
    if (!window.location.href.includes('/pages/')) backPath = './index.html';
    window.location.href = backPath;
}

function getCurrentUser() { return checkAuth(); }

window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
window.getCurrentUser = getCurrentUser;
